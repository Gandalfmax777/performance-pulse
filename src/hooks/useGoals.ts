import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

/**
 * Shape vindo do backend (espelha routes/goals.ts).
 */
export interface ApiGoal {
  id: string;
  kpiId: string;
  value: number;
  period: "DAILY" | "WEEKLY" | "MONTHLY";
  validFrom: string;
  validTo: string | null;
  appliesRetroactively: boolean;
  createdById: string;
  createdAt: string;
}

export interface CreateGoalInput {
  kpiId: string;
  value: number;
  period: "DAILY" | "WEEKLY" | "MONTHLY";
  validFrom?: string;
  appliesRetroactively?: boolean;
}

const QUERY_KEY = ["goals"] as const;

/**
 * Lista goals (histórico) opcionalmente filtrado por kpiId.
 * Útil pra UI admin da Fase 8 mostrar o histórico de mudanças de meta.
 */
export function useGoals(filters: { kpiId?: string } = {}) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.kpiId) params.set("kpiId", filters.kpiId);
      const qs = params.toString();
      return apiFetch<ApiGoal[]>(`/goals${qs ? `?${qs}` : ""}`);
    },
    staleTime: 30_000,
  });
}

/**
 * Mutation pra criar uma nova goal. Backend fecha automaticamente a anterior.
 * Invalida tanto a lista de goals quanto a lista de kpis (que embute activeGoal).
 */
export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGoalInput) =>
      apiFetch<ApiGoal>("/goals", { method: "POST", body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["kpis"] });
    },
  });
}
