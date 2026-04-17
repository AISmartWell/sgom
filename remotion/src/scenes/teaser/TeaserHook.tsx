import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONT_DISPLAY, FONT_MONO } from "./theme";
import { StageBackdrop } from "./StageBackdrop";

// SCENE 1 — HOOK (4 sec). Black, slow type-on rhetorical question.
export const TeaserHook: React.FC = () => {
  const frame = useCurrentFrame();

  const kickerO = interpolate(frame, [10, 28], [0, 1], { extrapolateRight: "clamp" });

  // Reveal headline word-by-word using clip-path mask
  const words = ["What if your", "worst wells", "could be your", "best assets?"];
  const startPerWord = 24;
  const perWordDuration = 18;

  const lineW = interpolate(frame, [80, 115], [0, 360], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <StageBackdrop tint={COLORS.accent} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "0 120px" }}>
        <div style={{ textAlign: "center", color: COLORS.text, fontFamily: FONT_DISPLAY }}>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 22,
              letterSpacing: 8,
              color: COLORS.accent,
              opacity: kickerO,
              textTransform: "uppercase",
              marginBottom: 40,
            }}
          >
            ▍ AI Smart Well · 2026
          </div>
          <div style={{ fontSize: 96, lineHeight: 1.05, fontWeight: 800, letterSpacing: -2 }}>
            {words.map((w, i) => {
              const start = startPerWord + i * perWordDuration;
              const o = interpolate(frame, [start, start + 14], [0, 1], { extrapolateRight: "clamp" });
              const y = interpolate(frame, [start, start + 18], [24, 0], { extrapolateRight: "clamp" });
              const blur = interpolate(frame, [start, start + 18], [10, 0], { extrapolateRight: "clamp" });
              const accent = i === 1 ? COLORS.danger : i === 3 ? COLORS.signal : COLORS.text;
              return (
                <div
                  key={i}
                  style={{
                    opacity: o,
                    transform: `translateY(${y}px)`,
                    filter: `blur(${blur}px)`,
                    color: accent,
                    display: "block",
                  }}
                >
                  {w}
                </div>
              );
            })}
          </div>
          <div
            style={{
              height: 2,
              background: COLORS.accent,
              width: lineW,
              maxWidth: 360,
              margin: "44px auto 0",
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
