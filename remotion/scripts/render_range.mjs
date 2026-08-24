import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bundled = await bundle({ entryPoint: path.resolve(__dirname, "../src/index.ts"), webpackOverride: (config) => config });
const browser = await openBrowser("chrome", {
  browserExecutable: process.env.PUPPETEER_EXECUTABLE_PATH ?? "/bin/chromium",
  chromiumOptions: { args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"] },
  chromeMode: "chrome-for-testing",
});
const composition = await selectComposition({ serveUrl: bundled, id: "investor-pitch", puppeteerInstance: browser });
const start = Date.now();
await renderMedia({
  composition,
  serveUrl: bundled,
  codec: "h264",
  outputLocation: process.argv[3] || "/mnt/documents/investor-pitch-range.mp4",
  puppeteerInstance: browser,
  muted: true,
  concurrency: 1,
  frameRange: process.argv[2] ? process.argv[2].split("-").map(Number) : undefined,
  onProgress: (p) => console.log("progress", p.renderedFrames, p.encodedFrames, ((Date.now()-start)/1000).toFixed(1)+"s"),
});
await browser.close({ silent: false });
console.log("Done! Output:", process.argv[3]);
