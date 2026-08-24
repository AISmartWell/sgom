import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const compId = process.argv[2];
const outputFile = process.argv[3];
const concurrency = Number(process.argv[4] || 1);

if (!compId || !outputFile) {
  console.error("Usage: node render_one.mjs <comp-id> <output.mp4> [concurrency]");
  process.exit(1);
}

const bundled = await bundle({
  entryPoint: path.resolve(__dirname, "../src/index.ts"),
  webpackOverride: (config) => config,
});

const browser = await openBrowser("chrome", {
  browserExecutable: process.env.PUPPETEER_EXECUTABLE_PATH ?? "/bin/chromium",
  chromiumOptions: { args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"] },
  chromeMode: "chrome-for-testing",
});

const composition = await selectComposition({
  serveUrl: bundled,
  id: compId,
  puppeteerInstance: browser,
});

const start = Date.now();
await renderMedia({
  composition,
  serveUrl: bundled,
  codec: "h264",
  outputLocation: outputFile,
  puppeteerInstance: browser,
  muted: true,
  concurrency,
  onProgress: (p) => console.log(`${compId}: ${p.renderedFrames}/${composition.durationInFrames} ${((Date.now() - start) / 1000).toFixed(0)}s`),
});

await browser.close({ silent: false });
console.log(`${compId} DONE -> ${outputFile}`);
