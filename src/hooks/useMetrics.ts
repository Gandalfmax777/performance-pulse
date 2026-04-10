import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

/**
 * Shape vindo do backend (espelha routes/metrics.ts).
 */
export interface ApiMetric {
  id: string;
  assessorId: string;
  kpiId: string;
  kpiKey: string;
  activityId: string | null;
  date: string; // YYYY-MM-DD
  rawValue: number;
  baseValue: number | null;
  convertedPercent: number | null;
  pointsAwarded: number | null;
  enteredById: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertMetricInput {
  assessorId: string;
  kpiKey: string;
  date?: string;
  rawValue: number;
  baseValue?: number;
  notes?: string;
}

const QUERY_KEY = ["metrics"] as const;

/**
 * Lista metric entries com filtros opcionais. Usado por componentes que querem
 * o histórico bruto (não o ranking agregado — pra isso use useDailyRanking).
 */
export function useMetrics(filters: {
  assessorId?: string;
  kpiKey?: string;
  from?: string;
  to?: string;
} = {}) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters],
    queryFn: () => {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(filters)) {
        if (v) params.set(k, v);
      }
      const qs = params.toString();
      return apiFetch<ApiMetric[]>(`/metrics${qs ? `?${qs}` : ""}`);
    },
    staleTime: 5_000,
  });
}

/**
 * Upsert de uma metric entry. Invalida tanto a lista de metrics quanto os
 * rankings (que dependem das entries).
 *
 * Mutation otimista: o caller pode passar `onMutate` adicional via opts.
 */
export function useUpsertMetric() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertMetricInput) =>
      apiFetch<ApiMetric>("/metrics", { method: "POST", body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["rankings"] });
      queryClient.invalidateQueries({ queryKey: ["assessors"] });
    },
  });
}
