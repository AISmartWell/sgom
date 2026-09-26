import React from "react";
import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

// Illustrative product demo: data in -> agent computes -> results. Not a live analysis.
const C = { bg: "#04070c", panel: "#0a111b", line: "#1b2633", fg: "#eef2f6", mute: "#8a97a8", em: "#12c28b", cy: "#0cc3e8", amber: "#f5a524", red: "#ef4444" };
const font = "'DejaVu Sans', sans-serif";
const mono = "'DejaVu Sans Mono', monospace";

export const AGENT_DEMO_DURATION = 900; // 30s @30fps

const Bg: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ background: `radial-gradient(ellipse at ${30 + Math.sin(f / 90) * 10}% 20%, #0b2a2a 0%, ${C.bg} 60%)` }}>
    <AbsoluteFill style={{ backgroundImage: `linear-gradient(${C.line}55 1px, transparent 1px), linear-gradient(90deg, ${C.line}55 1px, transparent 1px)`, backgroundSize: "80px 80px", opacity: 0.35 }} />
  </AbsoluteFill>;
};

const Chrome: React.FC<{ step: number; title: string }> = ({ step, title }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  return <div style={{ position: "absolute", top: 60, left: 110, right: 110, display: "flex", justifyContent: "space-between", alignItems: "center", opacity: o, fontFamily: font }}>
    <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
      <div style={{ fontFamily: mono, color: C.em, fontSize: 22, letterSpacing: 2 }}>ШАГ {step} / 3</div>
      <div style={{ color: C.fg, fontSize: 44, fontWeight: 700 }}>{title}</div>
    </div>
    <div style={{ fontFamily: mono, fontSize: 18, color: C.amber, border: `1px solid ${C.amber}88`, padding: "8px 14px" }}>ИЛЛЮСТРАТИВНОЕ ДЕМО · BRAWNER 10-15</div>
  </div>;
};

const Intro: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const s = spring({ frame: f, fps, config: { damping: 200 } });
  return <AbsoluteFill style={{ fontFamily: font, padding: "0 140px", justifyContent: "center" }}>
    <div style={{ fontFamily: mono, color: C.em, fontSize: 26, letterSpacing: 3, opacity: s }}>SGOM · ГЕОФИЗИЧЕСКИЙ ИИ-АГЕНТ</div>
    <div style={{ color: C.fg, fontSize: 112, fontWeight: 700, lineHeight: 1.06, marginTop: 24, transform: `translateY(${(1 - s) * 40}px)`, opacity: s }}>От данных скважины<br /><span style={{ color: C.cy }}>к решению.</span></div>
    <div style={{ color: C.mute, fontSize: 34, marginTop: 36, opacity: interpolate(f, [25, 45], [0, 1], { extrapolateRight: "clamp" }) }}>Загрузка → анализ → результат.</div>
  </AbsoluteFill>;
};

const files = [
  { n: "BRAWNER_10-15_logs.las", k: "LAS · ГК, ПС, сопротивление, нейтронный и плотностный каротаж", s: "2,4 МБ" },
  { n: "completion_report_1978.pdf", k: "Скан отчёта · перфорация", s: "5,1 МБ" },
  { n: "production_history.csv", k: "Добыча нефти, воды и газа по месяцам", s: "84 КБ" },
  { n: "core_analysis_1979.pdf", k: "Пористость · проницаемость", s: "3,7 МБ" },
];
const Upload: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ fontFamily: font }}>
    <Chrome step={1} title="Загрузка данных" />
    <div style={{ position: "absolute", top: 190, left: 110, right: 110, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
      {files.map((x, i) => {
        const st = 12 + i * 14;
        const o = interpolate(f, [st, st + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const p = interpolate(f, [st + 6, st + 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return <div key={x.n} style={{ background: C.panel, border: `1px solid ${p >= 1 ? C.em + "88" : C.line}`, padding: 34, opacity: o, transform: `translateY(${(1 - o) * 30}px)` }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ color: C.fg, fontSize: 32, fontFamily: mono }}>{x.n}</div>
            <div style={{ color: p >= 1 ? C.em : C.mute, fontSize: 21, fontFamily: mono }}>{p >= 1 ? "✓ ГОТОВО" : `${Math.round(p * 100)}%`}</div>
          </div>
          <div style={{ color: C.mute, fontSize: 24, marginTop: 10 }}>{x.k} · {x.s}</div>
          <div style={{ height: 6, background: C.line, marginTop: 22 }}><div style={{ height: 6, width: `${p * 100}%`, background: `linear-gradient(90deg, ${C.em}, ${C.cy})` }} /></div>
        </div>;
      })}
    </div>
    <div style={{ position: "absolute", bottom: 110, left: 110, color: C.fg, fontSize: 36, opacity: interpolate(f, [110, 130], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
      <span style={{ color: C.em }}>●</span> 4 источника · 375 ft каротажа · 38 лет добычи → данные подготовлены
    </div>
  </AbsoluteFill>;
};

const logLines = [
  "Чтение кривых ГК · ПС · RES · NPHI · RHOB",
  "Привязка керна к глубине (4 850–5 225 ft)",
  "Оценка глинистости по гамма-каротажу",
  "Пористость по нейтронно-плотностным данным",
  "Водонасыщенность · модель сопротивления",
  "Оценка проницаемости по пористости и Swirr",
  "Сверка с данными о перфорации",
  "Поиск пропущенных продуктивных интервалов",
];
const zones = [[0, .07, "s"], [.07, .13, "c"], [.13, .23, "t"], [.23, .29, "p"], [.29, .43, "s"], [.43, .51, "w"], [.51, .65, "t"], [.65, .75, "c"], [.75, .88, "s"], [.88, 1, "w"]] as const;
const Log: React.FC<{ progress: number; w: number; h: number; showFlags: boolean }> = ({ progress, w, h, showFlags }) => {
  const kind = (t: number) => zones.find(z => t >= z[0] && t < z[1])?.[2] ?? "s";
  const path = (x0: number, tw: number, v: (k: string) => number, a: number) => Array.from({ length: 200 }, (_, i) => {
    const t = i / 199; const val = v(kind(t)) + Math.sin(t * 90 + a) * .04 + Math.sin(t * 230 + a) * .02;
    return `${i ? "L" : "M"}${x0 + 8 + (tw - 16) * val},${t * h}`;
  }).join(" ");
  const tw = w / 4;
  return <svg width={w} height={h} style={{ background: C.panel, border: `1px solid ${C.line}` }}>
    {zones.map((z, i) => <g key={i}>
      <rect x={0} y={z[0] * h} width={tw * .5} height={(z[1] - z[0]) * h} fill={z[2] === "s" ? "#1f2a36" : z[2] === "w" ? C.cy + "33" : C.amber + "40"} />
      {showFlags && z[2] === "c" && <rect x={0} y={z[0] * h} width={w} height={(z[1] - z[0]) * h} fill={C.red + "22"} stroke={C.red} strokeDasharray="8 6" />}
      {showFlags && z[2] === "p" && <rect x={tw * .5} y={z[0] * h} width={w} height={(z[1] - z[0]) * h} fill={C.em + "18"} />}
    </g>)}
    {[1, 2, 3].map(i => <line key={i} x1={tw * i} x2={tw * i} y1={0} y2={h} stroke={C.line} />)}
    <path d={path(tw * .5, tw * .5 + tw * .5, k => k === "c" || k === "p" ? .25 : k === "s" ? .75 : .5, 1)} stroke={C.em} strokeWidth={2.5} fill="none" />
    <path d={path(tw * 1.5, tw, k => k === "c" || k === "p" ? .8 : k === "w" ? .2 : .42, 2)} stroke={C.red} strokeWidth={2.5} fill="none" />
    <path d={path(tw * 2.5, tw, k => k === "c" || k === "p" ? .65 : k === "s" ? .25 : .45, 3)} stroke={C.amber} strokeWidth={2.5} fill="none" />
    <path d={path(tw * 2.5, tw, k => k === "c" || k === "p" ? .3 : k === "s" ? .7 : .52, 4)} stroke={C.cy} strokeWidth={1.6} fill="none" opacity={.8} />
    {progress < 1 && <><rect x={0} y={progress * h} width={w} height={h * (1 - progress)} fill={C.bg + "cc"} /><line x1={0} x2={w} y1={progress * h} y2={progress * h} stroke={C.em} strokeWidth={3} /></>}
  </svg>;
};
const Compute: React.FC = () => {
  const f = useCurrentFrame();
  const prog = interpolate(f, [10, 240], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ fontFamily: font }}>
    <Chrome step={2} title="Агент анализирует" />
    <div style={{ position: "absolute", top: 190, left: 110 }}><Log progress={prog} w={900} h={780} showFlags={false} /></div>
    <div style={{ position: "absolute", top: 190, left: 1060, right: 110, background: C.panel, border: `1px solid ${C.line}`, padding: 36, height: 780, boxSizing: "border-box" }}>
      <div style={{ fontFamily: mono, color: C.cy, fontSize: 22, letterSpacing: 2, marginBottom: 26 }}>ХОД АНАЛИЗА</div>
      {logLines.map((l, i) => {
        const st = 15 + i * 28;
        const o = interpolate(f, [st, st + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const done = f > st + 26;
        return <div key={l} style={{ display: "flex", gap: 16, fontSize: 27, color: done ? C.fg : C.mute, opacity: o, marginBottom: 22 }}>
          <span style={{ fontFamily: mono, color: done ? C.em : C.amber, width: 30 }}>{done ? "✓" : "›"}</span>{l}
        </div>;
      })}
      <div style={{ position: "absolute", bottom: 36, left: 36, right: 36, fontFamily: mono, fontSize: 22, color: C.mute }}>
         Глубина: <span style={{ color: C.fg }}>{Math.round(4850 + prog * 375).toLocaleString("ru-RU")} ft</span>
        <div style={{ height: 6, background: C.line, marginTop: 12 }}><div style={{ height: 6, width: `${prog * 100}%`, background: C.em }} /></div>
      </div>
    </div>
  </AbsoluteFill>;
};

const Results: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const card = (i: number) => spring({ frame: f - 20 - i * 12, fps, config: { damping: 200 } });
  const items = [
    { k: "Продуктивные интервалы", v: "3", c: C.em },
    { k: "Без перфорации", v: "2", c: C.red },
    { k: "Рекомендованный метод", v: "SPT", c: C.cy },
    { k: "Уверенность агента", v: "Средняя", c: C.amber },
  ];
  return <AbsoluteFill style={{ fontFamily: font }}>
    <Chrome step={3} title="Результат" />
    <div style={{ position: "absolute", top: 190, left: 110 }}><Log progress={1} w={900} h={780} showFlags={f > 8} /></div>
    <div style={{ position: "absolute", top: 190, left: 1060, right: 110, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      {items.map((x, i) => <div key={x.k} style={{ background: C.panel, border: `1px solid ${C.line}`, borderTop: `3px solid ${x.c}`, padding: 30, opacity: card(i), transform: `translateY(${(1 - card(i)) * 30}px)` }}>
        <div style={{ color: C.mute, fontSize: 22 }}>{x.k}</div>
        <div style={{ color: x.c, fontSize: x.v === "Средняя" ? 48 : 64, fontWeight: 700, marginTop: 8 }}>{x.v}</div>
      </div>)}
    </div>
    <div style={{ position: "absolute", top: 640, left: 1060, right: 110, background: C.panel, border: `1px solid ${C.em}66`, padding: 32, opacity: card(5) }}>
      <div style={{ fontFamily: mono, color: C.em, fontSize: 20, letterSpacing: 2 }}>ВЫВОД АГЕНТА</div>
      <div style={{ color: C.fg, fontSize: 28, lineHeight: 1.4, marginTop: 14 }}>Два потенциально продуктивных интервала не были перфорированы. Возможный кандидат для щелевой перфорации (SPT). Требуется проверка перед работами.</div>
    </div>
  </AbsoluteFill>;
};

const Close: React.FC = () => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ fontFamily: font, justifyContent: "center", alignItems: "flex-start", padding: "0 140px", opacity: o }}>
    <div style={{ color: C.fg, fontSize: 150, fontWeight: 700, letterSpacing: -4 }}>SGOM</div>
    <div style={{ color: C.cy, fontSize: 44, marginTop: 10 }}>Загрузите данные. Агент проведёт анализ.</div>
    <div style={{ color: C.mute, fontSize: 24, marginTop: 50, fontFamily: mono }}>AI Smart Well Inc. · Иллюстративное демо, не результат измерений</div>
  </AbsoluteFill>;
};

export const AgentDemoVideo: React.FC = () => <AbsoluteFill>
  <Bg />
  <Sequence durationInFrames={90}><Intro /></Sequence>
  <Sequence from={90} durationInFrames={170}><Upload /></Sequence>
  <Sequence from={260} durationInFrames={290}><Compute /></Sequence>
  <Sequence from={550} durationInFrames={250}><Results /></Sequence>
  <Sequence from={800} durationInFrames={100}><Close /></Sequence>
</AbsoluteFill>;
