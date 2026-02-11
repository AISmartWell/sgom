import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Database, Globe, Cpu, Shield, Layers, BarChart3, MapPin, Beaker, Activity, DollarSign, Wrench, Brain, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Section = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) => (
  <Card className="glass-card border-primary/20">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-xl">
        <Icon className="h-5 w-5 text-primary" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="prose prose-invert max-w-none text-sm leading-relaxed text-muted-foreground">
      {children}
    </CardContent>
  </Card>
);

const TechnicalSpec = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              Техническое задание
            </h1>
            <p className="text-muted-foreground mt-1">AI Smartwell SGOM Platform — спецификация для разработчика</p>
          </div>
          <Badge className="ml-auto text-xs" variant="outline">v1.0 — Февраль 2026</Badge>
        </div>

        <Separator />

        {/* 1. Общее описание */}
        <Section icon={Globe} title="1. Общее описание проекта">
          <p><strong>Название:</strong> AI Smartwell SGOM (Smart Geological & Operations Management)</p>
          <p><strong>Назначение:</strong> SaaS-платформа для нефтегазовой отрасли. Анализ скважин, оптимизация добычи, геологическое моделирование и финансовое планирование с применением искусственного интеллекта.</p>
          <p><strong>Целевая аудитория:</strong> операторы нефтяных и газовых месторождений, сервисные компании, инженеры-нефтяники, геологи, инвесторы.</p>
          <p><strong>Сайт:</strong> <a href="https://www.aismartwell.com" className="text-primary hover:underline" target="_blank" rel="noreferrer">www.aismartwell.com</a></p>
        </Section>

        {/* 2. Технологический стек */}
        <Section icon={Layers} title="2. Технологический стек">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-foreground mb-2">Frontend</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>React 18 + TypeScript</li>
                <li>Vite (сборка)</li>
                <li>Tailwind CSS + shadcn/ui</li>
                <li>React Router v6</li>
                <li>Recharts (графики)</li>
                <li>React Three Fiber / Three.js (3D-визуализации)</li>
                <li>Leaflet + react-leaflet 4.x (карты)</li>
                <li>Framer Motion (анимации)</li>
                <li>TanStack Query (кэширование запросов)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">Backend (Lovable Cloud / Supabase)</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>PostgreSQL — база данных</li>
                <li>Row Level Security (RLS)</li>
                <li>Supabase Auth — аутентификация (email)</li>
                <li>Edge Functions (Deno) — серверная логика</li>
                <li>Supabase Storage — хранение файлов</li>
                <li>Realtime — подписки на изменения БД</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">AI / ML</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Google Gemini (через Lovable AI) — анализ керна, генерация отчётов</li>
                <li>Computer Vision — классификация горных пород по фото</li>
                <li>Ранжирование скважин — ML-скоринг</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">Внешние API</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Oklahoma Corporation Commission (OCC) ArcGIS REST API — данные по скважинам</li>
                <li>Google Earth (KML-экспорт)</li>
              </ul>
            </div>
          </div>
        </Section>

        {/* 3. Архитектура */}
        <Section icon={Cpu} title="3. Архитектура системы">
          <pre className="bg-muted/30 rounded-lg p-4 text-xs overflow-x-auto font-mono whitespace-pre">
{`┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React SPA)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Dashboard │  │ Modules  │  │ 3D Views │  │  Maps   │ │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └────┬────┘ │
│        └──────────────┴──────────────┴────────────┘      │
│                         │ Supabase SDK                   │
├─────────────────────────┼───────────────────────────────┤
│              BACKEND (Lovable Cloud)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  PostgreSQL   │  │ Edge Funcs   │  │   Storage     │  │
│  │  (wells, etc) │  │ (fetch-wells │  │  (core imgs)  │  │
│  │  + RLS        │  │  analyze-core│  │               │  │
│  │               │  │  rank-wells) │  │               │  │
│  └──────────────┘  └──────────────┘  └───────────────┘  │
│                         │                                │
│              ┌──────────┴──────────┐                     │
│              │   External APIs     │                     │
│              │  OCC ArcGIS, AI     │                     │
│              └─────────────────────┘                     │
└─────────────────────────────────────────────────────────┘`}
          </pre>
        </Section>

        {/* 4. База данных */}
        <Section icon={Database} title="4. Структура базы данных">
          <h4 className="font-semibold text-foreground mb-2">Таблица: <code className="text-primary">public.wells</code></h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-border/50 rounded">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left p-2 border-b border-border/50">Поле</th>
                  <th className="text-left p-2 border-b border-border/50">Тип</th>
                  <th className="text-left p-2 border-b border-border/50">Описание</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["id", "UUID (PK)", "Уникальный идентификатор"],
                  ["api_number", "TEXT (UNIQUE)", "API-номер скважины"],
                  ["well_name", "TEXT", "Название скважины"],
                  ["operator", "TEXT", "Оператор / компания"],
                  ["well_type", "TEXT", "Тип (OIL, GAS, INJECTION и т.д.)"],
                  ["status", "TEXT", "Статус (ACTIVE, PLUGGED, SHUT-IN)"],
                  ["state", "TEXT (NOT NULL)", "Штат (по умолчанию OK)"],
                  ["county", "TEXT", "Округ"],
                  ["latitude", "FLOAT", "Широта (GPS)"],
                  ["longitude", "FLOAT", "Долгота (GPS)"],
                  ["total_depth", "FLOAT", "Общая глубина (TD), ft"],
                  ["formation", "TEXT", "Геологический пласт"],
                  ["production_oil", "FLOAT", "Добыча нефти, bbl"],
                  ["production_gas", "FLOAT", "Добыча газа, mcf"],
                  ["water_cut", "FLOAT", "Обводнённость, %"],
                  ["spud_date", "DATE", "Дата начала бурения"],
                  ["completion_date", "DATE", "Дата завершения"],
                  ["source", "TEXT", "Источник данных (OCC)"],
                  ["raw_data", "JSONB", "Сырые данные из API"],
                  ["created_at", "TIMESTAMPTZ", "Дата создания записи"],
                  ["updated_at", "TIMESTAMPTZ", "Дата последнего обновления"],
                ].map(([field, type, desc]) => (
                  <tr key={field} className="border-b border-border/30 hover:bg-muted/10">
                    <td className="p-2 font-mono text-primary">{field}</td>
                    <td className="p-2">{type}</td>
                    <td className="p-2">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* 5. Модули */}
        <Section icon={Layers} title="5. Функциональные модули">
          <div className="space-y-4">
            {[
              { icon: "📡", name: "Data Collection & Integration", route: "/dashboard/data-collection",
                desc: "Сбор данных из OCC ArcGIS API (Оклахома). Отображение на интерактивной карте (Leaflet). Экспорт в KML для Google Earth. Детальный просмотр скважин. Edge Function: fetch-wells." },
              { icon: "🗺️", name: "Geological Analysis", route: "/dashboard/geological-analysis",
                desc: "3D-визуализация геологических моделей (Three.js). Сейсмические разрезы, каротажные диаграммы, кросс-секции. ИИ-генерация геологических отчётов." },
              { icon: "🔬", name: "Core Analysis (Computer Vision)", route: "/dashboard/core-analysis",
                desc: "Загрузка фото образцов керна. ИИ-анализ через Gemini: определение литологии, пористости, минерального состава. Визуализация результатов." },
              { icon: "🎯", name: "Well Selection & Ranking", route: "/dashboard/well-selection",
                desc: "ML-ранжирование скважин по множественным критериям. Фильтрация по округу, типу, оператору. Таблица с оценками и рекомендациями." },
              { icon: "⚡", name: "Reservoir Simulation", route: "/dashboard/simulation",
                desc: "Симуляция поведения пласта. Прогнозирование добычи. Визуализация давления и насыщенности." },
              { icon: "💰", name: "Financial Calculator", route: "/dashboard/financial",
                desc: "Расчёт ROI для Maxxwell Production. Калькулятор NPV, IRR. Анализ затрат на обработку скважин." },
              { icon: "🔧", name: "SPT Treatment", route: "/dashboard/spt-treatment",
                desc: "Интерактивная демонстрация технологии Siphon Pump Treatment (патент US8863823). Визуализация процесса обработки. Метрики эффективности." },
              { icon: "🧪", name: "EOR Optimization", route: "/dashboard/eor-optimization",
                desc: "Оптимизация методов повышения нефтеотдачи (Enhanced Oil Recovery). Моделирование химических и термальных воздействий." },
              { icon: "📊", name: "Real-Time Dashboard", route: "/dashboard/realtime",
                desc: "Мониторинг скважин в реальном времени. Симуляция WebSocket. Алерты по критическим показателям." },
              { icon: "🧠", name: "ML Training", route: "/dashboard/ml-training",
                desc: "Обучение моделей машинного обучения на данных скважин. Настройка параметров и визуализация процесса." },
              { icon: "📄", name: "Reports", route: "/dashboard/reports",
                desc: "Генерация отчётов по анализу. Экспорт данных." },
            ].map((mod) => (
              <div key={mod.route} className="p-3 rounded-lg bg-muted/20 border border-border/30">
                <p className="font-semibold text-foreground">{mod.icon} {mod.name}</p>
                <p className="text-xs mt-1">{mod.desc}</p>
                <code className="text-[10px] text-primary/70">{mod.route}</code>
              </div>
            ))}
          </div>
        </Section>

        {/* 6. Edge Functions */}
        <Section icon={Cpu} title="6. Edge Functions (серверные функции)">
          <div className="space-y-3">
            {[
              { name: "fetch-wells", desc: "Получение данных скважин из OCC ArcGIS REST API. Фильтрация по округу/типу. Upsert в таблицу wells.", input: "{ county?, wellType?, limit?, offset? }", output: "{ success, fetched, stored, skipped, sample }" },
              { name: "analyze-core", desc: "Анализ изображений керна через AI (Gemini). Определение литологии, пористости, текстуры.", input: "{ imageBase64 }", output: "{ analysis: { lithology, porosity, ... } }" },
              { name: "rank-wells", desc: "ML-ранжирование скважин. Расчёт скоринга по множественным параметрам.", input: "{ wells[], criteria }", output: "{ ranked: [{ id, score, ... }] }" },
              { name: "get-oil-price", desc: "Получение актуальной цены нефти для финансовых расчётов.", input: "{}", output: "{ price, currency, date }" },
            ].map((fn) => (
              <div key={fn.name} className="p-3 rounded-lg bg-muted/20 border border-border/30">
                <p className="font-semibold text-foreground font-mono text-sm">{fn.name}</p>
                <p className="text-xs mt-1">{fn.desc}</p>
                <div className="flex gap-4 mt-2 text-[10px]">
                  <span><strong>Input:</strong> <code>{fn.input}</code></span>
                  <span><strong>Output:</strong> <code>{fn.output}</code></span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* 7. Аутентификация */}
        <Section icon={Shield} title="7. Аутентификация и безопасность">
          <ul className="list-disc pl-5 space-y-1">
            <li>Email/password аутентификация через Supabase Auth</li>
            <li>Автоматическое подтверждение email (для ускорения тестирования)</li>
            <li>Row Level Security (RLS) на таблицах БД</li>
            <li>Session persistence через localStorage</li>
            <li>Маршрут: <code className="text-primary">/auth</code></li>
          </ul>
        </Section>

        {/* 8. Внешние интеграции */}
        <Section icon={Globe} title="8. Внешние интеграции">
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-foreground">Oklahoma Corporation Commission (OCC)</h4>
              <p>ArcGIS REST API — <code className="text-primary text-xs break-all">https://gis.occ.ok.gov/server/rest/services/Hosted/RBDMS_WELLS/FeatureServer/220/query</code></p>
              <p>Данные: координаты, API-номера, операторы, статусы, пласты, глубины, даты.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Google Earth (KML)</h4>
              <p>Экспорт скважин в формат KML. Иконки нефтяных вышек с цветовой кодировкой по статусу.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">NVIDIA Inception Program</h4>
              <p>Платформа является участником программы NVIDIA Inception. Страница: <code className="text-primary">/nvidia-inception</code></p>
            </div>
          </div>
        </Section>

        {/* 9. Файловая структура */}
        <Section icon={FileText} title="9. Ключевые директории">
          <pre className="bg-muted/30 rounded-lg p-4 text-xs font-mono whitespace-pre overflow-x-auto">
{`src/
├── pages/                  # Страницы приложения
│   ├── Index.tsx            # Лендинг
│   ├── Auth.tsx             # Авторизация
│   ├── Dashboard.tsx        # Главный дашборд
│   └── modules/             # Модули платформы
│       ├── DataCollection.tsx
│       ├── GeologicalAnalysis.tsx
│       ├── CoreAnalysis.tsx
│       ├── WellSelection.tsx
│       ├── Simulation.tsx
│       ├── Financial.tsx
│       ├── SPTTreatment.tsx
│       ├── EOROptimization.tsx
│       ├── RealtimeDashboard.tsx
│       ├── MLTraining.tsx
│       └── Reports.tsx
├── components/              # UI-компоненты
│   ├── ui/                  # shadcn/ui
│   ├── layout/              # DashboardLayout, Sidebar
│   ├── data-collection/     # WellMapLeaflet, RealDataPanel
│   ├── geological/          # 3D модели, сейсмика
│   ├── core-analysis/       # CV демо
│   ├── well-selection/      # Фильтры, таблица, карта
│   ├── simulation/          # Визуализации пласта
│   ├── financial/           # Калькулятор
│   └── spt/                 # SPT визуализация
├── hooks/                   # Кастомные хуки
├── integrations/supabase/   # Клиент и типы (автогенерация)
└── assets/                  # Изображения

supabase/
├── functions/               # Edge Functions
│   ├── fetch-wells/         # Импорт данных OCC
│   ├── analyze-core/        # CV анализ керна
│   ├── rank-wells/          # ML ранжирование
│   └── get-oil-price/       # Цена нефти
└── config.toml              # Конфигурация`}
          </pre>
        </Section>

        {/* 10. Запуск */}
        <Section icon={Wrench} title="10. Запуск и развёртывание">
          <div className="space-y-2">
            <p><strong>Dev-сервер:</strong> <code className="text-primary">npm run dev</code> (Vite, порт 8080)</p>
            <p><strong>Сборка:</strong> <code className="text-primary">npm run build</code></p>
            <p><strong>Деплой:</strong> Lovable Cloud — автоматический деплой frontend через Publish. Edge Functions деплоятся автоматически.</p>
            <p><strong>Переменные окружения (.env):</strong></p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li><code>VITE_SUPABASE_URL</code> — URL проекта</li>
              <li><code>VITE_SUPABASE_PUBLISHABLE_KEY</code> — Anon Key</li>
            </ul>
          </div>
        </Section>

        <div className="text-center text-xs text-muted-foreground pb-8">
          AI Smartwell SGOM Platform — Technical Specification v1.0 — February 2026
        </div>
      </div>
    </div>
  );
};

export default TechnicalSpec;
