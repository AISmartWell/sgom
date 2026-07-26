import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { ModelInputs, YearRow, CaseKey } from "@/lib/profitability-model";

const TITLE = "AI Smart Well + Maxxwell Production — Combined Profitability Model";

export type PnlLine = { key: keyof YearRow; label: string; group?: boolean; negative?: boolean };

const money = (v: number) =>
  v < 0 ? `($${Math.round(-v).toLocaleString("en-US")})` : `$${Math.round(v).toLocaleString("en-US")}`;

/* ── Assumptions sheet rows ─────────────────────────────────────────────── */
function assumptionRows(inp: ModelInputs): (string | number)[][] {
  const y = inp.years;
  const r: (string | number)[][] = [];
  r.push([TITLE]);
  r.push(["Assumptions — cells marked REAL come from Maxxwell Production's business plan"]);
  r.push([]);
  r.push(["Line item", ...y, "Note"]);
  r.push(["1. SGOM software revenue (SaaS / SPT Advisor)"]);
  r.push(["Commercial clients (cumulative)", ...inp.clients, "Pilots converting to contracts"]);
  r.push(["Average annual contract value (ACV), $", ...inp.acv, "Rises as pilots convert to enterprise"]);
  r.push(["SGOM COGS, % of SGOM revenue", ...inp.saasCogsPct, "Cloud/DGX infrastructure, support"]);
  r.push(["SaaS logo churn, %/yr (base case)", ...y.map(() => inp.churn), "Applied to retained client base"]);
  r.push([]);
  r.push(["2. SPT well restoration & production"]);
  r.push(["Wells in production (cumulative)", ...inp.wells, "4-well pilot → 25-well program"]);
  r.push(["Initial production per well, bbl/day", ...y.map(() => inp.bblPerDay), "REAL — Maxxwell business plan"]);
  r.push(["Arps nominal decline Di, /yr (base case)", ...y.map(() => inp.declineDi), "Exponential, half-year convention"]);
  r.push(["Oil price, $/bbl", ...y.map(() => inp.oilPrice), "REAL — Maxxwell business plan"]);
  r.push(["Days per year", ...y.map(() => inp.daysPerYear), ""]);
  r.push(["Royalty, % of gross oil revenue (base case)", ...y.map(() => inp.royaltyPct), "Lease burden"]);
  r.push(["Severance / production tax, % (base case)", ...y.map(() => inp.severancePct), "State production tax"]);
  r.push(["Well maintenance/opex, % of gross oil revenue", ...y.map(() => inp.opexPct), "REAL — maintenance & service"]);
  r.push(["SPT capex per new well, $", ...y.map(() => inp.sptCapexPerWell), "$1,157,840 / 4 wells"]);
  r.push(["SGOM platform capex, $", ...inp.platformCapex, "Investment Budget — AI Platform line"]);
  r.push(["Depreciation life, yrs (base case)", ...y.map(() => inp.daYears), "Straight-line"]);
  r.push([]);
  r.push(["3. Operating expenses"]);
  r.push(["Headcount, FTE (year-end)", ...inp.headcount, "CTO/dev/data science/BD"]);
  r.push(["Fully-loaded salary per FTE, $/yr", ...inp.salary, ""]);
  r.push(["G&A, $", ...inp.ga, ""]);
  r.push(["Sales & marketing, $", ...inp.sales, ""]);
  r.push(["MVP platform build (one-time), $", ...inp.mvpBuild, "Real figure from MVP scope"]);
  r.push([]);
  r.push(["4. Other"]);
  r.push(["Income tax rate", ...inp.taxRate, "Base case: applied to EBT with NOL carry-forward"]);
  r.push(["Investment raise received, $", ...inp.raise, ""]);
  r.push(["Net working capital, % of revenue growth", ...y.map(() => inp.nwcPct), ""]);
  return r;
}

function pnlRows(rows: YearRow[], lines: PnlLine[], caseLabel: string): (string | number)[][] {
  const out: (string | number)[][] = [];
  out.push([TITLE]);
  out.push([caseLabel]);
  out.push([]);
  out.push(["Line item ($)", ...rows.map(r => r.year)]);
  for (const l of lines) {
    const vals = rows.map(r => Math.round((l.negative ? -1 : 1) * (r[l.key] as number)));
    out.push([l.label, ...vals]);
  }
  out.push([]);
  out.push(["Memo: wells producing", ...rows.map(r => r.wellsProducing)]);
  out.push(["Memo: average rate per well, bbl/d", ...rows.map(r => Number(r.avgRatePerWell.toFixed(2)))]);
  out.push(["Memo: paying clients", ...rows.map(r => Number(r.payingClients.toFixed(2)))]);
  return out;
}

/* ── XLSX ───────────────────────────────────────────────────────────────── */
export function exportModelXlsx(opts: {
  inputs: ModelInputs;
  base: YearRow[];
  upside: YearRow[];
  lines: PnlLine[];
}) {
  const { inputs, base, upside, lines } = opts;
  const wb = XLSX.utils.book_new();

  const wsA = XLSX.utils.aoa_to_sheet(assumptionRows(inputs));
  wsA["!cols"] = [{ wch: 44 }, ...inputs.years.map(() => ({ wch: 14 })), { wch: 46 }];
  XLSX.utils.book_append_sheet(wb, wsA, "Assumptions");

  const wsB = XLSX.utils.aoa_to_sheet(pnlRows(base, lines, "P&L — Base case (Arps decline, royalty, severance, D&A, churn)"));
  wsB["!cols"] = [{ wch: 40 }, ...base.map(() => ({ wch: 16 }))];
  XLSX.utils.book_append_sheet(wb, wsB, "P&L Base case");

  const wsU = XLSX.utils.aoa_to_sheet(pnlRows(upside, lines, "P&L — Upside case (original workbook logic)"));
  wsU["!cols"] = [{ wch: 40 }, ...upside.map(() => ({ wch: 16 }))];
  XLSX.utils.book_append_sheet(wb, wsU, "P&L Upside case");

  const deltaLines: (string | number)[][] = [
    [TITLE], ["Base case vs upside case — delta ($)"], [],
    ["Line item", ...base.map(r => r.year)],
    ...lines.map(l => [l.label, ...base.map((r, i) => Math.round((r[l.key] as number) - (upside[i][l.key] as number)))]),
  ];
  const wsD = XLSX.utils.aoa_to_sheet(deltaLines);
  wsD["!cols"] = [{ wch: 40 }, ...base.map(() => ({ wch: 16 }))];
  XLSX.utils.book_append_sheet(wb, wsD, "Delta");

  XLSX.writeFile(wb, "sgom-maxxwell-profitability-model.xlsx");
}

/* ── PDF ────────────────────────────────────────────────────────────────── */
export async function exportModelPdf(opts: {
  inputs: ModelInputs;
  rows: YearRow[];
  caseLabel: string;
  lines: PnlLine[];
  chartNodes: (HTMLElement | null)[];
}) {
  const { inputs, rows, caseLabel, lines, chartNodes } = opts;
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 36;
  let y = M;

  const header = (sub: string) => {
    doc.setFillColor(15, 20, 28);
    doc.rect(0, 0, W, 54, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold").setFontSize(13);
    doc.text("AI Smart Well + Maxxwell Production", M, 24);
    doc.setFont("helvetica", "normal").setFontSize(9);
    doc.setTextColor(180, 190, 200);
    doc.text(sub, M, 40);
    doc.setTextColor(30, 30, 30);
    y = 78;
  };

  header(`Combined Profitability Model 2026–2030 · ${caseLabel}`);

  // KPI strip
  const last = rows[rows.length - 1];
  const cumRev = rows.reduce((s, r) => s + r.revenue, 0);
  const cumFcf = rows.reduce((s, r) => s + r.freeCashFlow, 0);
  const kpis: [string, string][] = [
    ["Revenue 2030", money(last.revenue)],
    ["EBITDA 2030", money(last.ebitda)],
    ["Net income 2030", money(last.netIncome)],
    ["Cash end 2030", money(last.cashEnd)],
    ["Cumulative revenue", money(cumRev)],
    ["Cumulative FCF", money(cumFcf)],
  ];
  const kw = (W - 2 * M - 5 * 8) / 6;
  kpis.forEach(([k, v], i) => {
    const x = M + i * (kw + 8);
    doc.setDrawColor(220).setFillColor(246, 248, 250).roundedRect(x, y, kw, 44, 4, 4, "FD");
    doc.setFontSize(7.5).setTextColor(110);
    doc.text(k.toUpperCase(), x + 8, y + 16);
    doc.setFontSize(12).setTextColor(20).setFont("helvetica", "bold");
    doc.text(v, x + 8, y + 34);
    doc.setFont("helvetica", "normal");
  });
  y += 60;

  // Key assumptions
  doc.setFontSize(9).setTextColor(60);
  const notes = [
    `Oil price $${inputs.oilPrice.toFixed(2)}/bbl · initial rate ${inputs.bblPerDay} bbl/d · wells ${inputs.wells[0]} → ${inputs.wells[inputs.wells.length - 1]}`,
    `Arps decline Di ${(inputs.declineDi * 100).toFixed(1)}%/yr · royalty ${(inputs.royaltyPct * 100).toFixed(2)}% · severance ${(inputs.severancePct * 100).toFixed(1)}% · well opex ${(inputs.opexPct * 100).toFixed(0)}%`,
    `SaaS churn ${(inputs.churn * 100).toFixed(0)}%/yr · depreciation ${inputs.daYears} yrs straight-line · SPT capex ${money(inputs.sptCapexPerWell)}/well`,
  ];
  notes.forEach((t, i) => doc.text(t, M, y + i * 13));
  y += notes.length * 13 + 10;

  // Charts
  for (const node of chartNodes) {
    if (!node) continue;
    const canvas = await html2canvas(node, { backgroundColor: "#ffffff", scale: 2, logging: false });
    const imgW = W - 2 * M;
    const imgH = (canvas.height / canvas.width) * imgW;
    if (y + imgH > H - M) { doc.addPage(); header(`Charts · ${caseLabel}`); }
    doc.addImage(canvas.toDataURL("image/png"), "PNG", M, y, imgW, imgH);
    y += imgH + 16;
  }

  // P&L table
  doc.addPage();
  header(`Full P&L · ${caseLabel}`);
  const labelW = 220;
  const colW = (W - 2 * M - labelW) / rows.length;
  const rowH = 16;

  const tableHead = () => {
    doc.setFillColor(15, 20, 28).rect(M, y, W - 2 * M, rowH + 2, "F");
    doc.setTextColor(255).setFontSize(8.5).setFont("helvetica", "bold");
    doc.text("Line item", M + 6, y + 12);
    rows.forEach((r, i) => doc.text(String(r.year), M + labelW + (i + 1) * colW - 6, y + 12, { align: "right" }));
    doc.setTextColor(30).setFont("helvetica", "normal");
    y += rowH + 6;
  };
  tableHead();

  const printRow = (label: string, values: string[], group?: boolean, indent?: boolean) => {
    if (y + rowH > H - M) { doc.addPage(); header(`Full P&L · ${caseLabel}`); tableHead(); }
    if (group) { doc.setFillColor(238, 241, 245).rect(M, y - 3, W - 2 * M, rowH, "F"); doc.setFont("helvetica", "bold"); }
    doc.setFontSize(8.5).setTextColor(group ? 20 : 55);
    doc.text(label, M + 6 + (indent ? 10 : 0), y + 8);
    values.forEach((v, i) => {
      doc.setTextColor(v.startsWith("(") ? 190 : group ? 20 : 55, v.startsWith("(") ? 40 : group ? 20 : 55, v.startsWith("(") ? 40 : group ? 20 : 55);
      doc.text(v, M + labelW + (i + 1) * colW - 6, y + 8, { align: "right" });
    });
    doc.setFont("helvetica", "normal").setTextColor(55);
    doc.setDrawColor(232).line(M, y + rowH - 4, W - M, y + rowH - 4);
    y += rowH;
  };

  for (const l of lines) {
    const vals = rows.map(r => {
      const raw = r[l.key] as number;
      if (raw === 0) return "–";
      return money(l.negative ? -raw : raw);
    });
    printRow(l.label, vals, l.group, l.negative);
  }
  printRow("Memo: wells producing", rows.map(r => String(r.wellsProducing)));
  printRow("Memo: avg rate per well, bbl/d", rows.map(r => r.avgRatePerWell.toFixed(1)));
  printRow("Memo: paying clients", rows.map(r => r.payingClients.toFixed(1)));

  doc.setFontSize(7.5).setTextColor(130);
  doc.text(
    `Generated by AI Smart Well · ${new Date().toISOString().slice(0, 10)} · figures in USD; base case includes Arps decline, royalty, severance tax, D&A and SaaS churn`,
    M, H - 18,
  );

  doc.save(`sgom-maxxwell-profitability-report.pdf`);
}
