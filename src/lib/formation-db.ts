// Shared formation database for consistent porosity/permeability references across modules
export interface FormationData {
  phiMin: number;      // porosity min (%)
  phiMax: number;      // porosity max (%)
  kMin: number;        // permeability min (mD)
  kMax: number;        // permeability max (mD)
  lithology: string;
  basin?: string;
  // Reservoir engineering parameters for IOIP
  hNet: number;        // net pay thickness (ft)
  drainage: number;    // drainage area (acres)
  Sw: number;          // water saturation (fraction)
  Bo: number;          // formation volume factor
}

export const FORMATION_DB: Record<string, FormationData> = {
  // Oklahoma formations
  "Mississippian Limestone": { phiMin: 5, phiMax: 18, kMin: 0.01, kMax: 50, lithology: "Cherty Limestone", basin: "Anadarko / STACK", hNet: 45, drainage: 40, Sw: 0.35, Bo: 1.15 },
  "Mississippian": { phiMin: 5, phiMax: 18, kMin: 0.01, kMax: 50, lithology: "Cherty Limestone", basin: "Anadarko / STACK", hNet: 45, drainage: 40, Sw: 0.35, Bo: 1.15 },
  "Hunton": { phiMin: 3, phiMax: 12, kMin: 0.1, kMax: 100, lithology: "Dolomite / Limestone", basin: "Anadarko", hNet: 35, drainage: 40, Sw: 0.30, Bo: 1.20 },
  "Woodford": { phiMin: 2, phiMax: 9, kMin: 0.000001, kMax: 0.01, lithology: "Siliceous Shale", basin: "Anadarko", hNet: 120, drainage: 160, Sw: 0.25, Bo: 1.35 },
  "Morrow": { phiMin: 8, phiMax: 18, kMin: 0.1, kMax: 200, lithology: "Fluvial Sandstone", basin: "Anadarko", hNet: 25, drainage: 40, Sw: 0.30, Bo: 1.18 },
  "Chester": { phiMin: 6, phiMax: 16, kMin: 0.05, kMax: 80, lithology: "Oolitic Limestone", basin: "Anadarko", hNet: 30, drainage: 40, Sw: 0.35, Bo: 1.15 },
  "Springer": { phiMin: 7, phiMax: 15, kMin: 0.5, kMax: 150, lithology: "Deltaic Sandstone", basin: "Anadarko", hNet: 35, drainage: 40, Sw: 0.32, Bo: 1.20 },
  "Wilcox": { phiMin: 18, phiMax: 32, kMin: 50, kMax: 2000, lithology: "Fluvial Sandstone", basin: "Gulf Coast", hNet: 50, drainage: 80, Sw: 0.25, Bo: 1.25 },
  "Oswego": { phiMin: 4, phiMax: 12, kMin: 0.05, kMax: 30, lithology: "Limestone", basin: "Anadarko", hNet: 20, drainage: 40, Sw: 0.40, Bo: 1.12 },
  "Red Fork": { phiMin: 10, phiMax: 20, kMin: 1, kMax: 300, lithology: "Marine Sandstone", basin: "Anadarko", hNet: 30, drainage: 40, Sw: 0.28, Bo: 1.18 },
  "Skinner": { phiMin: 9, phiMax: 18, kMin: 0.5, kMax: 100, lithology: "Sandstone", basin: "Anadarko", hNet: 25, drainage: 40, Sw: 0.30, Bo: 1.15 },
  "Bartlesville": { phiMin: 10, phiMax: 22, kMin: 1, kMax: 500, lithology: "Channel Sandstone", basin: "Cherokee Platform", hNet: 35, drainage: 40, Sw: 0.28, Bo: 1.18 },
  "Viola": { phiMin: 2, phiMax: 10, kMin: 0.01, kMax: 20, lithology: "Limestone / Dolomite", basin: "Anadarko", hNet: 25, drainage: 40, Sw: 0.40, Bo: 1.12 },
  "Arbuckle": { phiMin: 3, phiMax: 15, kMin: 0.1, kMax: 100, lithology: "Dolomite", basin: "Anadarko", hNet: 60, drainage: 40, Sw: 0.30, Bo: 1.15 },
  // Permian Basin formations
  "Wolfcamp": { phiMin: 3, phiMax: 10, kMin: 0.0001, kMax: 0.5, lithology: "Calcareous Mudstone", basin: "Permian", hNet: 200, drainage: 160, Sw: 0.30, Bo: 1.30 },
  "Spraberry": { phiMin: 7, phiMax: 14, kMin: 0.001, kMax: 1, lithology: "Siltstone / Fine Sandstone", basin: "Permian", hNet: 100, drainage: 80, Sw: 0.35, Bo: 1.25 },
  "Bone Spring": { phiMin: 4, phiMax: 12, kMin: 0.0005, kMax: 2, lithology: "Limestone / Sandstone", basin: "Permian", hNet: 80, drainage: 80, Sw: 0.30, Bo: 1.25 },
  "Delaware Sand": { phiMin: 12, phiMax: 22, kMin: 1, kMax: 500, lithology: "Turbidite Sandstone", basin: "Permian", hNet: 40, drainage: 40, Sw: 0.25, Bo: 1.20 },
  "San Andres": { phiMin: 5, phiMax: 15, kMin: 0.1, kMax: 50, lithology: "Dolomite / Limestone", basin: "Permian", hNet: 50, drainage: 40, Sw: 0.35, Bo: 1.15 },
  "Dean": { phiMin: 5, phiMax: 12, kMin: 0.01, kMax: 5, lithology: "Fine Sandstone / Siltstone", basin: "Permian", hNet: 30, drainage: 40, Sw: 0.35, Bo: 1.20 },
  "Cline": { phiMin: 2, phiMax: 8, kMin: 0.00001, kMax: 0.1, lithology: "Shale / Mudstone", basin: "Permian", hNet: 150, drainage: 160, Sw: 0.30, Bo: 1.35 },
  "Avalon": { phiMin: 3, phiMax: 10, kMin: 0.0005, kMax: 1, lithology: "Calcareous Siltstone", basin: "Permian", hNet: 60, drainage: 80, Sw: 0.32, Bo: 1.25 },
};

// Default reservoir parameters when formation is unknown
export const DEFAULT_RESERVOIR_PARAMS = {
  hNet: 30,       // ft
  drainage: 40,   // acres
  Sw: 0.35,
  Bo: 1.15,
  phi: 0.10,      // fraction
};

export function lookupFormation(name: string): FormationData | null {
  if (!name) return null;
  const key = Object.keys(FORMATION_DB).find(
    (k) => k.toLowerCase() === name.toLowerCase() || name.toLowerCase().includes(k.toLowerCase())
  );
  return key ? FORMATION_DB[key] : null;
}

/**
 * Calculate IOIP using volumetric method: 7758 * A * h * phi * (1 - Sw) / Bo
 * Uses formation-specific parameters when available, falls back to defaults.
 */
export function calcIOIP(formationName: string | null): { ioip: number; params: { A: number; h: number; phi: number; Sw: number; Bo: number; source: string } } {
  const f = lookupFormation(formationName ?? "");

  if (f) {
    const phi = (f.phiMin + f.phiMax) / 200; // avg as fraction
    const ioip = Math.round(7758 * f.drainage * f.hNet * phi * (1 - f.Sw) / f.Bo);
    return {
      ioip,
      params: { A: f.drainage, h: f.hNet, phi, Sw: f.Sw, Bo: f.Bo, source: formationName ?? "formation-db" },
    };
  }

  // Fallback defaults
  const d = DEFAULT_RESERVOIR_PARAMS;
  const ioip = Math.round(7758 * d.drainage * d.hNet * d.phi * (1 - d.Sw) / d.Bo);
  return {
    ioip,
    params: { A: d.drainage, h: d.hNet, phi: d.phi, Sw: d.Sw, Bo: d.Bo, source: "default" },
  };
}

export function formatPermeability(k: number): string {
  if (k < 0.001) return `${(k * 1000000).toFixed(1)} µD`;
  if (k < 0.1) return `${(k * 1000).toFixed(1)} µD`;
  if (k < 1) return `${k.toFixed(3)} mD`;
  if (k < 100) return `${k.toFixed(1)} mD`;
  return `${Math.round(k)} mD`;
}
