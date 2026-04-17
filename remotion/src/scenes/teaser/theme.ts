import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrains } from "@remotion/google-fonts/JetBrainsMono";

const inter = loadInter("normal", { weights: ["400", "600", "800", "900"], subsets: ["latin"] });
const mono = loadJetBrains("normal", { weights: ["400", "600"], subsets: ["latin"] });

export const FONT_DISPLAY = inter.fontFamily;
export const FONT_MONO = mono.fontFamily;

// NVIDIA-inspired but distinct: deep ink + electric blue + signal green accents.
export const COLORS = {
  bg: "#05070d",
  bgDeep: "#02030a",
  ink: "#0c1220",
  text: "#f5f7fb",
  mute: "#8893a8",
  accent: "#1A9FFF", // brand electric blue
  accentSoft: "#1A9FFF22",
  accentBorder: "#1A9FFF55",
  signal: "#22c55e",
  warn: "#f59e0b",
  danger: "#ef4444",
};
