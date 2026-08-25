import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Eyebrow, H2, Stage, Sub, useEnter } from "./Shared";
import { C, F_DISPLAY, F_MONO } from "./theme";

const TRACKS = [
  { name: "GR", color: C.teal, seed: 1.1, w: 26 },
  { name: "RT", color: C.gold, seed: 2.7, w: 30 },
  { name: "NPHI", color: C.blue, seed: 4.2, w: 22 },
  { name: "Sw", color: C.violet, seed: 6.1, w: 28 },
];

const path = (seed: number, w: number, h: number, wig: number, prog: number) => {
  const n = Math.max(2, Math.round(60 * prog));
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / 60;
    const x = w / 2 + Math.sin(t * 16 + seed) * wig + Math.sin(t * 39 + seed * 2.1) * wig * 0.4;
    pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${(t * h).toFixed(1)}`);
  }
  return pts.join(" ");
};

export const S2Predict: React.FC = () => {
  const frame = useCurrentFrame();
  const prog = interpolate(frame, [18, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const band = useEnter(80, 20);
  const meta = useEnter(40, 24);
  const btn = useEnter(105, 14);
  const H = 380;
  const TW = 110;
  return (
    <Stage>
      <Eyebrow text="SGOM Physics Predict" color={C.green} />
      <H2 text="Post-SPT formation behavior — before you touch the well." size={54} />
      <div style={{ display: "flex", gap: 44, marginTop: 34, alignItems: "flex-start" }}>
        <div
          style={{
            position: "relative",
            background: C.panel3,
            border: `1px solid ${C.hair}`,
            borderRadius: 12,
            padding: "18px 20px",
          }}
        >
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            {TRACKS.map((t) => (
              <div
                key={t.name}
                style={{
                  width: TW,
                  textAlign: "center",
                  fontFamily: F_MONO,
                  fontSize: 17,
                  color: t.color,
                }}
              >
                {t.name}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {TRACKS.map((t) => (
              <svg key={t.name} width={TW} height={H} style={{ background: "#0C1220", borderRadius: 4 }}>
                <path d={path(t.seed, TW, H, t.w, prog)} stroke={t.color} strokeWidth={1.8} fill="none" />
              </svg>
            ))}
          </div>
          <div
            style={{
              position: "absolute",
              left: 20,
              right: 20,
              top: 190,
              height: 96,
              background: C.goldDim,
              borderTop: `1px solid ${C.gold}`,
              borderBottom: `1px solid ${C.gold}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: band.opacity * (0.6 + 0.4 * (Math.sin(frame * 0.11) * 0.5 + 0.5)),
            }}
          >
            <span
              style={{
                fontFamily: F_MONO,
                fontSize: 18,
                color: C.gold,
                background: C.bg,
                padding: "4px 12px",
                borderRadius: 4,
              }}
            >
              SPT ZONE · 4940–5020 ft
            </span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            opacity: meta.opacity,
            transform: `translateY(${meta.y}px)`,
          }}
        >
          {[
            ["Well", "Brawner 10-15"],
            ["Basin", "East Texas"],
            ["Mode", "Hybrid · Live AI + Physics"],
          ].map(([k, v]) => (
            <div key={k} style={{ fontFamily: F_MONO, fontSize: 22, color: C.muted }}>
              {k}: <b style={{ color: C.ink }}>{v}</b>
            </div>
          ))}
          <div
            style={{
              fontFamily: F_MONO,
              fontSize: 21,
              color: C.bg,
              background: C.green,
              padding: "13px 24px",
              borderRadius: 8,
              width: "fit-content",
              opacity: btn.opacity,
              transform: `scale(${0.92 + btn.s * 0.08})`,
              fontWeight: 600,
            }}
          >
            ▶ Run COSMOS Predict
          </div>
        </div>
      </div>
      <Sub text="" delay={0} />
      <div style={{ fontFamily: F_DISPLAY, display: "none" }} />
    </Stage>
  );
};
