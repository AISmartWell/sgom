import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { COLORS, FONT_DISPLAY } from "./theme";

// 6-сек слайд: показывает 9-этапный pipeline платформы.
// Каждый этап подсвечивается по очереди + бегущая линия данных.
const STAGES = [
  { n: 1, name: "Field Scan", kpi: "10K+ wells" },
  { n: 2, name: "Data Class.", kpi: "Quality %" },
  { n: 3, name: "Core CV", kpi: "NVIDIA NIM" },
  { n: 4, name: "Cumulative", kpi: "Arps b=0.5" },
  { n: 5, name: "Seismic", kpi: "AI horizons" },
  { n: 6, name: "SPT Rank", kpi: "MCDA" },
  { n: 7, name: "Economics", kpi: "Monte Carlo" },
  { n: 8, name: "Geophysics", kpi: "Vsh / Φ / Sw" },
  { n: 9, name: "EOR Plan", kpi: "SPT US 8,863,823" },
];

export const TeaserPipelineFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const containerOpacity = interpolate(
    frame,
    [0, 14, durationInFrames - 18, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Бейдж сверху
  const badgeSpring = spring({ frame: frame - 6, fps, config: { damping: 18 } });
  const badgeY = interpolate(badgeSpring, [0, 1], [-30, 0]);

  // Заголовок
  const titleSpring = spring({ frame: frame - 18, fps, config: { damping: 18, stiffness: 110 } });
  const titleY = interpolate(titleSpring, [0, 1], [40, 0]);
  const titleO = interpolate(frame, [18, 36], [0, 1], { extrapolateRight: "clamp" });
  const subO = interpolate(frame, [34, 54], [0, 1], { extrapolateRight: "clamp" });

  // Прогресс по этапам: каждые ~14 frames новый этап подсвечивается
  const startStages = 56;
  const perStage = 12;
  const activeStage = Math.min(
    STAGES.length - 1,
    Math.max(-1, Math.floor((frame - startStages) / perStage))
  );

  // Бегущая линия (data flow)
  const lineProgress = interpolate(
    frame,
    [startStages, startStages + perStage * STAGES.length],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Финальная подпись
  const finalO = interpolate(
    frame,
    [startStages + perStage * STAGES.length + 4, startStages + perStage * STAGES.length + 24],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 40%, #0c1220 0%, ${COLORS.bgDeep} 70%)`,
        opacity: containerOpacity,
      }}
    >
      {/* Бейдж */}
      <div
        style={{
          position: "absolute",
          top: 70,
          left: "50%",
          transform: `translate(-50%, ${badgeY}px)`,
          opacity: badgeSpring,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 24px",
            borderRadius: 999,
            background: "rgba(26,159,255,0.12)",
            border: `1px solid ${COLORS.accent}66`,
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
              fontFamily: FONT_DISPLAY,
            }}
          >
            How It Computes · 9-Stage AI Pipeline
          </span>
        </div>
      </div>

      {/* Заголовок */}
      <div
        style={{
          position: "absolute",
          top: 150,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: titleO,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontWeight: 800,
            fontSize: 78,
            color: "#ffffff",
            letterSpacing: -1,
            lineHeight: 1.05,
          }}
        >
          From raw data → drilling decision
        </div>
        <div
          style={{
            marginTop: 14,
            fontFamily: FONT_DISPLAY,
            fontWeight: 500,
            fontSize: 28,
            color: COLORS.accent,
            opacity: subO,
            letterSpacing: 0.5,
          }}
        >
          Every well passes through 9 AI stages — fully automated
        </div>
      </div>

      {/* Pipeline */}
      <div
        style={{
          position: "absolute",
          top: 380,
          left: 80,
          right: 80,
          height: 380,
        }}
      >
        {/* Базовая линия */}
        <div
          style={{
            position: "absolute",
            top: 90,
            left: 60,
            right: 60,
            height: 4,
            background: "rgba(255,255,255,0.08)",
            borderRadius: 2,
          }}
        />
        {/* Активная линия (заполняется) */}
        <div
          style={{
            position: "absolute",
            top: 90,
            left: 60,
            width: `calc((100% - 120px) * ${lineProgress})`,
            height: 4,
            background: `linear-gradient(90deg, ${COLORS.accent}, #5fd4ff)`,
            borderRadius: 2,
            boxShadow: `0 0 14px ${COLORS.accent}`,
          }}
        />

        {/* Узлы */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          {STAGES.map((s, i) => {
            const isActive = i <= activeStage;
            const justActivated = i === activeStage;
            const nodeSpring = spring({
              frame: frame - (startStages + i * perStage),
              fps,
              config: { damping: 14, stiffness: 180 },
            });
            const nodeScale = interpolate(nodeSpring, [0, 1], [0.6, 1]);
            const pulseScale = justActivated ? 1 + 0.15 * Math.sin(frame * 0.4) : 1;

            return (
              <div
                key={s.n}
                style={{
                  width: 130,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                {/* Кружок с номером */}
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: isActive
                      ? `radial-gradient(circle, ${COLORS.accent} 0%, #0a4a7a 100%)`
                      : "rgba(255,255,255,0.06)",
                    border: `2px solid ${isActive ? COLORS.accent : "rgba(255,255,255,0.18)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isActive ? "#ffffff" : "rgba(255,255,255,0.45)",
                    fontFamily: FONT_DISPLAY,
                    fontWeight: 800,
                    fontSize: 26,
                    transform: `scale(${nodeScale * pulseScale})`,
                    boxShadow: isActive ? `0 0 24px ${COLORS.accent}88` : "none",
                    transition: "none",
                  }}
                >
                  {s.n}
                </div>

                {/* Название */}
                <div
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontWeight: 700,
                    fontSize: 18,
                    color: isActive ? "#ffffff" : "rgba(255,255,255,0.55)",
                    textAlign: "center",
                    lineHeight: 1.15,
                    opacity: nodeSpring,
                  }}
                >
                  {s.name}
                </div>

                {/* KPI */}
                <div
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontWeight: 500,
                    fontSize: 14,
                    color: isActive ? COLORS.accent : "rgba(255,255,255,0.3)",
                    textAlign: "center",
                    letterSpacing: 0.3,
                    opacity: nodeSpring,
                  }}
                >
                  {s.kpi}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Финальная подпись */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: finalO,
        }}
      >
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontWeight: 600,
            fontSize: 32,
            color: "#ffffff",
            letterSpacing: 0.3,
          }}
        >
          One platform · Real data in · Drilling-ready output
        </div>
      </div>
    </AbsoluteFill>
  );
};
