import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, TrendingDown, TrendingUp, Flame, Loader2 } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { type Assessor } from "@/types/assessor";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";
import { useOverviewReport } from "@/hooks/useReports";

type Period = "daily" | "weekly" | "monthly" | "semester";

const PERIOD_OPTIONS: Array<{ value: Period; label: string }> = [
  { value: "daily", label: "Diário" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "semester", label: "Semestral" },
];

function computeRange(period: Period): { from: string; to: string } {
  const now = new Date();
  const fmt = (d: Date) => format(d, "yyyy-MM-dd");
  switch (period) {
    case "daily":
      return { from: fmt(now), to: fmt(now) };
    case "weekly":
      return {
        from: fmt(startOfWeek(now, { weekStartsOn: 1 })),
        to: fmt(endOfWeek(now, { weekStartsOn: 1 })),
      };
    case "monthly":
      return { from: fmt(startOfMonth(now)), to: fmt(endOfMonth(now)) };
    case "semester": {
      const month = now.getMonth();
      const semStart = month < 6 ? new Date(now.getFullYear(), 0, 1) : new Date(now.getFullYear(), 6, 1);
      const semEnd = month < 6 ? new Date(now.getFullYear(), 5, 30) : new Date(now.getFullYear(), 11, 31);
      return { from: fmt(semStart), to: fmt(semEnd) };
    }
  }
}

interface DailyResultsProps {
  assessors: Assessor[];
}

const DailyResults = ({ assessors }: DailyResultsProps) => {
  const [period, setPeriod] = useState<Period>("weekly");
  const range = useMemo(() => computeRange(period), [period]);
  const { data: overview, isLoading } = useOverviewReport(range);

  // Ranking derivado do overview (topPerformers já ordenados por points desc)
  const performers = overview
    ? [...overview.topPerformers, ...overview.bottomPerformers]
        .filter((v, i, arr) => arr.findIndex((x) => x.assessorId === v.assessorId) === i) // dedupe
    : [];

  // Matching com assessors pra pegar avatar/level.
  // Usa allPerformers (ranking completo do período selecionado) — antes usava
  // só topPerformers (top 3) e fazia fallback pro dado SEMANAL, misturando períodos.
  const ranked = useMemo(() => {
    if (!overview) return [];
    return [...assessors]
      .map((a) => {
        const perf = overview.allPerformers?.find((p) => p.assessorId === a.id);
        return {
          ...a,
          overviewPoints: perf?.points ?? 0,
          overviewPct: perf?.weeklyGoalPercent ?? 0,
        };
      })
      .sort((a, b) => b.overviewPoints - a.overviewPoints);
  }, [assessors, overview]);

  const top3 = ranked.slice(0, 3);
  const bottom3 = ranked.slice(-3).reverse();
  const podiumOrder = [top3[1], top3[0], top3[2]];
  const podiumHeights = [140, 180, 110];
  const podiumLabels = ["2º", "1º", "3º"];
  const podiumColors = [
    "from-silver/30 to-silver/10 border-silver/40",
    "from-primary/30 to-primary/10 border-primary/40",
    "from-bronze/30 to-bronze/10 border-bronze/40",
  ];
  const podiumTextColors = ["text-silver", "text-primary", "text-bronze"];

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="card-glass rounded-xl p-4 flex items-center gap-3 flex-wrap">
        <Trophy className="w-5 h-5 text-primary" />
        <span className="text-sm font-bold text-foreground">Ranking Geral</span>
        <div className="flex gap-1 bg-muted/20 rounded-lg p-1 ml-auto">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                period === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
      </div>

      {/* Podium */}
      <div className="card-glass rounded-xl p-6">
        <div className="flex items-end justify-center gap-4 pt-8 pb-4">
          {podiumOrder.map((a, i) => {
            if (!a) return null;
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="flex flex-col items-center"
              >
                <AssessorAvatar initials={a.avatar} photoUrl={a.photoUrl} level={a.level} size={56} className="mb-2" />
                <p className="text-sm font-semibold text-foreground mb-1 break-words text-center max-w-[120px]">{a.name}</p>
                <div className="flex items-center gap-1 mb-2">
                  <TrendingUp className="w-3 h-3 text-primary" />
                  <span className="text-sm font-mono font-bold text-primary">{a.overviewPct}%</span>
                </div>
                {a.streak > 0 && (
                  <span className="flex items-center gap-0.5 text-xs text-chart-orange mb-2">
                    <Flame className="w-3 h-3" /> {a.streak} dias
                  </span>
                )}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: podiumHeights[i] }}
                  transition={{ delay: 0.3 + i * 0.15, duration: 0.6 }}
                  className={`w-28 rounded-t-xl bg-gradient-to-t border border-b-0 flex flex-col items-center justify-start pt-4 ${podiumColors[i]}`}
                >
                  <span className={`text-3xl font-black ${podiumTextColors[i]}`}>{podiumLabels[i]}</span>
                  <span className="text-xs text-muted-foreground mt-1 font-mono">{a.overviewPoints} pts</span>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Top 3 + Bottom 3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card-glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Medal className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Top 3</h3>
          </div>
          <div className="space-y-3">
            {top3.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-3 rounded-lg bg-muted/20 border border-border/30"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                  <AssessorAvatar initials={a.avatar} photoUrl={a.photoUrl} level={a.level} size={36} />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-foreground break-words">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{a.overviewPoints} pts • {a.level}</p>
                  </div>
                  <span className="text-lg font-mono font-bold text-primary">{a.overviewPct}%</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="card-glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-4 h-4 text-destructive" />
            <h3 className="text-sm font-bold text-foreground">Piores Resultados</h3>
          </div>
          <div className="space-y-3">
            {bottom3.map((a, i) => {
              const rank = ranked.length - i;
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-3 rounded-lg bg-destructive/5 border border-destructive/20"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-7 h-7 rounded-full bg-destructive/10 flex items-center justify-center text-xs font-mono font-bold text-destructive">
                      #{rank}
                    </span>
                    <AssessorAvatar initials={a.avatar} photoUrl={a.photoUrl} level={a.level} size={36} />
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-foreground break-words">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.overviewPoints} pts</p>
                    </div>
                    <span className="text-lg font-mono font-bold text-destructive">{a.overviewPct}%</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyResults;
