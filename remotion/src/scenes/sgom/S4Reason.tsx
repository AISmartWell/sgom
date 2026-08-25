import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Eyebrow, H2, Stage, useEnter } from "./Shared";
import { C, F_MONO } from "./theme";

const AXES = ["Production", "Low Water Cut", "Optimal Depth", "Porosity", "Low GOR", "Permeability"];
const VALUES = [0.82, 0.74, 0.66, 0.88, 0.7, 0.6];

const poly = (vals: number[], r: number, cx: number, cy: number) =>
  vals
    .map((v, i) => {
      const a = (Math.PI * 2 * i) / vals.length - Math.PI / 2;
      return `${(cx + Math.cos(a) * r * v).toFixed(1)},${(cy + Math.sin(a) * r * v).toFixed(1)}`;
    })
    .join(" ");

export const S4Reason: React.FC = () => {
  const frame = useCurrentFrame();
  const grow = interpolate(frame, [30, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const eased = 1 - Math.pow(1 - grow, 3);
  const q = useEnter(20, 24);
  const cx = 300;
  const cy = 220;
  const R = 155;
  return (
    <Stage>
      <Eyebrow text="SGOM Physics Reason" color={C.violet} />
      <H2 text="Why Well #5, not Well #3?" size={62} />
      <div style={{ display: "flex", gap: 60, marginTop: 30, alignItems: "center" }}>
        <div
          style={{
            background: C.panel3,
            borderLeft: `3px solid ${C.violet}`,
            borderRadius: 6,
            padding: "26px 30px",
            maxWidth: 640,
            opacity: q.opacity,
            transform: `translateY(${q.y}px)`,
          }}
        >
          <div style={{ fontSize: 26, lineHeight: 1.6, fontStyle: "italic", color: C.ink }}>
            “Well #5 shows 15% higher porosity in the target zone (12.3% vs 10.7%), a 40% lower
            projected water cut, and the Mississippian Limestone responds 2.3× better to SPT
            historically.”
          </div>
          <div style={{ fontFamily: F_MONO, fontSize: 17, color: C.muted, marginTop: 18 }}>
            SGOM Reason · chain-of-thought output
          </div>
        </div>
        <svg width={620} height={460}>
          {[1, 0.66, 0.33].map((k) => (
            <polygon
              key={k}
              points={poly(AXES.map(() => k), R, cx, cy)}
              fill="rgba(237,231,217,0.04)"
              stroke="rgba(237,231,217,0.22)"
              strokeWidth={1}
            />
          ))}
          <polygon
            points={poly(VALUES.map((v) => v * eased), R, cx, cy)}
            fill="rgba(232,174,77,0.22)"
            stroke={C.gold}
            strokeWidth={2}
          />
          {AXES.map((a, i) => {
            const ang = (Math.PI * 2 * i) / AXES.length - Math.PI / 2;
            const x = cx + Math.cos(ang) * (R + 42);
            const y = cy + Math.sin(ang) * (R + 26);
            return (
              <text
                key={a}
                x={x}
                y={y}
                fill={C.muted}
                fontSize={17}
                fontFamily={F_MONO}
                textAnchor="middle"
              >
                {a}
              </text>
            );
          })}
        </svg>
      </div>
    </Stage>
  );
};
