import { useRef, useEffect, useState, useCallback } from "react";

// ─── Types ──────────────────────────────────────────────────────────
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: "oil" | "water" | "gas" | "mobilised" | "spark" | "debris";
  radius: number;
  life: number;
  maxLife: number;
}

interface SlotLine {
  angle: number;       // angular position around wellbore
  penetration: number; // max penetration depth from casing wall into formation (px)
  progress: number;    // 0-1 animation progress
  arcSpan: number;     // angular width of the slot at casing wall (radians)
  slotWidth: number;   // radial width of the cut channel (px, narrow slit)
}

type Phase = "pre-spt" | "injection" | "mobilisation" | "post-spt";

interface PhaseInfo {
  label: string;
  description: string;
}

const PHASES: Record<Phase, PhaseInfo> = {
  "pre-spt": { label: "PRE-SPT", description: "Пласт в покое. Флюид заблокирован у ствола скважины." },
  injection: { label: "INJECTION", description: "SPT-перфорация создаёт слоты через зону повреждения." },
  mobilisation: { label: "MOBILISATION", description: "Мобилизованная нефть движется к стволу скважины." },
  "post-spt": { label: "POST-SPT", description: "Стабильный приток. Скин-фактор устранён." },
};

const PHASE_ORDER: Phase[] = ["pre-spt", "injection", "mobilisation", "post-spt"];

// ─── Colors ──────────────────────────────────────────────────────────
const COLORS = {
  bg: "#0a0c10",
  wellbore: "#1a1d24",
  wellboreBorder: "#2a2f38",
  damageZone: "rgba(180, 60, 40, 0.12)",
  damageZoneBorder: "rgba(180, 60, 40, 0.25)",
  oil: "#c8956c",
  water: "#3a6fa0",
  gas: "#6b8f5e",
  mobilised: "#e8b84a",
  slot: "#76b947",
  formation: "#1e2228",
  gridLine: "rgba(255,255,255,0.03)",
  accent: "#76b947",
  textPrimary: "#e0dcd4",
  textSecondary: "rgba(224,220,212,0.5)",
  panelBg: "rgba(14,16,22,0.85)",
  panelBorder: "rgba(255,255,255,0.06)",
};

// ─── Main Component ──────────────────────────────────────────────────
const FluidPhysicsSimulation = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const slotsRef = useRef<SlotLine[]>([]);
  const timeRef = useRef(0);
  const [phase, setPhase] = useState<Phase>("pre-spt");
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [metrics, setMetrics] = useState({
    flowRate: 6,
    skinFactor: 18.4,
    mobilisedOil: 2,
    damageZone: true,
    slotDepth: 0,
    pressure: 840,
  });
  const [showCosmosModal, setShowCosmosModal] = useState(false);

  // Canvas dimensions
  const W = 900;
  const H = 700;
  const CX = W / 2;
  const CY = H / 2;
  const WELLBORE_R = 22;
  const CASING_R = 30;   // outer casing wall
  const CEMENT_R = 42;   // cement sheath outer boundary
  const DAMAGE_R = 90;
  const FORMATION_R = 320;

  // ─── Initialize particles ──────────────────────────────────────
  const initParticles = useCallback(() => {
    const particles: Particle[] = [];
    // Oil droplets scattered in formation
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = DAMAGE_R + 20 + Math.random() * (FORMATION_R - DAMAGE_R - 40);
      particles.push({
        x: CX + Math.cos(angle) * r,
        y: CY + Math.sin(angle) * r,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        type: "oil",
        radius: 2 + Math.random() * 2.5,
        life: 0,
        maxLife: 99999,
      });
    }
    // Water droplets
    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = DAMAGE_R + 40 + Math.random() * (FORMATION_R - DAMAGE_R - 60);
      particles.push({
        x: CX + Math.cos(angle) * r,
        y: CY + Math.sin(angle) * r,
        vx: (Math.random() - 0.5) * 0.1,
        vy: (Math.random() - 0.5) * 0.1,
        type: "water",
        radius: 1.5 + Math.random() * 1.5,
        life: 0,
        maxLife: 99999,
      });
    }
    particlesRef.current = particles;
    slotsRef.current = [];
  }, [CX, CY]);

  useEffect(() => {
    initParticles();
  }, [initParticles]);

  // ─── Phase transitions ──────────────────────────────────────────
  const advancePhase = useCallback((t: number) => {
    if (t < 4) {
      setPhase("pre-spt");
      setMetrics({
        flowRate: 6,
        skinFactor: 18.4,
        mobilisedOil: 2,
        damageZone: true,
        slotDepth: 0,
        pressure: 840,
      });
    } else if (t < 10) {
      setPhase("injection");
      const prog = (t - 4) / 6;
      setMetrics({
        flowRate: Math.round(6 + prog * 20),
        skinFactor: +(18.4 - prog * 12).toFixed(1),
        mobilisedOil: Math.round(2 + prog * 25),
        damageZone: prog < 0.7,
        slotDepth: +(prog * 4.8).toFixed(1),
        pressure: Math.round(840 + prog * 1200),
      });
      // Create longitudinal slots — narrow rectangular cuts through casing/cement
      if (slotsRef.current.length === 0) {
        const count = 4; // typical SPT: 4 longitudinal slots at 90° intervals
        for (let i = 0; i < count; i++) {
          slotsRef.current.push({
            angle: (i / count) * Math.PI * 2 + Math.PI / 8, // offset so not axis-aligned
            penetration: DAMAGE_R + 15 + Math.random() * 30, // penetrates through damage zone
            progress: 0,
            arcSpan: 0.08 + Math.random() * 0.03, // narrow arc at casing wall (~4-6°)
            slotWidth: 2.5 + Math.random() * 1,   // very narrow radial cut
          });
        }
      }
      // Smooth eased progress for cutting animation
      const easedProg = prog < 0.15 ? prog * 4 : Math.min(1, 0.6 + (prog - 0.15) * 0.47);
      slotsRef.current.forEach((s) => {
        s.progress = Math.min(1, easedProg * 1.3);
      });
    } else if (t < 18) {
      setPhase("mobilisation");
      const prog = (t - 10) / 8;
      setMetrics({
        flowRate: Math.round(26 + prog * 39),
        skinFactor: +(6.4 - prog * 8.4).toFixed(1),
        mobilisedOil: Math.round(27 + prog * 55),
        damageZone: false,
        slotDepth: 4.8,
        pressure: Math.round(2040 - prog * 400),
      });
    } else {
      setPhase("post-spt");
      setMetrics({
        flowRate: 65,
        skinFactor: -2.0,
        mobilisedOil: 82,
        damageZone: false,
        slotDepth: 4.8,
        pressure: 1640,
      });
    }
  }, []);

  // ─── Physics update ──────────────────────────────────────────────
  const updatePhysics = useCallback(
    (dt: number) => {
      const particles = particlesRef.current;
      const currentPhase = phase;

      particles.forEach((p) => {
        p.life += dt;

        // Brownian motion
        p.vx += (Math.random() - 0.5) * 0.02;
        p.vy += (Math.random() - 0.5) * 0.02;

        // Damping
        p.vx *= 0.98;
        p.vy *= 0.98;

        const dx = p.x - CX;
        const dy = p.y - CY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Pre-SPT: particles stuck, slight random drift
        if (currentPhase === "pre-spt") {
          // Repel from wellbore damage zone
          if (dist < DAMAGE_R + 10) {
            const force = 0.05 * (1 - dist / (DAMAGE_R + 10));
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }
        }

        // Injection: mobilised oil forms near slots and moves toward well
        if (currentPhase === "injection" || currentPhase === "mobilisation") {
          if (p.type === "oil" && dist < DAMAGE_R + 50) {
            // Start mobilising — convert some to mobilised
            if (Math.random() < 0.002 && p.type === "oil") {
              p.type = "mobilised";
            }
          }
          if (p.type === "mobilised") {
            // Attract toward wellbore
            const attractForce = currentPhase === "mobilisation" ? 0.08 : 0.03;
            p.vx -= (dx / dist) * attractForce;
            p.vy -= (dy / dist) * attractForce;
          }
        }

        // Post-SPT: strong flow toward well
        if (currentPhase === "post-spt") {
          if (p.type === "oil" || p.type === "mobilised") {
            p.type = "mobilised";
            const attractForce = 0.12;
            p.vx -= (dx / dist) * attractForce;
            p.vy -= (dy / dist) * attractForce;
          }
        }

        // Boundary — keep in formation
        if (dist > FORMATION_R - 10) {
          p.vx -= (dx / dist) * 0.1;
          p.vy -= (dy / dist) * 0.1;
        }

        // Respawn if too close to wellbore
        if (dist < WELLBORE_R + 5) {
          const angle = Math.random() * Math.PI * 2;
          const r = DAMAGE_R + 40 + Math.random() * (FORMATION_R - DAMAGE_R - 60);
          p.x = CX + Math.cos(angle) * r;
          p.y = CY + Math.sin(angle) * r;
          p.vx = 0;
          p.vy = 0;
          if (currentPhase === "post-spt" || currentPhase === "mobilisation") {
            p.type = "oil"; // Reset for re-mobilisation
          }
        }

        p.x += p.vx;
        p.y += p.vy;
      });

      // Spawn gas bubbles during injection
      if ((currentPhase === "injection" || currentPhase === "mobilisation") && Math.random() < 0.05) {
        const angle = Math.random() * Math.PI * 2;
        const r = WELLBORE_R + 20 + Math.random() * 40;
        particles.push({
          x: CX + Math.cos(angle) * r,
          y: CY + Math.sin(angle) * r,
          vx: (Math.random() - 0.5) * 0.5,
          vy: -0.3 - Math.random() * 0.5,
          type: "gas",
          radius: 1 + Math.random() * 1.5,
          life: 0,
          maxLife: 80 + Math.random() * 60,
        });
      }

      // Spawn sparks and debris at cutting tips during injection
      if (currentPhase === "injection") {
        slotsRef.current.forEach((slot) => {
          if (slot.progress <= 0 || slot.progress >= 1) return;
          if (Math.random() < 0.35) {
            const a = slot.angle;
            const startR = CASING_R;
            const endR = startR + (slot.penetration - startR) * slot.progress;
            const tipX = CX + Math.cos(a) * endR;
            const tipY = CY + Math.sin(a) * endR;
            const sparkAngle = a + (Math.random() - 0.5) * 1.2;
            const sparkSpeed = 1 + Math.random() * 2.5;
            particles.push({
              x: tipX + (Math.random() - 0.5) * 3,
              y: tipY + (Math.random() - 0.5) * 3,
              vx: Math.cos(sparkAngle) * sparkSpeed,
              vy: Math.sin(sparkAngle) * sparkSpeed,
              type: "spark",
              radius: 0.8 + Math.random() * 1.2,
              life: 0,
              maxLife: 15 + Math.random() * 20,
            });
            if (Math.random() < 0.3) {
              const debrisAngle = a + (Math.random() - 0.5) * 0.8;
              particles.push({
                x: tipX,
                y: tipY,
                vx: Math.cos(debrisAngle) * (0.3 + Math.random() * 0.8),
                vy: Math.sin(debrisAngle) * (0.3 + Math.random() * 0.8),
                type: "debris",
                radius: 1.5 + Math.random() * 2,
                life: 0,
                maxLife: 30 + Math.random() * 30,
              });
            }
          }
        });
      }

      // Remove expired particles
      particlesRef.current = particles.filter((p) => {
        if (p.type === "gas" || p.type === "spark" || p.type === "debris") {
          return p.life < p.maxLife;
        }
        return true;
      });
    },
    [phase, CX, CY]
  );

  // ─── Render ───────────────────────────────────────────────────────
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Formation boundary
    ctx.beginPath();
    ctx.arc(CX, CY, FORMATION_R, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Damage zone
    if (metrics.damageZone || phase === "pre-spt" || phase === "injection") {
      const damageOpacity = phase === "pre-spt" ? 1 : phase === "injection" ? 0.5 : 0.15;
      ctx.beginPath();
      ctx.arc(CX, CY, DAMAGE_R, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.damageZone.replace("0.12", String(0.12 * damageOpacity));
      ctx.fill();
      ctx.strokeStyle = COLORS.damageZoneBorder.replace("0.25", String(0.25 * damageOpacity));
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ── Casing & cement rings (drawn before slots so slots cut through them) ──
    // Cement sheath
    ctx.beginPath();
    ctx.arc(CX, CY, CEMENT_R, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(160, 140, 110, 0.3)";
    ctx.lineWidth = CEMENT_R - CASING_R;
    ctx.stroke();

    // Casing pipe wall
    ctx.beginPath();
    ctx.arc(CX, CY, CASING_R, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(180, 190, 200, 0.4)";
    ctx.lineWidth = 3;
    ctx.stroke();

    // SPT Slots — longitudinal cuts shown as narrow rectangular slits in cross-section
    const time = timeRef.current;
    slotsRef.current.forEach((slot) => {
      if (slot.progress <= 0) return;
      const a = slot.angle;
      const startR = WELLBORE_R + 2; // start inside casing
      const maxR = slot.penetration;
      const endR = startR + (maxR - startR) * slot.progress;
      const halfArc = slot.arcSpan / 2;
      const isCutting = slot.progress > 0 && slot.progress < 1 && phase === "injection";

      // Vibration while cutting
      const vibOffset = isCutting ? Math.sin(time * 45) * 0.004 : 0;
      const aVib = a + vibOffset;

      // Draw the slot as a narrow wedge/slit shape
      // Left edge of slot
      const a1 = aVib - halfArc;
      const a2 = aVib + halfArc;

      ctx.beginPath();
      // Inner arc (at casing wall)
      ctx.arc(CX, CY, startR, a1, a2);
      // Right edge outward
      ctx.lineTo(CX + Math.cos(a2) * endR, CY + Math.sin(a2) * endR);
      // Outer arc (at penetration tip)
      ctx.arc(CX, CY, endR, a2, a1, true);
      // Left edge inward (closes path)
      ctx.closePath();

      // Gradient fill — green channel with hot tip when cutting
      const gradSlot = ctx.createRadialGradient(CX, CY, startR, CX, CY, endR);
      gradSlot.addColorStop(0, "rgba(118, 185, 71, 0.8)");
      gradSlot.addColorStop(0.4, "rgba(118, 185, 71, 0.5)");
      gradSlot.addColorStop(0.8, isCutting ? "rgba(255, 200, 60, 0.5)" : "rgba(118, 185, 71, 0.25)");
      gradSlot.addColorStop(1, isCutting ? "rgba(255, 160, 40, 0.7)" : "rgba(118, 185, 71, 0.1)");
      ctx.fillStyle = gradSlot;
      ctx.globalAlpha = 0.9;
      ctx.fill();

      // Slot border edges
      ctx.strokeStyle = "rgba(118, 185, 71, 0.4)";
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = 0.6;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Indicate casing breach — highlight where slot cuts through casing/cement
      if (endR > CASING_R) {
        // Bright marks at casing breach points
        for (const bR of [CASING_R, Math.min(endR, CEMENT_R)]) {
          if (endR < bR) continue;
          ctx.beginPath();
          ctx.arc(CX, CY, bR, a1 - 0.01, a2 + 0.01);
          ctx.strokeStyle = "rgba(255, 220, 120, 0.5)";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // Cutting tool head at the tip
      if (isCutting) {
        const tipR = endR;
        const tipX = CX + Math.cos(aVib) * tipR;
        const tipY = CY + Math.sin(aVib) * tipR;

        // Tool body — small arc at cutting front
        ctx.save();
        ctx.translate(tipX, tipY);
        ctx.rotate(aVib);

        // Tool housing
        const toolLen = 6;
        const toolW = slot.arcSpan * endR + 4;
        ctx.fillStyle = "#c0c8d0";
        ctx.fillRect(-2, -toolW / 2, toolLen, toolW);
        ctx.strokeStyle = "#8090a0";
        ctx.lineWidth = 0.8;
        ctx.strokeRect(-2, -toolW / 2, toolLen, toolW);

        // Cutting blade edge
        ctx.fillStyle = "#ffe080";
        ctx.globalAlpha = 0.7 + Math.sin(time * 30) * 0.3;
        ctx.fillRect(toolLen - 3.5, -toolW / 2, 1.5, toolW);
        ctx.globalAlpha = 1;

        ctx.restore();

        // Hot glow at cutting point
        const glowR = 10 + Math.sin(time * 20) * 3;
        const grad = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, glowR);
        grad.addColorStop(0, "rgba(255, 220, 80, 0.6)");
        grad.addColorStop(0.4, "rgba(255, 160, 40, 0.25)");
        grad.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(tipX, tipY, glowR, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      } else if (slot.progress >= 1) {
        // Completed slot — subtle glow at tip
        const gx = CX + Math.cos(a) * endR;
        const gy = CY + Math.sin(a) * endR;
        const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, 6);
        grad.addColorStop(0, "rgba(118, 185, 71, 0.4)");
        grad.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(gx, gy, 6, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }
    });

    // Particles
    particlesRef.current.forEach((p) => {
      let color = COLORS.oil;
      let alpha = 0.7;
      if (p.type === "water") {
        color = COLORS.water;
        alpha = 0.5;
      } else if (p.type === "gas") {
        color = COLORS.gas;
        alpha = 0.4 * (1 - p.life / p.maxLife);
      } else if (p.type === "mobilised") {
        color = COLORS.mobilised;
        alpha = 0.85;
      } else if (p.type === "spark") {
        const fade = 1 - p.life / p.maxLife;
        color = `rgb(${255}, ${180 + Math.random() * 40}, ${40})`;
        alpha = fade * 0.9;
        // Draw spark with a trail
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * fade, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;
        ctx.fill();
        // Bright core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * fade * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.globalAlpha = alpha * 0.8;
        ctx.fill();
        ctx.globalAlpha = 1;
        return;
      } else if (p.type === "debris") {
        const fade = 1 - p.life / p.maxLife;
        color = "#8b7355";
        alpha = fade * 0.7;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Wellbore (drawn on top of slots)
    ctx.beginPath();
    ctx.arc(CX, CY, WELLBORE_R, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.wellbore;
    ctx.fill();
    ctx.strokeStyle = COLORS.wellboreBorder;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Wellbore center dot
    ctx.beginPath();
    ctx.arc(CX, CY, 3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fill();

    // Labels
    ctx.font = "9px monospace";
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillText("Casing", CX + CASING_R + 3, CY - 3);
    ctx.fillText("Cement", CX + CEMENT_R + 3, CY - 3);
    [DAMAGE_R, FORMATION_R].forEach((r, i) => {
      ctx.fillText(i === 0 ? "Damage zone" : "Formation boundary", CX + r * 0.7 + 5, CY - r * 0.7);
    });
  }, [metrics, phase, CX, CY]);

  // ─── Animation loop ─────────────────────────────────────────────
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;

      if (isPlaying) {
        const dt = rawDt * speed;
        timeRef.current += dt;
        setElapsedTime(timeRef.current);
        advancePhase(timeRef.current);
        updatePhysics(dt);
      }

      render();
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying, speed, advancePhase, updatePhysics, render]);

  // ─── Controls ──────────────────────────────────────────────────
  const handleReset = () => {
    setIsPlaying(false);
    timeRef.current = 0;
    setElapsedTime(0);
    setPhase("pre-spt");
    setMetrics({
      flowRate: 6,
      skinFactor: 18.4,
      mobilisedOil: 2,
      damageZone: true,
      slotDepth: 0,
      pressure: 840,
    });
    initParticles();
  };

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const phaseIdx = PHASE_ORDER.indexOf(phase);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#06080c",
        color: COLORS.textPrimary,
        fontFamily: "'IBM Plex Mono', monospace",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Syne:wght@700;800&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 32px",
          borderBottom: `1px solid ${COLORS.panelBorder}`,
          background: COLORS.panelBg,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={() => setShowCosmosModal(true)}
            style={{
              background: "rgba(118,185,71,0.1)",
              border: "1px solid rgba(118,185,71,0.2)",
              borderRadius: 6,
              padding: "4px 12px",
              color: COLORS.accent,
              fontSize: 10,
              letterSpacing: 2,
              cursor: "pointer",
              textTransform: "uppercase",
            }}
          >
            NVIDIA COSMOS
          </button>
          <h1
            style={{
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: 3,
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            SGOM · Fluid Physics Simulation
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: 2,
              color: COLORS.accent,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: COLORS.accent,
                display: "inline-block",
              }}
            />
            READY
          </span>
        </div>
      </header>

      {/* Well info bar */}
      <div
        style={{
          padding: "10px 32px",
          borderBottom: `1px solid ${COLORS.panelBorder}`,
          fontSize: 11,
          color: COLORS.textSecondary,
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <span style={{ color: COLORS.textPrimary, fontWeight: 500 }}>
          Brawner 10-15
        </span>
        <span>·</span>
        <span>Tonkawa Sand</span>
        <span>·</span>
        <span>4680–4860 ft</span>
      </div>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          padding: 24,
          gap: 20,
          overflow: "hidden",
        }}
      >
        {/* Canvas area */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: COLORS.bg,
            borderRadius: 12,
            border: `1px solid ${COLORS.panelBorder}`,
            position: "relative",
          }}
        >
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

          {/* Phase progress dots */}
          <div
            style={{
              position: "absolute",
              top: 16,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            {PHASE_ORDER.map((p, i) => (
              <div key={p} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: i <= phaseIdx ? 10 : 8,
                    height: i <= phaseIdx ? 10 : 8,
                    borderRadius: "50%",
                    background: i <= phaseIdx ? COLORS.accent : "rgba(255,255,255,0.1)",
                    border: i === phaseIdx ? `2px solid ${COLORS.accent}` : "none",
                    transition: "all 0.3s",
                  }}
                />
                {i < PHASE_ORDER.length - 1 && (
                  <div
                    style={{
                      width: 30,
                      height: 1,
                      background: i < phaseIdx ? COLORS.accent : "rgba(255,255,255,0.08)",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Side panel */}
        <div
          style={{
            width: 280,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            overflowY: "auto",
          }}
        >
          {/* Phase card */}
          <PanelCard title="Simulation Phase">
            <div
              style={{
                background: "rgba(118,185,71,0.08)",
                border: "1px solid rgba(118,185,71,0.15)",
                borderRadius: 6,
                padding: "10px 14px",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.accent }}>
                {PHASES[phase].label}
              </div>
              <div style={{ fontSize: 10, color: COLORS.textSecondary, marginTop: 4, lineHeight: 1.4 }}>
                {PHASES[phase].description}
              </div>
            </div>
          </PanelCard>

          {/* Pressure */}
          <PanelCard title="Reservoir Pressure">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 10, color: COLORS.textSecondary }}>Near-wellbore</span>
              <span style={{ fontSize: 16, fontWeight: 600 }}>{metrics.pressure} psi</span>
            </div>
            <div
              style={{
                marginTop: 8,
                height: 4,
                background: "rgba(255,255,255,0.06)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, (metrics.pressure / 2500) * 100)}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${COLORS.accent}, #4a8a2a)`,
                  borderRadius: 2,
                  transition: "width 0.5s",
                }}
              />
            </div>
          </PanelCard>

          {/* Metrics */}
          <PanelCard title="Live Metrics">
            <MetricRow label="Flow rate" value={`${metrics.flowRate} bbl/d`} />
            <MetricRow
              label="Skin factor"
              value={metrics.skinFactor > 0 ? `+${metrics.skinFactor}` : String(metrics.skinFactor)}
              highlight={metrics.skinFactor <= 0}
            />
            <MetricRow label="Mobilised oil" value={`${metrics.mobilisedOil}%`} />
            <MetricRow
              label="Damage zone"
              value={metrics.damageZone ? "Active" : "Cleared"}
              highlight={!metrics.damageZone}
            />
            <MetricRow label="Slot depth" value={metrics.slotDepth > 0 ? `${metrics.slotDepth} ft` : "—"} />
          </PanelCard>

          {/* Legend */}
          <PanelCard title="Legend">
            <LegendItem color={COLORS.oil} label="Oil droplets" />
            <LegendItem color={COLORS.water} label="Formation water" />
            <LegendItem color={COLORS.mobilised} label="Mobilised oil (SPT)" />
            <LegendItem color={COLORS.gas} label="Gas (liberated)" />
            <LegendItem color={COLORS.slot} label="SPT slot cut" type="line" />
            <LegendItem color="rgba(180,60,40,0.4)" label="Damaged zone" type="dashed" />
          </PanelCard>

          {/* Patent */}
          <PanelCard title="US PATENT #8,863,823">
            <p style={{ fontSize: 10, color: COLORS.textSecondary, margin: 0, lineHeight: 1.5 }}>
              Slot Perforation Technology bypasses near-wellbore damage zone, connecting with natural
              fracture network up to 5 ft depth.
            </p>
          </PanelCard>
        </div>
      </div>

      {/* Controls footer */}
      <footer
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          padding: "14px 32px",
          borderTop: `1px solid ${COLORS.panelBorder}`,
          background: COLORS.panelBg,
        }}
      >
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          style={{
            background: isPlaying ? "rgba(255,255,255,0.06)" : COLORS.accent,
            color: isPlaying ? COLORS.textPrimary : "#0a0c10",
            border: "none",
            borderRadius: 6,
            padding: "8px 24px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'IBM Plex Mono', monospace",
            letterSpacing: 1,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {isPlaying ? "⏸ PAUSE" : "▶ PLAY"}
        </button>
        <button
          onClick={handleReset}
          style={{
            background: "rgba(255,255,255,0.04)",
            color: COLORS.textSecondary,
            border: `1px solid ${COLORS.panelBorder}`,
            borderRadius: 6,
            padding: "8px 20px",
            fontSize: 12,
            cursor: "pointer",
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        >
          ↺ RESET
        </button>
        <span style={{ fontSize: 12, color: COLORS.textSecondary, minWidth: 50 }}>
          {formatTime(elapsedTime)}
        </span>
        <button
          onClick={() => setSpeed(speed === 1 ? 2 : speed === 2 ? 4 : 1)}
          style={{
            background: "rgba(255,255,255,0.04)",
            color: COLORS.textSecondary,
            border: `1px solid ${COLORS.panelBorder}`,
            borderRadius: 6,
            padding: "6px 14px",
            fontSize: 11,
            cursor: "pointer",
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        >
          {speed}× speed
        </button>
      </footer>

      {/* COSMOS Modal */}
      {showCosmosModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
          onClick={() => setShowCosmosModal(false)}
        >
          <div
            style={{
              background: "#12141a",
              border: `1px solid ${COLORS.panelBorder}`,
              borderRadius: 16,
              padding: 40,
              maxWidth: 500,
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 24,
                fontWeight: 800,
                color: COLORS.accent,
                marginBottom: 16,
              }}
            >
              NVIDIA COSMOS
            </h2>
            <p style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.6 }}>
              This simulation leverages NVIDIA Cosmos World Foundation Model for physics-aware
              prediction of fluid behavior during SPT well restoration.
            </p>
            <button
              onClick={() => setShowCosmosModal(false)}
              style={{
                marginTop: 24,
                background: COLORS.accent,
                color: "#0a0c10",
                border: "none",
                borderRadius: 6,
                padding: "8px 24px",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 12,
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Sub-components ──────────────────────────────────────────────────
const PanelCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div
    style={{
      background: COLORS.panelBg,
      border: `1px solid ${COLORS.panelBorder}`,
      borderRadius: 10,
      padding: "14px 16px",
    }}
  >
    <div
      style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        color: COLORS.textSecondary,
        marginBottom: 10,
      }}
    >
      {title}
    </div>
    {children}
  </div>
);

const MetricRow = ({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "5px 0",
      fontSize: 11,
      borderBottom: `1px solid ${COLORS.panelBorder}`,
    }}
  >
    <span style={{ color: COLORS.textSecondary }}>{label}</span>
    <span style={{ fontWeight: 500, color: highlight ? COLORS.accent : COLORS.textPrimary }}>
      {value}
    </span>
  </div>
);

const LegendItem = ({
  color,
  label,
  type = "dot",
}: {
  color: string;
  label: string;
  type?: "dot" | "line" | "dashed";
}) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0", fontSize: 10 }}>
    {type === "dot" && (
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
    )}
    {type === "line" && (
      <div style={{ width: 16, height: 2, background: color, borderRadius: 1, flexShrink: 0 }} />
    )}
    {type === "dashed" && (
      <div
        style={{
          width: 16,
          height: 0,
          borderTop: `2px dashed ${color}`,
          flexShrink: 0,
        }}
      />
    )}
    <span style={{ color: COLORS.textSecondary }}>{label}</span>
  </div>
);

export default FluidPhysicsSimulation;
