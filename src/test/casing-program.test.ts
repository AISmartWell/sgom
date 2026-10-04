import { describe, expect, it } from "vitest";
import { casingProgramSchema, validateCasingProgram } from "@/lib/casing-program";
const row = { id: "one", type: "Production" as const, top_ft: 0, bottom_ft: 5000, od_in: 7, wall_in: 0.3, grade: "N80", cement_top_ft: 1000, cement_status: "Cemented" as const, notes: "" };
describe("casing validation", () => {
  it("accepts documented string and empty programs", () => {
    expect(casingProgramSchema.safeParse({ strings: [row], source: "Report", notes: "" }).success).toBe(true);
    expect(casingProgramSchema.safeParse({ strings: [], source: "", notes: "" }).success).toBe(true);
  });
  it.each([{ bottom_ft: 0 }, { od_in: 0 }, { wall_in: 4 }, { cement_top_ft: 6000 }, { cement_top_ft: -1 }, { grade: " " }, { top_ft: NaN }])("rejects invalid geometry / missing inputs %j", patch => {
    expect(casingProgramSchema.safeParse({ strings: [{ ...row, ...patch }], source: "", notes: "" }).success).toBe(false);
  });
  it("rejects depths below recorded TD and accepts missing cement top", () => {
    expect(validateCasingProgram({ strings: [row], source: "", notes: "" }, 4000).errors.length).toBe(1);
    expect(casingProgramSchema.safeParse({ strings: [{ ...row, cement_top_ft: null }], source: "", notes: "" }).success).toBe(true);
  });
});