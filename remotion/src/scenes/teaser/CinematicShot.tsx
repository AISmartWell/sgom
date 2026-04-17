import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "./theme";

// Cinematic screenshot wrapper: parallax zoom-in (Ken Burns) with vignette + colored edge glow.
// duration prop controls when zoom completes; defaults to scene length.
export const CinematicShot: React.FC<{
  src: string;
  fromScale?: number;
  toScale?: number;
  fromX?: number;
  toX?: number;
  fromY?: number;
  toY?: number;
  edge?: string;
}> = ({
  src,
  fromScale = 1.18,
  toScale = 1.04,
  fromX = 0,
  toX = 0,
  fromY = 0,
  toY = 0,
  edge = COLORS.accent,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  const t = frame / durationInFrames;
  const scale = interpolate(t, [0, 1], [fromScale, toScale]);
  const x = interpolate(t, [0, 1], [fromX, toX]);
  const y = interpolate(t, [0, 1], [fromY, toY]);

  // Entry: blur-to-sharp + fade in over 14 frames
  const entry = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 18 });
  const blur = interpolate(entry, [0, 1], [18, 0]);
  const opacity = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        opacity,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${scale}) translate(${x}px, ${y}px)`,
          filter: `blur(${blur}px) saturate(1.05) contrast(1.05)`,
          willChange: "transform, filter",
        }}
      >
        <Img
          src={staticFile(src)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
      {/* Color grade overlay - subtle blue cool */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, rgba(5,7,13,0.0) 50%, rgba(5,7,13,0.85) 100%), radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)`,
        }}
      />
      {/* Edge glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: `inset 0 0 220px ${edge}33, inset 0 -140px 80px ${COLORS.bgDeep}`,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
