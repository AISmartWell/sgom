import { useState, useEffect, useCallback } from "react";

export type SimulationStatus = "ready" | "running" | "paused" | "completed";

export interface SimulationMetrics {
  depth: number;
  pressure: number;
  flowRate: number;
  cutSpeed: number;
  slotsCut: number;
  progress: number;
}

export interface SPTSimulationState {
  status: SimulationStatus;
  metrics: SimulationMetrics;
  targetDepth: number;
  elapsedTime: number;
}

const INITIAL_METRICS: SimulationMetrics = {
  depth: 0,
  pressure: 0,
  flowRate: 0,
  cutSpeed: 0,
  slotsCut: 0,
  progress: 0,
};

export function useSPTSimulation(targetDepth: number = 4000) {
  const [state, setState] = useState<SPTSimulationState>({
    status: "ready",
    metrics: INITIAL_METRICS,
    targetDepth,
    elapsedTime: 0,
  });

  const start = useCallback(() => {
    setState((prev) => ({
      ...prev,
      status: "running",
      metrics: { ...INITIAL_METRICS },
      elapsedTime: 0,
    }));
  }, []);

  const pause = useCallback(() => {
    setState((prev) => ({
      ...prev,
      status: prev.status === "running" ? "paused" : prev.status,
    }));
  }, []);

  const resume = useCallback(() => {
    setState((prev) => ({
      ...prev,
      status: prev.status === "paused" ? "running" : prev.status,
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      status: "ready",
      metrics: INITIAL_METRICS,
      targetDepth,
      elapsedTime: 0,
    });
  }, [targetDepth]);

  const stop = useCallback(() => {
    setState((prev) => ({
      ...prev,
      status: "completed",
    }));
  }, []);

  useEffect(() => {
    if (state.status !== "running") return;

    const interval = setInterval(() => {
      setState((prev) => {
        const newProgress = Math.min(prev.metrics.progress + 0.5, 100);
        const newDepth = Math.round((newProgress / 100) * prev.targetDepth);
        
        // Simulate realistic fluctuating values
        const basePressure = 2500 + (newProgress / 100) * 1000;
        const baseFlowRate = 45 + (newProgress / 100) * 30;
        const baseCutSpeed = 8 + Math.random() * 4;
        
        const newMetrics: SimulationMetrics = {
          depth: newDepth,
          pressure: Math.round(basePressure + (Math.random() - 0.5) * 200),
          flowRate: Math.round(baseFlowRate + (Math.random() - 0.5) * 10),
          cutSpeed: Math.round(baseCutSpeed * 10) / 10,
          slotsCut: Math.floor(newProgress / 10),
          progress: newProgress,
        };

        const isCompleted = newProgress >= 100;

        return {
          ...prev,
          status: isCompleted ? "completed" : "running",
          metrics: newMetrics,
          elapsedTime: prev.elapsedTime + 100,
        };
      });
    }, 100);

    return () => clearInterval(interval);
  }, [state.status]);

  return {
    ...state,
    start,
    pause,
    resume,
    reset,
    stop,
  };
}
