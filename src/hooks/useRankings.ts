import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import type { LevelSlug } from "@/lib/levelMeta";

/**
 * Shapes vindos do backend (espelha routes/rankings.ts).
 */
export interface ApiRollup {
  points: number;
  weeklyGoalPercent: number;
  streak: number;
  /** Soma de rawValue por kpi.key. Use pra contagens absolutas (Leads, Ligações...). */
  kpiTotals: Record<string, number>;
  /**
   * Percentual médio (0-100) por kpi.key. Use pra exibir % de KPIs com modo
   * QUANTITY_OVER_BASE/PERCENT (Cadência) — não faz sentido somar rawValue ali.
   * Adicionado em 2026-05-07.
   */
  kpiPercents: Record<string, number>;
  activeDays: string[];
}

export interface ApiRankingEntry {
  assessor: {
    id: string;
    name: string;
    initials: string;
    photoUrl: string | null;
    /**
     * Nível REAL — pode ser qualquer dos 13 valores (3 legacy + 10 da P3).
     * Componentes legados que esperam só 3 devem usar `toLegacyLevel(level)`
     * de @/lib/levelMeta. Componentes novos (LevelBadge) usam direto.
     */
    level: LevelSlug;
  };
  rollup: ApiRollup;
}

export interface ApiDailyRanking {
  date: string;
  rankings: ApiRankingEntry[];
}

export interface ApiWeeklyRanking {
  weekStart: string;
  weekEnd: string;
  rankings: ApiRankingEntry[];
}

/** Retornado por /monthly e /semester (mesmo shape genérico). */
export interface ApiPeriodRanking {
  periodStart: string;
  periodEnd: string;
  rankings: ApiRankingEntry[];
}

const QUERY_KEY = ["rankings"] as const;

/**
 * Ranking diário com polling automático a cada 5s. Quando o gestor digita uma
 * métrica em outra tab/sessão, esta query pega a atualização sem refresh.
 *
 * Polling vai virar SSE na Fase 10 (TV mode dramático).
 */
export function useDailyRanking(date?: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, "daily", date ?? "today"],
    queryFn: () => {
      const qs = date ? `?date=${date}` : "";
      return apiFetch<ApiDailyRanking>(`/rankings/daily${qs}`);
    },
    refetchInterval: 5_000,
    staleTime: 4_000,
  });
}

/**
 * Ranking semanal — refresh menos frequente (15s) já que muda mais devagar.
 */
export function useWeeklyRanking(weekStart?: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, "weekly", weekStart ?? "current"],
    queryFn: () => {
      const qs = weekStart ? `?weekStart=${weekStart}` : "";
      return apiFetch<ApiWeeklyRanking>(`/rankings/weekly${qs}`);
    },
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
}

/**
 * Ranking mensal — endpoint dedicado (antes era fallback no overview).
 * Refresh 30s já que a granularidade é maior.
 */
export function useMonthlyRanking(monthStart?: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, "monthly", monthStart ?? "current"],
    queryFn: () => {
      const qs = monthStart ? `?monthStart=${monthStart}` : "";
      return apiFetch<ApiPeriodRanking>(`/rankings/monthly${qs}`);
    },
    refetchInterval: 30_000,
    staleTime: 20_000,
  });
}

/**
 * Ranking semestral (jan-jun ou jul-dez). Refresh 60s.
 */
export function useSemesterRanking(semesterStart?: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, "semester", semesterStart ?? "current"],
    queryFn: () => {
      const qs = semesterStart ? `?semesterStart=${semesterStart}` : "";
      return apiFetch<ApiPeriodRanking>(`/rankings/semester${qs}`);
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
