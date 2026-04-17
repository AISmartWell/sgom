import { AbsoluteFill, useCurrentFrame } from "remotion";

// Animated film grain that drifts every frame to add subtle texture.
// Pure CSS, GPU-light. Avoid backdropFilter (sandbox crash).
export const GrainOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const dx = (frame * 7) % 200;
  const dy = (frame * 11) % 200;
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        opacity: 0.06,
        mixBlendMode: "overlay",
        backgroundImage:
          "radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), radial-gradient(rgba(0,0,0,0.5) 1px, transparent 1px)",
        backgroundSize: "3px 3px, 5px 5px",
        backgroundPosition: `${dx}px ${dy}px, ${-dx}px ${-dy}px`,
      }}
    />
  );
};
