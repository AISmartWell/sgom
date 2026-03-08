import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Upload,
  Radar,
  FolderSearch,
  Microscope,
  Activity,
  TrendingUp,
  DollarSign,
  Download,
  FileSpreadsheet,
  Camera,
  BarChart3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface GuideStep {
  stage: number;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  description: string;
  dataRequired: {
    label: string;
    format: string;
    required: boolean;
    icon: React.ElementType;
  }[];
  whatHappens: string[];
  outputExample: string;
  route: string;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    stage: 1,
    title: "Field Scanning",
    subtitle: "Первичное сканирование месторождения",
    icon: Radar,
    color: "text-blue-500",
    description:
      "Система загружает данные о скважинах, отображает их на карте и выполняет первичный скрининг по ключевым параметрам (дебит, обводнённость, глубина).",
    dataRequired: [
      { label: "CSV с паспортами скважин", format: "api_number, well_name, operator, state, county, formation, latitude, longitude, total_depth, production_oil, production_gas, water_cut", required: true, icon: FileSpreadsheet },
      { label: "Или ручной ввод через форму", format: "16 полей на скважину", required: false, icon: Upload },
    ],
    whatHappens: [
      "Скважины импортируются в базу данных",
      "Отображение на интерактивной карте (Leaflet)",
      "Цветовая маркировка по статусу и типу",
      "Расчёт базовых KPI по месторождению",
    ],
    outputExample: "Карта с маркерами скважин, таблица с сортировкой и фильтрами, KPI-панель",
    route: "/dashboard/data-import",
  },
  {
    stage: 2,
    title: "Data Classification",
    subtitle: "Оценка качества и полноты данных",
    icon: FolderSearch,
    color: "text-emerald-500",
    description:
      "ИИ оценивает полноту данных по каждой скважине (Identity, Location, Geology, Production, Operations) и предлагает автозаполнение недостающих полей на основе соседних скважин.",
    dataRequired: [
      { label: "Данные из Stage 1", format: "Автоматически из базы", required: true, icon: BarChart3 },
    ],
    whatHappens: [
      "Расчёт Data Quality Score (%) по 5 категориям",
      "Выявление недостающих полей",
      "AI Auto-Fill: медиана (числа) / мода (категории) из соседних скважин",
      "Расчёт Confidence Score для каждого предложения",
    ],
    outputExample: "Шкала полноты данных, список предложений AI Auto-Fill с кнопками Apply",
    route: "/dashboard/data-classification",
  },
  {
    stage: 3,
    title: "Core Analysis",
    subtitle: "AI-анализ образцов керна",
    icon: Microscope,
    color: "text-purple-500",
    description:
      "Загрузите фотографии керна — ИИ (Gemini Vision) определит тип породы, пористость, проницаемость, трещины, минеральный состав и качество резервуара.",
    dataRequired: [
      { label: "Фото керна", format: "JPG / PNG, до 10 МБ на файл", required: true, icon: Camera },
      { label: "Метаданные (опционально)", format: "API-номер, глубина отбора, формация", required: false, icon: FileSpreadsheet },
    ],
    whatHappens: [
      "Computer Vision анализирует изображение керна",
      "6 разделов отчёта: порода, пористость, проницаемость, трещины, минералы, качество",
      "Валидация результатов по геологической базе данных",
      "Deviation Report при отклонениях от эталонных диапазонов",
    ],
    outputExample: "Структурированный AI-отчёт с числовыми оценками и рекомендациями",
    route: "/dashboard/core-analysis",
  },
  {
    stage: 4,
    title: "Geophysical Expertise",
    subtitle: "Интерпретация каротажных и сейсмических данных",
    icon: Activity,
    color: "text-amber-500",
    description:
      "Загрузите каротажные данные (GR, Resistivity, Porosity) — система построит синтетические логи, стратиграфическую колонку и определит свойства формации.",
    dataRequired: [
      { label: "Каротажные данные (опционально)", format: "CSV: depth, trace1, trace2, trace3", required: false, icon: FileSpreadsheet },
      { label: "Данные скважины из Stage 1", format: "formation, total_depth — автоматически", required: true, icon: BarChart3 },
    ],
    whatHappens: [
      "Построение синтетических каротажных диаграмм (GR, Resistivity, Porosity)",
      "Генерация стратиграфической колонки с целевым горизонтом",
      "Определение литологии, пористости и проницаемости по формации",
      "AI-интерпретация сейсмических данных (при загрузке CSV)",
    ],
    outputExample: "3-трековая каротажная диаграмма, стратиграфическая колонка, карточка свойств формации",
    route: "/dashboard/geophysical",
  },
  {
    stage: 5,
    title: "SPT Projection",
    subtitle: "Прогноз эффективности технологии SPT",
    icon: TrendingUp,
    color: "text-cyan-500",
    description:
      "Система оценивает пригодность скважины к технологии SPT по 6 критериям (MCDA) и прогнозирует прирост добычи.",
    dataRequired: [
      { label: "Данные из предыдущих стадий", format: "Автоматически: дебит, обводнённость, глубина, формация", required: true, icon: BarChart3 },
    ],
    whatHappens: [
      "Расчёт SPT Candidacy Score (0–100) по 6 параметрам",
      "Классификация: Excellent / Good / Marginal / Poor",
      "Радарная диаграмма профиля пригодности",
      "Прогноз прироста добычи (+1.5...+7 барр/сут)",
      "Фильтр: обводнённость < 60%, запасы ≥ 500K bbl, срок > 15 лет",
    ],
    outputExample: "Radar Chart, Candidacy Score, прогнозируемый прирост и сравнение до/после",
    route: "/dashboard/spt-projection",
  },
  {
    stage: 6,
    title: "Economic Analysis",
    subtitle: "Экономическая оценка и ROI",
    icon: DollarSign,
    color: "text-green-500",
    description:
      "Финальный этап — расчёт экономических показателей: NPV, IRR, срок окупаемости, прогноз выручки с учётом текущих цен на нефть.",
    dataRequired: [
      { label: "Результаты всех предыдущих стадий", format: "Автоматически из базы", required: true, icon: BarChart3 },
      { label: "OPEX / стоимость ГТМ (опционально)", format: "Числовые значения в USD", required: false, icon: DollarSign },
    ],
    whatHappens: [
      "Расчёт NPV (Net Present Value) и IRR",
      "Определение срока окупаемости (Payback Period)",
      "Прогноз выручки на 5–10 лет",
      "Сравнение сценариев: с SPT и без SPT",
      "Генерация финального отчёта (PDF / Excel / CSV)",
    ],
    outputExample: "Графики NPV/IRR, таблица сравнения сценариев, PDF-отчёт для инвесторов",
    route: "/dashboard/economic-analysis",
  },
];

const AnalysisGuide = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const step = GUIDE_STEPS[currentStep];
  const progress = ((currentStep + 1) / GUIDE_STEPS.length) * 100;

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="mb-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          📖 Пошаговый гайд: полный цикл анализа скважины
        </h1>
        <p className="text-muted-foreground mt-1">
          6 этапов от загрузки данных до экономической оценки
        </p>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium">Этап {currentStep + 1} из {GUIDE_STEPS.length}</span>
          <span className="text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between mt-2">
          {GUIDE_STEPS.map((s, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`flex flex-col items-center gap-1 transition-all ${
                i === currentStep
                  ? "scale-110"
                  : i < currentStep
                  ? "opacity-60"
                  : "opacity-40"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                  i === currentStep
                    ? "border-primary bg-primary text-primary-foreground"
                    : i < currentStep
                    ? "border-primary/50 bg-primary/20 text-primary"
                    : "border-muted-foreground/30 bg-muted text-muted-foreground"
                }`}
              >
                {i < currentStep ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className="text-[9px] text-muted-foreground hidden sm:block max-w-[60px] text-center leading-tight">
                {s.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Step Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Stage Header */}
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl bg-muted ${step.color}`}>
                  <step.icon className="h-6 w-6" />
                </div>
                <div>
                  <Badge variant="outline" className="mb-1">Stage {step.stage}</Badge>
                  <CardTitle className="text-xl">{step.title}</CardTitle>
                  <CardDescription>{step.subtitle}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/80 leading-relaxed">{step.description}</p>
            </CardContent>
          </Card>

          {/* What Data to Upload */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                Какие данные загрузить?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {step.dataRequired.map((d, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    d.required ? "border-primary/30 bg-primary/5" : "border-border bg-muted/10"
                  }`}
                >
                  <d.icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${d.required ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{d.label}</span>
                      {d.required ? (
                        <Badge variant="default" className="text-[9px] px-1.5 py-0">Обязательно</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Опционально</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 font-mono break-all">{d.format}</p>
                  </div>
                </div>
              ))}

              {currentStep === 0 && (
                <a
                  href="/templates/sample-wells-template.csv"
                  download
                  className="flex items-center gap-2 text-sm text-primary hover:underline mt-2"
                >
                  <Download className="h-4 w-4" />
                  Скачать шаблон CSV (20 скважин)
                </a>
              )}
            </CardContent>
          </Card>

          {/* What Happens */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                ⚙️ Что происходит на этом этапе?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {step.whatHappens.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Right: Output & Navigation */}
        <div className="space-y-4">
          {/* Expected Output */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">📊 Результат этапа</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/80">{step.outputExample}</p>
            </CardContent>
          </Card>

          {/* Data Flow */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">🔗 Поток данных</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {GUIDE_STEPS.map((s, i) => {
                  const StepIcon = s.icon;
                  const isActive = i === currentStep;
                  const isPast = i < currentStep;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-2 p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                        isActive
                          ? "bg-primary/10 border border-primary/30 font-semibold"
                          : isPast
                          ? "bg-muted/20 text-muted-foreground"
                          : "text-muted-foreground/50"
                      }`}
                      onClick={() => setCurrentStep(i)}
                    >
                      <StepIcon className={`h-3.5 w-3.5 ${isActive ? s.color : ""}`} />
                      <span>Stage {s.stage}: {s.title}</span>
                      {isPast && <CheckCircle2 className="h-3 w-3 text-primary ml-auto" />}
                      {isActive && <ArrowRight className="h-3 w-3 ml-auto animate-pulse" />}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Action Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={() => navigate(step.route)}
          >
            Открыть {step.title}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          {/* Navigation */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              disabled={currentStep === 0}
              onClick={() => setCurrentStep((p) => p - 1)}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Назад
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              disabled={currentStep === GUIDE_STEPS.length - 1}
              onClick={() => setCurrentStep((p) => p + 1)}
            >
              Далее
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisGuide;
