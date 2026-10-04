import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from "recharts";
import { ADDON_COST, ADDON_LABEL, AddOn, WellKind, computePayback, defaultRates } from "@/lib/hsp-payback";

const usd = (n: number) => `${n < 0 ? "−" : ""}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
const ADDONS: AddOn[] = ["cement", "acid", "pulse", "frac"];

const HSPPayback = () => {
  const [kind, setKind] = useState<WellKind>("oil");
  const [purchase, setPurchase] = useState(false);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [before, setBefore] = useState(7.5);
  const [after, setAfter] = useState(35);
  const [oilPrice, setOilPrice] = useState(70);
  const [royalty, setRoyalty] = useState(12.5);
  const [opex, setOpex] = useState(15);
  const [decline, setDecline] = useState(10);

  useEffect(() => { const r = defaultRates(kind, addOns); setBefore(r.before); setAfter(r.after); }, [kind, addOns]);

  const results = useMemo(() => [3, 5, 10].map((wells) => ({
    wells,
    r: computePayback({ kind, purchase, wells, addOns, beforeBpd: before, afterBpd: after, oilPrice, royaltyPct: royalty, opexPerBbl: opex, annualDeclinePct: decline }),
  })), [kind, purchase, addOns, before, after, oilPrice, royalty, opex, decline]);

  const chart = results[0].r.monthly.filter((p) => p.month % 3 === 0).map((p, idx) => ({
    year: +(p.month / 12).toFixed(2),
    w3: p.cumulative, w5: results[1].r.monthly[idx * 3].cumulative, w10: results[2].r.monthly[idx * 3].cumulative,
  }));

  const num = (v: number, set: (n: number) => void, label: string, step = 1) => (
    <div className="space-y-1"><Label className="text-xs">{label}</Label>
      <Input type="number" step={step} value={v} onChange={(e) => set(Number(e.target.value) || 0)} /></div>
  );

  return (
    <div className="p-8 space-y-6">
      <div className="text-xs border border-warning/40 text-warning rounded-lg px-3 py-2">
        ESTIMATE — costs and inflow ranges from the Maxxwell Production price list (2011–2016, "by minimum"). Not a quote or investment advice.
      </div>
      <div>
        <Badge className="bg-primary/20 text-primary border-primary/30 mb-1">Stage 7 · Economics</Badge>
        <h1 className="text-3xl font-bold">HSP Re-completion Payback Scenarios</h1>
        <p className="text-muted-foreground text-sm mt-1">Payback period and profit for 3, 5 and 10 wells at 1, 5, 10 and 15 years of exploitation.</p>
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Scenario</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={kind === "oil" ? "default" : "outline"} onClick={() => setKind("oil")}>Low-productive oil well</Button>
            <Button size="sm" variant={kind === "injector" ? "default" : "outline"} onClick={() => setKind("injector")}>Injection well</Button>
            <span className="w-4" />
            <Button size="sm" variant={!purchase ? "default" : "outline"} onClick={() => setPurchase(false)}>Without purchase</Button>
            <Button size="sm" variant={purchase ? "default" : "outline"} onClick={() => setPurchase(true)}>With land purchase</Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {ADDONS.map((a) => (
              <label key={a} className="flex items-center gap-2 text-sm">
                <Checkbox checked={addOns.includes(a)} onCheckedChange={(c) => setAddOns((p) => c ? [...p, a] : p.filter((x) => x !== a))} />
                {ADDON_LABEL[a]} <span className="text-muted-foreground">({usd(ADDON_COST[a])})</span>
              </label>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {num(before, setBefore, "Before, bbl/day", 0.5)}
            {num(after, setAfter, "After, bbl/day", 0.5)}
            {num(oilPrice, setOilPrice, "Oil price, $/bbl")}
            {num(royalty, setRoyalty, "Royalty, %", 0.5)}
            {num(opex, setOpex, "Opex, $/bbl")}
            {num(decline, setDecline, "Annual decline, %")}
          </div>
          {kind === "injector" && <p className="text-xs text-muted-foreground">Injector: only its own oil rate is counted. The up-to-20% uplift in 3–4 neighbouring oil wells is not included.</p>}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Results</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground text-left"><tr>
              <th className="py-2 pr-4">Wells</th><th className="pr-4">Cost / well</th><th className="pr-4">Total cost</th><th className="pr-4">Payback</th>
              {results[0].r.horizons.map((h) => <th key={h.years} className="pr-4">Profit {h.years} yr</th>)}
            </tr></thead>
            <tbody>{results.map(({ wells, r }) => (
              <tr key={wells} className="border-t border-border">
                <td className="py-2 pr-4 font-semibold">{wells}</td><td className="pr-4">{usd(r.costPerWell)}</td><td className="pr-4">{usd(r.capex)}</td>
                <td className="pr-4">{r.paybackMonths ? `${r.paybackMonths} mo` : "> 15 yr"}</td>
                {r.horizons.map((h) => <td key={h.years} className={`pr-4 ${h.profit >= 0 ? "text-success" : "text-destructive"}`}>{usd(h.profit)}</td>)}
              </tr>))}
            </tbody>
          </table>
          <p className="text-xs text-muted-foreground mt-3">Profit = incremental oil × (price × (1 − royalty) − opex) − re-completion cost. Exponential decline of the uplift; taxes, discounting and resale value are not included.</p>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Cumulative cash flow</CardTitle></CardHeader>
        <CardContent style={{ minHeight: 320 }}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chart}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" unit=" yr" />
              <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip formatter={(v: number) => usd(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
              <Line dataKey="w3" name="3 wells" stroke="hsl(var(--primary))" dot={false} />
              <Line dataKey="w5" name="5 wells" stroke="hsl(var(--success))" dot={false} />
              <Line dataKey="w10" name="10 wells" stroke="hsl(var(--warning))" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default HSPPayback;
