import { useRef, useEffect, useCallback, useState } from "react";

interface LongitudinalCrossSectionProps {
  phase: "pre-spt" | "injection" | "mobilisation" | "post-spt";
  slotProgress: number; // 0-1
  isPlaying: boolean;
  time: number;
  metrics: {
    flowRate: number;
    skinFactor: number;
    slotDepth: number;
    pressure: number;
  };
}

const COLORS = {
  bg: "#0a0c10",
  casing: "#3a4050",
  casingInner: "#1a1d24",
  cement: "#5a5040",
  formation: "#1e2228",
  damageZone: "rgba(180, 60, 40, 0.15)",
  slot: "#76b947",
  oil: "#c8956c",
  mobilised: "#e8b84a",
  water: "#3a6fa0",
  accent: "#76b947",
  textSecondary: "rgba(224,220,212,0.5)",
  panelBorder: "rgba(255,255,255,0.06)",
  shale: "#2a2520",
  sandstone: "#2e3328",
  limestone: "#28303a",
};

// Formation layers with depths (in px from top)
const LAYERS = [
  { name: "Shale", color: COLORS.shale, height: 50 },
  { name: "Sandstone", color: COLORS.sandstone, height: 35 },
  { name: "Shale", color: COLORS.shale, height: 25 },
  { name: "Tonkawa Sand", color: "#2a3325", height: 80, isTarget: true },
  { name: "Shale", color: COLORS.shale, height: 30 },
  { name: "Limestone", color: COLORS.limestone, height: 40 },
  { name: "Shale", color: COLORS.shale, height: 40 },
];

const LongitudinalCrossSection = ({
  phase,
  slotProgress,
  isPlaying,
  time,
  metrics,
}: LongitudinalCrossSectionProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const localTimeRef = useRef(0);

  const W = 340;
  const H = 500;

  // Wellbore geometry (vertical pipe centered)
  const WELL_CX = W / 2;
  const CASING_HALF = 10;   // half-width of casing
  const CEMENT_HALF = 16;   // half-width including cement
  const DAMAGE_HALF = 45;   // damage zone half-width
  const SLOT_MAX = 90;      // max slot penetration from casing wall

  // Slot positions (depths within the target formation)
  const TARGET_TOP = LAYERS.slice(0, 3).reduce((s, l) => s + l.height, 0) + 30; // 30px offset from top
  const SLOT_SPACING = 18;
  const NUM_SLOTS = 4;

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const t = localTimeRef.current;

    // Clear
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, W, H);

    // Draw formation layers
    let layerY = 30;
    LAYERS.forEach((layer) => {
      ctx.fillStyle = layer.color;
      ctx.fillRect(0, layerY, W, layer.height);

      // Target formation highlight
      if (layer.isTarget) {
        ctx.strokeStyle = "rgba(118, 185, 71, 0.15)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(0, layerY, W, layer.height);
        ctx.setLineDash([]);
      }

      // Layer label
      ctx.font = "8px monospace";
      ctx.fillStyle = layer.isTarget ? "rgba(118,185,71,0.5)" : "rgba(255,255,255,0.12)";
      ctx.textAlign = "left";
      ctx.fillText(layer.name, 6, layerY + 12);
      if (layer.isTarget) {
        ctx.fillText("TARGET ZONE", 6, layerY + 22);
      }

      layerY += layer.height;
    });

    // Damage zone (vertical band around wellbore)
    ctx.fillStyle = COLORS.damageZone;
    const dmgFade = phase === "post-spt" ? 0.3 : 1;
    ctx.globalAlpha = dmgFade;
    ctx.fillRect(WELL_CX - DAMAGE_HALF, 30, DAMAGE_HALF * 2, layerY - 30);
    ctx.globalAlpha = 1;

    // Damage zone border
    ctx.strokeStyle = "rgba(180, 60, 40, 0.25)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(WELL_CX - DAMAGE_HALF, 30);
    ctx.lineTo(WELL_CX - DAMAGE_HALF, layerY);
    ctx.moveTo(WELL_CX + DAMAGE_HALF, 30);
    ctx.lineTo(WELL_CX + DAMAGE_HALF, layerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Cement sheath
    ctx.fillStyle = "rgba(90, 80, 64, 0.5)";
    ctx.fillRect(WELL_CX - CEMENT_HALF, 0, CEMENT_HALF * 2, H);
    ctx.strokeStyle = "rgba(90, 80, 64, 0.3)";
    ctx.lineWidth = 0.5;
    ctx.strokeRect(WELL_CX - CEMENT_HALF, 0, CEMENT_HALF * 2, H);

    // Casing
    ctx.fillStyle = COLORS.casing;
    ctx.fillRect(WELL_CX - CASING_HALF, 0, CASING_HALF * 2, H);
    ctx.strokeStyle = "rgba(180, 190, 200, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(WELL_CX - CASING_HALF, 0);
    ctx.lineTo(WELL_CX - CASING_HALF, H);
    ctx.moveTo(WELL_CX + CASING_HALF, 0);
    ctx.lineTo(WELL_CX + CASING_HALF, H);
    ctx.stroke();

    // Wellbore interior (fluid column)
    ctx.fillStyle = COLORS.casingInner;
    ctx.fillRect(WELL_CX - CASING_HALF + 2, 0, (CASING_HALF - 2) * 2, H);

    // SPT Slots — horizontal cuts extending from casing into formation
    const targetFormTop = LAYERS.slice(0, 3).reduce((s, l) => s + l.height, 0) + 30;

    for (let i = 0; i < NUM_SLOTS; i++) {
      const slotY = targetFormTop + 12 + i * SLOT_SPACING;
      const prog = Math.min(1, slotProgress * 1.3);
      if (prog <= 0) continue;

      const slotLen = SLOT_MAX * prog;
      const slotH = 3; // narrow slit height
      const isCutting = prog > 0 && prog < 1 && phase === "injection";

      // Vibration
      const vib = isCutting ? Math.sin(t * 45) * 0.8 : 0;

      // Draw slot on BOTH sides of the wellbore
      for (const dir of [-1, 1]) {
        const startX = WELL_CX + dir * CASING_HALF;
        const endX = startX + dir * slotLen;

        // Slot body
        const gradSlot = ctx.createLinearGradient(startX, 0, endX, 0);
        gradSlot.addColorStop(0, "rgba(118, 185, 71, 0.8)");
        gradSlot.addColorStop(0.4, "rgba(118, 185, 71, 0.5)");
        gradSlot.addColorStop(0.8, isCutting ? "rgba(255, 200, 60, 0.5)" : "rgba(118, 185, 71, 0.25)");
        gradSlot.addColorStop(1, isCutting ? "rgba(255, 160, 40, 0.7)" : "rgba(118, 185, 71, 0.1)");
        ctx.fillStyle = gradSlot;

        const x = dir === 1 ? startX : endX;
        const w = Math.abs(endX - startX);
        ctx.fillRect(x, slotY - slotH / 2 + vib, w, slotH);

        // Slot border
        ctx.strokeStyle = "rgba(118, 185, 71, 0.3)";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, slotY - slotH / 2 + vib, w, slotH);

        // Cement breach marker
        if (slotLen > CEMENT_HALF - CASING_HALF) {
          const bx = WELL_CX + dir * CEMENT_HALF;
          ctx.beginPath();
          ctx.moveTo(bx, slotY - 4 + vib);
          ctx.lineTo(bx, slotY + 4 + vib);
          ctx.strokeStyle = "rgba(255, 220, 120, 0.5)";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Cutting head
        if (isCutting) {
          const tipX = endX;
          const tipY = slotY + vib;

          // Tool head
          ctx.fillStyle = "#c0c8d0";
          ctx.fillRect(tipX - (dir === 1 ? 0 : 5), tipY - 3, 5, 6);
          ctx.fillStyle = "#ffe080";
          ctx.globalAlpha = 0.7 + Math.sin(t * 30) * 0.3;
          ctx.fillRect(tipX + (dir === 1 ? 3 : -2), tipY - 3, 2, 6);
          ctx.globalAlpha = 1;

          // Hot glow
          const glowR = 8 + Math.sin(t * 20) * 2;
          const grad = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, glowR);
          grad.addColorStop(0, "rgba(255, 220, 80, 0.5)");
          grad.addColorStop(0.5, "rgba(255, 160, 40, 0.2)");
          grad.addColorStop(1, "transparent");
          ctx.beginPath();
          ctx.arc(tipX, tipY, glowR, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();

          // Sparks
          if (Math.random() < 0.4) {
            for (let s = 0; s < 3; s++) {
              const sx = tipX + dir * (Math.random() * 8);
              const sy = tipY + (Math.random() - 0.5) * 12;
              ctx.beginPath();
              ctx.arc(sx, sy, 0.8 + Math.random(), 0, Math.PI * 2);
              ctx.fillStyle = `rgba(255, ${180 + Math.random() * 60}, 40, ${0.5 + Math.random() * 0.4})`;
              ctx.fill();
            }
          }
        } else if (prog >= 1) {
          // Completed glow at tip
          const gx = endX;
          const gy = slotY;
          const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, 5);
          grad.addColorStop(0, "rgba(118, 185, 71, 0.35)");
          grad.addColorStop(1, "transparent");
          ctx.beginPath();
          ctx.arc(gx, gy, 5, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }
      }
    }

    // Oil particles flowing towards wellbore (post-SPT / mobilisation)
    if (phase === "mobilisation" || phase === "post-spt") {
      const numParticles = phase === "post-spt" ? 15 : 8;
      for (let i = 0; i < numParticles; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const baseX = WELL_CX + side * (DAMAGE_HALF + 10 + Math.random() * 40);
        const baseY = targetFormTop + Math.random() * 70;
        const drift = Math.sin(t * 2 + i * 1.3) * 5;
        const px = baseX + drift;
        const py = baseY + Math.sin(t * 1.5 + i) * 3;

        ctx.beginPath();
        ctx.arc(px, py, 2 + Math.random() * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = phase === "post-spt" ? COLORS.mobilised : COLORS.oil;
        ctx.globalAlpha = 0.6 + Math.random() * 0.3;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Flow arrows towards slots
      for (let i = 0; i < NUM_SLOTS; i++) {
        const slotY = targetFormTop + 12 + i * SLOT_SPACING;
        for (const dir of [-1, 1]) {
          const arrowX = WELL_CX + dir * (DAMAGE_HALF + 20 + Math.sin(t * 3 + i) * 5);
          ctx.beginPath();
          ctx.moveTo(arrowX, slotY);
          ctx.lineTo(arrowX + dir * 6, slotY - 3);
          ctx.lineTo(arrowX + dir * 6, slotY + 3);
          ctx.closePath();
          ctx.fillStyle = COLORS.mobilised;
          ctx.globalAlpha = 0.3 + Math.sin(t * 4 + i) * 0.15;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    }

    // Depth scale on left
    ctx.font = "8px monospace";
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.textAlign = "right";
    const depthStart = 4680;
    const depthRange = 180; // ft
    const pixelRange = layerY - 30;
    for (let d = 0; d <= depthRange; d += 30) {
      const y = 30 + (d / depthRange) * pixelRange;
      ctx.fillText(`${depthStart + d}'`, WELL_CX - DAMAGE_HALF - 8, y + 3);
      ctx.beginPath();
      ctx.moveTo(WELL_CX - DAMAGE_HALF - 4, y);
      ctx.lineTo(WELL_CX - DAMAGE_HALF, y);
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // Labels
    ctx.textAlign = "center";
    ctx.font = "9px monospace";
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillText("Casing", WELL_CX, 20);

    ctx.font = "7px monospace";
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.textAlign = "left";
    ctx.fillText("Cement", WELL_CX + CEMENT_HALF + 2, 20);

    // Title
    ctx.font = "bold 10px monospace";
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.textAlign = "center";
    ctx.fillText("LONGITUDINAL SECTION (SIDE VIEW)", W / 2, 14);

  }, [phase, slotProgress, metrics]);

  useEffect(() => {
    let running = true;
    const loop = () => {
      if (!running) return;
      if (isPlaying) {
        localTimeRef.current = time;
      }
      render();
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, time, render]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      style={{
        maxWidth: "100%",
        maxHeight: "100%",
        borderRadius: 8,
      }}
    />
  );
};

export default LongitudinalCrossSection;
