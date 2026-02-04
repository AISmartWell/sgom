import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface WellMetrics {
  wellId: string;
  wellName: string;
  production: number; // bbl/day
  pressure: number; // psi
  waterCut: number; // %
  gasRate: number; // mcf/day
  temperature: number; // °F
  status: "active" | "warning" | "critical" | "offline";
  lastUpdated: Date;
}

export interface AggregatedMetrics {
  totalProduction: number;
  avgPressure: number;
  avgWaterCut: number;
  totalGasRate: number;
  activeWells: number;
  warningWells: number;
  criticalWells: number;
}

// Simulated real-time data generator for demo
const generateWellMetrics = (wellId: string, wellName: string, baseValues: Partial<WellMetrics>): WellMetrics => {
  const variance = (value: number, range: number) => value + (Math.random() - 0.5) * range;
  
  const production = variance(baseValues.production || 150, 20);
  const waterCut = Math.max(0, Math.min(100, variance(baseValues.waterCut || 25, 5)));
  const pressure = variance(baseValues.pressure || 2500, 100);
  
  let status: WellMetrics["status"] = "active";
  if (waterCut > 50 || production < 50) status = "critical";
  else if (waterCut > 35 || production < 80) status = "warning";
  
  return {
    wellId,
    wellName,
    production: Math.round(production * 10) / 10,
    pressure: Math.round(pressure),
    waterCut: Math.round(waterCut * 10) / 10,
    gasRate: Math.round(variance(baseValues.gasRate || 450, 50)),
    temperature: Math.round(variance(baseValues.temperature || 185, 10)),
    status,
    lastUpdated: new Date(),
  };
};

// Demo wells configuration
const DEMO_WELLS = [
  { id: "W-001", name: "Permian Basin #1", production: 180, pressure: 2800, waterCut: 18, gasRate: 520, temperature: 190 },
  { id: "W-002", name: "Anadarko #7", production: 145, pressure: 2400, waterCut: 28, gasRate: 380, temperature: 175 },
  { id: "W-003", name: "Delaware Basin #3", production: 210, pressure: 3100, waterCut: 15, gasRate: 680, temperature: 195 },
  { id: "W-004", name: "Midland #12", production: 95, pressure: 2100, waterCut: 42, gasRate: 290, temperature: 168 },
  { id: "W-005", name: "SCOOP Play #5", production: 165, pressure: 2650, waterCut: 22, gasRate: 440, temperature: 182 },
  { id: "W-006", name: "STACK #9", production: 125, pressure: 2350, waterCut: 32, gasRate: 350, temperature: 178 },
  { id: "W-007", name: "Eagle Ford #2", production: 55, pressure: 1900, waterCut: 58, gasRate: 180, temperature: 162 },
  { id: "W-008", name: "Woodford #4", production: 190, pressure: 2950, waterCut: 12, gasRate: 590, temperature: 188 },
];

export const useRealtimeMetrics = (updateInterval = 3000) => {
  const [wells, setWells] = useState<WellMetrics[]>([]);
  const [aggregated, setAggregated] = useState<AggregatedMetrics>({
    totalProduction: 0,
    avgPressure: 0,
    avgWaterCut: 0,
    totalGasRate: 0,
    activeWells: 0,
    warningWells: 0,
    criticalWells: 0,
  });
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateMetrics = useCallback(() => {
    const updatedWells = DEMO_WELLS.map(well => 
      generateWellMetrics(well.id, well.name, well)
    );
    
    setWells(updatedWells);
    setLastUpdate(new Date());
    
    // Calculate aggregated metrics
    const activeWells = updatedWells.filter(w => w.status === "active").length;
    const warningWells = updatedWells.filter(w => w.status === "warning").length;
    const criticalWells = updatedWells.filter(w => w.status === "critical").length;
    
    setAggregated({
      totalProduction: Math.round(updatedWells.reduce((sum, w) => sum + w.production, 0)),
      avgPressure: Math.round(updatedWells.reduce((sum, w) => sum + w.pressure, 0) / updatedWells.length),
      avgWaterCut: Math.round(updatedWells.reduce((sum, w) => sum + w.waterCut, 0) / updatedWells.length * 10) / 10,
      totalGasRate: Math.round(updatedWells.reduce((sum, w) => sum + w.gasRate, 0)),
      activeWells,
      warningWells,
      criticalWells,
    });
  }, []);

  const connect = useCallback(() => {
    setIsConnected(true);
    updateMetrics();
    
    intervalRef.current = setInterval(updateMetrics, updateInterval);
  }, [updateMetrics, updateInterval]);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    wells,
    aggregated,
    isConnected,
    lastUpdate,
    connect,
    disconnect,
  };
};
