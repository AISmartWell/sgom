import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Database, TrendingUp, Droplets, Flame, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from "recharts";

interface WellOption {
  id: string;
  well_name: string | null;
  api_number: string | null;
  formation: string | null;
  state: string;
  county: string | null;
  production_oil: number | null;
  production_gas: number | null;
  water_cut: number | null;
  total_depth: number | null;
  status: string | null;
}

interface ProductionRow {
  production_month: string;
  oil_bbl: number | null;
  gas_mcf: number | null;
  water_bbl: number | null;
  days_on: number | null;
}

interface WellLogRow {
  measured_depth: number;
  gamma_ray: number | null;
  resistivity: number | null;
  porosity: number | null;
  sp: number | null;
  density: number | null;
  neutron_porosity: number | null;
}

const RealDataTab = () => {
  const [wells, setWells] = useState<WellOption[]>([]);
  const [selectedWellId, setSelectedWellId] = useState<string>("");
  const [production, setProduction] = useState<ProductionRow[]>([]);
  const [wellLogs, setWellLogs] = useState<WellLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Load wells
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("wells")
        .select("id, well_name, api_number, formation, state, county, production_oil, production_gas, water_cut, total_depth, status")
        .order("created_at", { ascending: false })
        .limit(100);
      setWells(data || []);
      setLoading(false);
      if (data && data.length > 0) {
        setSelectedWellId(data[0].id);
      }
    })();
  }, []);

  // Load well details
  useEffect(() => {
    if (!selectedWellId) return;
    setLoadingDetail(true);
    Promise.all([
      supabase
        .from("production_history")
        .select("production_month, oil_bbl, gas_mcf, water_bbl, days_on")
        .eq("well_id", selectedWellId)
        .order("production_month", { ascending: true }),
      supabase
        .from("well_logs")
        .select("measured_depth, gamma_ray, resistivity, porosity, sp, density, neutron_porosity")
        .eq("well_id", selectedWellId)
        .order("measured_depth", { ascending: true })
        .limit(500),
    ]).then(([prodRes, logRes]) => {
      setProduction(prodRes.data || []);
      setWellLogs(logRes.data || []);
      setLoadingDetail(false);
    });
  }, [selectedWellId]);

  const selectedWell = wells.find((w) => w.id === selectedWellId);

  const productionChartData = production.map((p) => ({
    month: new Date(p.production_month).toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
    oil: p.oil_bbl || 0,
    gas: p.gas_mcf || 0,
    water: p.water_bbl || 0,
  }));

  const cumulativeData = production.reduce<{ month: string; cumOil: number; cumGas: number; cumWater: number }[]>(
    (acc, p) => {
      const prev = acc.length > 0 ? acc[acc.length - 1] : { cumOil: 0, cumGas: 0, cumWater: 0 };
      acc.push({
        month: new Date(p.production_month).toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        cumOil: prev.cumOil + (p.oil_bbl || 0),
        cumGas: prev.cumGas + (p.gas_mcf || 0),
        cumWater: prev.cumWater + (p.water_bbl || 0),
      });
      return acc;
    },
    []
  );

  // Sampled well logs for chart (every Nth point)
  const logStep = Math.max(1, Math.floor(wellLogs.length / 200));
  const logChartData = wellLogs.filter((_, i) => i % logStep === 0).map((l) => ({
    depth: l.measured_depth,
    gr: l.gamma_ray,
    res: l.resistivity,
    por: l.porosity != null ? l.porosity * 100 : null,
    sp: l.sp,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="ml-3 text-slate-400">Loading wells from database...</span>
      </div>
    );
  }

  if (wells.length === 0) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="py-16 text-center">
          <Database className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-white font-semibold text-lg">No Wells in Database</p>
          <p className="text-slate-500 text-sm mt-2">Import wells via Data Collection or Data Import modules first.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-500" /> Real Data Analytics
          </h3>
          <p className="text-sm text-slate-500">{wells.length} wells loaded from your database</p>
        </div>
        <Select value={selectedWellId} onValueChange={setSelectedWellId}>
          <SelectTrigger className="w-[300px] bg-slate-900 border-slate-700 text-white">
            <SelectValue placeholder="Select well" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            {wells.map((w) => (
              <SelectItem key={w.id} value={w.id} className="text-white">
                {w.well_name || w.api_number || w.id.slice(0, 8)}
                {w.formation ? ` · ${w.formation}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Well Summary Cards */}
      {selectedWell && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: "Oil Production", value: selectedWell.production_oil ? `${selectedWell.production_oil.toLocaleString()} bbl/d` : "N/A", icon: <Flame className="w-5 h-5 text-amber-500" /> },
            { label: "Gas Production", value: selectedWell.production_gas ? `${selectedWell.production_gas.toLocaleString()} mcf/d` : "N/A", icon: <BarChart3 className="w-5 h-5 text-blue-400" /> },
            { label: "Water Cut", value: selectedWell.water_cut != null ? `${selectedWell.water_cut.toFixed(1)}%` : "N/A", icon: <Droplets className="w-5 h-5 text-cyan-400" /> },
            { label: "Total Depth", value: selectedWell.total_depth ? `${selectedWell.total_depth.toLocaleString()} ft` : "N/A", icon: <TrendingUp className="w-5 h-5 text-emerald-400" /> },
            { label: "Status", value: selectedWell.status || "Unknown", icon: <Badge className={`text-xs ${selectedWell.status === "Active" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-600/20 text-slate-400"}`}>{selectedWell.status || "?"}</Badge> },
          ].map((c, i) => (
            <Card key={i} className="bg-slate-900 border-slate-800">
              <CardContent className="pt-4 pb-3 flex flex-col items-center text-center">
                {typeof c.icon === "object" && "type" in c.icon && c.icon.type === Badge ? c.icon : c.icon}
                <p className="text-[11px] uppercase tracking-wider text-slate-500 mt-2">{c.label}</p>
                <p className="text-lg font-bold font-mono text-white mt-0.5">{c.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {loadingDetail ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          <span className="ml-2 text-slate-400">Loading well data...</span>
        </div>
      ) : (
        <>
          {/* Production History Charts */}
          {productionChartData.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white">Monthly Production</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={productionChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 10 }} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="oil" name="Oil (bbl)" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="water" name="Water (bbl)" fill="#06b6d4" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white">Cumulative Production</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={cumulativeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 10 }} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Area type="monotone" dataKey="cumOil" name="Cum. Oil" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} />
                      <Area type="monotone" dataKey="cumGas" name="Cum. Gas" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} />
                      <Area type="monotone" dataKey="cumWater" name="Cum. Water" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="py-10 text-center">
                <p className="text-slate-500 text-sm">No production history for this well. Upload via Production History module.</p>
              </CardContent>
            </Card>
          )}

          {/* Well Log Curves */}
          {logChartData.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white">Gamma Ray & SP vs Depth</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={logChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <YAxis dataKey="depth" type="number" reversed tick={{ fill: "#64748b", fontSize: 10 }} label={{ value: "Depth (ft)", angle: -90, position: "insideLeft", fill: "#64748b" }} />
                      <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="gr" name="GR (API)" stroke="#22c55e" dot={false} strokeWidth={1.5} />
                      <Line type="monotone" dataKey="sp" name="SP (mV)" stroke="#a78bfa" dot={false} strokeWidth={1.5} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white">Resistivity & Porosity vs Depth</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={logChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <YAxis dataKey="depth" type="number" reversed tick={{ fill: "#64748b", fontSize: 10 }} label={{ value: "Depth (ft)", angle: -90, position: "insideLeft", fill: "#64748b" }} />
                      <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="res" name="Resistivity (Ω·m)" stroke="#f59e0b" dot={false} strokeWidth={1.5} />
                      <Line type="monotone" dataKey="por" name="Porosity (%)" stroke="#06b6d4" dot={false} strokeWidth={1.5} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="py-10 text-center">
                <p className="text-slate-500 text-sm">No well log data for this well. Upload LAS files via Geophysical module.</p>
              </CardContent>
            </Card>
          )}

          {/* Wells Summary Table */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white">All Wells Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-900 z-10">
                    <tr className="border-b border-slate-800">
                      {["Well Name", "API #", "State", "County", "Formation", "Oil (bbl/d)", "Gas (mcf/d)", "Water Cut", "Depth (ft)", "Status"].map((h) => (
                        <th key={h} className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider text-slate-600 font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {wells.map((w) => (
                      <tr
                        key={w.id}
                        onClick={() => setSelectedWellId(w.id)}
                        className={`border-b border-slate-800/50 cursor-pointer transition-colors ${w.id === selectedWellId ? "bg-amber-500/10" : "hover:bg-slate-800/40"}`}
                      >
                        <td className="px-3 py-2.5 font-medium text-white whitespace-nowrap">{w.well_name || "—"}</td>
                        <td className="px-3 py-2.5 font-mono text-blue-400 text-xs">{w.api_number || "—"}</td>
                        <td className="px-3 py-2.5 text-slate-400">{w.state}</td>
                        <td className="px-3 py-2.5 text-slate-400">{w.county || "—"}</td>
                        <td className="px-3 py-2.5 text-slate-400">{w.formation || "—"}</td>
                        <td className="px-3 py-2.5 font-mono text-amber-400">{w.production_oil?.toLocaleString() || "—"}</td>
                        <td className="px-3 py-2.5 font-mono text-red-400">{w.production_gas?.toLocaleString() || "—"}</td>
                        <td className="px-3 py-2.5 font-mono text-cyan-400">{w.water_cut != null ? `${w.water_cut.toFixed(1)}%` : "—"}</td>
                        <td className="px-3 py-2.5 font-mono text-slate-300">{w.total_depth?.toLocaleString() || "—"}</td>
                        <td className="px-3 py-2.5">
                          <Badge variant="outline" className={`text-[10px] ${w.status === "Active" ? "border-emerald-500/40 text-emerald-400" : "border-slate-600 text-slate-500"}`}>
                            {w.status || "N/A"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default RealDataTab;
