import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONT_DISPLAY, FONT_MONO } from "./theme";

// Reusable kinetic caption block: small kicker + huge headline + thin underline.
export const KineticCaption: React.FC<{
  kicker?: string;
  headline: string;
  sub?: string;
  align?: "left" | "center";
  accent?: string;
}> = ({ kicker, headline, sub, align = "center", accent = COLORS.accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const kickerO = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const kickerY = interpolate(frame, [0, 18], [10, 0], { extrapolateRight: "clamp" });

  const headlineSpring = spring({ frame: frame - 6, fps, config: { damping: 18, stiffness: 110 } });
  const headlineY = interpolate(headlineSpring, [0, 1], [40, 0]);
  const headlineO = interpolate(frame, [6, 22], [0, 1], { extrapolateRight: "clamp" });
  const headlineBlur = interpolate(frame, [6, 26], [12, 0], { extrapolateRight: "clamp" });

  const subO = interpolate(frame, [22, 38], [0, 1], { extrapolateRight: "clamp" });
  const subY = interpolate(frame, [22, 38], [12, 0], { extrapolateRight: "clamp" });

  const lineW = interpolate(frame, [12, 38], [0, 100], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        textAlign: align,
        color: COLORS.text,
        fontFamily: FONT_DISPLAY,
        maxWidth: 1500,
        margin: align === "center" ? "0 auto" : undefined,
      }}
    >
      {kicker ? (
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 22,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: accent,
            opacity: kickerO,
            transform: `translateY(${kickerY}px)`,
            marginBottom: 24,
          }}
        >
          {kicker}
        </div>
      ) : null}
      <h1
        style={{
          fontSize: 116,
          lineHeight: 1.02,
          fontWeight: 800,
          margin: 0,
          letterSpacing: -2,
          opacity: headlineO,
          transform: `translateY(${headlineY}px)`,
          filter: `blur(${headlineBlur}px)`,
        }}
      >
        {headline}
      </h1>
      <div
        style={{
          height: 2,
          width: `${lineW * 4}px`,
          maxWidth: 320,
          background: accent,
          margin: align === "center" ? "32px auto 0" : "32px 0 0",
        }}
      />
      {sub ? (
        <p
          style={{
            fontSize: 28,
            color: COLORS.mute,
            margin: "28px 0 0",
            opacity: subO,
            transform: `translateY(${subY}px)`,
            fontWeight: 400,
            letterSpacing: 0.2,
          }}
        >
          {sub}
        </p>
      ) : null}
    </div>
  );
};
