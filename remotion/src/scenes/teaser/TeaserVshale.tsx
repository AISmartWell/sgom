import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { CinematicShot } from "./CinematicShot";
import { COLORS, FONT_DISPLAY, FONT_MONO } from "./theme";

// SCENE 5 — VSHALE / SCHLUMBERGER WORKFLOW (6 sec).
export const TeaserVshale: React.FC = () => {
  const frame = useCurrentFrame();

  const stageO = interpolate(frame, [8, 24], [0, 1], { extrapolateRight: "clamp" });
  const stageY = interpolate(frame, [8, 24], [16, 0], { extrapolateRight: "clamp" });

  const headO = interpolate(frame, [20, 42], [0, 1], { extrapolateRight: "clamp" });
  const headY = interpolate(frame, [20, 42], [40, 0], { extrapolateRight: "clamp" });
  const headBlur = interpolate(frame, [20, 50], [14, 0], { extrapolateRight: "clamp" });

  const formulaO = interpolate(frame, [60, 82], [0, 1], { extrapolateRight: "clamp" });
  const formulaY = interpolate(frame, [60, 82], [20, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <CinematicShot
        src="shots/03-vshale.png"
        fromScale={1.05}
        toScale={1.18}
        fromY={-30}
        toY={30}
        edge={COLORS.accent}
      />
      {/* Анимированные оверлеи интерпретации: горизонты + fault sticks + bright spots */}
      <InterpretationOverlay />
      {/* Затемнение нижней трети, чтобы текст читался поверх UI */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to bottom, rgba(5,7,13,0) 55%, rgba(5,7,13,0.85) 78%, rgba(5,7,13,0.95) 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          padding: "0 120px 90px 120px",
          alignItems: "flex-start",
          justifyContent: "flex-end",
        }}
      >
        <div style={{ maxWidth: 1400, width: "100%" }}>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 16,
              letterSpacing: 6,
              color: COLORS.accent,
              textTransform: "uppercase",
              opacity: stageO,
              transform: `translateY(${stageY}px)`,
              marginBottom: 14,
            }}
          >
            Schlumberger Petrophysical Workflow · Step 3
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 48,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                color: COLORS.text,
                fontSize: 76,
                fontWeight: 800,
                lineHeight: 1.02,
                letterSpacing: -2,
                opacity: headO,
                transform: `translateY(${headY}px)`,
                filter: `blur(${headBlur}px)`,
              }}
            >
              Linear vs Larionov.<br />
              <span style={{ color: COLORS.accent }}>Old rocks, corrected.</span>
            </div>
            <div
              style={{
                padding: "20px 28px",
                border: `1px solid ${COLORS.accentBorder}`,
                borderRadius: 8,
                background: "rgba(5,7,13,0.85)",
                fontFamily: FONT_MONO,
                fontSize: 24,
                color: COLORS.text,
                opacity: formulaO,
                transform: `translateY(${formulaY}px)`,
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ color: COLORS.mute }}>Vsh</span>
              <span style={{ color: COLORS.accent }}> = 0.33 × (2</span>
              <sup style={{ color: COLORS.accent }}>2·IGR</sup>
              <span style={{ color: COLORS.accent }}> − 1)</span>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ===== Слой интерпретации: горизонты, fault sticks, bright spots =====
const HORIZONS = [
  { d: "M 0 360 C 320 340, 640 380, 960 350 S 1600 330, 1920 360", color: COLORS.accent, label: "TOP RESERVOIR", labelX: 1500, labelY: 348 },
  { d: "M 0 540 C 280 520, 620 560, 980 535 S 1620 515, 1920 545", color: "#22c55e", label: "BASE SANDSTONE", labelX: 1480, labelY: 528 },
  { d: "M 0 720 C 340 700, 700 740, 1020 715 S 1640 695, 1920 725", color: "#f59e0b", label: "FAULT ZONE", labelX: 1520, labelY: 712 },
];

const FAULTS = [
  { x1: 720, y1: 320, x2: 760, y2: 760 },
  { x1: 1180, y1: 340, x2: 1140, y2: 780 },
];

const BRIGHT_SPOTS = [
  { cx: 460, cy: 400, r: 22 },
  { cx: 1320, cy: 580, r: 26 },
  { cx: 880, cy: 660, r: 18 },
];

const InterpretationOverlay: React.FC = () => {
  const frame = useCurrentFrame();

  const horizonProgress = (idx: number) =>
    interpolate(frame, [10 + idx * 14, 50 + idx * 14], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  const faultProgress = (idx: number) =>
    interpolate(frame, [70 + idx * 8, 92 + idx * 8], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  const spotPulse = (idx: number) => {
    const start = 95 + idx * 10;
    const local = frame - start;
    if (local < 0) return { o: 0, s: 0 };
    const o = 0.55 + 0.45 * Math.sin(local * 0.18 + idx);
    const s = interpolate(local, [0, 18], [0, 1], { extrapolateRight: "clamp" });
    return { o, s };
  };

  const labelOpacity = (idx: number) =>
    interpolate(frame, [40 + idx * 14, 60 + idx * 14], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  const legendOpacity = interpolate(frame, [30, 55], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0 }}
      >
        {HORIZONS.map((h, i) => (
          <g key={`h-${i}`}>
            <path
              d={h.d}
              stroke={h.color}
              strokeWidth={2.5}
              fill="none"
              strokeDasharray="2400"
              strokeDashoffset={2400 * horizonProgress(i)}
              opacity={0.95}
              style={{ filter: `drop-shadow(0 0 8px ${h.color})` }}
            />
            <g opacity={labelOpacity(i)}>
              <rect
                x={h.labelX - 8}
                y={h.labelY - 18}
                width={210}
                height={24}
                fill="rgba(5,7,13,0.85)"
                stroke={h.color}
                strokeWidth={1}
                rx={3}
              />
              <text
                x={h.labelX}
                y={h.labelY - 2}
                fill={h.color}
                fontFamily={FONT_MONO}
                fontSize={14}
                letterSpacing={2}
              >
                {h.label}
              </text>
            </g>
          </g>
        ))}

        {FAULTS.map((f, i) => {
          const p = faultProgress(i);
          const x2 = f.x1 + (f.x2 - f.x1) * (1 - p);
          const y2 = f.y1 + (f.y2 - f.y1) * (1 - p);
          return (
            <g key={`f-${i}`}>
              <line
                x1={f.x1}
                y1={f.y1}
                x2={x2}
                y2={y2}
                stroke={COLORS.danger}
                strokeWidth={2.5}
                strokeDasharray="6 4"
                style={{ filter: `drop-shadow(0 0 6px ${COLORS.danger})` }}
              />
              {p < 0.1 && (
                <>
                  <line x1={f.x1 - 10} y1={f.y1} x2={f.x1 + 10} y2={f.y1} stroke={COLORS.danger} strokeWidth={2} />
                  <line x1={f.x2 - 10} y1={f.y2} x2={f.x2 + 10} y2={f.y2} stroke={COLORS.danger} strokeWidth={2} />
                </>
              )}
            </g>
          );
        })}

        {BRIGHT_SPOTS.map((s, i) => {
          const { o, s: scl } = spotPulse(i);
          if (scl === 0) return null;
          return (
            <g key={`s-${i}`} opacity={o}>
              <circle cx={s.cx} cy={s.cy} r={s.r * scl * 1.6} fill={COLORS.accent} opacity={0.15} />
              <circle
                cx={s.cx}
                cy={s.cy}
                r={s.r * scl}
                fill="none"
                stroke={COLORS.accent}
                strokeWidth={2}
                style={{ filter: `drop-shadow(0 0 10px ${COLORS.accent})` }}
              />
              <circle cx={s.cx} cy={s.cy} r={3 * scl} fill={COLORS.accent} />
            </g>
          );
        })}
      </svg>

      <div
        style={{
          position: "absolute",
          top: 60,
          right: 80,
          padding: "14px 20px",
          background: "rgba(5,7,13,0.85)",
          border: `1px solid ${COLORS.accentBorder}`,
          borderRadius: 6,
          fontFamily: FONT_MONO,
          fontSize: 13,
          color: COLORS.text,
          letterSpacing: 1.5,
          opacity: legendOpacity,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div style={{ color: COLORS.mute, fontSize: 11, letterSpacing: 3, marginBottom: 4 }}>
          AI INTERPRETATION
        </div>
        <LegendRow color={COLORS.accent} label="Horizon picks" />
        <LegendRow color={COLORS.danger} label="Fault sticks" dashed />
        <LegendRow color={COLORS.accent} label="Bright spots" dot />
      </div>
    </AbsoluteFill>
  );
};

const LegendRow: React.FC<{ color: string; label: string; dashed?: boolean; dot?: boolean }> = ({
  color,
  label,
  dashed,
  dot,
}) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    {dot ? (
      <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}` }} />
    ) : (
      <div
        style={{
          width: 22,
          height: 2,
          background: dashed
            ? `repeating-linear-gradient(90deg, ${color} 0 4px, transparent 4px 8px)`
            : color,
          boxShadow: `0 0 6px ${color}`,
        }}
      />
    )}
    <span>{label}</span>
  </div>
);
