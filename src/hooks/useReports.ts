import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

/**
 * Shapes vindos do backend (espelham routes/reports.ts + services/reports.ts).
 */

export type Granularity = "day" | "week" | "month";

export interface ApiKpiSeriesBucket {
  label: string;
  displayLabel: string;
  start: string;
  end: string;
  value: number;
  target: number;
  percentOfTarget: number;
}

export interface ApiKpiSeriesResponse {
  kpi: { id: string; key: string; label: string; unit: string };
  granularity: Granularity;
  from: string;
  to: string;
  buckets: ApiKpiSeriesBucket[];
  total: number;
  totalTarget: number;
  overallPercent: number;
}

export interface ApiOverviewByKpi {
  kpiId: string;
  key: string;
  label: string;
  unit: string;
  actual: number;
  target: number;
  percent: number;
  series: Array<{ date: string; value: number }>;
}

export interface ApiOverviewPerformer {
  assessorId: string;
  name: string;
  initials: string;
  points: number;
  weeklyGoalPercent: number;
}

export interface ApiOverviewByAssessor {
  assessorId: string;
  /** Somas de rawValue por kpiKey no range (ex: { leads: 12, ligacoes: 45 }) */
  kpis: Record<string, number>;
}

export interface ApiOverviewReport {
  from: string;
  to: string;
  totalMetricEntries: number;
  byKpi: ApiOverviewByKpi[];
  topPerformers: ApiOverviewPerformer[];
  bottomPerformers: ApiOverviewPerformer[];
  allPerformers: ApiOverviewPerformer[];
  /** Breakdown por assessor — pra consistência nos cards que misturam fontes */
  byAssessor: ApiOverviewByAssessor[];
}

export interface ApiAssessorKpiHistory {
  key: string;
  label: string;
  unit: string;
  total: number;
  target: number;
  percentOfTarget: number;
  history: Array<{ date: string; value: number }>;
}

export interface ApiAssessorReport {
  assessor: {
    id: string;
    name: string;
    initials: string;
    photoUrl: string | null;
    level: "BRONZE" | "SILVER" | "GOLD";
  };
  from: string;
  to: string;
  kpis: ApiAssessorKpiHistory[];
  rollup: {
    points: number;
    weeklyGoalPercent: number;
    streak: number;
    kpiTotals: Record<string, number>;
    activeDays: string[];
  };
  badgeUnlocks: Array<{
    id: string;
    badgeId: string;
    slug: string;
    name: string;
    icon: string;
    scope: "INDIVIDUAL" | "SQUAD";
    periodKey: string;
    unlockedAt: string;
  }>;
  observations: Array<{
    date: string;
    notes: string;
    kpiLabel: string;
  }>;
}

export interface ApiFunnelReport {
  from: string;
  to: string;
  ligacoes: number;
  reunioesAgendadas: number;
  reunioesRealizadas: number;
  fechamentos: number;
  perdidas: number;
  conversaoReuniao: number;
  conversaoRealizacao: number;
  conversaoFechamento: number;
  ticketMedio: number;
  ticketTotal: number;
}

export interface ApiActivityFeedItem {
  id: string;
  type: "metric" | "badge_unlock" | "observation" | "meeting" | "meeting_area";
  timestamp: string;
  assessorId: string;
  assessorName: string;
  description: string;
  icon: string;
  /// Sprint C - entry foi registrada em data ≠ hoje (retroativa)
  backfilled?: boolean;
  metricDate?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function toQs(params: Record<string, string | number | undefined>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") usp.set(k, String(v));
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

export function useKpiSeries(params: {
  kpiId: string;
  from?: string;
  to?: string;
  granularity?: Granularity;
  assessorId?: string;
}) {
  return useQuery({
    queryKey: ["reports", "kpi", params],
    queryFn: () =>
      apiFetch<ApiKpiSeriesResponse>(
        `/reports/kpi${toQs({
          kpiId: params.kpiId,
          from: params.from,
          to: params.to,
          granularity: params.granularity ?? "day",
          assessorId: params.assessorId,
        })}`,
      ),
    enabled: Boolean(params.kpiId),
    // staleTime baixo (5s) + refetchInterval 30s = fallback rápido caso
    // SSE (useRankingStream) esteja offline. Quando online, SSE invalida
    // imediatamente; quando offline, garante refresh a cada 30s.
    staleTime: 5_000,
    refetchInterval: 30_000,
  });
}

export function useOverviewReport(
  params: { from?: string; to?: string },
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ["reports", "overview", params],
    queryFn: () =>
      apiFetch<ApiOverviewReport>(
        `/reports/overview${toQs({ from: params.from, to: params.to })}`,
      ),
    // KpiCards + ActivationHighlight dependem disso. SSE invalida em
    // <500ms; fallback 15s caso SSE caia (TV, rede instável).
    staleTime: 3_000,
    refetchInterval: 15_000,
    enabled: options.enabled ?? true,
  });
}

/**
 * Resolve qual período (semana/mês) a TV deve exibir: o que contém a métrica
 * mais recente do tenant. Evita a TV ficar vazia no início da semana (antes do
 * 1º lançamento), caindo na última semana com dados. Rota pública (/tv) —
 * apiFetch injeta `?tenant=` sozinho.
 */
export function useActiveTvPeriod(period: "weekly" | "monthly") {
  return useQuery({
    queryKey: ["reports", "active-period", period],
    queryFn: () =>
      apiFetch<{ from: string; to: string }>(
        `/reports/active-period${toQs({ period })}`,
      ),
    staleTime: 3_000,
    refetchInterval: 30_000,
  });
}

export function useAssessorReport(
  assessorId: string | undefined,
  params: { from?: string; to?: string },
) {
  return useQuery({
    queryKey: ["reports", "assessor", assessorId, params],
    queryFn: () =>
      apiFetch<ApiAssessorReport>(
        `/reports/assessor/${assessorId}${toQs({ from: params.from, to: params.to })}`,
      ),
    enabled: Boolean(assessorId),
    staleTime: 5_000,
    refetchInterval: 30_000,
  });
}

export function useFunnelReport(params: { from?: string; to?: string; assessorId?: string }) {
  return useQuery({
    queryKey: ["reports", "funnel", params],
    queryFn: () =>
      apiFetch<ApiFunnelReport>(
        `/reports/funnel${toQs({
          from: params.from,
          to: params.to,
          assessorId: params.assessorId,
        })}`,
      ),
    staleTime: 5_000,
    refetchInterval: 30_000,
  });
}

export function useActivityFeed(params: { limit?: number; assessorId?: string } = {}) {
  return useQuery({
    queryKey: ["reports", "activity-feed", params],
    queryFn: () =>
      apiFetch<ApiActivityFeedItem[]>(
        `/reports/activity-feed${toQs({
          limit: params.limit ?? 20,
          assessorId: params.assessorId,
        })}`,
      ),
    refetchInterval: 10_000,
    staleTime: 8_000,
  });
}
