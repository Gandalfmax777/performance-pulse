import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

/**
 * Shapes vindos do backend (espelha routes/rankings.ts).
 */
export interface ApiRollup {
  points: number;
  weeklyGoalPercent: number;
  streak: number;
  kpiTotals: Record<string, number>;
  activeDays: string[];
}

export interface ApiRankingEntry {
  assessor: {
    id: string;
    name: string;
    initials: string;
    photoUrl: string | null;
    level: "BRONZE" | "SILVER" | "GOLD";
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
