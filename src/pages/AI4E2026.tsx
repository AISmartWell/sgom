import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  CheckCircle,
  Microscope,
  Bot,
  FileText,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Cpu,
  Quote,
  Languages,
} from "lucide-react";

type Lang = "en" | "ru";

const stageIcons = [FileText, Microscope, TrendingUp, Bot, DollarSign];

const content = {
  en: {
    docTitle: "SGOM — AI4E2026 Networking Theses",
    back: "Back to Innovation",
    badge: "AI4E2026 · Houston, TX · November 3–4, 2026",
    subtitle: "Verifiable AI for Mature-Well Restoration",
    quote: (
      <>
        We do not sell black-box predictions. We ship{" "}
        <strong>AI whose every recommendation can be traced back to physics, reservoir data, and published equations</strong>. The SPT
        Advisor ranks candidates, explains why, and links each step to formulas you can inspect.
      </>
    ),
    s1Title: "1. The problem we address",
    s1p1: "Mature fields hold large volumes of bypassed pay, but most historical data is still on paper or fragmented across state registries. Operators need a way to digitize, interpret, and rank candidates without trusting a black box.",
    s1p2: (
      <>
        <strong>SGOM</strong> turns legacy logs, completion reports, and production histories into ranked restoration candidates
        with an auditable evidence trail.
      </>
    ),
    s2Title: "2. Our AI is real — and verifiable",
    s2p: 'The platform is not a dashboard of static charts. It is an autonomous agent pipeline that actively diagnoses, scores, and justifies decisions. What makes it different from generic "AI oil & gas" tools is that the AI\'s reasoning is exposed, not hidden.',
    claims: [
      {
        label: "SPT Advisor agent",
        proof:
          "Tool-calling loop: rank_wells → inspect_well → forecast_well → enrich_well_metadata. Chain-of-Thought trace is stored and auditable.",
      },
      {
        label: "Petrophysical formulas",
        proof:
          "Archie (1942), Timur (1968), Larionov (1969) — every output references the exact equation and source DOI.",
      },
      {
        label: "Vision OCR",
        proof:
          "NVIDIA NIM VLM (Nemotron VL) digitizes paper curves page-by-page with confidence scores and evidence trail.",
      },
      {
        label: "Reservoir simulation",
        proof:
          "SGOM Physics Simulator runs on NVIDIA NIM with deterministic physics: pressure, saturation, and rate evolution.",
      },
      {
        label: "Auto-calibration",
        proof:
          "Extended Kalman Filter + Bayesian update adjusts Twin parameters against SCADA measurements, not hand-tuned fudge factors.",
      },
    ],
    s3Title: "3. The SPT-first cycle",
    s3p: (
      <>
        Our default execution path is <strong>Slot Perforation Technology (SPT, US 8,863,823)</strong>, but the diagnostic engine itself
        works on any well with adequate data. If SPT is not the best fit, the platform still identifies the bypassed pay and explains why
        another method may be preferable.
      </>
    ),
    stepLabel: "Step",
    stages: [
      { title: "Paper → data", desc: "OCR of legacy logs and scanned completion reports via NVIDIA Vision VLM." },
      { title: "Petrophysics", desc: "Archie, Timur, Larionov — published equations with DOI citations." },
      { title: "Forecast & twin", desc: "Arps decline, IOIP, Digital Twin with SCADA feedback and EKF calibration." },
      { title: "SPT Advisor", desc: "Autonomous agent ranks candidates, explains its reasoning, cites analogs." },
      { title: "Economics", desc: "NPV, IRR, Monte Carlo P10/P90, Base vs Upside scenario export." },
    ],
    s4Title: "4. Why this matters for operators and investors",
    bullets: [
      { k: "Trust:", v: "Every AI score is paired with the underlying physics, formulas, and data lineage." },
      { k: "Regulatory readiness:", v: "Auditable reasoning supports NSF/SBIR, field approvals, and investor due diligence." },
      { k: "Speed:", v: "Paper logs → ranked candidate in hours, not weeks." },
      { k: "Flexibility:", v: "Diagnose any well; SPT is the default execution path, not the only diagnostic path." },
    ],
    s5Title: "5. Current status",
    s5p: (
      <>
        Functional prototype in production use for demos and pilot data. We are seeking field partners to validate the ranking methodology
        against historical SPT and restoration outcomes. We are not claiming 100% accuracy or 4 ms inference — we are claiming{" "}
        <strong>transparent, formula-backed AI</strong> that gets better with every new well you feed it.
      </>
    ),
    ctaPrimary: "Explore Innovation",
    ctaSecondary: "Run live SPT demo",
    toggle: "Русская версия",
  },
  ru: {
    docTitle: "SGOM — тезисы для AI4E2026",
    back: "Назад в Innovation",
    badge: "AI4E2026 · Хьюстон, Техас · 3–4 ноября 2026",
    subtitle: "Проверяемый ИИ для восстановления зрелых скважин",
    quote: (
      <>
        Мы не продаём предсказания «чёрного ящика». Мы поставляем{" "}
        <strong>ИИ, каждую рекомендацию которого можно проследить до физики, данных пласта и опубликованных уравнений</strong>. SPT Advisor
        ранжирует кандидатов, объясняет почему и связывает каждый шаг с формулами, которые можно проверить.
      </>
    ),
    s1Title: "1. Какую задачу мы решаем",
    s1p1: "В зрелых месторождениях остаются большие объёмы пропущенных продуктивных интервалов (bypassed pay), но большая часть исторических данных до сих пор существует на бумаге или разбросана по государственным реестрам. Операторам нужен способ оцифровать, интерпретировать и ранжировать кандидатов, не доверяясь «чёрному ящику».",
    s1p2: (
      <>
        <strong>SGOM</strong> превращает старые каротажки, отчёты о заканчивании и историю добычи в ранжированный список кандидатов
        на восстановление с прослеживаемой доказательной базой.
      </>
    ),
    s2Title: "2. У нас есть реальный ИИ — и его можно проверить",
    s2p: "Платформа — это не дашборд со статичными графиками. Это конвейер автономных агентов, который сам ставит диагноз, выставляет оценку и обосновывает решение. Отличие от универсальных «AI для нефтегаза» в том, что ход рассуждений ИИ открыт, а не скрыт.",
    claims: [
      {
        label: "Агент SPT Advisor",
        proof:
          "Цикл вызова инструментов: rank_wells → inspect_well → forecast_well → enrich_well_metadata. Цепочка рассуждений (Chain-of-Thought) сохраняется и доступна для аудита.",
      },
      {
        label: "Петрофизические формулы",
        proof:
          "Арчи (1942), Тимур (1968), Ларионов (1969) — каждый результат ссылается на конкретное уравнение и DOI источника.",
      },
      {
        label: "Vision OCR",
        proof:
          "NVIDIA NIM VLM (Nemotron VL) оцифровывает бумажные кривые постранично с оценками достоверности и следом доказательств.",
      },
      {
        label: "Симуляция пласта",
        proof:
          "SGOM Physics Simulator работает на NVIDIA NIM с детерминированной физикой: эволюция давления, насыщенности и дебитов.",
      },
      {
        label: "Автокалибровка",
        proof:
          "Расширенный фильтр Калмана и байесовское обновление подстраивают параметры цифрового двойника под измерения SCADA — без ручных подгоночных коэффициентов.",
      },
    ],
    s3Title: "3. Цикл с приоритетом SPT",
    s3p: (
      <>
        Наш основной путь исполнения — <strong>щелевая перфорация (SPT, патент US 8,863,823)</strong>, но сам диагностический движок работает
        с любой скважиной, по которой достаточно данных. Если SPT не оптимален, платформа всё равно находит пропущенные интервалы и
        объясняет, почему другой метод может быть предпочтительнее.
      </>
    ),
    stepLabel: "Шаг",
    stages: [
      { title: "Бумага → данные", desc: "OCR старых каротажек и сканов отчётов о заканчивании через NVIDIA Vision VLM." },
      { title: "Петрофизика", desc: "Арчи, Тимур, Ларионов — опубликованные уравнения со ссылками на DOI." },
      { title: "Прогноз и двойник", desc: "Кривые падения Арпса, IOIP, цифровой двойник с обратной связью SCADA и калибровкой EKF." },
      { title: "SPT Advisor", desc: "Автономный агент ранжирует кандидатов, объясняет логику, ссылается на аналоги." },
      { title: "Экономика", desc: "NPV, IRR, Монте-Карло P10/P90, экспорт сценариев Base и Upside." },
    ],
    s4Title: "4. Почему это важно операторам и инвесторам",
    bullets: [
      { k: "Доверие:", v: "Каждая оценка ИИ сопровождается физикой, формулами и происхождением данных." },
      { k: "Готовность к аудиту:", v: "Прослеживаемые рассуждения подходят для NSF/SBIR, промысловых согласований и due diligence." },
      { k: "Скорость:", v: "От бумажной каротажки до ранжированного кандидата — часы, а не недели." },
      { k: "Гибкость:", v: "Диагностируем любую скважину; SPT — путь исполнения по умолчанию, а не единственный путь диагностики." },
    ],
    s5Title: "5. Текущий статус",
    s5p: (
      <>
        Работающий прототип, используемый для демонстраций и пилотных данных. Мы ищем промысловых партнёров, чтобы валидировать методику
        ранжирования на исторических результатах SPT и восстановления скважин. Мы не заявляем 100% точность или инференс за 4 мс — мы
        заявляем <strong>прозрачный ИИ, подкреплённый формулами</strong>, который улучшается с каждой новой скважиной.
      </>
    ),
    ctaPrimary: "Открыть Innovation",
    ctaSecondary: "Запустить демо SPT",
    toggle: "English version",
  },
} as const;

const AI4E2026 = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState<Lang>("en");
  const t = content[lang];

  useEffect(() => {
    document.title = t.docTitle;
  }, [t.docTitle]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        <div className="mb-8 flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/innovation")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            {t.back}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setLang(lang === "en" ? "ru" : "en")}
          >
            <Languages className="w-4 h-4" />
            {t.toggle}
          </Button>
        </div>

        <header className="mb-10 text-center">
          <Badge variant="outline" className="mb-4 text-primary border-primary/30">
            {t.badge}
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">SGOM</h1>
          <p className="text-xl md:text-2xl text-muted-foreground">{t.subtitle}</p>
        </header>

        <Card className="mb-8 border-primary/20 bg-card/50 backdrop-blur">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-start gap-4">
              <Quote className="w-8 h-8 text-primary shrink-0 mt-1" />
              <p className="text-lg md:text-xl leading-relaxed">{t.quote}</p>
            </div>
          </CardContent>
        </Card>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-primary" />
            {t.s1Title}
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">{t.s1p1}</p>
          <p className="text-muted-foreground leading-relaxed">{t.s1p2}</p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            {t.s2Title}
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6">{t.s2p}</p>

          <div className="grid gap-4 md:grid-cols-2">
            {t.claims.map((claim) => (
              <Card key={claim.label} className="bg-card/60 border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-primary">{claim.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{claim.proof}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Cpu className="w-6 h-6 text-primary" />
            {t.s3Title}
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6">{t.s3p}</p>

          <div className="grid gap-4 md:grid-cols-5">
            {t.stages.map((stage, idx) => {
              const Icon = stageIcons[idx];
              return (
                <div key={stage.title} className="relative group">
                  <div className="flex flex-col items-center text-center p-4 rounded-xl border border-border/60 bg-card/40 hover:bg-card/80 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">
                      {t.stepLabel} {idx + 1}
                    </div>
                    <div className="font-semibold text-sm mb-1">{stage.title}</div>
                    <div className="text-xs text-muted-foreground leading-relaxed">{stage.desc}</div>
                  </div>
                  {idx < t.stages.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-2 w-4 h-px bg-gradient-to-r from-primary/40 to-transparent" />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <Separator className="my-8" />

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            {t.s4Title}
          </h2>
          <ul className="space-y-3 text-muted-foreground">
            {t.bullets.map((b) => (
              <li key={b.k} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-success mt-1 shrink-0" />
                <span>
                  <strong>{b.k}</strong> {b.v}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">{t.s5Title}</h2>
          <p className="text-muted-foreground leading-relaxed">{t.s5p}</p>
        </section>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => navigate("/innovation")} className="gap-2">
            {t.ctaPrimary}
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </Button>
          <Button variant="outline" onClick={() => navigate("/dashboard/spt-demo")} className="gap-2">
            {t.ctaSecondary}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AI4E2026;
