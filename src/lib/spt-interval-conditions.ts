/**
 * Screening estimates of pressure and temperature at an SPT interval and
 * injection-well classification / distance. Shared by Injection & Water
 * Salinity and SPT Slot Plan so both show identical numbers.
 */

export const DEFAULT_SURFACE_TEMP_F = 60;

/** Linear pressure from surface: gradient = P_datum / datum depth. */
export function pressureAtDepth(pPsi: number | null | undefined, datumFt: number | null | undefined, depthFt: number): number | null {
  if (!(pPsi! > 0) || !(datumFt! > 0) || !(depthFt > 0)) return null;
  return (pPsi! / datumFt!) * depthFt;
}

/** Linear geothermal gradient between surface temperature and the measured BHT. */
export function temperatureAtDepth(bhtF: number | null | undefined, bhtDepthFt: number | null | undefined, depthFt: number, surfaceF?: number | null): number | null {
  const ts = surfaceF ?? DEFAULT_SURFACE_TEMP_F;
  if (!(bhtF! > ts) || !(bhtDepthFt! > 0) || !(depthFt > 0)) return null;
  return ts + ((bhtF! - ts) * depthFt) / bhtDepthFt!;
}

/** Class II injection / disposal / EOR injector codes found in state registries. */
const INJ_RE = /(^|[^a-z])(inj|injection|injector|swd|disposal|wiw|wsw|2r|2rin|2d|2dnc|2dc|eor)/i;

export function isInjectionWell(wellType: string | null | undefined): boolean {
  if (!wellType) return false;
  const t = wellType.trim();
  if (/^eor-p&a$/i.test(t)) return false; // plugged former EOR well
  return INJ_RE.test(t);
}

/** Great-circle distance in miles. */
export function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8, r = Math.PI / 180;
  const dLat = (lat2 - lat1) * r, dLon = (lon2 - lon1) * r;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
