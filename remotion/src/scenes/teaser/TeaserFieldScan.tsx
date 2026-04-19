import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONT_DISPLAY, FONT_MONO } from "./theme";

// SCENE — STAGE 1: FIELD SCANNING via SATELLITE.
// Top-down satellite view of an oilfield. Sweep radar pings well candidates.
export const TeaserFieldScan: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Stable PRNG well positions — Oklahoma-style scattered field
  const wells = Array.from({ length: 28 }).map((_, i) => {
    const seed = i * 9301 + 49297;
    const rx = ((seed * 1103515245 + 12345) % 1000) / 1000;
    const ry = ((seed * 22695477 + 1) % 1000) / 1000;
    return {
      x: 0.12 + rx * 0.76,
      y: 0.18 + ry * 0.7,
      // detection delay
      delay: 70 + i * 4,
      // some "low producers" highlighted
      flagged: i % 4 === 0,
    };
  });

  const stageO = interpolate(frame, [6, 22], [0, 1], { extrapolateRight: "clamp" });
  const stageY = interpolate(frame, [6, 22], [16, 0], { extrapolateRight: "clamp" });

  const headO = interpolate(frame, [16, 38], [0, 1], { extrapolateRight: "clamp" });
  const headY = interpolate(frame, [16, 38], [40, 0], { extrapolateRight: "clamp" });
  const headBlur = interpolate(frame, [16, 46], [14, 0], { extrapolateRight: "clamp" });

  // Slow camera zoom on the satellite map
  const mapScale = interpolate(frame, [0, durationInFrames], [1.0, 1.06]);
  const mapY = interpolate(frame, [0, durationInFrames], [0, -10]);

  // Radar sweep angle (continuous rotation)
  const sweepAngle = (frame / fps) * 60; // 60 deg/sec

  // Counter (well count tally)
  const detectedCount = Math.min(
    wells.filter((w) => frame >= w.delay).length,
    wells.length
  );

  return (
    <AbsoluteFill style={{ background: COLORS.bgDeep }}>
      {/* ============ SATELLITE MAP (right side) ============ */}
      <div
        style={{
          position: "absolute",
          right: 80,
          top: 80,
          width: 980,
          height: 920,
          borderRadius: 14,
          overflow: "hidden",
          border: `1px solid ${COLORS.accentBorder}`,
          boxShadow: `0 30px 80px rgba(0,0,0,0.7), inset 0 0 80px ${COLORS.accent}22`,
          transform: `scale(${mapScale}) translateY(${mapY}px)`,
        }}
      >
        {/* Real satellite imagery — Oklahoma basin */}
        <Img
          src={staticFile("images/oklahoma-satellite.png")}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "brightness(0.85) contrast(1.1) saturate(0.9)",
          }}
        />
        {/* Subtle blue tactical tint over satellite */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(135deg, ${COLORS.accent}10 0%, transparent 50%, ${COLORS.bgDeep}55 100%)`,
            mixBlendMode: "multiply",
          }}
        />

        {/* Grid overlay (satellite UI feel) */}
        <svg
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.18 }}
          viewBox="0 0 980 920"
        >
          {Array.from({ length: 11 }).map((_, i) => (
            <line
              key={`v${i}`}
              x1={i * 98}
              y1={0}
              x2={i * 98}
              y2={920}
              stroke={COLORS.accent}
              strokeWidth={0.5}
            />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <line
              key={`h${i}`}
              x1={0}
              y1={i * 92}
              x2={980}
              y2={i * 92}
              stroke={COLORS.accent}
              strokeWidth={0.5}
            />
          ))}
        </svg>

        {/* Radar sweep cone from center */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `rotate(${sweepAngle}deg)`,
            transformOrigin: "center",
            background: `conic-gradient(from 0deg, transparent 0deg, ${COLORS.accent}55 25deg, ${COLORS.accent}11 60deg, transparent 80deg)`,
            mixBlendMode: "screen",
          }}
        />

        {/* Concentric radar rings */}
        <svg
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          viewBox="0 0 980 920"
        >
          {[150, 280, 410].map((r, i) => {
            const pulse = (frame + i * 30) % 90;
            const o = interpolate(pulse, [0, 30, 90], [0.5, 0.15, 0.5]);
            return (
              <circle
                key={i}
                cx={490}
                cy={460}
                r={r}
                fill="none"
                stroke={COLORS.accent}
                strokeWidth={1}
                opacity={o}
                strokeDasharray="4 6"
              />
            );
          })}
          {/* Center crosshair */}
          <line x1={470} y1={460} x2={510} y2={460} stroke={COLORS.accent} strokeWidth={1.5} />
          <line x1={490} y1={440} x2={490} y2={480} stroke={COLORS.accent} strokeWidth={1.5} />
          <circle cx={490} cy={460} r={4} fill={COLORS.accent} />
        </svg>

        {/* Detected wells — appear progressively */}
        <svg
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          viewBox="0 0 980 920"
        >
          {wells.map((w, i) => {
            const visible = frame >= w.delay;
            if (!visible) return null;
            const t = frame - w.delay;
            const s = spring({
              frame: t,
              fps,
              config: { damping: 12, stiffness: 200 },
              durationInFrames: 18,
            });
            const cx = w.x * 980;
            const cy = w.y * 920;
            const color = w.flagged ? COLORS.warn : COLORS.signal;
            const ringR = interpolate(t % 60, [0, 60], [4, 28]);
            const ringO = interpolate(t % 60, [0, 60], [0.8, 0]);
            return (
              <g key={i}>
                {/* Pulse ring */}
                <circle cx={cx} cy={cy} r={ringR} fill="none" stroke={color} strokeWidth={1.5} opacity={ringO} />
                {/* Marker */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={6 * s}
                  fill={color}
                  style={{ filter: `drop-shadow(0 0 6px ${color})` }}
                />
                <circle cx={cx} cy={cy} r={2} fill="#fff" opacity={s} />
              </g>
            );
          })}
        </svg>

        {/* HUD corner markers */}
        {[
          { top: 12, left: 12 },
          { top: 12, right: 12 },
          { bottom: 12, left: 12 },
          { bottom: 12, right: 12 },
        ].map((pos, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              ...pos,
              width: 24,
              height: 24,
              borderTop: pos.top !== undefined ? `2px solid ${COLORS.accent}` : "none",
              borderBottom: pos.bottom !== undefined ? `2px solid ${COLORS.accent}` : "none",
              borderLeft: pos.left !== undefined ? `2px solid ${COLORS.accent}` : "none",
              borderRight: pos.right !== undefined ? `2px solid ${COLORS.accent}` : "none",
            }}
          />
        ))}

        {/* HUD telemetry top */}
        <div
          style={{
            position: "absolute",
            top: 24,
            left: 50,
            fontFamily: FONT_MONO,
            fontSize: 12,
            color: COLORS.accent,
            letterSpacing: 2,
          }}
        >
          SAT-LINK · LAT 35.47°N · LON −97.51°W · ALT 705 km
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: 50,
            fontFamily: FONT_MONO,
            fontSize: 12,
            color: COLORS.accent,
            letterSpacing: 2,
          }}
        >
          SCAN · OKLAHOMA BASIN · 1:25,000
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 24,
            right: 50,
            fontFamily: FONT_MONO,
            fontSize: 12,
            color: COLORS.signal,
            letterSpacing: 2,
          }}
        >
          ● LIVE
        </div>
      </div>

      {/* ============ LEFT — Title + counter ============ */}
      <div style={{ position: "absolute", left: 100, top: 140, maxWidth: 760 }}>
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 18,
            letterSpacing: 6,
            color: COLORS.accent,
            textTransform: "uppercase",
            opacity: stageO,
            transform: `translateY(${stageY}px)`,
            marginBottom: 18,
          }}
        >
          Stage 1 · Field Scanning
        </div>
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            color: COLORS.text,
            fontSize: 84,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -2,
            opacity: headO,
            transform: `translateY(${headY}px)`,
            filter: `blur(${headBlur}px)`,
          }}
        >
          Satellites find<br />
          the <span style={{ color: COLORS.accent }}>abandoned wells.</span>
        </div>

        <div
          style={{
            marginTop: 36,
            fontFamily: FONT_MONO,
            fontSize: 18,
            color: COLORS.mute,
            opacity: interpolate(frame, [50, 70], [0, 1], { extrapolateRight: "clamp" }),
            lineHeight: 1.6,
          }}
        >
          Multi-spectral imagery · pad detection<br />
          Cross-referenced with state registries
        </div>

        {/* Live counter */}
        <div
          style={{
            marginTop: 56,
            opacity: interpolate(frame, [70, 90], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 13,
              letterSpacing: 4,
              color: COLORS.signal,
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            ● Wells detected
          </div>
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 140,
              fontWeight: 900,
              color: COLORS.text,
              lineHeight: 1,
              letterSpacing: -4,
            }}
          >
            {String(detectedCount).padStart(2, "0")}
            <span style={{ color: COLORS.mute, fontSize: 60, fontWeight: 600 }}> / {wells.length}</span>
          </div>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 14,
              color: COLORS.warn,
              marginTop: 8,
              letterSpacing: 2,
            }}
          >
            ▲ {wells.filter((w, i) => w.flagged && frame >= w.delay).length} flagged · low producers (&lt; 5 BBL/day)
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
