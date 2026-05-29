/// <reference lib="webworker" />
/**
 * Monte Carlo simulation worker.
 * Runs N iterations of Arps-decline 5-year ROI sampling off the main thread.
 * Streams progress messages so the UI stays responsive at 50K+ iterations.
 */

import { arpsRate } from "@/lib/economics-config";

export interface MCWorkerInput {
  type: "run";
  wells: { name: string; addedProd: number; Di: number; b: number }[];
  basePrice: number;
  baseCost: number;
  baseOpex: number;
  priceStd: number;
  costStd: number;
  opexStd: number;
  diStd: number;
  iterations: number;
  seed: number;
}

export interface MCWorkerProgress {
  type: "progress";
  done: number;
  total: number;
}

export interface MCWorkerResult {
  type: "result";
  rois: Float64Array;
  elapsedMs: number;
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normalRandom(rand: () => number, mean: number, stdDev: number): number {
  const u1 = rand();
  const u2 = rand();
  return mean + stdDev * Math.sqrt(-2 * Math.log(u1 || 1e-10)) * Math.cos(2 * Math.PI * u2);
}

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (e: MessageEvent<MCWorkerInput>) => {

  const msg = e.data;
  if (msg.type !== "run") return;

  const t0 = performance.now();
  const {
    wells, basePrice, baseCost, baseOpex,
    priceStd, costStd, opexStd, diStd,
    iterations, seed,
  } = msg;

  const rand = mulberry32(seed);
  const rois = new Float64Array(iterations);
  // Emit progress ~20 times total
  const progressEvery = Math.max(1, Math.floor(iterations / 20));

  for (let i = 0; i < iterations; i++) {
    const price = Math.max(20, normalRandom(rand, basePrice, priceStd));
    const cost = Math.max(10000, normalRandom(rand, baseCost, costStd));
    const opex = Math.max(2, normalRandom(rand, baseOpex, opexStd));

    let totalNet = 0;
    let totalCapex = 0;

    for (const w of wells) {
      const di = Math.max(0.005, normalRandom(rand, w.Di, diStd));
      let fiveYearNet = 0;
      for (let m = 1; m <= 60; m++) {
        const rate = arpsRate(w.addedProd, di, w.b, m);
        fiveYearNet += rate * 30.44 * (price - opex);
      }
      totalNet += fiveYearNet;
      totalCapex += cost;
    }

    rois[i] = totalCapex > 0 ? ((totalNet - totalCapex) / totalCapex) * 100 : 0;

    if ((i + 1) % progressEvery === 0) {
      const progress: MCWorkerProgress = { type: "progress", done: i + 1, total: iterations };
      ctx.postMessage(progress);
    }
  }

  // In-place sort
  rois.sort();

  const result: MCWorkerResult = {
    type: "result",
    rois,
    elapsedMs: performance.now() - t0,
  };
  ctx.postMessage(result, [rois.buffer]);

};

export {};
