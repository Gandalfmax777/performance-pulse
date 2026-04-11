import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Flame, TrendingUp, Clock, Crown, CalendarOff } from "lucide-react";
import { startOfWeek, addDays, format } from "date-fns";
import { type Assessor } from "@/types/assessor";
import PomodoroTimer from "./PomodoroTimer";
import RegistrationPanel from "./RegistrationPanel";
import { useDailyRanking } from "@/hooks/useRankings";
import { useActivities, type ApiActivity, type ApiActivityKpi } from "@/hooks/useActivities";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";

/**
 * Labels Pt-BR pros 5 dias úteis. dayOfWeek 1=segunda ... 5=sexta
 * (matching o backend que usa o mesmo encoding).
 */
const DAY_LABELS: Record<number, { label: string; short: string }> = {
  1: { label: "Segunda", short: "SEG" },
  2: { label: "Terça",   short: "TER" },
  3: { label: "Quarta",  short: "QUA" },
  4: { label: "Quinta",  short: "QUI" },
  5: { label: "Sexta",   short: "SEX" },
};

const LEVEL_COLORS = {
  gold:   "text-gold border-gold/40 bg-gold/10",
  silver: "text-silver border-silver/40 bg-silver/10",
  bronze: "text-bronze border-bronze/40 bg-bronze/10",
};

interface DayViewProps {
  assessors: Assessor[];
}

const DayView = ({ assessors }: DayViewProps) => {
  // ─── Data e tab ────────────────────────────────────────────────────────────
  const today = new Date();
  const todayDow = today.getDay(); // 0=dom..6=sab
  // defaultTab é o índice (0..4) do dia útil atual (seg=0..sex=4)
  const defaultTab = todayDow >= 1 && todayDow <= 5 ? todayDow - 1 : 0;
  const [activeDay, setActiveDay] = useState(defaultTab);

  // Calcula a data exata do tab selecionado dentro da semana corrente.
  // weekStartsOn:1 = segunda. activeDay 0..4 → seg..sex.
  const weekMonday = useMemo(() => startOfWeek(today, { weekStartsOn: 1 }), [today]);
  const activeDate = useMemo(() => addDays(weekMonday, activeDay), [weekMonday, activeDay]);
  const activeDateString = useMemo(() => format(activeDate, "yyyy-MM-dd"), [activeDate]);

  // ─── Activities do dia (backend resolve biweekly) ──────────────────────────
  const { data: activities, isLoading: activitiesLoading } = useActivities(activeDateString);

  // KPI keys únicos das atividades do dia (collapsa duplicatas como Bloco 1+2)
  const kpiKeysForDay = useMemo(
    () => Array.from(new Set(activities.flatMap((a) => a.kpis.map((k) => k.key)))),
    [activities],
  );

  // Lookup kpiKey → ApiActivityKpi (pra label/target/unit nos KPI breakdowns do ranking)
  const kpiByKey = useMemo(() => {
    const map: Record<string, ApiActivityKpi> = {};
    for (const act of activities) {
      for (const k of act.kpis) {
        map[k.key] ??= k;
      }
    }
    return map;
  }, [activities]);

  // ─── Ranking diário ────────────────────────────────────────────────────────
  const { data: dailyRanking } = useDailyRanking();

  const sorted = (dailyRanking?.rankings ?? [])
    .map((r) => {
      const a = assessors.find((x) => x.id === r.assessor.id);
      if (!a) return null;
      return {
        assessor: a,
        dayScore: r.rollup.points,
        dayPct: r.rollup.weeklyGoalPercent,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const dayLabel = DAY_LABELS[activeDay + 1].label;

  return (
    <div className="space-y-4">
      {/* Tabs dos 5 dias úteis */}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((dow) => {
          const i = dow - 1;
          const lbl = DAY_LABELS[dow];
          return (
            <button
              key={dow}
              onClick={() => setActiveDay(i)}
              className={`relative px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeDay === i
                  ? "gradient-primary text-primary-foreground glow-primary"
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-border/30"
              }`}
            >
              <span className="hidden md:inline">{lbl.label}</span>
              <span className="md:hidden">{lbl.short}</span>
              {i === defaultTab && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeDateString}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-12 gap-4"
        >
          {/* ─── Schedule panel (esquerda) ─────────────────────────────────── */}
          <div className="col-span-3 space-y-4">
            <div className="card-glass rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold text-foreground">Atividades – {dayLabel}</h2>
              </div>

              {activitiesLoading ? (
                <p className="text-xs text-muted-foreground">Carregando…</p>
              ) : activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <CalendarOff className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-xs text-center">Nenhuma atividade ativa hoje.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.map((act: ApiActivity) => (
                    <div key={act.id} className="p-3 rounded-lg bg-muted/20 border border-border/30">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">{act.name}</p>
                        {act.cadenceType === "BIWEEKLY" && (
                          <span className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/30 rounded px-1.5 py-0.5 whitespace-nowrap">
                            QUINZENAL
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="text-xs font-mono text-primary">
                          {act.startTime}–{act.endTime}
                        </span>
                      </div>
                      <div className="mt-1.5 space-y-0.5">
                        {act.kpis.map((k) => (
                          <p key={k.kpiId} className="text-xs text-muted-foreground">
                            Meta: {k.target}
                            {k.unit} {k.label}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <PomodoroTimer />
          </div>

          {/* ─── Ranking (centro) ──────────────────────────────────────────── */}
          <div className="col-span-4">
            <div className="card-glass rounded-xl p-5 h-full">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Ranking – {dayLabel}</h2>
              </div>
              <div className="space-y-3">
                {sorted.map((row, i) => {
                  const a = row.assessor;
                  const dayScore = row.dayScore;
                  const avgPct = Math.min(100, row.dayPct);
                  return (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className={`p-3.5 rounded-xl border transition-all ${
                        i === 0
                          ? "bg-primary/10 border-primary/30 glow-primary"
                          : i === 1
                          ? "bg-silver/5 border-silver/20"
                          : i === 2
                          ? "bg-bronze/5 border-bronze/20"
                          : "border-border/30 bg-muted/10"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-sm ${
                            i === 0
                              ? "bg-primary/20 text-primary"
                              : i === 1
                              ? "bg-silver/15 text-silver"
                              : i === 2
                              ? "bg-bronze/15 text-bronze"
                              : "bg-muted/30 text-muted-foreground"
                          }`}
                        >
                          {i === 0 ? <Crown className="w-5 h-5" /> : `#${i + 1}`}
                        </div>
                        <AssessorAvatar initials={a.avatar} photoUrl={a.photoUrl} level={a.level} size={40} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm truncate text-foreground">{a.name}</p>
                            {a.streak > 0 && (
                              <span className="flex items-center gap-0.5 text-xs text-chart-orange font-semibold">
                                <Flame className="w-3.5 h-3.5" /> {a.streak}
                              </span>
                            )}
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {dayScore} pts
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                            {kpiKeysForDay.map((kpiKey) => {
                              const val = (a.kpis as Record<string, number>)[kpiKey] ?? 0;
                              const k = kpiByKey[kpiKey];
                              const target = k?.target ?? 1;
                              const unit = k?.unit ?? "";
                              const label = k?.label ?? kpiKey;
                              const pct = Math.min(100, Math.round((val / target) * 100));
                              return (
                                <div key={kpiKey} className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-muted-foreground">{label}:</span>
                                  <span
                                    className={`text-xs font-mono font-bold ${
                                      pct >= 80
                                        ? "text-primary"
                                        : pct >= 50
                                        ? "text-chart-orange"
                                        : "text-destructive"
                                    }`}
                                  >
                                    {val}
                                    {unit}/{target}
                                    {unit}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`flex items-center gap-1 text-sm font-mono font-bold ${
                              avgPct >= 80
                                ? "text-primary"
                                : avgPct >= 50
                                ? "text-chart-orange"
                                : "text-destructive"
                            }`}
                          >
                            <TrendingUp className="w-3.5 h-3.5" /> {avgPct}%
                          </div>
                          <div className="w-20 h-2 bg-muted/40 rounded-full mt-1.5 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${avgPct}%` }}
                              transition={{ duration: 1, delay: i * 0.1 }}
                              className={`h-full rounded-full ${
                                avgPct >= 80 ? "gradient-success" : "gradient-primary"
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ─── Registration (direita) ────────────────────────────────────── */}
          <div className="col-span-5">
            <RegistrationPanel assessors={assessors} kpiKeys={kpiKeysForDay} />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default DayView;
