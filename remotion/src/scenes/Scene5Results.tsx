import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

export const Scene5Results = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const metrics = [
    { label: "Дебит нефти", before: "8 BPD", after: "65 BPD", change: "+712%", color: "#7CB342" },
    { label: "Скин-фактор", before: "S = +12", after: "S = -2", change: "Устранён", color: "#4A90D9" },
    { label: "Проницаемость ПЗП", before: "12 мД", after: "85 мД", change: "+608%", color: "#D4A574" },
    { label: "Водный фактор", before: "45%", after: "22%", change: "-51%", color: "#64C8FF" },
  ];

  // Staggered card reveals
  const cards = metrics.map((m, i) => {
    const delay = 10 + i * 12;
    const s = spring({ frame: frame - delay, fps, config: { damping: 15, stiffness: 100 } });
    const y = interpolate(s, [0, 1], [50, 0]);
    const op = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateRight: "clamp" });
    return { ...m, y, op };
  });

  // Summary badge
  const summaryOp = interpolate(frame, [65, 85], [0, 1], { extrapolateRight: "clamp" });
  const summaryScale = interpolate(
    spring({ frame: frame - 60, fps, config: { damping: 12 } }),
    [0, 1], [0.8, 1]
  );

  // AI Smart Wells logo/branding
  const brandOp = interpolate(frame, [75, 95], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* Title */}
      <div style={{
        position: "absolute", top: 80,
        fontSize: 42, fontWeight: 700, color: "#E8E0D8",
        fontFamily: "sans-serif", textAlign: "center",
      }}>
        Результаты <span style={{ color: "#D4A574" }}>SPT-обработки</span>
      </div>

      {/* Metric cards grid */}
      <div style={{
        display: "flex", gap: 30, position: "absolute", top: 220,
        left: 0, right: 0, justifyContent: "center",
      }}>
        {cards.map((c, i) => (
          <div key={i} style={{
            width: 350, padding: "30px",
            background: "rgba(0,0,0,0.4)",
            border: `1px solid ${c.color}33`,
            borderRadius: 16,
            transform: `translateY(${c.y}px)`,
            opacity: c.op,
          }}>
            <div style={{ color: "rgba(232,224,216,0.5)", fontSize: 16, fontFamily: "sans-serif", marginBottom: 16 }}>
              {c.label}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
              <div style={{
                color: "rgba(255,100,100,0.7)", fontSize: 22, fontFamily: "sans-serif",
                textDecoration: "line-through", opacity: 0.6,
              }}>
                {c.before}
              </div>
              <svg width="24" height="12"><polygon points="0,2 0,10 20,6" fill={c.color} /></svg>
              <div style={{ color: c.color, fontSize: 28, fontFamily: "sans-serif", fontWeight: 700 }}>
                {c.after}
              </div>
            </div>
            <div style={{
              background: `${c.color}15`, border: `1px solid ${c.color}30`,
              borderRadius: 6, padding: "4px 12px", display: "inline-block",
              color: c.color, fontSize: 14, fontFamily: "sans-serif", fontWeight: 600,
            }}>
              {c.change}
            </div>
          </div>
        ))}
      </div>

      {/* ROI summary */}
      <div style={{
        position: "absolute", bottom: 160, opacity: summaryOp,
        transform: `scale(${summaryScale})`,
        background: "rgba(212, 165, 116, 0.1)",
        border: "1px solid rgba(212, 165, 116, 0.3)",
        borderRadius: 16, padding: "20px 50px",
        textAlign: "center",
      }}>
        <div style={{ color: "#D4A574", fontSize: 20, fontFamily: "sans-serif", fontWeight: 600 }}>
          Прогноз ROI: 340% за 12 месяцев
        </div>
        <div style={{ color: "rgba(232,224,216,0.4)", fontSize: 14, fontFamily: "sans-serif", marginTop: 4 }}>
          EUR прирост: +120,000 BBL
        </div>
      </div>

      {/* Branding */}
      <div style={{
        position: "absolute", bottom: 50, opacity: brandOp,
        color: "rgba(232,224,216,0.3)", fontSize: 16, fontFamily: "sans-serif",
        letterSpacing: 4, textTransform: "uppercase",
      }}>
        AI Smart Wells • Physics-Aware Simulation
      </div>
    </AbsoluteFill>
  );
};
