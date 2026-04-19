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
      // Histórico também invalida — entrada nova pode ter aparecido.
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEY, variables.assessorId, "history"],
      });
    },
  });
}

// ─── Team insight ────────────────────────────────────────────────────────────

/**
 * Gera insight de IA pro time inteiro. Usado no KpiAnalytics.
 */
export function useGenerateTeamInsight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      period,
      force,
    }: {
      period?: InsightPeriod;
      force?: boolean;
    }) =>
      apiFetch<ApiInsight>("/insights/team", {
        method: "POST",
        body: { period: period ?? "WEEK", force },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, "team"] });
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, "team", "history"] });
    },
  });
}

// ─── History endpoints ──────────────────────────────────────────────────────

export interface ApiInsightHistoryItem {
  id: string;
  textMarkdown: string;
  summary: string;
  tags: string[];
  model: string;
  periodKind: InsightPeriod;
  periodKey: string;
  createdAt: string;
}

interface HistoryResponse {
  items: ApiInsightHistoryItem[];
}

/**
 * Histórico de insights de um assessor (cronológico desc). Filtra por
 * periodKind se passado. Limit max 50, default 10.
 */
export function useAssessorInsightHistory(
  assessorId: string | undefined,
  periodKind?: InsightPeriod,
  limit = 10,
) {
  return useQuery({
    queryKey: [...QUERY_KEY, assessorId, "history", periodKind ?? "all", limit],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (periodKind) qs.set("periodKind", periodKind);
      qs.set("limit", String(limit));
      return apiFetch<HistoryResponse>(`/insights/assessor/${assessorId}/history?${qs}`);
    },
    enabled: Boolean(assessorId),
    staleTime: 5 * 60_000,
  });
}

/**
 * Histórico de insights do TIME inteiro.
 */
export function useTeamInsightHistory(periodKind?: InsightPeriod, limit = 10) {
  return useQuery({
    queryKey: [...QUERY_KEY, "team", "history", periodKind ?? "all", limit],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (periodKind) qs.set("periodKind", periodKind);
      qs.set("limit", String(limit));
      return apiFetch<HistoryResponse>(`/insights/team/history?${qs}`);
    },
    staleTime: 5 * 60_000,
  });
}
