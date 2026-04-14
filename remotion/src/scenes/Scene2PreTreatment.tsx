import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

// Cross-section of reservoir BEFORE treatment — damaged zone, blocked pores
export const Scene2PreTreatment = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const panelOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  // Rock layers
  const layers = [
    { y: 100, h: 180, color: "#5C4033", label: "Покрышка (глина)", labelColor: "#A0896E" },
    { y: 280, h: 300, color: "#8B7355", label: "Пласт-коллектор", labelColor: "#D4A574" },
    { y: 580, h: 180, color: "#4A3728", label: "Подошва", labelColor: "#8B7355" },
  ];

  // Well bore
  const wellX = 960;
  const wellW = 24;

  // Damaged zone around wellbore (skin damage)
  const damageOpacity = interpolate(frame, [25, 50], [0, 0.6], { extrapolateRight: "clamp" });
  const damageWidth = interpolate(
    spring({ frame: frame - 20, fps, config: { damping: 12 } }),
    [0, 1], [0, 120]
  );

  // Blocked pore indicators
  const blockages = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2;
    const r = 60 + (i % 3) * 25;
    const x = wellX + Math.cos(angle) * r;
    const y = 430 + Math.sin(angle) * r * 0.6;
    const showFrame = 35 + i * 5;
    const op = interpolate(frame, [showFrame, showFrame + 15], [0, 1], { extrapolateRight: "clamp" });
    return { x, y, op };
  });

  // Pressure arrows (weak, indicating low flow)
  const arrowOpacity = interpolate(frame, [50, 70], [0, 0.5], { extrapolateRight: "clamp" });
  const arrowPulse = 0.3 + Math.sin(frame * 0.08) * 0.2;

  const labelOpacity = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: panelOpacity }}>
      {/* Rock layers */}
      {layers.map((l, i) => (
        <div key={i} style={{
          position: "absolute", left: 200, top: l.y, width: 1520, height: l.h,
          background: l.color, borderTop: "1px solid rgba(255,255,255,0.05)",
        }}>
          <span style={{
            position: "absolute", right: 40, top: 10,
            color: l.labelColor, fontSize: 16, fontFamily: "sans-serif", opacity: 0.8,
          }}>{l.label}</span>
        </div>
      ))}

      {/* Wellbore */}
      <div style={{
        position: "absolute", left: wellX - wellW / 2, top: 60, width: wellW, height: 700,
        background: "linear-gradient(90deg, #333, #555, #333)",
        borderLeft: "2px solid #666", borderRight: "2px solid #666",
      }} />

      {/* Wellhead */}
      <div style={{
        position: "absolute", left: wellX - 30, top: 50, width: 60, height: 30,
        background: "#4A90D9", borderRadius: 4,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 10, color: "white", fontFamily: "sans-serif",
      }}>ПЗП</div>

      {/* Damaged zone (skin) */}
      <div style={{
        position: "absolute",
        left: wellX - damageWidth / 2 - wellW / 2,
        top: 280, width: damageWidth + wellW, height: 300,
        background: "radial-gradient(ellipse, rgba(180, 60, 60, 0.4), transparent 70%)",
        opacity: damageOpacity,
      }} />

      {/* Blockage indicators */}
      {blockages.map((b, i) => (
        <div key={i} style={{
          position: "absolute", left: b.x - 6, top: b.y - 6,
          width: 12, height: 12, opacity: b.op,
        }}>
          <svg width="12" height="12">
            <line x1="2" y1="2" x2="10" y2="10" stroke="#FF4444" strokeWidth="2" />
            <line x1="10" y1="2" x2="2" y2="10" stroke="#FF4444" strokeWidth="2" />
          </svg>
        </div>
      ))}

      {/* Weak pressure arrows */}
      {[340, 400, 460].map((y, i) => (
        <g key={i}>
          <div style={{
            position: "absolute",
            left: wellX + 80 + i * 30, top: y,
            opacity: arrowOpacity * arrowPulse,
            transform: "rotate(180deg)",
          }}>
            <svg width="40" height="16">
              <polygon points="0,8 30,2 30,14" fill="#D4A574" opacity="0.4" />
            </svg>
          </div>
          <div style={{
            position: "absolute",
            left: wellX - 120 - i * 30, top: y,
            opacity: arrowOpacity * arrowPulse,
          }}>
            <svg width="40" height="16">
              <polygon points="0,8 30,2 30,14" fill="#D4A574" opacity="0.4" />
            </svg>
          </div>
        </g>
      ))}

      {/* Status label */}
      <div style={{
        position: "absolute", left: 240, top: 820, opacity: labelOpacity,
        display: "flex", gap: 20, alignItems: "center",
      }}>
        <div style={{
          background: "rgba(255, 68, 68, 0.15)", border: "1px solid rgba(255,68,68,0.3)",
          borderRadius: 8, padding: "10px 24px",
          color: "#FF6B6B", fontSize: 22, fontFamily: "sans-serif", fontWeight: 600,
        }}>
          ⚠ Скин-фактор: S = +12
        </div>
        <div style={{
          color: "rgba(232,224,216,0.5)", fontSize: 18, fontFamily: "sans-serif",
        }}>
          Дебит нефти: 8 BPD → Закупорка призабойной зоны
        </div>
      </div>

      {/* Title */}
      <div style={{
        position: "absolute", left: 240, top: 30,
        fontSize: 28, fontWeight: 600, color: "#E8E0D8",
        fontFamily: "sans-serif",
      }}>
        До обработки — повреждённый пласт
      </div>
    </AbsoluteFill>
  );
};
