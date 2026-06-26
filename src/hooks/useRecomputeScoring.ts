import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

/**
 * Dispara o recálculo de pontos do ranking no backend
 * (`POST /api/admin/scoring/recompute`). Reaplica a regra de pontuação ATUAL
 * sobre o histórico de métricas do tenant — elimina a necessidade de rodar
 * `scripts/recompute-all-points.ts` à mão depois de editar uma ScoringRule.
 *
 * Invalida rankings/reports/metrics/kpis no sucesso pra UI refletir os novos
 * pontos. Idempotente no backend.
 */
export interface RecomputeResult {
  updated: number;
  unchanged: number;
  failed: number;
  total: number;
}

export function useRecomputeScoring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<RecomputeResult>("/admin/scoring/recompute", { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rankings"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      qc.invalidateQueries({ queryKey: ["metrics"] });
      qc.invalidateQueries({ queryKey: ["kpis"] });
    },
  });
}
