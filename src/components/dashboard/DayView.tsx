import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarX,
  CalendarBlank,
  Target,
  Clock,
  X as XIcon,
} from "@phosphor-icons/react";
import { startOfWeek, addDays, format } from "date-fns";
import { type Assessor } from "@/types/assessor";
import PomodoroTimer from "./PomodoroTimer";
import RegistrationPanel from "./RegistrationPanel";
import { useActivities, type ApiActivity, type ApiActivityKpi } from "@/hooks/useActivities";
import { useKpis } from "@/hooks/useKpis";
import { useDailyRanking } from "@/hooks/useRankings";
import DailyDirection from "./DailyDirection";
import DayKpiTilesRow from "./DayKpiTilesRow";
import HourlyBarChart from "./HourlyBarChart";
import DailyRankingTable from "./DailyRankingTable";
import { Eyebrow, SectionCard } from "@/components/shared";
import { cn } from "@/lib/utils";

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

/**
 * `/por-dia` — alinha com `Por-Dia.html`.
 *
 * Topo (design):
 *   [Day strip 5 cards: SEG/TER/QUA/QUI/SEX com pontos do dia]
 *   [Custom date picker à direita]
 *   [4 KPI tiles: Pontos · hoje | Ligações | Reuniões ag. | Reuniões real.]
 *   [Hourly bar chart 08-18h]
 *   [Tabela ranking · dia]
 *
 * Operação do dia (funcionalidades preservadas, abaixo):
 *   [Schedule panel + Pomodoro] | [DailyDirection]
 *   [RegistrationPanel full-width]
 */
const DayView = ({ assessors }: DayViewProps) => {
  // ─── Data e tab ────────────────────────────────────────────────────────────
  const today = new Date();
  const todayDow = today.getDay();
  const defaultTab = todayDow >= 1 && todayDow <= 5 ? todayDow - 1 : 0;
  const [activeDay, setActiveDay] = useState(defaultTab);
  const [customDate, setCustomDate] = useState<string | null>(null);

  const weekMonday = useMemo(() => startOfWeek(today, { weekStartsOn: 1 }), [today]);
  const tabDate = useMemo(() => addDays(weekMonday, activeDay), [weekMonday, activeDay]);
  const activeDateString = customDate ?? format(tabDate, "yyyy-MM-dd");

  // Pontos por dia do strip (5 days da semana atual) — só pré-fetcha o dia
  // ativo. Para o strip mostrar pontos por cada dia precisaríamos abrir 5
  // queries; preferimos manter leve e mostrar "•" se não-ativo.
  const { data: activeDayRanking } = useDailyRanking(activeDateString);
  const activeDayPoints = (activeDayRanking?.rankings ?? []).reduce(
    (s, r) => s + (r.rollup.points ?? 0),
    0,
  );

  // ─── Activities do dia (backend resolve biweekly) ──────────────────────────
  const { data: activities, isLoading: activitiesLoading } = useActivities(activeDateString);

  const kpiKeysForDay = useMemo(
    () => Array.from(new Set(activities.flatMap((a) => a.kpis.map((k) => k.key)))),
    [activities],
  );

  const { kpis: allActiveKpis } = useKpis();
  const extraKpiKeys = useMemo(
    () => allActiveKpis
      .map((k) => k.key)
      .filter((k) => !kpiKeysForDay.includes(k)),
    [allActiveKpis, kpiKeysForDay],
  );

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

  // Lookup kpiKey → ApiActivityKpi (mantido para compat com RegistrationPanel)
  // — usa-se apenas quando precisamos de label/target/unit. Não usado agora
  // que o ranking tem componente dedicado.
  void useMemo(() => {
    const map: Record<string, ApiActivityKpi> = {};
    for (const act of activities) {
      for (const k of act.kpis) {
        map[k.key] ??= k;
      }
    }
    return map;
  }, [activities]);

  const dayLabel = DAY_LABELS[activeDay + 1].label;
  const formattedDate = activeDateString.split("-").reverse().slice(0, 2).join("/");

  return (
    <div className="space-y-5">
      {/* Day strip + custom date picker */}
      <div className="flex items-stretch gap-3 flex-wrap">
        <div className="flex-1 min-w-[300px] rounded-[var(--radius)] border border-line bg-card overflow-hidden">
          <div className="grid grid-cols-5">
            {[1, 2, 3, 4, 5].map((dow) => {
              const i = dow - 1;
              const lbl = DAY_LABELS[dow];
              const selected = !customDate && activeDay === i;
              const isToday = i === defaultTab && !customDate;
              return (
                <button
                  key={dow}
                  type="button"
                  onClick={() => { setCustomDate(null); setActiveDay(i); }}
                  className={cn(
                    "relative text-left px-4 py-3.5 transition-all border-r border-line last:border-r-0",
                    selected
                      ? "bg-ink text-white"
                      : "bg-transparent hover:bg-surface-2",
                  )}
                >
                  <p
                    className={cn(
                      "text-[9px] uppercase tracking-[0.12em] font-mono font-semibold",
                      selected ? "text-white/60" : "text-ink-3",
                    )}
                  >
                    <span className="hidden md:inline">{lbl.label}</span>
                    <span className="md:hidden">{lbl.short}</span>
                  </p>
                  <p
                    className={cn(
                      "font-display font-extrabold leading-none mt-1.5 tracking-[-0.03em]",
                      "text-[22px]",
                      selected ? "text-white" : "text-ink",
                    )}
                  >
                    {format(addDays(weekMonday, i), "dd/MM")}
                  </p>
                  {isToday && (
                    <span
                      className="absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse"
                      style={{
                        background: selected ? "hsl(var(--gold))" : "hsl(var(--brand-primary))",
                      }}
                      aria-label="hoje"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <label
          className={cn(
            "inline-flex items-center gap-2 px-3 py-2 rounded-[var(--radius)] border cursor-pointer transition-all shrink-0",
            customDate
              ? "bg-accent border-primary/30 text-primary"
              : "bg-card border-line text-ink-3 hover:text-ink",
          )}
          title="Navegar pra uma data específica"
        >
          <CalendarBlank size={14} />
          <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.12em] whitespace-nowrap">
            Outra data
          </span>
          <input
            type="date"
            value={customDate ?? ""}
            onChange={(e) => setCustomDate(e.target.value || null)}
            max={format(today, "yyyy-MM-dd")}
            className="bg-transparent text-[12px] font-mono focus:outline-none cursor-pointer"
          />
          {customDate && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setCustomDate(null); }}
              className="ml-1 text-ink-3 hover:text-destructive"
              title="Voltar pra semana atual"
            >
              <XIcon size={11} weight="bold" />
            </button>
          )}
        </label>
      </div>

      {/* Foco do dia — direcionamento rápido */}
      {!activitiesLoading && activities.length > 0 && (
        <div className="rounded-[var(--radius)] border border-line bg-card px-4 py-3 flex items-center gap-3 flex-wrap">
          <span className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-primary inline-flex items-center gap-1.5">
            <Target size={12} weight="bold" /> Foco do dia
          </span>
          {activities.map((act) => (
            <span key={act.id} className="text-[12px] text-ink-2">
              <span className="font-semibold">{act.name}</span>
              <span className="text-ink-3 ml-1">
                ({act.startTime}–{act.endTime})
              </span>
              {act.kpis.length > 0 && (
                <span className="text-ink-3 ml-1">
                  · Meta: {act.kpis.map((k) => `${k.target} ${k.label}`).join(", ")}
                </span>
              )}
            </span>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeDateString}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-5"
        >
          {/* 4 KPI tiles do dia */}
          <DayKpiTilesRow date={activeDateString} />

          {/* Hourly bar chart */}
          <HourlyBarChart date={activeDateString} />

          {/* Tabela ranking · dia */}
          <DailyRankingTable date={activeDateString} assessors={assessors} />

          {/* ─── Operação do dia ──────────────────────────────────────────── */}
          <div className="flex items-center gap-3 pt-2">
            <Eyebrow>Operação do dia</Eyebrow>
            <div className="flex-1 h-px bg-line" />
            <span className="text-[11px] text-ink-3">
              {dayLabel} · {formattedDate} · {activeDayPoints} pts
            </span>
          </div>

          {/* Schedule + DailyDirection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard
              title={`Atividades · ${dayLabel}`}
              subtitle={
                activitiesLoading
                  ? "Carregando…"
                  : `${activities.length} ${activities.length === 1 ? "bloco" : "blocos"} no dia`
              }
            >
              {activitiesLoading ? (
                <p className="text-[12px] text-ink-3">Carregando…</p>
              ) : activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-ink-3">
                  <CalendarX size={32} className="mb-2 opacity-50" />
                  <p className="text-[12px] text-center">Nenhuma atividade ativa hoje.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.map((act: ApiActivity) => (
                    <div
                      key={act.id}
                      className="rounded-[var(--radius)] border border-line bg-surface-2/50 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[13px] font-semibold text-ink">{act.name}</p>
                        {act.cadenceType === "BIWEEKLY" && (
                          <span className="text-[9px] font-mono font-bold text-primary bg-primary/10 border border-primary/30 rounded px-1.5 py-0.5 whitespace-nowrap">
                            QUINZENAL
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock size={11} className="text-primary" />
                        <span className="text-[11px] font-mono text-primary">
                          {act.startTime}–{act.endTime}
                        </span>
                      </div>
                      <div className="mt-2 space-y-0.5">
                        {act.kpis.map((k) => (
                          <p key={k.kpiId} className="text-[11px] text-ink-3">
                            Meta: <span className="num font-mono font-semibold text-ink-2">
                              {k.target}{k.unit}
                            </span> {k.label}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <PomodoroTimer />
              </div>
            </SectionCard>

            <DailyDirection
              date={activeDateString}
              dayLabel={`${dayLabel} ${formattedDate}`}
            />
          </div>

          {/* RegistrationPanel full-width */}
          <RegistrationPanel
            assessors={assessors}
            kpiKeys={kpiKeysForDay}
            extraKpiKeys={extraKpiKeys}
            date={activeDateString}
            blocks={activityBlocks}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default DayView;
