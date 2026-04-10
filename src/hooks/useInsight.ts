import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

export type InsightPeriod = "DAY" | "WEEK" | "MONTH";

export interface ApiInsight {
  id: string;
  textMarkdown: string;
  summary: string;
  tags: string[];
  model: string;
  cached: boolean;
  createdAt: string;
}

const QUERY_KEY = ["insights"] as const;

/**
 * Lê o insight mais recente do cache (GET). Retorna undefined se não houver.
 * staleTime longo (5 min) porque insights não mudam frequentemente.
 */
export function useInsight(assessorId: string | undefined, period: InsightPeriod = "WEEK") {
  return useQuery({
    queryKey: [...QUERY_KEY, assessorId, period],
    queryFn: () =>
      apiFetch<ApiInsight>(`/insights/assessor/${assessorId}?period=${period}`).catch(() => null),
    enabled: Boolean(assessorId),
    staleTime: 5 * 60_000,
    retry: false,
  });
}

/**
 * Mutation pra gerar (ou forçar regeneração) de insight. Invalida o cache query.
 */
export function useGenerateInsight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      assessorId,
      period,
      force,
    }: {
      assessorId: string;
      period?: InsightPeriod;
      force?: boolean;
    }) =>
      apiFetch<ApiInsight>(`/insights/assessor/${assessorId}`, {
        method: "POST",
        body: { period: period ?? "WEEK", force },
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEY, variables.assessorId],
      });
    },
  });
}
