import { useMemo } from "react";
import { differenceInDays, format, parseISO, subDays } from "date-fns";
import { Fire } from "@phosphor-icons/react";
import { KpiTile, StatDelta } from "@/components/shared";
import { useOverviewReport } from "@/hooks/useReports";
import { useWeeklyRanking } from "@/hooks/useRankings";

interface HeroMetricStripProps {
  from: string;
  to: string;
}

/**
 * Hero KPI strip — 3 cards seguindo `Dashboard.html` do design:
 *
 *   1. Total de pontos · time   (accent — primeiro card destacado)
 *   2. Meta atingida · média    (% agregado)
 *   3. Streak · time            (maior streak ativo + flame icon)
 *
 * Cada card é um `KpiTile size="lg"` com label, valor display 36px,
 * trailing StatDelta (vs período anterior), sub line e progress bar.
 *
 * Fontes:
 *   - useWeeklyRanking → totalPoints + maior streak
 *   - useOverviewReport (current + previous range) → meta % agregada e
 *     deltas vs período anterior.
 */
const HeroMetricStrip = ({ from, to }: HeroMetricStripProps) => {
  const previousRange = useMemo(() => {
    const days = differenceInDays(parseISO(to), parseISO(from)) + 1;
    return {
      from: format(subDays(parseISO(from), days), "yyyy-MM-dd"),
      to: format(subDays(parseISO(to), days), "yyyy-MM-dd"),
    };
  }, [from, to]);

  const { data: overview } = useOverviewReport({ from, to });
  const { data: previousOverview } = useOverviewReport(previousRange);
  const { data: weekly } = useWeeklyRanking();

  const totalPoints = useMemo(
    () => weekly?.rankings?.reduce((s, r) => s + (r.rollup.points || 0), 0) ?? 0,
    [weekly],
  );
  const totalPointsPrev = 0; // backend não fornece pontos da semana anterior aqui
  const totalPointsDelta = computeDeltaPct(totalPoints, totalPointsPrev);

  const aggPct = overview?.byKpi?.length
    ? Math.round(
        overview.byKpi.reduce((s, k) => s + (k.percent || 0), 0) /
          overview.byKpi.length,
      )
    : 0;
  const aggPrev = previousOverview?.byKpi?.length
    ? Math.round(
        previousOverview.byKpi.reduce((s, k) => s + (k.percent || 0), 0) /
          previousOverview.byKpi.length,
      )
    : 0;
  const aggDelta = computeDeltaPct(aggPct, aggPrev);

  const overGoalCount =
    weekly?.rankings?.filter((r) => (r.rollup.weeklyGoalPercent ?? 0) >= 80)
      .length ?? 0;
  const totalCount = weekly?.rankings?.length ?? 0;

  const maxStreak = weekly?.rankings?.reduce(
    (max, r) => Math.max(max, r.rollup.streak ?? 0),
    0,
  ) ?? 0;
  const leaderName =
    weekly?.rankings?.find((r) => r.rollup.streak === maxStreak)?.assessor.name ?? "—";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. Total de pontos · time */}
      <KpiTile
        accent
        size="lg"
        label="Total de pontos · time"
        value={totalPoints.toLocaleString("pt-BR")}
        trailing={
          totalPointsDelta != null ? (
            <StatDelta direction={totalPointsDelta >= 0 ? "up" : "down"}>
              {totalPointsDelta >= 0 ? "+" : ""}
              {totalPointsDelta}%
            </StatDelta>
          ) : null
        }
        sub={
          totalPointsPrev > 0
            ? `vs ${totalPointsPrev.toLocaleString("pt-BR")} no período anterior`
            : "Sem comparação anterior disponível"
        }
        progress={Math.min(100, Math.round((totalPoints / Math.max(1, totalPoints + 100)) * 100))}
      />

      {/* 2. Meta atingida · média */}
      <KpiTile
        size="lg"
        label="Meta atingida · média"
        value={`${aggPct}%`}
        trailing={
          aggDelta != null ? (
            <StatDelta direction={aggDelta >= 0 ? "up" : "down"}>
              {aggDelta >= 0 ? "+" : ""}
              {aggDelta} pp
            </StatDelta>
          ) : null
        }
        sub={
          totalCount > 0
            ? `${overGoalCount} dos ${totalCount} AAIs acima de 80%`
            : "Sem dados no período"
        }
        progress={Math.min(100, aggPct)}
        progressColor={aggPct >= 100 ? "success" : aggPct >= 80 ? "warning" : "danger"}
      />

      {/* 3. Maior streak ativo */}
      <KpiTile
        size="lg"
        label="Maior streak · time"
        value={maxStreak}
        unit={maxStreak === 1 ? "dia" : "dias"}
        trailing={
          maxStreak > 0 ? (
            <span className="inline-flex items-center gap-1 text-[12px] font-mono font-medium text-[hsl(var(--warning))]">
              <Fire size={14} weight="fill" /> ativo
            </span>
          ) : null
        }
        sub={maxStreak > 0 ? `Líder: ${leaderName}` : "Ninguém em sequência"}
        progress={Math.min(100, (maxStreak / 14) * 100)}
        progressColor="warning"
      />
    </div>
  );
};

function computeDeltaPct(curr: number, prev: number): number | null {
  if (prev <= 0) return null;
  return Math.round(((curr - prev) / prev) * 100);
}

export default HeroMetricStrip;
