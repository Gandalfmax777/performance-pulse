import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import type { LevelSlug } from "@/lib/levelMeta";

// ─── Risk Alerts ────────────────────────────────────────────────────────────

export type RiskReason = "pending_penalty" | "below_meta" | "level_drop";

export interface RiskAlert {
  assessorId: string;
  assessorName: string;
  assessorInitials: string;
  photoUrl: string | null;
  reasons: RiskReason[];
  details: {
    pendingPenalties: number;
    weeklyGoalPercent: number | null;
    droppedLevelInLast2Weeks: boolean;
  };
}

export interface RiskAlertsResponse {
  generatedAt: string;
  alerts: RiskAlert[];
}

const RISK_KEY = ["dashboard", "risk-alerts"] as const;

export function useRiskAlerts() {
  return useQuery({
    queryKey: RISK_KEY,
    queryFn: () => apiFetch<RiskAlertsResponse>("/dashboard/risk-alerts"),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000, // 5 min
  });
}

// ─── Evolution ──────────────────────────────────────────────────────────────

export interface AssessorEvolution {
  assessorId: string;
  assessorName: string;
  assessorInitials: string;
  photoUrl: string | null;
  pointsCurrentWeek: number;
  pointsPreviousWeek: number;
  deltaPercent: number | null;
  trend: Array<{ weekStart: string; points: number }>;
}

export interface EvolutionResponse {
  generatedAt: string;
  assessors: AssessorEvolution[];
}

const EVO_KEY = ["dashboard", "evolution"] as const;

export function useEvolution(trendWeeks = 8) {
  return useQuery({
    queryKey: [...EVO_KEY, trendWeeks],
    queryFn: () =>
      apiFetch<EvolutionResponse>(`/dashboard/evolution?trendWeeks=${trendWeeks}`),
    staleTime: 60_000,
    refetchInterval: 2 * 60_000,
  });
}

// ─── Quarterly Ranking ──────────────────────────────────────────────────────

export interface QuarterlyRankingResponse {
  periodStart: string;
  periodEnd: string;
  rankings: Array<{
    assessor: {
      id: string;
      name: string;
      initials: string;
      photoUrl: string | null;
      level: LevelSlug;
    };
    rollup: {
      points: number;
      weeklyGoalPercent: number;
      streak: number;
      kpiTotals: Record<string, number>;
      kpiPercents: Record<string, number>;
      activeDays: string[];
      penaltyPoints: number;
      penaltyDays: number;
    };
  }>;
}

const QUARTERLY_KEY = ["rankings", "quarterly"] as const;

interface QuarterlyOptions {
  start?: string;
  /** Se false, query fica desabilitada (não dispara fetch). Default true. */
  enabled?: boolean;
}

export function useQuarterlyRanking(opts?: QuarterlyOptions | string) {
  // Backwards-compat: signature antiga aceitava `quarterStart?: string`.
  const config = typeof opts === "string" ? { start: opts } : opts ?? {};
  return useQuery({
    queryKey: [...QUARTERLY_KEY, config.start ?? "current"],
    queryFn: () => {
      const qs = config.start ? `?quarterStart=${config.start}` : "";
      return apiFetch<QuarterlyRankingResponse>(`/rankings/quarterly${qs}`);
    },
    enabled: config.enabled ?? true,
    refetchInterval: 5 * 60_000,
    staleTime: 60_000,
  });
}
