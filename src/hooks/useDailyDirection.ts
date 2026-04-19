import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

export type DirectionPeriod = "DAILY" | "WEEKLY" | "MONTHLY";
export type DirectionStatus = "PENDING" | "ACHIEVED" | "PARTIAL" | "MISSED";

export interface ApiDailyDirection {
  id: string;
  date: string;
  text: string;
  // Sprint B (Felipe): foco com período + cumprimento
  period: DirectionPeriod;
  periodStart: string | null;
  periodEnd: string | null;
  targetKpiKeys: string[];
  status: DirectionStatus;
  reviewNote: string | null;
  reviewedAt: string | null;
  reviewedById: string | null;
  reviewedByName: string | null;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface KpiCompliance {
  kpiKey: string;
  realized: number;
  baseline: number;
  deltaPct: number | null;
}

export interface ApiDirectionWithCompliance extends ApiDailyDirection {
  compliance: KpiCompliance[];
}

export interface UpsertDirectionInput {
  text: string;
  period?: DirectionPeriod;
  periodStart?: string;
  periodEnd?: string;
  targetKpiKeys?: string[];
}

const queryKey = (date: string) => ["direction", date] as const;
const complianceKey = (params: object) => ["direction", "compliance", params] as const;

/** Busca direcionamento da data. Retorna null se não houver (204). */
export function useDailyDirection(date: string) {
  return useQuery({
    queryKey: queryKey(date),
    queryFn: () => apiFetch<ApiDailyDirection | null>(`/directions/${date}`),
    staleTime: 30_000,
    retry: false,
  });
}

/**
 * Salva (upsert) direcionamento da data.
 * Aceita string (compat antiga) OU objeto com período + KPIs alvo.
 */
export function useUpsertDailyDirection(date: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: string | UpsertDirectionInput) => {
      const body: UpsertDirectionInput =
        typeof input === "string" ? { text: input } : input;
      return apiFetch<ApiDailyDirection | null>(`/directions/${date}`, {
        method: "PUT",
        body,
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey(date), data);
      queryClient.invalidateQueries({ queryKey: ["direction", "compliance"] });
    },
  });
}

/**
 * Marca status de cumprimento (admin review).
 */
export function useReviewDirection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reviewNote }: { id: string; status: DirectionStatus; reviewNote?: string }) =>
      apiFetch<ApiDailyDirection>(`/directions/${id}/review`, {
        method: "PATCH",
        body: { status, reviewNote },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["direction"] });
    },
  });
}

/**
 * Lista de directions com cumprimento medido (delta vs período anterior).
 */
export function useDirectionCompliance(params: { from?: string; to?: string; period?: DirectionPeriod; limit?: number } = {}) {
  return useQuery({
    queryKey: complianceKey(params),
    queryFn: () => {
      const qs = new URLSearchParams();
      if (params.from) qs.set("from", params.from);
      if (params.to) qs.set("to", params.to);
      if (params.period) qs.set("period", params.period);
      qs.set("limit", String(params.limit ?? 20));
      return apiFetch<ApiDirectionWithCompliance[]>(`/directions/compliance?${qs}`);
    },
    staleTime: 60_000,
  });
}
