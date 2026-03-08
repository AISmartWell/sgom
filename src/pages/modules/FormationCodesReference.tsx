import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Database, MapPin, Layers, Fuel } from "lucide-react";
import { useFormationCodes, useLookupCode } from "@/hooks/useFormationCodes";

const STATE_TABS = [
  { code: "", label: "Все штаты", count: 0 },
  { code: "KS", label: "Kansas", count: 0 },
  { code: "OK", label: "Oklahoma", count: 0 },
  { code: "TX", label: "Texas", count: 0 },
];

const FormationCodesReference = () => {
  const [activeState, setActiveState] = useState("");
  const [search, setSearch] = useState("");
  const [lookupInput, setLookupInput] = useState("");

  const { data: codes = [], isLoading } = useFormationCodes({
    stateCode: activeState || undefined,
    search: search || undefined,
  });

  const { data: lookupResult } = useLookupCode(lookupInput || null);

  const ksCodes = codes.filter(c => c.state_code === "KS").length;
  const okCodes = codes.filter(c => c.state_code === "OK").length;
  const txCodes = codes.filter(c => c.state_code === "TX").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Database className="h-8 w-8 text-primary" />
            Справочник кодов KDOR / API
          </h1>
          <p className="text-muted-foreground mt-1">
            Мульти-штатовый справочник: Kansas (KDOR), Oklahoma (OCC), Texas (RRC)
          </p>
        </div>

        {/* Quick lookup */}
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Быстрый поиск по коду
            </CardTitle>
            <CardDescription>
              Введите API-номер скважины (например: 15-019, 35-073, 42-383) для декодирования
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Input
                  placeholder="Введите код, например 15-019 или 42-383..."
                  value={lookupInput}
                  onChange={(e) => setLookupInput(e.target.value)}
                  className="font-mono"
                />
              </div>
              <Button variant="outline" onClick={() => setLookupInput("")}>Очистить</Button>
            </div>

            {lookupResult && (
              <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary/20 text-primary">{lookupResult.code}</Badge>
                  <span className="font-semibold">{lookupResult.county_name}, {lookupResult.state_name}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span><strong>Штат:</strong> {lookupResult.state_name} ({lookupResult.state_code})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span><strong>Округ:</strong> {lookupResult.county_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Fuel className="h-4 w-4 text-muted-foreground" />
                    <span><strong>Тип:</strong> {lookupResult.well_type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    <span><strong>Формация:</strong> {lookupResult.formation}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Бассейн: {lookupResult.basin} · Источник: {lookupResult.source}
                </p>
              </div>
            )}

            {lookupInput && !lookupResult && (
              <p className="mt-3 text-sm text-muted-foreground">
                Код не найден. Попробуйте формат: SS-CCC (например: 15-019)
              </p>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-5 text-center">
              <p className="text-3xl font-bold text-primary">{ksCodes || "—"}</p>
              <p className="text-sm text-muted-foreground">Kansas (KDOR)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 text-center">
              <p className="text-3xl font-bold text-primary">{okCodes || "—"}</p>
              <p className="text-sm text-muted-foreground">Oklahoma (OCC)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 text-center">
              <p className="text-3xl font-bold text-primary">{txCodes || "—"}</p>
              <p className="text-sm text-muted-foreground">Texas (RRC)</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter tabs + search */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="flex gap-2">
                {STATE_TABS.map((tab) => (
                  <Button
                    key={tab.code}
                    variant={activeState === tab.code ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveState(tab.code)}
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>
              <div className="w-full md:w-72">
                <Input
                  placeholder="Поиск по округу, формации, бассейну..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Загрузка справочника...</p>
            ) : (
              <ScrollArea className="h-[500px]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30 sticky top-0">
                      <th className="px-3 py-2 text-left">Код</th>
                      <th className="px-3 py-2 text-left">Штат</th>
                      <th className="px-3 py-2 text-left">Округ</th>
                      <th className="px-3 py-2 text-left">Тип</th>
                      <th className="px-3 py-2 text-left">Формация</th>
                      <th className="px-3 py-2 text-left">Бассейн</th>
                      <th className="px-3 py-2 text-left">Источник</th>
                    </tr>
                  </thead>
                  <tbody>
                    {codes.map((c) => (
                      <tr key={c.id} className="border-b border-border/30 hover:bg-muted/10">
                        <td className="px-3 py-2 font-mono text-xs font-bold text-primary">{c.code}</td>
                        <td className="px-3 py-2">
                          <Badge variant="outline" className="text-xs">{c.state_code}</Badge>
                        </td>
                        <td className="px-3 py-2">{c.county_name}</td>
                        <td className="px-3 py-2">
                          <Badge className={
                            c.well_type === "OIL" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                            c.well_type === "GAS" ? "bg-sky-500/20 text-sky-400 border-sky-500/30" :
                            "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          }>
                            {c.well_type}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-xs">{c.formation}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{c.basin}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{c.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {codes.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Нет результатов</p>
                )}
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default FormationCodesReference;
