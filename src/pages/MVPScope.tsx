import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock, Rocket, Layers, Shield, Brain, Radio, Microscope, BarChart3, Target, DollarSign, Settings, FolderSearch, TrendingDown, Radar, Activity, GraduationCap, Building2, TrendingUp, ChevronDown, AlertTriangle, Server, Globe, Gauge, CreditCard, ShieldCheck, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

const mvpModules = [
  {
    stage: "Stage 1",
    title: "Field Scanning",
    icon: Radar,
    description: "Satellite imagery + well location mapping for field overview",
    emoji: "🛰️",
    inputs: ["Координаты месторождения (lat/lon)", "Источник спутниковых снимков (Sentinel-2 / Mapbox)"],
    outputs: ["Карта месторождения с маркерами скважин", "Границы лицензионного участка"],
    acceptance: ["Отображение ≥100 скважин на карте без задержек", "Поддержка зума и кластеризации маркеров", "Загрузка спутниковых тайлов < 3 сек"],
    dependencies: [],
  },
  {
    stage: "Stage 2",
    title: "Data Classification",
    icon: FolderSearch,
    description: "Automated categorization and quality scoring of well data",
    emoji: "📂",
    inputs: ["Сырые данные скважин из Stage 1", "Публичные БД (Oklahoma/Texas OCC/RRC)"],
    outputs: ["Категоризированные записи (active/inactive/plugged)", "Quality Score (0–100) для каждой скважины"],
    acceptance: ["Автоматическая классификация ≥95% записей", "AI Quality Score для каждой скважины", "Фильтрация по статусу, формации, округу"],
    dependencies: ["Field Scanning"],
  },
  {
    stage: "Stage 3",
    title: "Cumulative Analysis",
    icon: TrendingDown,
    description: "Production decline curves and cumulative output analysis",
    emoji: "📈",
    inputs: ["Исторические данные добычи (oil/gas/water)", "Временные ряды по скважинам"],
    outputs: ["Кривые падения добычи (Arps decline)", "Кумулятивная добыча и прогноз EUR", "Коэффициент обводнённости (water cut trend)"],
    acceptance: ["Построение decline curve для выбранной скважины", "Расчёт EUR (Estimated Ultimate Recovery)", "Интерактивные графики с Recharts"],
    dependencies: ["Data Classification"],
  },
  {
    stage: "Stage 4",
    title: "AI Well Selection & Ranking",
    icon: Target,
    description: "ML-driven candidate ranking for SPT treatment",
    emoji: "🎯",
    inputs: ["Классифицированные данные скважин", "Decline curves из Stage 3", "Геологические параметры (формация, глубина)"],
    outputs: ["Ранжированный список кандидатов для SPT", "AI Score (0–100) с объяснением факторов", "Top-N рекомендации"],
    acceptance: ["Ранжирование ≥50 скважин за < 5 сек", "Прозрачная формула скоринга", "Фильтры по штату, формации, минимальному баллу"],
    dependencies: ["Cumulative Analysis", "Data Classification"],
  },
  {
    stage: "Stage 5",
    title: "Economic Analysis",
    icon: DollarSign,
    description: "ROI modeling, NPV/IRR calculations per well candidate",
    emoji: "💵",
    inputs: ["Текущая добыча скважины", "Прогноз прироста после SPT", "Стоимость обработки SPT", "Цена нефти (API)"],
    outputs: ["NPV, IRR, Payback Period для каждого кандидата", "Sensitivity analysis (цена нефти ±20%)", "Сравнительная таблица ROI"],
    acceptance: ["Расчёт NPV/IRR за < 2 сек", "Динамическое обновление при смене цены нефти", "Экспорт результатов в PDF"],
    dependencies: ["AI Well Selection & Ranking"],
  },
  {
    stage: "Stage 7",
    title: "SPT Parameters",
    icon: Settings,
    description: "Treatment slot configuration and chemical dosage optimization",
    emoji: "⚙️",
    inputs: ["Данные о скважине (глубина, диаметр, формация)", "Выбранный кандидат из Stage 4"],
    outputs: ["Конфигурация слотов (количество, глубина, интервал)", "Дозировка химических реагентов", "Расчётное давление обработки"],
    acceptance: ["Визуализация расположения слотов на стволе скважины", "Автоматический подбор параметров по формации", "Валидация параметров (мин/макс диапазоны)"],
    dependencies: ["AI Well Selection & Ranking"],
  },
  {
    stage: "Stage 6",
    title: "Geophysical Expertise",
    icon: Activity,
    description: "Well log analysis with AI interpretation and formation evaluation",
    emoji: "📊",
    inputs: ["Каротажные данные (GR, SP, Resistivity, Porosity)", "LAS-файлы или табличные данные"],
    outputs: ["AI-интерпретация каротажных кривых", "Определение коллекторских зон", "Рекомендации по интервалам обработки"],
    acceptance: ["Визуализация каротажных кривых (multi-track)", "AI-разметка продуктивных зон", "Поддержка загрузки LAS-файлов"],
    dependencies: ["Data Classification"],
  },
  {
    stage: "Core",
    title: "Core Analysis (CV)",
    icon: Microscope,
    description: "Computer vision for core sample classification and geological interpretation",
    emoji: "🔬",
    inputs: ["Фотографии керна (JPEG/PNG)", "Метаданные (глубина отбора, скважина)"],
    outputs: ["Классификация литотипа (limestone/sandstone/shale/dolomite)", "Confidence score и описание", "Geological interpretation report"],
    acceptance: ["Классификация изображения за < 5 сек", "Accuracy ≥ 85% на тестовом наборе", "Поддержка drag & drop загрузки"],
    dependencies: [],
  },
  {
    stage: "Core",
    title: "EOR Optimization",
    icon: Brain,
    description: "AI-driven Enhanced Oil Recovery optimization — центральный хаб MVP pipeline",
    emoji: "🧠",
    inputs: ["Результаты всех Stage 1–7 модулей", "Данные Core Analysis"],
    outputs: ["Сводный отчёт по оптимизации EOR", "Итоговые рекомендации по обработке", "Dashboard с ключевыми метриками"],
    acceptance: ["Агрегация данных из всех модулей", "Единый dashboard с KPI", "Генерация PDF-отчёта"],
    dependencies: ["Field Scanning", "Data Classification", "Cumulative Analysis", "AI Well Selection & Ranking", "Economic Analysis", "SPT Parameters", "Geophysical Expertise", "Core Analysis (CV)"],
  },
  {
    stage: "Core",
    title: "Multi-Tenant Auth",
    icon: Building2,
    description: "Company-based access control, user management, RLS policies",
    emoji: "🏢",
    inputs: ["Email/password для регистрации", "Название компании"],
    outputs: ["JWT-токены аутентификации", "Company-scoped данные (RLS)", "Роли: admin / operator / viewer"],
    acceptance: ["Регистрация и логин пользователей", "Изоляция данных между компаниями (RLS)", "Минимум 3 роли с разными правами"],
    dependencies: [],
  },
];

const phase2Modules = [
  {
    title: "Reservoir Simulation",
    icon: BarChart3,
    description: "Physics-based or surrogate reservoir modeling",
    reason: "Requires physics engine / external solver",
    emoji: "📊",
  },
  {
    title: "ML Model Training",
    icon: GraduationCap,
    description: "Custom TensorFlow/PyTorch model training pipeline",
    reason: "GPU infrastructure + labeled dataset needed",
    emoji: "🎓",
  },
  {
    title: "IoT / Telemetry",
    icon: Radio,
    description: "Real-time SCADA data ingestion and monitoring",
    reason: "Requires hardware integration / simulators",
    emoji: "📡",
  },
];

const v11Modules = [
  {
    title: "SPT Projection",
    icon: TrendingUp,
    description: "Post-treatment production forecasting",
    emoji: "🚀",
  },
  {
    title: "Financial Forecast",
    icon: DollarSign,
    description: "Multi-year ROI projections and sensitivity analysis",
    emoji: "💰",
  },
];

const allModulesComparison = [
  ...mvpModules.map(m => ({ title: m.title, emoji: m.emoji, description: m.description, inMVP: true, phase: "MVP" as const })),
  ...phase2Modules.map(m => ({ title: m.title, emoji: m.emoji, description: m.description, inMVP: false, phase: "Phase 2" as const })),
  ...v11Modules.map(m => ({ title: m.title, emoji: m.emoji, description: m.description, inMVP: false, phase: "v1.1" as const })),
  { title: "Data Collection", emoji: "🗄️", description: "Well data ingestion from Oklahoma & Texas databases", inMVP: false, phase: "v1.1" as const },
  { title: "Geological Analysis", emoji: "🗺️", description: "AI seismic analysis, well logs, 3D geological modeling", inMVP: false, phase: "v1.1" as const },
  { title: "Real-Time Monitor", emoji: "📡", description: "Live SCADA data monitoring dashboard", inMVP: false, phase: "Phase 2" as const },
  { title: "Telemetry Architecture", emoji: "🔗", description: "IoT data pipeline architecture and design", inMVP: false, phase: "Phase 2" as const },
  { title: "SPT Treatment", emoji: "🔧", description: "Hydro-slotting technology configuration (Patent US8863823)", inMVP: false, phase: "v1.1" as const },
  { title: "Reports", emoji: "✅", description: "Automated report generation and export", inMVP: false, phase: "v1.1" as const },
  { title: "SaaS Business Model", emoji: "💼", description: "Subscription tiers, pricing, and go-to-market strategy", inMVP: false, phase: "v1.1" as const },
  { title: "Architecture", emoji: "🏗️", description: "System architecture overview and tech stack documentation", inMVP: false, phase: "v1.1" as const },
];

const MVPScope = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto flex items-center gap-4 px-6 py-4">
          <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">MVP Scope & Roadmap</h1>
            <p className="text-sm text-muted-foreground">AI Smart Well SGOM — Module Priority Map</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 space-y-12 max-w-6xl">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6 text-center">
              <Rocket className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-3xl font-bold text-primary">10</p>
              <p className="text-sm text-muted-foreground">MVP Modules</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="pt-6 text-center">
              <Clock className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-yellow-500">3</p>
              <p className="text-sm text-muted-foreground">Phase 2</p>
            </CardContent>
          </Card>
          <Card className="border-muted-foreground/30 bg-muted/30">
            <CardContent className="pt-6 text-center">
              <Layers className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-3xl font-bold text-muted-foreground">2</p>
              <p className="text-sm text-muted-foreground">v1.1 Secondary</p>
            </CardContent>
          </Card>
        </div>

        {/* MVP Core with detailed specs */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Essential MVP</h2>
              <p className="text-sm text-muted-foreground">Data-to-Recommendation Pipeline — must ship</p>
            </div>
          </div>

          <div className="space-y-4">
            {mvpModules.map((mod) => (
              <Collapsible key={mod.title}>
                <Card className="border-primary/20 hover:border-primary/40 transition-colors">
                  <CollapsibleTrigger className="w-full text-left">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <mod.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-[10px]">{mod.stage}</Badge>
                            {mod.dependencies.length > 0 && (
                              <Badge variant="outline" className="text-[10px] border-muted-foreground/30 text-muted-foreground">
                                {mod.dependencies.length} dep{mod.dependencies.length > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-sm">{mod.emoji} {mod.title}</CardTitle>
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 pb-3">
                      <p className="text-xs text-muted-foreground">{mod.description}</p>
                    </CardContent>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="px-6 pb-5 space-y-4 border-t border-border/40 pt-4">
                      {/* Inputs */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">📥 Входные данные</p>
                        <ul className="space-y-1">
                          {mod.inputs.map((inp, i) => (
                            <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                              <span className="text-muted-foreground mt-0.5">•</span> {inp}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Outputs */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">📤 Выходные данные</p>
                        <ul className="space-y-1">
                          {mod.outputs.map((out, i) => (
                            <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                              <span className="text-primary mt-0.5">→</span> {out}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Acceptance Criteria */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">✅ Критерии приёмки</p>
                        <ul className="space-y-1">
                          {mod.acceptance.map((acc, i) => (
                            <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                              <CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" /> {acc}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Dependencies */}
                      {mod.dependencies.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">🔗 Зависимости</p>
                          <div className="flex flex-wrap gap-1.5">
                            {mod.dependencies.map((dep) => (
                              <Badge key={dep} variant="outline" className="text-[10px] border-primary/30 text-primary/80">
                                {dep}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        </section>

        {/* Phase 2 */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Phase 2 — Post-MVP</h2>
              <p className="text-sm text-muted-foreground">Requires external infrastructure or hardware</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {phase2Modules.map((mod) => (
              <Card key={mod.title} className="border-yellow-500/20 opacity-80">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                      <mod.icon className="h-5 w-5 text-yellow-500" />
                    </div>
                    <CardTitle className="text-sm">{mod.emoji} {mod.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  <p className="text-xs text-muted-foreground">{mod.description}</p>
                  <p className="text-[11px] text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                    <Shield className="h-3 w-3" /> {mod.reason}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* v1.1 */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
              <Layers className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">v1.1 — Secondary</h2>
              <p className="text-sm text-muted-foreground">Nice-to-have, not blocking launch</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {v11Modules.map((mod) => (
              <Card key={mod.title} className="border-muted opacity-60">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <mod.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-sm">{mod.emoji} {mod.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{mod.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Technical Clarifications from Dev Team */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">🔧 Технические уточнения от команды</h2>
              <p className="text-sm text-muted-foreground">Согласованные архитектурные решения для MVP</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">Python ML Service (Модули 4, 5)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">Dedicated FastAPI inference service вместо Deno Edge Functions для ML моделей.</p>
                <div className="space-y-1">
                  <div className="flex items-start gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Хостинг на AWS/GCP</div>
                  <div className="flex items-start gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Edge Functions вызывают ML API</div>
                  <div className="flex items-start gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Gemini остаётся для текстового анализа</div>
                </div>
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">✅ Согласовано</Badge>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">Texas API Integration (Модуль 2)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">Texas RRC не имеет REST API — требуется custom ETL pipeline.</p>
                <div className="space-y-1">
                  <div className="flex items-start gap-2 text-xs"><AlertTriangle className="h-3 w-3 text-yellow-500 mt-0.5 shrink-0" /> Дополнительно 2–3 недели</div>
                  <div className="flex items-start gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" /> В рамках бюджета $125K</div>
                  <div className="flex items-start gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Нормализация под схему Oklahoma</div>
                </div>
                <Badge variant="outline" className="text-[10px] border-yellow-500/30 text-yellow-600 dark:text-yellow-400">⚠️ +2-3 недели</Badge>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">Reservoir Simulation (Модуль 9)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">MVP: аналитические модели. Физический симулятор — post-MVP.</p>
                <div className="space-y-1">
                  <div className="flex items-start gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Material balance, decline analysis</div>
                  <div className="flex items-start gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Recovery factors</div>
                  <div className="flex items-start gap-2 text-xs text-muted-foreground"><Shield className="h-3 w-3 mt-0.5 shrink-0" /> Physics solver — Phase 2</div>
                </div>
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">✅ Согласовано</Badge>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">IoT / Telemetry (Модули 11–12)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">MVP: API + MQTT + software simulator. SCADA — post-MVP.</p>
                <div className="space-y-1">
                  <div className="flex items-start gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Ingestion API + MQTT endpoint</div>
                  <div className="flex items-start gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Device structure + simulator</div>
                  <div className="flex items-start gap-2 text-xs text-muted-foreground"><Shield className="h-3 w-3 mt-0.5 shrink-0" /> SCADA — Phase 2</div>
                </div>
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">✅ Согласовано</Badge>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">Billing / Payments (Модуль 13)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">Admin UI + subscription structure. Stripe — опционально.</p>
                <div className="space-y-1">
                  <div className="flex items-start gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Admin panel + тарифная сетка</div>
                  <div className="flex items-start gap-2 text-xs"><AlertTriangle className="h-3 w-3 text-yellow-500 mt-0.5 shrink-0" /> Stripe automation: +2-3 нед.</div>
                  <div className="flex items-start gap-2 text-xs text-muted-foreground"><Shield className="h-3 w-3 mt-0.5 shrink-0" /> Рекомендация: manual billing</div>
                </div>
                <Badge variant="outline" className="text-[10px] border-yellow-500/30 text-yellow-600 dark:text-yellow-400">⚠️ Требует решения</Badge>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">Security Audit (Milestone 6)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">MVP: внутренний audit. Полный pentest — post-launch.</p>
                <div className="space-y-1">
                  <div className="flex items-start gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" /> RLS policies audit</div>
                  <div className="flex items-start gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" /> API protection + access control</div>
                  <div className="flex items-start gap-2 text-xs text-muted-foreground"><Shield className="h-3 w-3 mt-0.5 shrink-0" /> Third-party pentest — post-launch</div>
                </div>
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">✅ Согласовано</Badge>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4 border-muted">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm">📎 Дополнительные обязательства</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-primary shrink-0" /> API документация (OpenAPI/Swagger)</div>
                <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-primary shrink-0" /> Full mobile responsiveness</div>
                <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-primary shrink-0" /> Investor Deck & Budget pages</div>
                <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-primary shrink-0" /> Technical documentation for handover</div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Comparison Table */}
        <section>
          <h2 className="text-2xl font-bold mb-2">📋 Module Comparison Analysis</h2>
          <p className="text-sm text-muted-foreground mb-6">All SGOM platform modules vs MVP inclusion status</p>

          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-bold">Module</TableHead>
                  <TableHead className="font-bold">Description</TableHead>
                  <TableHead className="font-bold text-center">MVP Status</TableHead>
                  <TableHead className="font-bold text-center">Phase</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allModulesComparison.map((mod) => (
                  <TableRow key={mod.title}>
                    <TableCell className="font-medium whitespace-nowrap">
                      <span className="mr-1.5">{mod.emoji}</span>{mod.title}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs">{mod.description}</TableCell>
                    <TableCell className="text-center">
                      {mod.inMVP ? (
                        <Badge className="bg-primary/20 text-primary border-primary/30">✅ Included</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">❌ Deferred</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn(
                        "text-[10px]",
                        mod.phase === "MVP" && "border-primary/40 text-primary",
                        mod.phase === "Phase 2" && "border-yellow-500/40 text-yellow-600 dark:text-yellow-400",
                        mod.phase === "v1.1" && "border-muted-foreground/40 text-muted-foreground",
                      )}>{mod.phase}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex gap-6 text-sm text-muted-foreground">
            <span>✅ In MVP: <strong className="text-primary">{allModulesComparison.filter(m => m.inMVP).length}</strong></span>
            <span>❌ Deferred: <strong>{allModulesComparison.filter(m => !m.inMVP).length}</strong></span>
            <span>Total modules: <strong>{allModulesComparison.length}</strong></span>
          </div>
        </section>

        {/* Pipeline flow */}
        <section>
          <h2 className="text-xl font-bold mb-4">MVP Pipeline Flow</h2>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {mvpModules.slice(0, 7).map((mod, i) => (
              <div key={mod.title} className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-medium text-xs">
                  {mod.emoji} {mod.title}
                </span>
                {i < 6 && <span className="text-muted-foreground">→</span>}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default MVPScope;
