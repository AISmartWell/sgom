import React from "react";
import { useCurrentFrame } from "remotion";
import { Eyebrow, H2, Stage, useEnter } from "./Shared";
import { C, F_DISPLAY, F_MONO } from "./theme";

export const S7Close: React.FC = () => {
  const frame = useCurrentFrame();
  const e = useEnter(34, 26);
  const line = useEnter(52, 26);
  return (
    <Stage>
      <Eyebrow text="AI Smart Well" color={C.gold} />
      <H2 text={"Physics-informed.\nNot a black box."} size={82} />
      <div
        style={{
          fontFamily: F_DISPLAY,
          fontSize: 38,
          color: C.gold,
          marginTop: 30,
          opacity: e.opacity,
          transform: `translateY(${e.y}px)`,
        }}
      >
        SGOM Physics Simulator
      </div>
      <div
        style={{
          fontFamily: F_MONO,
          fontSize: 20,
          letterSpacing: 2,
          color: C.muted,
          marginTop: 18,
          opacity: line.opacity,
        }}
      >
        Self-Learning Geological Object Model · Powered by NVIDIA NIM
      </div>
      <div
        style={{
          width: 240 + Math.sin(frame * 0.05) * 10,
          height: 2,
          background: `linear-gradient(90deg,${C.gold},transparent)`,
          marginTop: 28,
          opacity: line.opacity,
        }}
      />
    </Stage>
  );
};
