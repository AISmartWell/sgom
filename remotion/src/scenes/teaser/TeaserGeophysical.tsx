import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { CinematicShot } from "./CinematicShot";
import { COLORS, FONT_DISPLAY, FONT_MONO } from "./theme";

// SCENE 4 — GEOPHYSICAL EXPERTISE (6 sec).
export const TeaserGeophysical: React.FC = () => {
  const frame = useCurrentFrame();

  const stageO = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });
  const stageX = interpolate(frame, [10, 30], [-30, 0], { extrapolateRight: "clamp" });

  const headO = interpolate(frame, [22, 42], [0, 1], { extrapolateRight: "clamp" });
  const headY = interpolate(frame, [22, 42], [30, 0], { extrapolateRight: "clamp" });
  const headBlur = interpolate(frame, [22, 50], [12, 0], { extrapolateRight: "clamp" });

  const subO = interpolate(frame, [50, 70], [0, 1], { extrapolateRight: "clamp" });

  const items = [
    { l: "01", t: "Lithology · GR cutoffs" },
    { l: "02", t: "Vshale · Larionov 1969" },
    { l: "03", t: "Porosity · DEN-NPHI" },
    { l: "04", t: "Sw · Archie equation" },
  ];

  return (
    <AbsoluteFill>
      <CinematicShot
        src="shots/02-geophysical.png"
        fromScale={1.18}
        toScale={1.04}
        fromY={20}
        toY={-20}
        edge={COLORS.accent}
      />
      <AbsoluteFill style={{ padding: 100, alignItems: "flex-end", justifyContent: "flex-end" }}>
        <div
          style={{
            maxWidth: 900,
            background: "linear-gradient(135deg, rgba(5,7,13,0.88), rgba(5,7,13,0.6))",
            border: `1px solid ${COLORS.accentBorder}`,
            padding: "40px 56px",
            borderRadius: 8,
            textAlign: "right",
          }}
        >
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 18,
              letterSpacing: 6,
              color: COLORS.accent,
              textTransform: "uppercase",
              opacity: stageO,
              transform: `translateX(${stageX}px)`,
              marginBottom: 16,
            }}
          >
            Stage 8 · Geophysical Expertise
          </div>
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              color: COLORS.text,
              fontSize: 76,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2,
              opacity: headO,
              transform: `translateY(${headY}px)`,
              filter: `blur(${headBlur}px)`,
            }}
          >
            Real well logs.<br />Interpreted in seconds.
          </div>
          <div
            style={{
              marginTop: 28,
              opacity: subO,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              alignItems: "flex-end",
            }}
          >
            {items.map((it, i) => {
              const o = interpolate(frame, [60 + i * 10, 76 + i * 10], [0, 1], {
                extrapolateRight: "clamp",
              });
              const x = interpolate(frame, [60 + i * 10, 76 + i * 10], [20, 0], {
                extrapolateRight: "clamp",
              });
              return (
                <div
                  key={i}
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 22,
                    color: COLORS.text,
                    opacity: o,
                    transform: `translateX(${x}px)`,
                    display: "flex",
                    gap: 16,
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: COLORS.accent }}>{it.l}</span>
                  <span>{it.t}</span>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
