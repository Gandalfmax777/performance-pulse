import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

/**
 * Shape vindo do backend (espelha o serializer de routes/kpis.ts).
 */
export interface ApiKpi {
  id: string;
  key: string;
  label: string;
  unit: string;
  inputMode: "ABSOLUTE" | "PERCENT" | "QUANTITY_OVER_BASE";
  baseSource: string | null;
  defaultTarget: number;
  isDerived: boolean;
  derivedFormula: string | null;
  sortOrder: number;
  active: boolean;
  activeGoal: {
    id: string;
    value: number;
    period: "DAILY" | "WEEKLY" | "MONTHLY";
    validFrom: string;
    validTo: string | null;
  } | null;
}

/**
 * Shape simplificado pros componentes da Overview — label, target efetivo, unit.
 * O target efetivo é a goal ativa (se houver) senão o defaultTarget.
 */
export interface KpiSummary {
  id: string;
  key: string;
  label: string;
  target: number;
  unit: string;
}

const QUERY_KEY = ["kpis"] as const;

interface UseKpisResult {
  kpis: KpiSummary[];
  isLoading: boolean;
}

export function useKpis(): UseKpisResult {
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => apiFetch<ApiKpi[]>("/kpis?active=true"),
    staleTime: 60_000,
  });

  const kpis: KpiSummary[] = (query.data ?? [])
    .filter((k) => !k.isDerived)
    .map((k) => ({
      id: k.id,
      key: k.key,
      label: k.label,
      target: k.activeGoal?.value ?? k.defaultTarget,
      unit: k.unit,
    }));

  return { kpis, isLoading: query.isLoading };
}
