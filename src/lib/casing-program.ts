import { z } from "zod";

export const casingTypes = ["Conductor", "Surface", "Intermediate", "Production", "Liner"] as const;
export const cementStatuses = ["Unknown", "Planned", "Cemented", "Not cemented"] as const;
export const casingStringSchema = z.object({
  id: z.string().min(1),
  type: z.enum(casingTypes),
  top_ft: z.number().finite().min(0).max(60000),
  bottom_ft: z.number().finite().positive().max(60000),
  od_in: z.number().finite().positive().max(60),
  wall_in: z.number().finite().positive().max(30),
  grade: z.string().trim().min(1, "Steel grade is required").max(80),
  cement_top_ft: z.number().finite().min(0).max(60000).nullable(),
  cement_status: z.enum(cementStatuses),
  notes: z.string().max(2000),
}).superRefine((r, ctx) => {
  if (r.bottom_ft <= r.top_ft) ctx.addIssue({ code: "custom", path: ["bottom_ft"], message: "Bottom depth must exceed top depth" });
  if (r.wall_in * 2 >= r.od_in) ctx.addIssue({ code: "custom", path: ["wall_in"], message: "Twice the wall thickness must be less than OD" });
  if (r.cement_top_ft !== null && (r.cement_top_ft < r.top_ft || r.cement_top_ft > r.bottom_ft)) ctx.addIssue({ code: "custom", path: ["cement_top_ft"], message: "Cement top must be within the string interval" });
});
export const casingProgramSchema = z.object({
  strings: z.array(casingStringSchema).max(50),
  source: z.string().max(1000),
  notes: z.string().max(4000),
});
export type CasingString = z.infer<typeof casingStringSchema>;
export type CasingProgram = z.infer<typeof casingProgramSchema>;
export interface CasingWell { id: string; company_id: string; well_name: string | null; api_number: string | null; total_depth: number | null; state: string }
export const emptyCasingProgram = (): CasingProgram => ({ strings: [], source: "", notes: "" });
export const newCasingString = (): CasingString => ({ id: crypto.randomUUID(), type: "Production", top_ft: NaN, bottom_ft: NaN, od_in: NaN, wall_in: NaN, grade: "", cement_top_ft: null, cement_status: "Unknown", notes: "" });
export const casingNumber = (value: number | null) => value === null || !Number.isFinite(value) ? "—" : value.toLocaleString("en-US", { maximumFractionDigits: 4 });

export function validateCasingProgram(program: CasingProgram, totalDepth: number | null) {
  const parsed = casingProgramSchema.safeParse(program);
  const errors = parsed.success ? [] : parsed.error.issues.map(i => {
    const index = i.path[0] === "strings" && typeof i.path[1] === "number" ? `String ${i.path[1] + 1}: ` : "";
    return index + i.message;
  });
  if (totalDepth !== null && totalDepth > 0) program.strings.forEach((r, i) => {
    if (r.bottom_ft > totalDepth) errors.push(`String ${i + 1}: bottom exceeds recorded TD (${casingNumber(totalDepth)} ft)`);
  });
  return { parsed, errors };
}