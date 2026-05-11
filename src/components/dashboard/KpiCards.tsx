import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Lightning,
  Phone,
  CalendarBlank,
  CheckCircle,
  Sparkle,
  Gift,
  FileText,
  TrendUp,
  TrendDown,
  Warning,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { format, startOfWeek, endOfWeek, differenceInCalendarDays } from "date-fns";
import { useKpis } from "@/hooks/useKpis";
import { useWeeklyRanking } from "@/hooks/useRankings";
import { useOverviewReport } from "@/hooks/useReports";

const KPI_VISUAL: Record<string, PhosphorIcon> = {
  leads: Users,
  cadencia: Lightning,
  ligacoes: Phone,
  reunioes: CalendarBlank,
  reunioes_realizadas: CheckCircle,
  reunioes_ag: CalendarBlank,
  reunioes_real: CheckCircle,
  indicacoes: Gift,
  ativacao: Sparkle,
  ativacao_conta: Sparkle,
};

interface KpiCardsProps {
  /** Range opcional (YYYY-MM-DD). Default: semana corrente. */
  from?: string;
  to?: string;
}

/**
 * Grid de KPIs Editorial V1 — cards com label uppercase, valor grande
 * em mono e barra de progresso fina. Verde EQI quando bate meta,
 * dourado quando acima de 100%, ink no resto. Versão "trading-desk
 * dense" do artboard de KPIs.
 */
const KpiCards = ({ from, to }: KpiCardsProps) => {
  const { kpis } = useKpis();

  const now = new Date();
  const defaultFrom = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const defaultTo = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const fromDate = from ?? defaultFrom;
  const toDate = to ?? defaultTo;

  const { data: overview } = useOverviewReport({ from: fromDate, to: toDate });
  const { data: weeklyRanking } = useWeeklyRanking();
  const teamSize = weeklyRanking?.rankings.length ?? 1;

  const projection = useMemo(() => {
    const start = new Date(`${fromDate}T00:00:00.000Z`);
    const end = new Date(`${toDate}T00:00:00.000Z`);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const totalDays = Math.max(1, differenceInCalendarDays(end, start) + 1);
    const elapsedDays = Math.max(
      1,
      Math.min(totalDays, differenceInCalendarDays(today, start) + 1),
    );
    const remaining = Math.max(0, differenceInCalendarDays(end, today));
    return { totalDays, elapsedDays, remaining };
  }, [fromDate, toDate]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((kpi, i) => {
        const Icon = KPI_VISUAL[kpi.key] ?? FileText;
        const byKpi = overview?.byKpi.find((k) => k.key === kpi.key);
        const value = Math.round(byKpi?.actual ?? 0);
        const teamTarget = byKpi?.target ?? (kpi.target || 1) * teamSize;
        const isQob = kpi.inputMode === "QUANTITY_OVER_BASE";
        const pct = isQob
          ? Math.min(150, Math.round(byKpi?.percent ?? 0))
          : teamTarget > 0
          ? Math.min(150, Math.round((value / teamTarget) * 100))
          : 0;
        const barWidth = Math.min(100, pct);
        const displayValue = isQob ? `${pct}%` : `${value}${kpi.unit}`;
        const displaySub = isQob ? `meta ${teamTarget}%` : `meta ${teamTarget}`;

        const projected =
          projection.elapsedDays > 0
            ? Math.round((value / projection.elapsedDays) * projection.totalDays)
            : value;
        const projectedPct = teamTarget > 0 ? Math.round((projected / teamTarget) * 100) : 0;
        const onTrack = projectedPct >= 100;

        const valueColor =
          pct >= 100 ? "hsl(var(--brand-primary))" : "hsl(var(--ink))";
        const barColor =
          pct >= 100
            ? "hsl(var(--success))"
            : pct >= 70
            ? "hsl(var(--ink-2))"
            : "hsl(var(--gold))";

        return (
          <motion.div
            key={kpi.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-[14px] border border-line bg-card p-4 relative overflow-hidden"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="inline-flex items-center gap-2 text-ink-2">
                <Icon size={13} className="text-ink-3" />
                <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-ink-3">
                  {kpi.label}
                </p>
              </div>
              {byKpi && (
                <span className="font-mono text-[11px] font-bold text-ink-3 inline-flex items-center gap-0.5">
                  {pct >= 100 ? (
                    <TrendUp size={11} weight="bold" className="text-success" />
                  ) : (
                    <TrendDown size={11} weight="bold" className="text-ink-3" />
                  )}
                  {pct}%
                </span>
              )}
            </div>

            <p
              className="font-mono font-extrabold leading-none tracking-[-0.03em] mt-3"
              style={{ fontSize: 28, color: valueColor }}
            >
              {displayValue}
            </p>

            <p className="font-mono text-[10px] text-ink-3 mt-1.5 font-semibold">
              {displaySub}
            </p>

            <div className="mt-2.5 h-[3px] rounded-full bg-line overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${barWidth}%` }}
                transition={{ duration: 0.8, delay: i * 0.04 }}
                className="h-full rounded-full"
                style={{ background: barColor }}
              />
            </div>

            {!isQob && projection.remaining > 0 && projection.elapsedDays > 0 && (
              <p className="mt-2 font-mono text-[10px] text-ink-3 font-semibold inline-flex items-center gap-1.5">
                {onTrack ? (
                  <span className="inline-flex items-center gap-1 text-success">
                    <TrendUp size={10} weight="bold" /> ~{projected}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-gold-deep">
                    <Warning size={10} weight="fill" /> ~{projected}
                  </span>
                )}
                <span className="text-ink-4">· proj. ({projectedPct}%)</span>
              </p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default KpiCards;
