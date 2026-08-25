import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadPlex } from "@remotion/google-fonts/IBMPlexSans";
import { loadFont as loadPlexMono } from "@remotion/google-fonts/IBMPlexMono";

const display = loadFraunces("normal", { weights: ["400", "500", "600"], subsets: ["latin"] });
const sans = loadPlex("normal", { weights: ["400", "500", "600"], subsets: ["latin"] });
const mono = loadPlexMono("normal", { weights: ["400", "500", "600"], subsets: ["latin"] });

export const F_DISPLAY = display.fontFamily;
export const F_SANS = sans.fontFamily;
export const F_MONO = mono.fontFamily;

export const C = {
  bg: "#0A0F1A",
  panel: "#111A2B",
  panel2: "#1B2740",
  panel3: "#151F34",
  gold: "#E8AE4D",
  goldDim: "rgba(232,174,77,0.28)",
  teal: "#49C9B8",
  violet: "#8E7FD9",
  blue: "#5B8DEF",
  coral: "#E17B6B",
  green: "#6FCF7F",
  ink: "#EDE7D9",
  muted: "#8791A6",
  hair: "rgba(237,231,217,0.10)",
};
