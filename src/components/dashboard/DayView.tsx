import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Flame, TrendingUp, Clock, Crown, CalendarOff, CheckCircle2, CalendarDays } from "lucide-react";
import { Target, X as XIcon } from "@phosphor-icons/react";
import { startOfWeek, addDays, format } from "date-fns";
import { type Assessor } from "@/types/assessor";
import PomodoroTimer from "./PomodoroTimer";
import RegistrationPanel from "./RegistrationPanel";
import { useDailyRanking } from "@/hooks/useRankings";
import { useActivities, type ApiActivity, type ApiActivityKpi } from "@/hooks/useActivities";
import { useMetrics } from "@/hooks/useMetrics";
import { useKpis } from "@/hooks/useKpis";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";
import { apiFetch } from "@/api/client";
import { SALESFORCE_PREFIX, isSalesforceCheck } from "@/lib/meetingBonus";
import DailyDirection from "./DailyDirection";
import DayHeroMetrics from "./DayHeroMetrics";

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

  // Date picker: data arbitrária pra editar dias passados (não só semana atual).
  // Quando definida, sobrescreve o tab da semana.
  const [customDate, setCustomDate] = useState<string | null>(null);

  // Calcula a data exata: ou customDate (se definida) ou tab da semana corrente.
  const weekMonday = useMemo(() => startOfWeek(today, { weekStartsOn: 1 }), [today]);
  const tabDate = useMemo(() => addDays(weekMonday, activeDay), [weekMonday, activeDay]);
  const activeDateString = customDate ?? format(tabDate, "yyyy-MM-dd");

  // ─── Activities do dia (backend resolve biweekly) ──────────────────────────
  const { data: activities, isLoading: activitiesLoading } = useActivities(activeDateString);

  // KPI keys únicos das atividades do dia (collapsa duplicatas como Bloco 1+2)
  const kpiKeysForDay = useMemo(
    () => Array.from(new Set(activities.flatMap((a) => a.kpis.map((k) => k.key)))),
    [activities],
  );

  // KPIs ativos "extras" — os que NÃO estão no cronograma do dia mas podem
  // ter sido realizados pelo assessor (ex: ligação numa segunda onde cronograma
  // só tem Leads+Cadência). Felipe pediu pra permitir lançamento fora do
  // cronograma oficial.
  const { kpis: allActiveKpis } = useKpis();
  const extraKpiKeys = useMemo(
    () => allActiveKpis
      .map((k) => k.key)
      .filter((k) => !kpiKeysForDay.includes(k)),
    [allActiveKpis, kpiKeysForDay],
  );

  // Blocos manhã/tarde pra discriminar no RegistrationPanel
  const activityBlocks = useMemo(() => {
    const morning: Array<{ name: string; time: string; kpiKeys: string[] }> = [];
    const afternoon: Array<{ name: string; time: string; kpiKeys: string[] }> = [];
    for (const act of activities) {
      const hour = parseInt(act.startTime?.split(":")[0] ?? "9", 10);
      const block = hour < 12 ? morning : afternoon;
      block.push({
        name: act.name,
        time: `${act.startTime}–${act.endTime}`,
        kpiKeys: act.kpis.map((k) => k.key),
      });
    }
    return { morning, afternoon };
  }, [activities]);

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

  // ─── Ranking diário (usa a data do tab selecionado, não sempre "hoje") ─────
  const { data: dailyRanking } = useDailyRanking(activeDateString);
  const { data: dayMetrics } = useMetrics({ from: activeDateString, to: activeDateString });

  // Salesforce check: set de assessorIds que já marcaram [SALESFORCE_OK] no dia
  const sfCheckedIds = useMemo(() => {
    const set = new Set<string>();
    for (const m of dayMetrics ?? []) {
      if (isSalesforceCheck(m.notes)) set.add(m.assessorId);
    }
    return set;
  }, [dayMetrics]);

  const handleSfCheck = async (assessorId: string) => {
    try {
      await apiFetch("/metrics", {
        method: "POST",
        body: {
          assessorId,
          kpiKey: kpiKeysForDay[0] ?? "leads",
          rawValue: 0,
          notes: `${SALESFORCE_PREFIX} Confirmado`,
          date: activeDateString,
        },
      });
    } catch {}
  };

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
      {/* Day picker Editorial V1 — 5 cards horizontais com nº mono grande */}
      <div className="rounded-[14px] border border-line bg-card overflow-hidden">
        <div className="grid grid-cols-5">
          {[1, 2, 3, 4, 5].map((dow) => {
            const i = dow - 1;
            const lbl = DAY_LABELS[dow];
            const selected = !customDate && activeDay === i;
            return (
              <button
                key={dow}
                onClick={() => { setCustomDate(null); setActiveDay(i); }}
                className={`relative text-left px-4 py-3.5 transition-all ${
                  i < 4 ? "border-r border-line" : ""
                } ${selected ? "" : "hover:bg-surface-2"}`}
                style={{
                  background: selected ? "hsl(var(--ink))" : "transparent",
                  color: selected ? "white" : "hsl(var(--ink))",
                }}
              >
                <p
                  className="text-[9px] uppercase tracking-[0.12em] font-semibold"
                  style={{ color: selected ? "oklch(1 0 0 / 0.5)" : "hsl(var(--ink-3))" }}
                >
                  <span className="hidden md:inline">{lbl.label}</span>
                  <span className="md:hidden">{lbl.short}</span>
                </p>
                {i === defaultTab && !customDate && (
                  <span
                    className="absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse"
                    style={{ background: selected ? "hsl(var(--gold))" : "hsl(var(--eqi-green))" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date picker pra editar dias fora da semana atual */}
      <div className="flex justify-end">
        <label
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[8px] border cursor-pointer transition-all ${
            customDate
              ? "bg-accent border-primary/15 text-primary"
              : "bg-surface border-line text-ink-3 hover:text-ink"
          }`}
          title="Navegar pra uma data específica"
        >
          <CalendarDays className="w-4 h-4" />
          <span className="text-xs font-semibold whitespace-nowrap">Ir pra outra data</span>
          <input
            type="date"
            value={customDate ?? ""}
            onChange={(e) => setCustomDate(e.target.value || null)}
            max={format(today, "yyyy-MM-dd")}
            className="bg-transparent text-sm font-mono focus:outline-none cursor-pointer"
          />
          {customDate && (
            <button
              onClick={(e) => { e.preventDefault(); setCustomDate(null); }}
              className="ml-1 text-ink-3 hover:text-destructive"
              title="Voltar pra semana atual"
            >
              <XIcon size={12} weight="bold" />
            </button>
          )}
        </label>
      </div>

      {/* Foco do dia — direcionamento rápido */}
      {!activitiesLoading && activities.length > 0 && (
        <div className="rounded-[14px] border border-line bg-card px-4 py-3 flex items-center gap-3 flex-wrap">
          <span className="text-xs font-extrabold text-primary inline-flex items-center gap-1.5"><Target size={13} weight="bold" /> Foco do dia:</span>
          {activities.map((act) => (
            <span key={act.id} className="text-xs text-foreground">
              <span className="font-semibold">{act.name}</span>
              <span className="text-muted-foreground ml-1">({act.startTime}–{act.endTime})</span>
              {act.kpis.length > 0 && (
                <span className="text-muted-foreground ml-1">
                  — Meta: {act.kpis.map((k) => `${k.target} ${k.label}`).join(", ")}
                </span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Hero metrics do dia (artboard DailyDrilldown) */}
      <DayHeroMetrics date={activeDateString} />

      {/* Direcionamento livre editável (orientação do coordenador) */}
      <DailyDirection date={activeDateString} dayLabel={`${dayLabel} ${activeDateString.split("-").reverse().slice(0, 2).join("/")}`} />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeDateString}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 xl:grid-cols-12 gap-4"
        >
          {/* ─── Schedule panel (esquerda) ─────────────────────────────────── */}
          <div className="xl:col-span-3 space-y-4">
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
          <div className="xl:col-span-5">
            <div className="card-glass rounded-xl p-5 h-full">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Ranking – {dayLabel}</h2>
              </div>
              <div className="space-y-3">
                {sorted.map((row, i) => {
                  const a = row.assessor;
                  const dayScore = row.dayScore;
                  // dayPct agora é soma cap 150 (refletindo esforço cumulativo).
                  // Usamos o valor real pro display e capamos só a largura da barra em 100.
                  const avgPct = row.dayPct;
                  const barWidth = Math.min(100, avgPct);
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
                            <p className="font-bold text-sm text-foreground break-words">{a.name}</p>
                            {a.streak > 0 && (
                              <span className="flex items-center gap-0.5 text-xs text-chart-orange font-semibold">
                                <Flame className="w-3.5 h-3.5" /> {a.streak}
                              </span>
                            )}
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {dayScore} pts
                            </span>
                            <button
                              onClick={() => !sfCheckedIds.has(a.id) && handleSfCheck(a.id)}
                              title={sfCheckedIds.has(a.id) ? "Salesforce OK" : "Marcar Salesforce"}
                              className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                                sfCheckedIds.has(a.id)
                                  ? "text-success"
                                  : "text-muted-foreground/40 hover:text-success/60"
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
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
                              animate={{ width: `${barWidth}%` }}
                              transition={{ duration: 1, delay: i * 0.1 }}
                              className={`h-full rounded-full ${
                                avgPct >= 80 ? "bg-success" : "bg-primary"
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
          <div className="xl:col-span-4">
            <RegistrationPanel assessors={assessors} kpiKeys={kpiKeysForDay} extraKpiKeys={extraKpiKeys} date={activeDateString} blocks={activityBlocks} />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default DayView;
