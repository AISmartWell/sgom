import { useEffect, useRef, useState } from "react";
import mariaPortrait from "@/assets/maria-portrait.jpg";
import { cn } from "@/lib/utils";

interface MariaAvatarProps {
  size?: number;
  speaking?: boolean;
  audio?: HTMLAudioElement | null;
  className?: string;
  ring?: boolean;
}

/**
 * MariaAvatar — circular portrait with audio-reactive "lipsync":
 * scale + glow pulse tracked to real-time audio amplitude via WebAudio Analyser.
 * When `audio` is provided and playing, mouth area subtly scales with volume.
 */
export const MariaAvatar = ({
  size = 44,
  speaking = false,
  audio,
  className,
  ring = true,
}: MariaAvatarProps) => {
  const [level, setLevel] = useState(0);
  const rafRef = useRef<number>();
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const linkedAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audio) {
      setLevel(0);
      return;
    }
    if (linkedAudioRef.current === audio && analyserRef.current) {
      // already wired
    } else {
      try {
        const AC =
          (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!ctxRef.current) ctxRef.current = new AC();
        const ctx = ctxRef.current!;
        if (ctx.state === "suspended") ctx.resume().catch(() => {});
        // One MediaElementSource per <audio> element (browser restriction).
        const src = ctx.createMediaElementSource(audio);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
        src.connect(ctx.destination);
        sourceRef.current = src;
        analyserRef.current = analyser;
        linkedAudioRef.current = audio;
      } catch {
        // If already connected, ignore.
      }
    }

    const data = new Uint8Array(analyserRef.current?.frequencyBinCount ?? 128);
    const tick = () => {
      const a = analyserRef.current;
      if (a) {
        a.getByteFrequencyData(data);
        // focus on low-mid band (voice)
        let sum = 0;
        const n = Math.min(40, data.length);
        for (let i = 2; i < n; i++) sum += data[i];
        const avg = sum / (n - 2) / 255;
        setLevel((prev) => prev * 0.5 + avg * 0.5);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [audio]);

  const scale = 1 + level * 0.08;
  const glow = 0.3 + level * 0.9;
  const mouthScale = 1 + level * 0.35;

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
      aria-label="Maria avatar"
    >
      {/* Glow ring */}
      {ring && (
        <div
          className="absolute inset-0 rounded-full transition-opacity"
          style={{
            boxShadow: `0 0 ${12 + level * 40}px hsl(140 80% 55% / ${glow}), 0 0 ${
              4 + level * 12
            }px hsl(140 90% 65% / ${glow * 0.8})`,
            opacity: speaking ? 1 : 0.4,
          }}
        />
      )}
      {/* Portrait */}
      <div
        className="absolute inset-0 rounded-full overflow-hidden border-2"
        style={{
          borderColor: speaking ? "hsl(140 80% 55%)" : "hsl(140 40% 30%)",
          transform: `scale(${scale})`,
          transition: "transform 60ms linear, border-color 200ms",
        }}
      >
        <img
          src={mariaPortrait}
          alt="Maria"
          width={size * 2}
          height={size * 2}
          loading="lazy"
          className="w-full h-full object-cover"
          style={{ objectPosition: "50% 30%" }}
        />
        {/* Mouth "lipsync" overlay — a soft dark ellipse pulsing over the mouth area */}
        {speaking && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: "50%",
              top: "62%",
              width: size * 0.28,
              height: size * 0.12,
              transform: `translate(-50%, -50%) scaleY(${mouthScale})`,
              borderRadius: "50%",
              background:
                "radial-gradient(ellipse, hsl(0 0% 0% / 0.35) 0%, hsl(0 0% 0% / 0) 70%)",
              transition: "transform 50ms linear",
            }}
          />
        )}
      </div>
      {/* Live dot */}
      {speaking && (
        <span
          className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[hsl(140_90%_55%)] border-2 border-background animate-pulse"
          style={{ boxShadow: "0 0 8px hsl(140 90% 55%)" }}
        />
      )}
    </div>
  );
};

export default MariaAvatar;
