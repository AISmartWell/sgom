import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Upload,
  Link2,
  Tags,
  Map,
  Microscope,
  Activity,
  Layers,
  TrendingUp,
  DollarSign,
  FileText,
  ChevronRight,
  CheckCircle2,
  Cpu,
  Download,
} from "lucide-react";

const steps = [
  {
    number: 1,
    title: "Импорт данных",
    subtitle: "Загрузка CSV-шаблона",
    icon: Upload,
    color: "hsl(var(--primary))",
    duration: "5–10 мин",
    description:
      "Оператор заполняет CSV-шаблон с русскими заголовками и метрической системой (метры, тонны/сут). Загружает файл на платформу.",
    details: [
      "Поддержка кириллицы (BOM для Excel)",
      "14+ полей: координаты, глубина, дебиты, обводнённость",
      "Метрическая система: м, т/сут, тыс.м³/сут",
      "Автоматическая валидация формата данных",
    ],
    fields: ["Тенгиз", "Кашаган", "Карачаганак", "Узень", "Жанажол"],
    link: "/kazakhstan-template",
    linkText: "Скачать шаблон",
  },
  {
    number: 2,
    title: "Автопривязка",
    subtitle: "Связывание данных",
    icon: Link2,
    color: "hsl(var(--primary))",
    duration: "Автоматически",
    description:
      "Система автоматически связывает скважины с фотографиями керна, каротажными диаграммами и историей добычи по номеру скважины.",
    details: [
      "Привязка по API-номеру / номеру скважины",
      "Автоматическое сопоставление керн → скважина",
      "Связывание каротажных данных (GR, Neutron)",
      "Обнаружение дублей и конфликтов",
    ],
    fields: [],
  },
  {
    number: 3,
    title: "Классификация данных",
    subtitle: "AI-категоризация",
    icon: Tags,
    color: "hsl(var(--primary))",
    duration: "1–2 мин",
    description:
      "AI автоматически разделяет загруженные данные на 5 категорий для структурированного анализа.",
    details: [
      "Добыча: дебиты нефти, газа, жидкости",
      "Давление: пластовое, забойное, устьевое",
      "Геология: пористость, проницаемость, литология",
      "Состояние: статус скважины, ГТМ, ремонты",
      "Экономика: OPEX, себестоимость барреля",
    ],
    fields: [],
  },
  {
    number: 4,
    title: "Полевое сканирование",
    subtitle: "Карта месторождения",
    icon: Map,
    color: "hsl(var(--success))",
    duration: "Мгновенно",
    description:
      "Визуализация всех скважин месторождения на интерактивной карте. Кластеризация по статусу, дебиту и обводнённости.",
    details: [
      "Интерактивная карта с OpenStreetMap",
      "Цветовая кодировка по статусу скважин",
      "Тепловая карта добычи по зонам",
      "Кластерный анализ: выявление зон деплеции",
    ],
    fields: ["Тенгиз — 46.2°N, 53.3°E", "Кашаган — 46.6°N, 51.7°E"],
  },
  {
    number: 5,
    title: "Анализ керна (CV)",
    subtitle: "NVIDIA AI Vision",
    icon: Microscope,
    color: "hsl(var(--warning))",
    duration: "2–5 мин / образец",
    description:
      "Компьютерное зрение NVIDIA анализирует фотографии керна: определяет тип породы, пористость, трещиноватость и минеральный состав.",
    details: [
      "Определение литотипа: известняк, доломит, песчаник",
      "Оценка видимой пористости (0–35%)",
      "Классификация трещин: естественные vs. индуцированные",
      "Идентификация нефтенасыщенных интервалов",
    ],
    fields: ["Тенгиз — подсолевые карбонаты", "Узень — юрские песчаники"],
  },
  {
    number: 6,
    title: "Геофизика",
    subtitle: "Интерпретация каротажа",
    icon: Activity,
    color: "hsl(var(--warning))",
    duration: "3–8 мин",
    description:
      "Автоматическая интерпретация каротажных диаграмм: выделение коллекторов, расчёт насыщенности, корреляция пластов.",
    details: [
      "GR — выделение песчаников и глин",
      "Neutron + Density — расчёт пористости",
      "Resistivity — оценка водо/нефтенасыщенности",
      "Автокорреляция между скважинами",
    ],
    fields: [],
  },
  {
    number: 7,
    title: "Геологическое моделирование",
    subtitle: "3D-модель пласта",
    icon: Layers,
    color: "hsl(var(--accent))",
    duration: "5–15 мин",
    description:
      "Построение геологической модели на основе данных каротажа и керна. Визуализация структуры пласта и разрезы.",
    details: [
      "Структурные карты по кровле/подошве пласта",
      "Геологические разрезы между скважинами",
      "Карты эффективных толщин",
      "3D-визуализация резервуара",
    ],
    fields: ["Тенгиз — платформенный риф", "Кашаган — подсолевой карбонат"],
  },
  {
    number: 8,
    title: "Симуляция добычи",
    subtitle: "Прогноз на 1–5 лет",
    icon: TrendingUp,
    color: "hsl(var(--accent))",
    duration: "5–10 мин",
    description:
      "AI-прогноз динамики добычи на основе исторических данных. Моделирование различных сценариев разработки.",
    details: [
      "Decline Curve Analysis (DCA) — экспоненциальный, гиперболический",
      "Прогноз обводнённости",
      "Три сценария: оптимистичный, базовый, пессимистичный",
      "Рекомендации по оптимизации режима",
    ],
    fields: [
      "Узень: рост обводнённости с 65% до 78% за 3 года",
      "Тенгиз: стабильная добыча при текущем режиме",
    ],
  },
  {
    number: 9,
    title: "Экономический анализ",
    subtitle: "NPV, ROI, окупаемость",
    icon: DollarSign,
    color: "hsl(var(--success))",
    duration: "2–5 мин",
    description:
      "Расчёт экономической эффективности каждой скважины и рекомендуемых ГТМ. Ранжирование по приоритету инвестиций.",
    details: [
      "NPV при ценах $65–85/bbl",
      "ROI по каждому виду ГТМ (ГРП, кислотная обработка, полимерное заводнение)",
      "Срок окупаемости в месяцах",
      "AI-ранжирование: ТОП скважин для инвестиций",
    ],
    fields: [
      "Узень: полимерное заводнение — ROI 340%",
      "Жанажол: ГРП — окупаемость 8 мес",
    ],
  },
  {
    number: 10,
    title: "Финальный отчёт",
    subtitle: "PDF + Excel",
    icon: FileText,
    color: "hsl(var(--success))",
    duration: "Мгновенно",
    description:
      "Генерация полного отчёта с результатами анализа, рекомендациями по EOR-оптимизации и приоритезированным планом ГТМ.",
    details: [
      "PDF-отчёт с графиками и картами",
      "Excel с таблицами ранжирования",
      "Рекомендации по EOR на русском языке",
      "Экспорт данных для интеграции с SAP/1С",
    ],
    fields: [],
  },
];

const phaseColors: Record<string, { bg: string; label: string }> = {
  "1": { bg: "bg-primary/20 text-primary", label: "Подготовка данных" },
  "2": { bg: "bg-primary/20 text-primary", label: "Подготовка данных" },
  "3": { bg: "bg-primary/20 text-primary", label: "Подготовка данных" },
  "4": { bg: "bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]", label: "Визуализация" },
  "5": { bg: "bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]", label: "AI-анализ" },
  "6": { bg: "bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]", label: "AI-анализ" },
  "7": { bg: "bg-accent/20 text-accent", label: "Моделирование" },
  "8": { bg: "bg-accent/20 text-accent", label: "Моделирование" },
  "9": { bg: "bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]", label: "Результаты" },
  "10": { bg: "bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]", label: "Результаты" },
};

export default function KazakhstanProcess() {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Главная
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
                <Cpu className="w-5 h-5 text-primary" />
                AI Smart Well — Казахстан
              </h1>
              <p className="text-xs text-muted-foreground">
                Полный цикл AI-анализа скважин
              </p>
            </div>
          </div>
          <Link to="/kazakhstan-template">
            <Button size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Скачать CSV-шаблон
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 text-primary border-primary/30">
            10 этапов • от загрузки данных до отчёта
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            Процесс анализа месторождений
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Пошаговый процесс AI-анализа для казахстанских операторов.
            Адаптирован под метрическую систему, русский язык и местные месторождения.
          </p>
        </div>

        {/* Phase legend */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {[
            { label: "Подготовка данных", cls: "bg-primary/20 text-primary border-primary/30" },
            { label: "Визуализация", cls: "bg-[hsl(145,80%,50%)]/20 text-[hsl(145,80%,50%)] border-[hsl(145,80%,50%)]/30" },
            { label: "AI-анализ", cls: "bg-[hsl(45,100%,55%)]/20 text-[hsl(45,100%,55%)] border-[hsl(45,100%,55%)]/30" },
            { label: "Моделирование", cls: "bg-accent/20 text-accent border-accent/30" },
            { label: "Результаты", cls: "bg-[hsl(145,80%,50%)]/20 text-[hsl(145,80%,50%)] border-[hsl(145,80%,50%)]/30" },
          ].map((p) => (
            <Badge key={p.label} variant="outline" className={p.cls}>
              {p.label}
            </Badge>
          ))}
        </div>

        {/* Steps timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-border hidden md:block" />

          <div className="space-y-6">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = activeStep === step.number;

              return (
                <Card
                  key={step.number}
                  className={`relative cursor-pointer transition-all duration-300 border ${
                    isActive
                      ? "border-primary/50 bg-card shadow-lg shadow-primary/5"
                      : "border-border hover:border-primary/30 bg-card/50"
                  }`}
                  onClick={() =>
                    setActiveStep(isActive ? null : step.number)
                  }
                >
                  <CardContent className="p-0">
                    {/* Main row */}
                    <div className="flex items-start gap-4 p-5">
                      {/* Number circle */}
                      <div
                        className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold"
                        style={{
                          background: `${step.color}20`,
                          color: step.color,
                        }}
                      >
                        {step.number.toString().padStart(2, "0")}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{step.title}</h3>
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <Badge
                            variant="outline"
                            className="ml-auto text-xs text-muted-foreground border-border"
                          >
                            {step.duration}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {step.subtitle} — {step.description}
                        </p>
                      </div>

                      <ChevronRight
                        className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200 ${
                          isActive ? "rotate-90" : ""
                        }`}
                      />
                    </div>

                    {/* Expanded content */}
                    {isActive && (
                      <div className="border-t border-border px-5 pb-5 pt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium mb-2 text-primary">
                              Что происходит:
                            </h4>
                            <ul className="space-y-1.5">
                              {step.details.map((d, i) => (
                                <li
                                  key={i}
                                  className="text-sm text-muted-foreground flex items-start gap-2"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                                  {d}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {step.fields.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                                Примеры по месторождениям:
                              </h4>
                              <div className="space-y-1.5">
                                {step.fields.map((f, i) => (
                                  <div
                                    key={i}
                                    className="text-sm bg-muted/50 rounded-lg px-3 py-2 text-muted-foreground"
                                  >
                                    {f}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {step.link && (
                          <Link to={step.link}>
                            <Button variant="outline" size="sm" className="gap-2 mt-2">
                              <Download className="w-3.5 h-3.5" />
                              {step.linkText}
                            </Button>
                          </Link>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <Card className="mt-12 border-primary/30 bg-primary/5">
          <CardContent className="p-6 sm:p-8 text-center">
            <h3 className="text-xl font-bold mb-2">
              Полный цикл анализа: от CSV до отчёта за 30–60 минут
            </h3>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Минимум 10 скважин для пилотного проекта. Данные обрабатываются
              локально и защищены шифрованием. Результаты — на русском языке.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/kazakhstan-template">
                <Button className="gap-2">
                  <Download className="w-4 h-4" />
                  Скачать CSV-шаблон
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="outline" className="gap-2">
                  Открыть платформу
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
