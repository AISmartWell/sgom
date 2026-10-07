import { useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { flagLabel, type Correlation, type CellFlag } from "@/lib/well-correlation";

interface WellLoc { id: string; latitude: number | null; longitude: number | null }

const tok = (name: string) =>
  `hsl(${getComputedStyle(document.documentElement).getPropertyValue(name).trim()})`;

/** Plan-view map of one correlated sand unit over a regional geological base map. */
export function CorrelationMap({ corr, wells }: { corr: Correlation; wells: WellLoc[] }) {
  const [unitId, setUnitId] = useState(corr.units[0]?.id ?? "");
  const [geo, setGeo] = useState(true);
  const unit = corr.units.find(u => u.id === unitId) ?? corr.units[0];
  const colors: Record<CellFlag | "ref", string> = useMemo(() => ({
    ref: tok("--primary"), ok: tok("--success"), offset: tok("--warning"),
    thinning: tok("--warning"), missing: tok("--destructive"), no_coverage: tok("--muted-foreground"),
  }), []);

  const pts = corr.wells.map(w => {
    const loc = wells.find(x => x.id === w.wellId);
    return loc?.latitude != null && loc?.longitude != null ? { w, lat: +loc.latitude, lng: +loc.longitude } : null;
  }).filter(Boolean) as { w: Correlation["wells"][number]; lat: number; lng: number }[];
  const ref = pts.find(p => p.w.wellId === corr.referenceId);

  if (!unit) return <p className="text-sm text-muted-foreground">Correlation map: no sand units were picked from the gamma-ray logs, so there is nothing to plot.</p>;
  if (pts.length < 2) return <p className="text-sm text-muted-foreground">Map view needs coordinates for at least two correlated wells.</p>;

  const bounds = pts.map(p => [p.lat, p.lng] as [number, number]);

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">Correlation map (plan view)</h4>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="text-muted-foreground">Sand unit</label>
        <select value={unit.id} onChange={e => setUnitId(e.target.value)} className="bg-background border border-border rounded px-2 py-1">
          {corr.units.map(u => <option key={u.id} value={u.id}>{u.id} (ref top {u.refTop.toFixed(0)} ft)</option>)}
        </select>
        <label className="flex items-center gap-1 text-muted-foreground"><input type="checkbox" checked={geo} onChange={e => setGeo(e.target.checked)} /> Regional geological map</label>
      </div>
      <div className="h-[420px] rounded-md overflow-hidden border border-border">
        <MapContainer bounds={bounds} boundsOptions={{ padding: [40, 40] }} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
          {geo && <TileLayer url="https://tiles.macrostrat.org/carto/{z}/{x}/{y}.png" opacity={0.55} attribution="Geology &copy; Macrostrat" />}
          {ref && pts.filter(p => p !== ref).map(p => {
            const f = unit.cells[p.w.wellId]?.flag ?? "no_coverage";
            return <Polyline key={`l-${p.w.wellId}`} positions={[[ref.lat, ref.lng], [p.lat, p.lng]]} pathOptions={{ color: colors[f], weight: 2, dashArray: f === "ok" ? undefined : "6 6" }} />;
          })}
          {pts.map(p => {
            const isRef = p.w.wellId === corr.referenceId;
            const c = unit.cells[p.w.wellId];
            const f = c?.flag ?? "no_coverage";
            return (
              <CircleMarker key={p.w.wellId} center={[p.lat, p.lng]} radius={isRef ? 10 : 8} pathOptions={{ color: isRef ? colors.ref : colors[f], fillColor: isRef ? colors.ref : colors[f], fillOpacity: 0.85, weight: 2 }}>
                <Tooltip permanent direction="top" offset={[0, -8]}>
                  <div className="text-xs">
                    <b>{p.w.name}</b>{isRef && " (reference)"}<br />
                    {c?.sand ? `Top ${c.sand.top.toFixed(0)} ft · ${c.sand.thickness.toFixed(0)} ft thick` : "No sand picked"}
                    {c?.deltaTop != null && !isRef && <><br />Δ top {c.deltaTop > 0 ? "+" : ""}{c.deltaTop} ft</>}
                    {!isRef && <><br />{flagLabel[f]}</>}
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {(["ok", "offset", "thinning", "missing", "no_coverage"] as CellFlag[]).map(f => (
          <span key={f} className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full" style={{ background: colors[f] }} />{flagLabel[f]}</span>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Illustrative screening view: unit names are unnamed GR candidates, not formations. The geological base map is a public regional compilation (Macrostrat) at small scale; pinch-outs and faults must be confirmed by a geophysicist. {pts.length < corr.wells.length && `${corr.wells.length - pts.length} well(s) without coordinates are not shown.`}</p>
    </div>
  );
}
