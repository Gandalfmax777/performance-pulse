import { useMemo } from "react";
import { motion } from "framer-motion";
import { Users, PhoneCall, CalendarCheck, Gift, FileText, Zap, type LucideIcon } from "lucide-react";
import { useKpis } from "@/hooks/useKpis";
import { useWeeklyRanking } from "@/hooks/useRankings";

/**
 * Mapa estável icone+cor por KPI key. O backend é fonte da label e do target;
 * o frontend só decora visualmente.
 */
const KPI_VISUALS: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  leads:      { icon: Users,         color: "text-primary",       bg: "bg-primary/10" },
  cadencia:   { icon: Zap,           color: "text-eqi-mint",     bg: "bg-eqi-mint/10" },
  ligacoes:   { icon: PhoneCall,     color: "text-chart-blue",   bg: "bg-chart-blue/10" },
  reunioes:   { icon: CalendarCheck, color: "text-chart-purple", bg: "bg-chart-purple/10" },
  indicacoes: { icon: Gift,          color: "text-chart-orange", bg: "bg-chart-orange/10" },
  boletos:    { icon: FileText,      color: "text-gold",         bg: "bg-gold/10" },
};

const FALLBACK_VISUAL = { icon: FileText, color: "text-foreground", bg: "bg-muted/30" };

const KpiCards = () => {
  const { kpis } = useKpis();
  const { data: weeklyRanking } = useWeeklyRanking();

  // Número de assessores ativos (pra escalar o target pro time todo)
  const teamSize = weeklyRanking?.rankings.length ?? 1;

  /** Agrega kpiTotals do ranking semanal: soma de rawValue por kpi.key. */
  const aggregatedValues = useMemo(() => {
    const map: Record<string, number> = {};
    if (!weeklyRanking) return map;
    for (const r of weeklyRanking.rankings) {
      for (const [k, v] of Object.entries(r.rollup.kpiTotals)) {
        map[k] = (map[k] ?? 0) + v;
      }
    }
    return map;
  }, [weeklyRanking]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.slice(0, 6).map((kpi, i) => {
        const visual = KPI_VISUALS[kpi.key] ?? FALLBACK_VISUAL;
        const Icon = visual.icon;
        const value = aggregatedValues[kpi.key] ?? 0;
        // Target escalado: meta individual × nº de assessores = meta do time
        const teamTarget = (kpi.target || 1) * teamSize;
        const pct = Math.min(100, Math.round((value / teamTarget) * 100));

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
                {value}
                {kpi.unit}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{kpi.label}</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1.2, delay: i * 0.1 }}
                  className={`h-full rounded-full ${pct >= 80 ? "gradient-success" : "gradient-primary"}`}
                />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                {value}/{teamTarget}
              </span>
            </div>
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
