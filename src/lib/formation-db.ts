// Shared formation database for consistent porosity/permeability references across modules
export interface FormationData {
  phiMin: number;
  phiMax: number;
  kMin: number;
  kMax: number;
  lithology: string;
  basin?: string;
}

export const FORMATION_DB: Record<string, FormationData> = {
  // Oklahoma formations
  "Mississippian Limestone": { phiMin: 5, phiMax: 18, kMin: 0.01, kMax: 50, lithology: "Cherty Limestone", basin: "Anadarko / STACK" },
  "Mississippian": { phiMin: 5, phiMax: 18, kMin: 0.01, kMax: 50, lithology: "Cherty Limestone", basin: "Anadarko / STACK" },
  "Hunton": { phiMin: 3, phiMax: 12, kMin: 0.1, kMax: 100, lithology: "Dolomite / Limestone", basin: "Anadarko" },
  "Woodford": { phiMin: 2, phiMax: 9, kMin: 0.000001, kMax: 0.01, lithology: "Siliceous Shale", basin: "Anadarko" },
  "Morrow": { phiMin: 8, phiMax: 18, kMin: 0.1, kMax: 200, lithology: "Fluvial Sandstone", basin: "Anadarko" },
  "Chester": { phiMin: 6, phiMax: 16, kMin: 0.05, kMax: 80, lithology: "Oolitic Limestone", basin: "Anadarko" },
  "Springer": { phiMin: 7, phiMax: 15, kMin: 0.5, kMax: 150, lithology: "Deltaic Sandstone", basin: "Anadarko" },
  "Wilcox": { phiMin: 18, phiMax: 32, kMin: 50, kMax: 2000, lithology: "Fluvial Sandstone", basin: "Gulf Coast" },
  "Oswego": { phiMin: 4, phiMax: 12, kMin: 0.05, kMax: 30, lithology: "Limestone", basin: "Anadarko" },
  "Red Fork": { phiMin: 10, phiMax: 20, kMin: 1, kMax: 300, lithology: "Marine Sandstone", basin: "Anadarko" },
  "Skinner": { phiMin: 9, phiMax: 18, kMin: 0.5, kMax: 100, lithology: "Sandstone", basin: "Anadarko" },
  "Bartlesville": { phiMin: 10, phiMax: 22, kMin: 1, kMax: 500, lithology: "Channel Sandstone", basin: "Cherokee Platform" },
  "Viola": { phiMin: 2, phiMax: 10, kMin: 0.01, kMax: 20, lithology: "Limestone / Dolomite", basin: "Anadarko" },
  "Arbuckle": { phiMin: 3, phiMax: 15, kMin: 0.1, kMax: 100, lithology: "Dolomite", basin: "Anadarko" },
  // Permian Basin formations
  "Wolfcamp": { phiMin: 3, phiMax: 10, kMin: 0.0001, kMax: 0.5, lithology: "Calcareous Mudstone", basin: "Permian" },
  "Spraberry": { phiMin: 7, phiMax: 14, kMin: 0.001, kMax: 1, lithology: "Siltstone / Fine Sandstone", basin: "Permian" },
  "Bone Spring": { phiMin: 4, phiMax: 12, kMin: 0.0005, kMax: 2, lithology: "Limestone / Sandstone", basin: "Permian" },
  "Delaware Sand": { phiMin: 12, phiMax: 22, kMin: 1, kMax: 500, lithology: "Turbidite Sandstone", basin: "Permian" },
  "San Andres": { phiMin: 5, phiMax: 15, kMin: 0.1, kMax: 50, lithology: "Dolomite / Limestone", basin: "Permian" },
  "Dean": { phiMin: 5, phiMax: 12, kMin: 0.01, kMax: 5, lithology: "Fine Sandstone / Siltstone", basin: "Permian" },
  "Cline": { phiMin: 2, phiMax: 8, kMin: 0.00001, kMax: 0.1, lithology: "Shale / Mudstone", basin: "Permian" },
  "Avalon": { phiMin: 3, phiMax: 10, kMin: 0.0005, kMax: 1, lithology: "Calcareous Siltstone", basin: "Permian" },
};

export function lookupFormation(name: string): FormationData | null {
  if (!name) return null;
  const key = Object.keys(FORMATION_DB).find(
    (k) => k.toLowerCase() === name.toLowerCase() || name.toLowerCase().includes(k.toLowerCase())
  );
  return key ? FORMATION_DB[key] : null;
}

export function formatPermeability(k: number): string {
  if (k < 0.001) return `${(k * 1000000).toFixed(1)} µD`;
  if (k < 0.1) return `${(k * 1000).toFixed(1)} µD`;
  if (k < 1) return `${k.toFixed(3)} mD`;
  if (k < 100) return `${k.toFixed(1)} mD`;
  return `${Math.round(k)} mD`;
}
