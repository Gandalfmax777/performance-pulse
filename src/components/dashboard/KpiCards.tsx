import { useMemo } from "react";
import { motion } from "framer-motion";
import { Users, PhoneCall, CalendarCheck, Gift, FileText, Zap, Sparkles, Target, Hand, type LucideIcon } from "lucide-react";
import { format, startOfWeek, endOfWeek, differenceInCalendarDays, addDays } from "date-fns";
import { useKpis } from "@/hooks/useKpis";
import { useWeeklyRanking } from "@/hooks/useRankings";
import { useOverviewReport } from "@/hooks/useReports";

const KPI_VISUALS: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  leads:              { icon: Users,         color: "text-primary",      bg: "bg-primary/10" },
  cadencia:           { icon: Zap,           color: "text-eqi-mint",     bg: "bg-eqi-mint/10" },
  ligacoes:           { icon: PhoneCall,     color: "text-chart-blue",   bg: "bg-chart-blue/10" },
  reunioes:           { icon: CalendarCheck, color: "text-chart-purple", bg: "bg-chart-purple/10" },
  reunioes_realizadas:{ icon: CalendarCheck, color: "text-chart-purple", bg: "bg-chart-purple/10" },
  indicacoes:         { icon: Gift,          color: "text-chart-orange", bg: "bg-chart-orange/10" },
  boletos:            { icon: FileText,      color: "text-gold",         bg: "bg-gold/10" },
  touchpoint:         { icon: Hand,          color: "text-chart-blue",   bg: "bg-chart-blue/10" },
  ativacao_conta:     { icon: Sparkles,      color: "text-gold",         bg: "bg-gold/10" },
};

const FALLBACK_VISUAL = { icon: FileText, color: "text-foreground", bg: "bg-muted/30" };

interface KpiCardsProps {
  /** Range opcional (YYYY-MM-DD). Default: semana corrente. */
  from?: string;
  to?: string;
}

const KpiCards = ({ from, to }: KpiCardsProps) => {
  const { kpis } = useKpis();

  // Range default: semana atual (segunda → domingo)
  const now = new Date();
  const defaultFrom = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const defaultTo = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const fromDate = from ?? defaultFrom;
  const toDate = to ?? defaultTo;

  const { data: overview } = useOverviewReport({ from: fromDate, to: toDate });
  // Weekly ranking mantido só pra contar teamSize e fallback
  const { data: weeklyRanking } = useWeeklyRanking();
  const teamSize = weeklyRanking?.rankings.length ?? 1;

  // Projeção: dado realizado até hoje, projeta linearmente até o fim do período.
  // Se já passou todo o período (toDate < hoje), usa o realizado direto.
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
        const visual = KPI_VISUALS[kpi.key] ?? FALLBACK_VISUAL;
        const Icon = visual.icon;
        const byKpi = overview?.byKpi.find((k) => k.key === kpi.key);
        const value = Math.round(byKpi?.actual ?? 0);
        const teamTarget = byKpi?.target ?? (kpi.target || 1) * teamSize;
        const pct = teamTarget > 0 ? Math.min(150, Math.round((value / teamTarget) * 100)) : 0;
        const barWidth = Math.min(100, pct);
        // QOB (cadência, touchpoint): valor big = %, target é o threshold % da lista
        const isQob = kpi.inputMode === "QUANTITY_OVER_BASE";
        const displayValue = isQob ? `${pct}%` : `${value}${kpi.unit}`;
        const displaySub = isQob ? `${value}/${teamTarget} da lista` : `${value}/${teamTarget}`;

        // Projeção linear: se manter o ritmo atual, vai bater X% até o fim
        const projected =
          projection.elapsedDays > 0
            ? Math.round((value / projection.elapsedDays) * projection.totalDays)
            : value;
        const projectedPct = teamTarget > 0 ? Math.round((projected / teamTarget) * 100) : 0;
        const onTrack = projectedPct >= 100;

        return (
          <motion.div
            key={kpi.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="card-glass card-noise rounded-xl p-4 relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`w-9 h-9 rounded-lg ${visual.bg} flex items-center justify-center`}>
                <Icon className={`w-4.5 h-4.5 ${visual.color}`} />
              </div>
              <span className="font-display text-2xl font-bold text-foreground">
                {displayValue}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{kpi.label}</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${barWidth}%` }}
                  transition={{ duration: 1.2, delay: i * 0.1 }}
                  className={`h-full rounded-full ${pct >= 80 ? "bg-success" : "bg-primary"}`}
                />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                {displaySub}
              </span>
            </div>
            {/* Projeção (só se ainda há dias restantes no período) */}
            {projection.remaining > 0 && projection.elapsedDays > 0 && (
              <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono">
                <span className="text-muted-foreground">
                  📈 ~{projected} ({projectedPct}%)
                </span>
                <span className={onTrack ? "text-success" : "text-chart-orange"}>
                  {onTrack ? "✅ no ritmo" : "⚠️ ritmo abaixo"}
                </span>
              </div>
            )}
            <div className="absolute -right-4 -bottom-4 opacity-5">
              <Icon className="w-20 h-20" />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default KpiCards;
