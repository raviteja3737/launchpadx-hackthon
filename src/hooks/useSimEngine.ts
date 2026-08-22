import { useEffect } from "react";
import { useSimulationStore } from "@/stores/simulationStore";

export function useSimEngine() {
  const startEngine = useSimulationStore((s) => s.startEngine);
  useEffect(() => {
    startEngine();
  }, [startEngine]);
}

export function useHydrated() {
  return typeof window !== "undefined";
}
