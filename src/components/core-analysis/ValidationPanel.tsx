import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { FORMATION_DB, lookupFormation, formatPermeability, type FormationData } from "@/lib/formation-db";

interface ParsedValues {
  porosity: number | null;
  permeability: number | null;
  rockType: string | null;
}

function parseAnalysisText(text: string): ParsedValues {
  // Extract porosity (look for % values near porosity keywords)
  let porosity: number | null = null;
  const phiPatterns = [
    /porosity[^%\d]*?(\d+(?:\.\d+)?)\s*%/i,
    /visual porosity[^%\d]*?(\d+(?:\.\d+)?)\s*%/i,
    /porosity estimate[^%\d]*?(\d+(?:\.\d+)?)\s*%/i,
    /(\d+(?:\.\d+)?)\s*%\s*(?:porosity|φ)/i,
    /φ\s*[:=≈~]\s*(\d+(?:\.\d+)?)/i,
  ];
  for (const pat of phiPatterns) {
    const m = text.match(pat);
    if (m) { porosity = parseFloat(m[1]); break; }
  }

  // Extract permeability (mD or µD)
  let permeability: number | null = null;
  const kPatterns = [
    /(\d+(?:\.\d+)?)\s*(?:–|-|to)\s*(\d+(?:\.\d+)?)\s*mD/i,
    /(\d+(?:\.\d+)?)\s*mD/i,
    /(\d+(?:\.\d+)?)\s*(?:–|-|to)\s*(\d+(?:\.\d+)?)\s*µD/i,
    /(\d+(?:\.\d+)?)\s*µD/i,
    /permeability[^:]*?:\s*(\d+(?:\.\d+)?)/i,
  ];
  for (const pat of kPatterns) {
    const m = text.match(pat);
    if (m) {
      const isRange = m[2] !== undefined;
      const isMicroDarcy = pat.source.includes("µD");
      if (isRange) {
        permeability = (parseFloat(m[1]) + parseFloat(m[2])) / 2;
      } else {
        permeability = parseFloat(m[1]);
      }
      if (isMicroDarcy) permeability /= 1000;
      break;
    }
  }

  // Extract rock type
  let rockType: string | null = null;
  const rtMatch = text.match(/(?:rock type|primary rock type|classification)[:\s]*\**([^*\n,]+)/i);
  if (rtMatch) rockType = rtMatch[1].trim();

  return { porosity, permeability, rockType };
}

interface ValidationResult {
  id: string;
  sampleName: string;
  createdAt: string;
  rockType: string | null;
  aiPorosity: number | null;
  aiPermeability: number | null;
  refFormation: string | null;
  ref: FormationData | null;
  porosityStatus: "in-range" | "near" | "out" | "no-data";
  permStatus: "in-range" | "near" | "out" | "no-data";
  porosityDeviation: number | null;
  permDeviation: number | null;
}

function computeDeviation(value: number, min: number, max: number): { status: "in-range" | "near" | "out"; deviation: number } {
  const mid = (min + max) / 2;
  const range = max - min;
  if (value >= min && value <= max) {
    return { status: "in-range", deviation: ((value - mid) / mid) * 100 };
  }
  const tolerance = range * 0.15; // 15% tolerance band
  if (value >= min - tolerance && value <= max + tolerance) {
    const dev = value < min ? ((min - value) / mid) * 100 : ((value - max) / mid) * 100;
    return { status: "near", deviation: value < mid ? -dev : dev };
  }
  const dev = value < min ? ((min - value) / mid) * 100 : ((value - max) / mid) * 100;
  return { status: "out", deviation: value < mid ? -dev : dev };
}

function statusIcon(status: string) {
  switch (status) {
    case "in-range": return <CheckCircle2 className="h-4 w-4 text-success" />;
    case "near": return <AlertTriangle className="h-4 w-4 text-warning" />;
    case "out": return <XCircle className="h-4 w-4 text-destructive" />;
    default: return <span className="h-4 w-4 text-muted-foreground">—</span>;
  }
}

function statusBadge(status: string) {
  switch (status) {
    case "in-range": return <Badge variant="outline" className="text-success border-success/30 text-[10px]">В диапазоне</Badge>;
    case "near": return <Badge variant="outline" className="text-warning border-warning/30 text-[10px]">Близко</Badge>;
    case "out": return <Badge variant="outline" className="text-destructive border-destructive/30 text-[10px]">Отклонение</Badge>;
    default: return <Badge variant="outline" className="text-muted-foreground text-[10px]">Нет данных</Badge>;
  }
}

export const ValidationPanel = () => {
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, matched: 0, inRange: 0, near: 0, out: 0 });

  const fetchAndValidate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("core_analyses" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      const records = (data as any[]) || [];

      const validated: ValidationResult[] = records.map((rec) => {
        const parsed = parseAnalysisText(rec.analysis);
        const ref = rec.rock_type ? lookupFormation(rec.rock_type) : null;

        let porosityStatus: ValidationResult["porosityStatus"] = "no-data";
        let permStatus: ValidationResult["permStatus"] = "no-data";
        let porosityDeviation: number | null = null;
        let permDeviation: number | null = null;

        if (ref && parsed.porosity !== null) {
          const d = computeDeviation(parsed.porosity, ref.phiMin, ref.phiMax);
          porosityStatus = d.status;
          porosityDeviation = d.deviation;
        }
        if (ref && parsed.permeability !== null) {
          // Use log scale for permeability deviation
          const logVal = Math.log10(Math.max(parsed.permeability, 1e-7));
          const logMin = Math.log10(Math.max(ref.kMin, 1e-7));
          const logMax = Math.log10(Math.max(ref.kMax, 1e-7));
          const d = computeDeviation(logVal, logMin, logMax);
          permStatus = d.status;
          permDeviation = d.deviation;
        }

        const matchedKey = rec.rock_type ? Object.keys(FORMATION_DB).find(
          k => k.toLowerCase() === rec.rock_type?.toLowerCase() || rec.rock_type?.toLowerCase().includes(k.toLowerCase())
        ) : null;

        return {
          id: rec.id,
          sampleName: rec.sample_name || "Core Sample",
          createdAt: rec.created_at,
          rockType: rec.rock_type,
          aiPorosity: parsed.porosity,
          aiPermeability: parsed.permeability,
          refFormation: matchedKey || null,
          ref,
          porosityStatus,
          permStatus,
          porosityDeviation,
          permDeviation,
        };
      });

      const matched = validated.filter(v => v.ref !== null);
      const hasData = matched.filter(v => v.porosityStatus !== "no-data" || v.permStatus !== "no-data");
      const inRange = hasData.filter(v => v.porosityStatus === "in-range" && (v.permStatus === "in-range" || v.permStatus === "no-data"));
      const near = hasData.filter(v => v.porosityStatus === "near" || v.permStatus === "near");
      const out = hasData.filter(v => v.porosityStatus === "out" || v.permStatus === "out");

      setResults(validated);
      setStats({
        total: records.length,
        matched: matched.length,
        inRange: inRange.length,
        near: near.length,
        out: out.length,
      });
    } catch (err) {
      console.error("Validation fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAndValidate(); }, []);

  const matchRate = stats.total > 0 ? Math.round((stats.matched / stats.total) * 100) : 0;
  const accuracyRate = stats.matched > 0
    ? Math.round(((stats.inRange + stats.near) / Math.max(stats.inRange + stats.near + stats.out, 1)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Всего анализов</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Совпало с формациями</p>
            <p className="text-2xl font-bold">{stats.matched}</p>
            <Progress value={matchRate} className="h-1.5 mt-1" />
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">В диапазоне</p>
            <p className="text-2xl font-bold text-success">{stats.inRange}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Точность модели</p>
            <p className="text-2xl font-bold">{accuracyRate}%</p>
            <Progress value={accuracyRate} className="h-1.5 mt-1" />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Валидация: расчёт vs факт
              </CardTitle>
              <CardDescription>
                Сравнение ИИ-анализа керна с эталонными диапазонами по формациям
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchAndValidate} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
              Обновить
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>Нет данных для валидации</p>
              <p className="text-sm mt-1">Проведите анализ керна — результаты появятся здесь</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-2 pr-3 font-medium text-muted-foreground">Образец</th>
                      <th className="pb-2 pr-3 font-medium text-muted-foreground">Формация</th>
                      <th className="pb-2 pr-3 font-medium text-muted-foreground text-center">φ ИИ</th>
                      <th className="pb-2 pr-3 font-medium text-muted-foreground text-center">φ эталон</th>
                      <th className="pb-2 pr-3 font-medium text-muted-foreground text-center">φ</th>
                      <th className="pb-2 pr-3 font-medium text-muted-foreground text-center">k ИИ</th>
                      <th className="pb-2 pr-3 font-medium text-muted-foreground text-center">k эталон</th>
                      <th className="pb-2 font-medium text-muted-foreground text-center">k</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r) => (
                      <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 pr-3 max-w-[140px] truncate">{r.sampleName}</td>
                        <td className="py-2 pr-3">
                          {r.refFormation ? (
                            <Badge variant="secondary" className="text-[10px]">{r.refFormation}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="py-2 pr-3 text-center font-mono text-xs">
                          {r.aiPorosity !== null ? `${r.aiPorosity.toFixed(1)}%` : "—"}
                        </td>
                        <td className="py-2 pr-3 text-center font-mono text-xs text-muted-foreground">
                          {r.ref ? `${r.ref.phiMin}–${r.ref.phiMax}%` : "—"}
                        </td>
                        <td className="py-2 pr-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {statusIcon(r.porosityStatus)}
                            {r.porosityDeviation !== null && (
                              <span className="text-[10px] font-mono text-muted-foreground">
                                {r.porosityDeviation > 0 ? "+" : ""}{r.porosityDeviation.toFixed(0)}%
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 pr-3 text-center font-mono text-xs">
                          {r.aiPermeability !== null ? formatPermeability(r.aiPermeability) : "—"}
                        </td>
                        <td className="py-2 pr-3 text-center font-mono text-xs text-muted-foreground">
                          {r.ref ? `${formatPermeability(r.ref.kMin)}–${formatPermeability(r.ref.kMax)}` : "—"}
                        </td>
                        <td className="py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {statusIcon(r.permStatus)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-success" /> В диапазоне</div>
        <div className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-warning" /> Близко (±15%)</div>
        <div className="flex items-center gap-1"><XCircle className="h-3 w-3 text-destructive" /> Отклонение</div>
      </div>
    </div>
  );
};
