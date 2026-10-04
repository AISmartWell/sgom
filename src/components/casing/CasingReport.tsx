import { forwardRef } from "react";
import CasingSchematic from "./CasingSchematic";
import { CasingProgram, CasingWell, casingNumber } from "@/lib/casing-program";

export const CasingReport = forwardRef<HTMLDivElement, { program: CasingProgram; well: CasingWell; savedAt: string | null }>(({ program, well, savedAt }, ref) => (
  <div ref={ref} className="w-[760px] bg-background text-foreground p-7 space-y-5">
    <section className="space-y-3">
      <p className="text-sm text-primary font-semibold">SGOM · Stage 6 · DRAFT</p>
      <h1 className="text-2xl font-bold">Casing Program — {well.well_name || well.api_number || "Well"}</h1>
      <p className="text-sm text-muted-foreground">API: {well.api_number || "Not recorded"} · {well.state} · TD: {casingNumber(well.total_depth)} ft</p>
      <p className="text-sm">Saved: {savedAt ? new Date(savedAt).toLocaleString("en-US") : "Not saved"}</p>
      <p className="text-sm text-warning">Entered records, not an engineered design. No collapse, burst, tension, cement-volume or SPT-access verification. Not a field work order.</p>
    </section>
    <section className="space-y-2"><h2 className="font-semibold">Casing and cement schematic</h2><CasingSchematic strings={program.strings} totalDepth={well.total_depth} /></section>
    {program.strings.map((r, i) => <section key={r.id} className="border-t border-border pt-4 space-y-3">
      <h2 className="text-lg font-semibold">String {i + 1} · {r.type}</h2>
      <table className="w-full text-sm"><tbody>
        {[
          ["Top / bottom MD (ft)", `${casingNumber(r.top_ft)} / ${casingNumber(r.bottom_ft)}`],
          ["Outer diameter / wall (in)", `${casingNumber(r.od_in)} / ${casingNumber(r.wall_in)}`],
          ["Calculated pipe-body ID (in)", casingNumber(r.od_in - 2 * r.wall_in)],
          ["Steel grade", r.grade], ["Cement top MD (ft)", casingNumber(r.cement_top_ft)], ["Cement status", r.cement_status],
        ].map(([label, value]) => <tr key={label} className="border-b border-border"><td className="py-2 w-1/2 text-muted-foreground">{label}</td><td className="py-2 break-words">{value}</td></tr>)}
      </tbody></table>
      {r.notes && <p className="text-sm whitespace-pre-wrap break-words">{r.notes}</p>}
    </section>)}
    {program.source && <section className="space-y-2"><h2 className="font-semibold">Source documents</h2><p className="text-sm whitespace-pre-wrap break-words">{program.source}</p></section>}
    {program.notes && <section className="space-y-2"><h2 className="font-semibold">Program notes</h2><p className="text-sm whitespace-pre-wrap break-words">{program.notes}</p></section>}
    <section className="border-t border-border pt-3 text-xs text-muted-foreground">AI Smart Well Inc. · DRAFT · All depths are measured depth (ft); diameters and wall thickness are in inches. Calculated pipe-body ID is not a drift or tool-clearance guarantee.</section>
  </div>
));
CasingReport.displayName = "CasingReport";