import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONT_DISPLAY, FONT_MONO } from "./theme";
import { StageBackdrop } from "./StageBackdrop";

// SCENE — REAL WELL REPORT: Brawner 10-15 (API 42-467-30979).
// Pulls real numbers captured live from /dashboard/geophysical Net Pay step.
// 12 intervals · 117 ft Shale · 52 ft Net Pay · 100% N/G ratio · 5,225 ft TD.
// Duration target: 240 frames (~8 sec at 30fps).

type Stat = {
  label: string;
  value: string;
  unit: string;
  tone: "accent" | "signal" | "warn" | "danger";
};

const STATS: Stat[] = [
  { label: "Net Pay",       value: "52",   unit: "ft",  tone: "signal" },
  { label: "Gross Pay",     value: "52",   unit: "ft",  tone: "accent" },
  { label: "N/G Ratio",     value: "100",  unit: "%",   tone: "signal" },
  { label: "Shale (cap)",   value: "117",  unit: "ft",  tone: "danger" },
  { label: "Clean Sand",    value: "42",   unit: "ft",  tone: "warn"   },
  { label: "Total Depth",   value: "5,225",unit: "ft",  tone: "accent" },
];

const toneColor = (t: Stat["tone"]) =>
  t === "signal" ? COLORS.signal :
  t === "warn"   ? COLORS.warn   :
  t === "danger" ? COLORS.danger :
                   COLORS.accent;

export const TeaserBrawnerReport: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Header
  const tagSpring = spring({ frame, fps, config: { damping: 18, stiffness: 120 } });
  const tagY = interpolate(tagSpring, [0, 1], [-30, 0]);
  const tagO = tagSpring;

  const titleO  = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });
  const titleY  = interpolate(frame, [10, 30], [24, 0], { extrapolateRight: "clamp" });
  const subO    = interpolate(frame, [22, 42], [0, 1], { extrapolateRight: "clamp" });

  // Verdict bar at bottom
  const verdictO = interpolate(frame, [180, 210], [0, 1], { extrapolateRight: "clamp" });
  const verdictY = interpolate(frame, [180, 210], [20, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <StageBackdrop tint={COLORS.signal} />

      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: 90,
          left: 110,
          right: 110,
          fontFamily: FONT_DISPLAY,
          color: COLORS.text,
        }}
      >
        <div
          style={{
            opacity: tagO,
            transform: `translateY(${tagY}px)`,
            display: "inline-flex",
            alignItems: "center",
            gap: 14,
            padding: "10px 20px",
            borderRadius: 999,
            background: COLORS.accentSoft,
            border: `1px solid ${COLORS.accentBorder}`,
            fontFamily: FONT_MONO,
            fontSize: 18,
            letterSpacing: 4,
            color: COLORS.accent,
            textTransform: "uppercase",
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: 999, background: COLORS.signal }} />
          Live Well Report · Stage 8
        </div>

        <div
          style={{
            marginTop: 28,
            fontSize: 96,
            fontWeight: 900,
            letterSpacing: -3,
            opacity: titleO,
            transform: `translateY(${titleY}px)`,
            lineHeight: 1,
          }}
        >
          Brawner 10-15
        </div>

        <div
          style={{
            marginTop: 18,
            opacity: subO,
            fontFamily: FONT_MONO,
            fontSize: 22,
            color: COLORS.mute,
            letterSpacing: 2,
          }}
        >
          API 42-467-30979 · Rodessa / Upper Carlisle / James Lime · 12 intervals
        </div>
      </div>

      {/* Stat grid */}
      <div
        style={{
          position: "absolute",
          top: 380,
          left: 110,
          right: 110,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 28,
          fontFamily: FONT_DISPLAY,
        }}
      >
        {STATS.map((s, i) => {
          const start = 50 + i * 9;
          const sp = spring({ frame: frame - start, fps, config: { damping: 16, stiffness: 130 } });
          const o = sp;
          const y = interpolate(sp, [0, 1], [40, 0]);
          const c = toneColor(s.tone);
          return (
            <div
              key={s.label}
              style={{
                opacity: o,
                transform: `translateY(${y}px)`,
                padding: "32px 36px",
                borderRadius: 22,
                background: `linear-gradient(160deg, ${COLORS.ink}, #060912)`,
                border: `1px solid ${c}55`,
                boxShadow: `0 0 60px ${c}22`,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* corner accent */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: 4,
                  height: "100%",
                  background: `linear-gradient(180deg, ${c}, transparent)`,
                }}
              />
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 14,
                  letterSpacing: 3,
                  color: COLORS.mute,
                  textTransform: "uppercase",
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  marginTop: 14,
                  display: "flex",
                  alignItems: "baseline",
                  gap: 12,
                }}
              >
                <div style={{ fontSize: 92, fontWeight: 900, letterSpacing: -3, color: c, lineHeight: 1 }}>
                  {s.value}
                </div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 22, color: COLORS.mute }}>
                  {s.unit}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Verdict */}
      <div
        style={{
          position: "absolute",
          bottom: 70,
          left: 110,
          right: 110,
          opacity: verdictO,
          transform: `translateY(${verdictY}px)`,
          padding: "26px 36px",
          borderRadius: 18,
          background: `linear-gradient(90deg, ${COLORS.signal}22, transparent)`,
          border: `1px solid ${COLORS.signal}66`,
          fontFamily: FONT_DISPLAY,
          color: COLORS.text,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 14,
              letterSpacing: 4,
              color: COLORS.signal,
              textTransform: "uppercase",
            }}
          >
            AI Verdict
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1, marginTop: 6 }}>
            High-quality reservoir · SPT candidate
          </div>
        </div>
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 22,
            color: COLORS.signal,
            letterSpacing: 2,
            whiteSpace: "nowrap",
          }}
        >
          φ &gt; 8% · Sw &lt; 60% · Vsh &lt; 40%
        </div>
      </div>
    </AbsoluteFill>
  );
};
