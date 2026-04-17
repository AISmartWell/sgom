import { interpolate, useCurrentFrame } from "remotion";
import { COLORS } from "./theme";

// Subtle vignette + parallax dot grid that drifts. Used as backdrop on title scenes.
export const StageBackdrop: React.FC<{ tint?: string }> = ({ tint = COLORS.accent }) => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 300], [0, 80]);
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 40%, ${tint}22 0%, transparent 55%), linear-gradient(180deg, ${COLORS.bgDeep} 0%, ${COLORS.bg} 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `radial-gradient(${tint}33 1px, transparent 1px)`,
          backgroundSize: "44px 44px",
          backgroundPosition: `${drift}px ${drift * 0.6}px`,
          opacity: 0.35,
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />
      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.7) 100%)",
        }}
      />
    </>
  );
};
