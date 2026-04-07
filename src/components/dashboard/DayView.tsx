import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Flame, TrendingUp, CheckCircle2, Clock, Target } from "lucide-react";
import { ASSESSORS, SCHEDULE, type Assessor } from "@/data/mockData";
import PomodoroTimer from "./PomodoroTimer";

const DAYS_CONFIG = [
  {
    key: "segunda",
    label: "Segunda",
    short: "SEG",
    activities: [
      { id: "lista", name: "Geração Lista Prospecção", time: "13:30–14:30", kpi: "Leads", target: 10, field: "leads" as const },
      { id: "cadencia-seg", name: "Cadência de Novos", time: "15:30–16:15", kpi: "% Cadenciada", target: 70, field: "cadencia" as const },
    ],
  },
  {
    key: "terca",
    label: "Terça",
    short: "TER",
    activities: [
      { id: "bloco1", name: "Prospecção Ativa – Bloco 1", time: "10:00–10:45", kpi: "Ligações", target: 15, field: "ligacoes" as const },
      { id: "bloco2", name: "Prospecção Ativa – Bloco 2", time: "15:00–15:45", kpi: "Ligações", target: 15, field: "ligacoes" as const },
    ],
  },
  {
    key: "quarta",
    label: "Quarta",
    short: "QUA",
    activities: [
      { id: "indica", name: "Indica Day", time: "Dia todo", kpi: "Indicações", target: 5, field: "indicacoes" as const },
    ],
  },
  {
    key: "quinta",
    label: "Quinta",
    short: "QUI",
    activities: [
      { id: "cadencia-prod", name: "Cadência c/ Produto", time: "09:45–11:00", kpi: "Touch Points", target: 20, field: "cadencia" as const },
      { id: "boleta", name: "Boleta Day", time: "14:00–17:30", kpi: "Boletos", target: 10, field: "boletos" as const },
    ],
  },
  {
    key: "sexta",
    label: "Sexta",
    short: "SEX",
    activities: [
      { id: "revisao", name: "Revisão & Follow-up", time: "09:00–12:00", kpi: "Cadência", target: 100, field: "cadencia" as const },
    ],
  },
];

type KpiField = keyof Assessor["kpis"];

const LEVEL_COLORS = {
  gold: "text-gold border-gold/30 bg-gold/10",
  silver: "text-silver border-silver/30 bg-silver/10",
  bronze: "text-bronze border-bronze/30 bg-bronze/10",
};

const RANK_STYLES = [
  "gradient-gold glow-gold",
  "bg-silver/20 border-silver/30",
  "bg-bronze/20 border-bronze/30",
];

const DayView = () => {
  const today = new Date().getDay(); // 0=Sun, 1=Mon...
  const defaultTab = Math.max(0, Math.min(4, today - 1));
  const [activeDay, setActiveDay] = useState(defaultTab);
  const [registrations, setRegistrations] = useState<Record<string, Record<string, boolean>>>({});

  const day = DAYS_CONFIG[activeDay];

  const toggleRegistration = (assessorId: string, activityId: string) => {
    setRegistrations(prev => ({
      ...prev,
      [assessorId]: {
        ...prev[assessorId],
        [activityId]: !prev[assessorId]?.[activityId],
      },
    }));
  };

  // Calculate day score per assessor based on the day's relevant KPI fields
  const getDayScore = (assessor: Assessor) => {
    return day.activities.reduce((sum, act) => {
      const val = assessor.kpis[act.field];
      const pct = Math.min(100, Math.round((val / act.target) * 100));
      return sum + pct;
    }, 0);
  };

  const sorted = [...ASSESSORS].sort((a, b) => getDayScore(b) - getDayScore(a));

  return (
    <div className="space-y-4">
      {/* Day Tabs */}
      <div className="flex gap-2">
        {DAYS_CONFIG.map((d, i) => (
          <button
            key={d.key}
            onClick={() => setActiveDay(i)}
            className={`relative px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeDay === i
                ? "gradient-primary text-primary-foreground glow-primary"
                : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-border/30"
            }`}
          >
            <span className="hidden md:inline">{d.label}</span>
            <span className="md:hidden">{d.short}</span>
            {i === defaultTab && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* Day Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={day.key}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-12 gap-4"
        >
          {/* Left: Activities Schedule + Registration */}
          <div className="col-span-3 space-y-4">
            {/* Day Activities */}
            <div className="card-glass rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold text-foreground">Atividades – {day.label}</h2>
              </div>
              <div className="space-y-3">
                {day.activities.map(act => (
                  <div key={act.id} className="p-3 rounded-lg bg-muted/20 border border-border/30">
                    <p className="text-sm font-semibold text-foreground">{act.name}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs font-mono text-primary">{act.time}</span>
                      <span className="text-xs text-muted-foreground">Meta: {act.target} {act.kpi}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pomodoro */}
            <PomodoroTimer />
          </div>

          {/* Center: Individual Ranking for the Day */}
          <div className="col-span-5">
            <div className="card-glass rounded-xl p-5 h-full">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-gold" />
                <h2 className="text-lg font-bold text-foreground">Ranking – {day.label}</h2>
              </div>

              <div className="space-y-3">
                {sorted.map((a, i) => {
                  const dayScore = getDayScore(a);
                  const avgPct = Math.round(dayScore / day.activities.length);

                  return (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className={`p-3 rounded-lg border ${
                        i < 3 ? RANK_STYLES[i] : "border-border/30 bg-muted/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-sm ${
                          i === 0 ? "text-background" : i < 3 ? "text-foreground" : "text-muted-foreground"
                        }`}>
                          {i === 0 ? "👑" : `#${i + 1}`}
                        </div>

                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${LEVEL_COLORS[a.level]}`}>
                          {a.avatar}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm truncate text-foreground">{a.name}</p>
                            {a.streak > 0 && (
                              <span className="flex items-center gap-0.5 text-xs text-chart-orange">
                                <Flame className="w-3 h-3" /> {a.streak}
                              </span>
                            )}
                          </div>

                          {/* Individual KPIs for this day */}
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                            {day.activities.map(act => {
                              const val = a.kpis[act.field];
                              const pct = Math.min(100, Math.round((val / act.target) * 100));
                              return (
                                <div key={act.id} className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-muted-foreground">{act.kpi}:</span>
                                  <span className={`text-xs font-mono font-semibold ${pct >= 80 ? "text-success" : pct >= 50 ? "text-chart-orange" : "text-destructive"}`}>
                                    {act.field === "cadencia" ? `${val}%` : val}/{act.target}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: avgPct >= 80 ? "hsl(var(--success))" : avgPct >= 50 ? "hsl(var(--chart-orange))" : "hsl(var(--destructive))" }}>
                            <TrendingUp className="w-3 h-3" />
                            {avgPct}%
                          </div>
                          <div className="w-16 h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${avgPct}%` }}
                              transition={{ duration: 1, delay: i * 0.1 }}
                              className={`h-full rounded-full ${avgPct >= 80 ? "gradient-success" : "gradient-primary"}`}
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

          {/* Right: Quick Activity Registration */}
          <div className="col-span-4">
            <div className="card-glass rounded-xl p-5 h-full">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-success" />
                <h2 className="text-sm font-bold text-foreground">Registrar Atividade</h2>
              </div>

              <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-240px)]">
                {ASSESSORS.map(a => (
                  <div key={a.id} className="p-3 rounded-lg bg-muted/20 border border-border/30">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${LEVEL_COLORS[a.level]}`}>
                        {a.avatar}
                      </div>
                      <span className="text-sm font-semibold text-foreground">{a.name.split(" ")[0]}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {day.activities.map(act => {
                        const done = registrations[a.id]?.[act.id];
                        return (
                          <button
                            key={act.id}
                            onClick={() => toggleRegistration(a.id, act.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                              done
                                ? "bg-success/20 text-success border border-success/30"
                                : "bg-muted/30 text-muted-foreground border border-border/30 hover:bg-muted/50 hover:text-foreground"
                            }`}
                          >
                            <CheckCircle2 className={`w-3.5 h-3.5 ${done ? "text-success" : "text-muted-foreground/50"}`} />
                            {act.name.length > 20 ? act.kpi : act.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default DayView;
