import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

// Post-treatment fluid flow restoration — oil flowing freely
export const Scene4FluidResponse = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const wellX = 960;

  // Oil flow particles moving TOWARD wellbore (production restored)
  const oilParticles = Array.from({ length: 30 }, (_, i) => {
    const angle = (i / 30) * Math.PI * 2;
    const startR = 180 + (i % 5) * 30;
    const cycleLen = 60 + (i % 4) * 10;
    const t = ((frame + i * 7) % cycleLen) / cycleLen;
    const r = startR * (1 - t);
    const x = wellX + Math.cos(angle) * r;
    const y = 420 + Math.sin(angle) * r * 0.45;
    const op = t < 0.1 ? t * 10 : t > 0.85 ? (1 - t) / 0.15 : 0.8;
    const appearing = interpolate(frame, [5 + (i % 10) * 3, 15 + (i % 10) * 3], [0, 1], { extrapolateRight: "clamp" });
    return { x, y, op: op * appearing, size: 5 + (i % 3) * 2 };
  });

  // Water particles (blue, further out)
  const waterParticles = Array.from({ length: 15 }, (_, i) => {
    const angle = (i / 15) * Math.PI * 2 + 0.3;
    const startR = 220 + (i % 4) * 20;
    const cycleLen = 80 + (i % 3) * 15;
    const t = ((frame + i * 11) % cycleLen) / cycleLen;
    const r = startR * (1 - t * 0.5);
    const x = wellX + Math.cos(angle) * r;
    const y = 420 + Math.sin(angle) * r * 0.45;
    const op = interpolate(frame, [20, 40], [0, 0.4], { extrapolateRight: "clamp" }) * (t < 0.1 ? t * 10 : 0.6);
    return { x, y, op, size: 4 };
  });

  // Rising oil in wellbore
  const oilLevel = interpolate(frame, [20, 80], [700, 200], { extrapolateRight: "clamp" });
  const oilOpacity = interpolate(frame, [20, 35], [0, 0.8], { extrapolateRight: "clamp" });

  // Cleaned zone glow
  const cleanGlow = interpolate(
    spring({ frame: frame - 10, fps, config: { damping: 15 } }),
    [0, 1], [0, 1]
  );

  // Production rate counter
  const bpd = Math.round(interpolate(frame, [30, 90], [8, 65], { extrapolateRight: "clamp" }));

  // Flow velocity arrows
  const arrowPulse = 0.5 + Math.sin(frame * 0.12) * 0.3;

  return (
    <AbsoluteFill>
      {/* Rock layers */}
      <div style={{ position: "absolute", left: 200, top: 100, width: 1520, height: 180, background: "#5C4033" }} />
      <div style={{ position: "absolute", left: 200, top: 280, width: 1520, height: 300, background: "#8B7355" }} />
      <div style={{ position: "absolute", left: 200, top: 580, width: 1520, height: 180, background: "#4A3728" }} />

      {/* Clean zone glow (green = healthy) */}
      <div style={{
        position: "absolute",
        left: wellX - 150, top: 300, width: 300, height: 260,
        background: "radial-gradient(ellipse, rgba(124, 179, 66, 0.25), transparent 70%)",
        opacity: cleanGlow,
      }} />

      {/* Wellbore */}
      <div style={{
        position: "absolute", left: wellX - 12, top: 60, width: 24, height: 700,
        background: "linear-gradient(90deg, #333, #555, #333)",
        borderLeft: "2px solid #666", borderRight: "2px solid #666",
        overflow: "hidden",
      }}>
        {/* Rising oil column */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          top: oilLevel - 60, opacity: oilOpacity,
          background: "linear-gradient(180deg, #2D1B0E, #5C3A1E, #8B5A2B)",
        }} />
      </div>

      {/* Oil particles flowing in */}
      {oilParticles.map((p, i) => (
        <div key={`o${i}`} style={{
          position: "absolute", left: p.x - p.size / 2, top: p.y - p.size / 2,
          width: p.size, height: p.size, borderRadius: "50%",
          background: "#D4A574", opacity: p.op,
          boxShadow: "0 0 8px rgba(212, 165, 116, 0.4)",
        }} />
      ))}

      {/* Water particles */}
      {waterParticles.map((p, i) => (
        <div key={`w${i}`} style={{
          position: "absolute", left: p.x - p.size / 2, top: p.y - p.size / 2,
          width: p.size, height: p.size, borderRadius: "50%",
          background: "#4A90D9", opacity: p.op,
        }} />
      ))}

      {/* Flow arrows */}
      {[-1, 1].map((dir) =>
        [350, 420, 490].map((y, i) => (
          <div key={`${dir}-${i}`} style={{
            position: "absolute",
            left: dir === 1 ? wellX + 30 : wellX - 70,
            top: y,
            opacity: arrowPulse * interpolate(frame, [10 + i * 8, 25 + i * 8], [0, 1], { extrapolateRight: "clamp" }),
            transform: dir === 1 ? "scaleX(-1)" : undefined,
          }}>
            <svg width="40" height="12">
              <polygon points="0,6 30,1 30,11" fill="#7CB342" opacity="0.7" />
            </svg>
          </div>
        ))
      )}

      {/* Production rate */}
      <div style={{
        position: "absolute", right: 100, top: 100,
        background: "rgba(0,0,0,0.5)", borderRadius: 12, padding: "20px 30px",
        border: "1px solid rgba(124, 179, 66, 0.3)",
      }}>
        <div style={{ color: "rgba(232,224,216,0.5)", fontSize: 14, fontFamily: "sans-serif", marginBottom: 8 }}>
          Дебит нефти
        </div>
        <div style={{ color: "#7CB342", fontSize: 42, fontFamily: "sans-serif", fontWeight: 700 }}>
          {bpd} BPD
        </div>
        <div style={{ color: "rgba(124,179,66,0.6)", fontSize: 14, fontFamily: "sans-serif", marginTop: 4 }}>
          ▲ Рост {Math.round(((bpd - 8) / 8) * 100)}%
        </div>
      </div>

      {/* Skin factor */}
      <div style={{
        position: "absolute", right: 100, top: 260,
        background: "rgba(0,0,0,0.5)", borderRadius: 12, padding: "16px 24px",
        border: "1px solid rgba(124,179,66,0.2)",
      }}>
        <div style={{ color: "rgba(232,224,216,0.5)", fontSize: 14, fontFamily: "sans-serif" }}>
          Скин-фактор
        </div>
        <div style={{ color: "#7CB342", fontSize: 28, fontFamily: "sans-serif", fontWeight: 700 }}>
          S = {interpolate(frame, [0, 80], [12, -2], { extrapolateRight: "clamp" }).toFixed(1)}
        </div>
      </div>

      {/* Title */}
      <div style={{
        position: "absolute", left: 240, top: 30,
        fontSize: 28, fontWeight: 600, color: "#E8E0D8", fontFamily: "sans-serif",
      }}>
        Восстановление потока — приток нефти
      </div>
    </AbsoluteFill>
  );
};
