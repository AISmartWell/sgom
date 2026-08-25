import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
const bundled = await bundle({ entryPoint: path.resolve("src/index.ts"), webpackOverride: (c)=>c });
const browser = await openBrowser("chrome", { browserExecutable: process.env.PUPPETEER_EXECUTABLE_PATH ?? "/bin/chromium", chromiumOptions:{args:["--no-sandbox","--disable-gpu","--disable-dev-shm-usage"]}, chromeMode:"chrome-for-testing" });
for (const [id, fr] of [["sgom-01-hero",120],["sgom-02-predict",140],["sgom-03-transfer",150],["sgom-04-reason",120],["sgom-05-pipeline",120],["sgom-06-trust",110],["sgom-07-close",120]]) {
  const composition = await selectComposition({ serveUrl: bundled, id, puppeteerInstance: browser });
  await renderStill({ composition, serveUrl: bundled, frame: fr, output: `/tmp/sgom/${id}.png`, puppeteerInstance: browser });
  console.log("ok", id);
}
await browser.close({ silent:false });
