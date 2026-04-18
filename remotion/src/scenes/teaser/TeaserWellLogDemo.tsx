import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { COLORS } from "./theme";
import { KineticCaption } from "./KineticCaption";

// 7-сек полноэкранное демо работы платформы (Stage 8: Geophysical Expertise / Well Log)
export const TeaserWellLogDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Лёгкий ken-burns зум поверх видео
  const t = frame / durationInFrames;
  const scale = interpolate(t, [0, 1], [1.04, 1.1]);

  // Fade in/out
  const opacity = interpolate(
    frame,
    [0, 12, durationInFrames - 18, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Stage badge spring
  const badge = spring({ frame: frame - 8, fps, config: { damping: 18 } });
  const badgeY = interpolate(badge, [0, 1], [-30, 0]);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgDeep }}>
      {/* Видео */}
      <AbsoluteFill style={{ opacity, overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `scale(${scale})`,
            filter: "saturate(1.08) contrast(1.05)",
          }}
        >
          <OffthreadVideo
            src={staticFile("shots/welllog-demo.mp4")}
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        {/* Кинематографическая виньетка */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.55) 100%)",
            pointerEvents: "none",
          }}
        />
        {/* Цветовая подкраска под бренд */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(180deg, rgba(5,7,13,0.0) 55%, rgba(5,7,13,0.85) 100%)`,
            pointerEvents: "none",
          }}
        />
        {/* Edge glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            boxShadow: `inset 0 0 240px ${COLORS.accent}33`,
            pointerEvents: "none",
          }}
        />
      </AbsoluteFill>

      {/* Stage badge */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 80,
          opacity: badge,
          transform: `translateY(${badgeY}px)`,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 22px",
            borderRadius: 999,
            background: "rgba(26,159,255,0.12)",
            border: `1px solid ${COLORS.accent}66`,
            backdropFilter: "blur(8px)",
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: COLORS.accent,
              boxShadow: `0 0 12px ${COLORS.accent}`,
            }}
          />
          <span
            style={{
              color: COLORS.accent,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Stage 8 · Live Platform Demo
          </span>
        </div>
      </div>

      {/* Заголовок снизу */}
      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          bottom: 90,
        }}
      >
        <KineticCaption
          text="Geophysical Expertise"
          delay={20}
          size={92}
          weight={800}
          color="#ffffff"
        />
        <div style={{ height: 14 }} />
        <KineticCaption
          text="AI well-log interpretation in real time"
          delay={42}
          size={36}
          weight={500}
          color={COLORS.accent}
        />
      </div>

      {/* REC indicator справа сверху */}
      <div
        style={{
          position: "absolute",
          top: 70,
          right: 90,
          display: "flex",
          alignItems: "center",
          gap: 10,
          opacity: opacity * (0.5 + 0.5 * Math.sin(frame * 0.25)),
        }}
      >
        <span
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "#ff3b3b",
            boxShadow: "0 0 16px #ff3b3b",
          }}
        />
        <span
          style={{
            color: "#ffffff",
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 3,
            fontFamily: "Inter, sans-serif",
          }}
        >
          LIVE
        </span>
      </div>
    </AbsoluteFill>
  );
};
