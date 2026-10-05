// Generic block-by-block PDF export of a report container (each child = one block).
export async function downloadReportPdf(report: HTMLDivElement, title: string, fileName: string, footer: string) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
  const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  pdf.setProperties({ title, author: "AI Smart Well Inc." });
  const width = pdf.internal.pageSize.getWidth(), height = pdf.internal.pageSize.getHeight();
  const margin = 28, usableWidth = width - margin * 2, usableHeight = height - 76;
  const bg = getComputedStyle(report).backgroundColor;
  const pageBg = () => { pdf.setFillColor(bg); pdf.rect(0, 0, width, height, "F"); };
  let y = margin; pageBg();
  for (const block of Array.from(report.children)) {
    const canvas = await html2canvas(block as HTMLElement, { scale: 1.5, backgroundColor: bg, logging: false });
    let w = usableWidth, h = canvas.height * usableWidth / canvas.width;
    if (h > usableHeight) { w = w * usableHeight / h; h = usableHeight; }
    if (y + h > margin + usableHeight) { pdf.addPage(); pageBg(); y = margin; }
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.9), "JPEG", margin, y, w, h);
    y += h + 12;
  }
  const pages = pdf.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i); pdf.setFontSize(8); pdf.setTextColor(getComputedStyle(report).color);
    pdf.text(`${footer} | ${i} / ${pages}`, margin, height - 18);
  }
  pdf.save(fileName);
}
