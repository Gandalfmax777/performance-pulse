import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CaretLeft,
  CaretRight,
  CalendarBlank as CalendarDays,
  Fire as Flame,
  Crown,
  CircleNotch,
  Printer,
  ArrowUp,
  ArrowDown,
  Minus,
  Play,
  Pause,
  TrendUp,
  Trophy,
  Target,
  Sparkle,
  Sword as Swords,
  Medal,
  ChartBar,
} from "@phosphor-icons/react";
import Markdown from "react-markdown";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Assessor } from "@/types/assessor";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";
import { useKpis } from "@/hooks/useKpis";
import { useOverviewReport } from "@/hooks/useReports";
import { useGenerateTeamInsight, type ApiInsight } from "@/hooks/useInsight";
import { useDailyDirection } from "@/hooks/useDailyDirection";
import { useTournaments } from "@/hooks/useTournaments";
import DirectionEditModal from "./DirectionEditModal";

type Period = "weekly" | "monthly";

interface PresentationModeProps {
  assessors: Assessor[];
  onClose: () => void;
}

interface Slide {
  id: string;
  title: string;
  icon: typeof Trophy;
  render: () => JSX.Element;
}

function rangeFor(period: Period) {
  const now = new Date();
  const fmt = (d: Date) => format(d, "yyyy-MM-dd");
  if (period === "weekly") {
    return {
      from: fmt(startOfWeek(now, { weekStartsOn: 1 })),
      to: fmt(endOfWeek(now, { weekStartsOn: 1 })),
      label: `Semana de ${format(startOfWeek(now, { weekStartsOn: 1 }), "dd/MM", { locale: ptBR })} a ${format(endOfWeek(now, { weekStartsOn: 1 }), "dd/MM", { locale: ptBR })}`,
    };
  }
  return {
    from: fmt(startOfMonth(now)),
    to: fmt(endOfMonth(now)),
    label: format(now, "MMMM 'de' yyyy", { locale: ptBR }).replace(/^\w/, (c) => c.toUpperCase()),
  };
}

const PresentationMode = ({ assessors, onClose }: PresentationModeProps) => {
  const [period, setPeriod] = useState<Period>("weekly");
  const [slideIdx, setSlideIdx] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const range = rangeFor(period);

  // Range anterior pra comparativo temporal (slide Highlights)
  const previousRange = useMemo(() => {
    const now = new Date();
    if (period === "weekly") {
      const prevRef = subDays(now, 7);
      return {
        from: format(startOfWeek(prevRef, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        to: format(endOfWeek(prevRef, { weekStartsOn: 1 }), "yyyy-MM-dd"),
      };
    }
    const prevRef = subMonths(now, 1);
    return {
      from: format(startOfMonth(prevRef), "yyyy-MM-dd"),
      to: format(endOfMonth(prevRef), "yyyy-MM-dd"),
    };
  }, [period]);

  const { kpis } = useKpis();
  const { data: overview } = useOverviewReport({ from: range.from, to: range.to });
  const { data: previousOverview } = useOverviewReport(previousRange);
  const { data: tournaments = [] } = useTournaments();
  const generateTeam = useGenerateTeamInsight();
  const [teamInsight, setTeamInsight] = useState<ApiInsight | null>(null);

  // Delta por KPI key — highlights
  const deltaByKey = useMemo(() => {
    const map = new Map<string, { current: number; previous: number; pct: number | null }>();
    if (!overview || !previousOverview) return map;
    const prevMap = new Map(previousOverview.byKpi.map((p) => [p.key, p.actual]));
    for (const k of overview.byKpi) {
      const prev = prevMap.get(k.key) ?? 0;
      const pct = prev > 0 ? ((k.actual - prev) / prev) * 100 : null;
      map.set(k.key, { current: k.actual, previous: prev, pct });
    }
    return map;
  }, [overview, previousOverview]);

  // Direcionamento da segunda-feira da próxima semana (próximos passos)
  const nextMonday = useMemo(() => {
    const d = new Date();
    const dow = d.getDay();
    const daysToNextMonday = ((1 - dow + 7) % 7) || 7;
    d.setDate(d.getDate() + daysToNextMonday);
    return format(d, "yyyy-MM-dd");
  }, []);
  const { data: nextDirection } = useDailyDirection(nextMonday);
  const [directionEditOpen, setDirectionEditOpen] = useState(false);

  // Ranking ordenado por points (do period selecionado)
  const ranked = useMemo(() => {
    if (!overview?.allPerformers) {
      return [...assessors].sort((a, b) => b.points - a.points);
    }
    return [...assessors]
      .map((a) => {
        const p = overview.allPerformers.find((x) => x.assessorId === a.id);
        return { ...a, points: p?.points ?? 0, weeklyGoalPercent: p?.weeklyGoalPercent ?? 0 };
      })
      .sort((a, b) => b.points - a.points);
  }, [assessors, overview]);

  const totalPoints = ranked.reduce((s, a) => s + a.points, 0);
  const avgGoalPct = ranked.length
    ? Math.round(ranked.reduce((s, a) => s + a.weeklyGoalPercent, 0) / ranked.length)
    : 0;

  const slides: Slide[] = [
    {
      id: "cover",
      title: "Capa",
      icon: Trophy,
      render: () => (
        <div className="text-center space-y-8">
          <h1 className="font-display text-7xl font-black text-ink tracking-tight">
            Performance Pulse
          </h1>
          <p className="text-3xl text-ink-3">{range.label}</p>
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto pt-8">
            <div className="bg-card border border-line rounded-[14px] p-6">
              <p className="text-xs uppercase text-ink-3 tracking-wider mb-2">Total Pontos</p>
              <p className="font-display text-5xl font-black text-eqi">{totalPoints}</p>
            </div>
            <div className="bg-card border border-line rounded-[14px] p-6">
              <p className="text-xs uppercase text-ink-3 tracking-wider mb-2">% Meta Médio</p>
              <p className="font-display text-5xl font-black text-success">{avgGoalPct}%</p>
            </div>
            <div className="bg-card border border-line rounded-[14px] p-6">
              <p className="text-xs uppercase text-ink-3 tracking-wider mb-2">Time</p>
              <p className="font-display text-5xl font-black text-chart-purple">{ranked.length}</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "highlights",
      title: "Destaques",
      icon: TrendUp,
      render: () => {
        // Mostra os 6 primeiros KPIs com delta vs período anterior
        const items = (overview?.byKpi ?? []).slice(0, 6).map((k) => ({
          label: k.label,
          key: k.key,
          actual: Math.round(k.actual),
          delta: deltaByKey.get(k.key) ?? null,
        }));
        const prevLabel = period === "weekly" ? "semana passada" : "mês passado";
        return (
          <div className="space-y-8">
            <h2 className="text-4xl font-display font-bold text-ink text-center">
              <TrendUp size={32} weight="bold" className="inline-block mr-2 text-eqi align-middle" />Destaques do Período
            </h2>
            <p className="text-center text-ink-3 text-lg">
              Comparativo com {prevLabel}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {items.map((it, i) => {
                const pct = it.delta?.pct;
                const isUp = pct !== null && pct !== undefined && pct > 1;
                const isDown = pct !== null && pct !== undefined && pct < -1;
                const Icon = pct === null || pct === undefined ? Minus : isUp ? ArrowUp : isDown ? ArrowDown : Minus;
                const color = pct === null || pct === undefined
                  ? "text-ink-3"
                  : isUp
                  ? "text-success"
                  : isDown
                  ? "text-destructive"
                  : "text-ink-3";
                const deltaLabel = pct === null || pct === undefined
                  ? it.delta && it.delta.previous === 0 && it.actual > 0 ? "novo!" : "—"
                  : `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`;
                return (
                  <motion.div
                    key={it.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-card border border-line rounded-[14px] p-6"
                  >
                    <p className="text-sm text-ink-3 uppercase tracking-wider mb-3">
                      {it.label}
                    </p>
                    <p className="font-display text-5xl font-black text-ink mb-2">
                      {it.actual.toLocaleString("pt-BR")}
                    </p>
                    <div className={`flex items-center gap-1.5 text-lg font-mono font-bold ${color}`}>
                      <Icon size={20} weight="bold" />
                      {deltaLabel}
                      {it.delta && it.delta.previous > 0 && (
                        <span className="text-xs text-ink-3 ml-1">
                          vs {Math.round(it.delta.previous).toLocaleString("pt-BR")}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      },
    },
    {
      id: "podium",
      title: "Pódio",
      icon: Crown,
      render: () => {
        const top3 = ranked.slice(0, 3);
        const order = [top3[1], top3[0], top3[2]].filter(Boolean);
        const heights = [180, 240, 140];
        const labels = ["2º", "1º", "3º"];
        const colors = [
          "from-silver/30 to-silver/5 border-silver/40",
          "from-eqi/30 to-eqi/5 border-eqi/40",
          "from-bronze/30 to-bronze/5 border-bronze/40",
        ];
        return (
          <div className="space-y-8">
            <h2 className="text-4xl font-display font-bold text-ink text-center">
              <Trophy size={32} weight="bold" className="inline-block mr-2 text-gold align-middle" />Top 3 do Período
            </h2>
            <div className="flex items-end justify-center gap-6 pt-8">
              {order.map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 60 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.2, duration: 0.6 }}
                  className="flex flex-col items-center"
                >
                  <AssessorAvatar
                    initials={a.avatar}
                    photoUrl={a.photoUrl}
                    level={a.level}
                    size={96}
                    className="mb-3"
                  />
                  <p className="text-xl font-bold text-ink mb-1">{a.name}</p>
                  <p className="text-sm text-ink-3 mb-3">{a.points} pts</p>
                  <div
                    style={{ height: heights[i] }}
                    className={`w-32 rounded-t-2xl bg-gradient-to-t ${colors[i]} border-2 flex items-start justify-center pt-4`}
                  >
                    <span className="text-3xl font-display font-black text-ink">
                      {labels[i]}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      },
    },
    {
      id: "kpis",
      title: "KPIs",
      icon: Target,
      render: () => (
        <div className="space-y-6">
          <h2 className="text-4xl font-display font-bold text-ink text-center">
<ChartBar size={32} weight="bold" className="inline-block mr-2 text-eqi align-middle" />KPIs do Período
          </h2>
          <div className="grid grid-cols-3 gap-4 max-w-5xl mx-auto">
            {kpis.slice(0, 6).map((kpi) => {
              const byKpi = overview?.byKpi.find((k) => k.key === kpi.key);
              const value = Math.round(byKpi?.actual ?? 0);
              const target = byKpi?.target ?? 1;
              const pct = target > 0 ? Math.min(150, Math.round((value / target) * 100)) : 0;
              return (
                <div key={kpi.id} className="bg-card border border-line rounded-[14px] p-6">
                  <p className="text-sm text-ink-3 mb-2">{kpi.label}</p>
                  <p className="font-display text-4xl font-black text-ink mb-2">
                    {value}
                    <span className="text-lg text-ink-3"> / {target}</span>
                  </p>
                  <div className="h-2 bg-muted/40 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, pct)}%` }}
                      className={`h-full rounded-full ${pct >= 80 ? "bg-success" : pct >= 50 ? "bg-chart-orange" : "bg-destructive"}`}
                    />
                  </div>
                  <p className="text-xs font-mono text-ink-3 mt-1 text-right">{pct}%</p>
                </div>
              );
            })}
          </div>
        </div>
      ),
    },
    {
      id: "ranking",
      title: "Ranking Completo",
      icon: Trophy,
      render: () => {
        // 2 colunas quando > 6 assessores — cabe time grande (até 20) sem scroll.
        // Cards compactos (py-2, avatar 44px) pra densidade de apresentação.
        const useTwoCols = ranked.length > 6;
        return (
          <div className="space-y-4 w-full">
            <h2 className="text-3xl font-display font-bold text-ink text-center">
<Medal size={32} weight="bold" className="inline-block mr-2 text-gold align-middle" />Ranking Completo
            </h2>
            <div
              className={`mx-auto ${useTwoCols ? "max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2" : "max-w-3xl space-y-2"}`}
            >
              {ranked.map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.4) }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-[14px] border ${
                    i === 0
                      ? "bg-eqi/10 border-eqi/40"
                      : i === 1
                        ? "bg-silver/5 border-silver/30"
                        : i === 2
                          ? "bg-bronze/5 border-bronze/30"
                          : "border-line/20 bg-muted/10"
                  }`}
                >
                  <span
                    className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center font-display font-black text-sm ${
                      i === 0
                        ? "bg-eqi/20 text-eqi"
                        : i === 1
                          ? "bg-silver/15 text-silver"
                          : i === 2
                            ? "bg-bronze/15 text-bronze"
                            : "bg-muted/30 text-ink-3"
                    }`}
                  >
                    {i === 0 ? <Crown size={16} weight="fill" /> : `#${i + 1}`}
                  </span>
                  <AssessorAvatar
                    initials={a.avatar}
                    photoUrl={a.photoUrl}
                    level={a.level}
                    size={40}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-ink truncate">{a.name}</p>
                    {a.streak > 0 && (
                      <p className="text-[10px] text-chart-orange flex items-center gap-1">
                        <Flame size={12} weight="fill" /> {a.streak}d
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-display text-lg font-bold text-eqi leading-none">
                      {a.points} <span className="text-xs font-normal text-ink-3">pts</span>
                    </p>
                    <p className="text-[10px] text-ink-3">{a.weeklyGoalPercent}% meta</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      },
    },
    {
      id: "tournaments",
      title: "Torneios",
      icon: Swords,
      render: () => {
        const activeT = tournaments.filter((t) => t.status === "ACTIVE");
        const recentFinished = tournaments
          .filter((t) => t.status === "FINISHED")
          .slice(0, 3);
        const hasNothing = activeT.length === 0 && recentFinished.length === 0;
        return (
          <div className="space-y-8 max-w-5xl mx-auto">
            <h2 className="text-4xl font-display font-bold text-ink text-center">
<Swords size={32} weight="bold" className="inline-block mr-2 text-eqi align-middle" />Torneios do Período
            </h2>

            {hasNothing && (
              <p className="text-center text-ink-3 text-lg py-12">
                Nenhum torneio ativo ou recente. Considere criar um em /admin/tournaments
                pra aumentar o engajamento da próxima semana.
              </p>
            )}

            {activeT.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-ink mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  Ativos ({activeT.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeT.map((t) => {
                    const leader = [...t.participants]
                      .sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0))[0];
                    return (
                      <div key={t.id} className="bg-card border border-line rounded-[14px] p-5 border-secondary/30">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <h4 className="font-display font-bold text-lg text-ink">
                            {t.roundLabel}
                          </h4>
                          <span className="font-mono font-black text-2xl text-secondary">
                            R$ {t.totalPrizePool.toLocaleString("pt-BR")}
                          </span>
                        </div>
                        <p className="text-sm text-ink-3 mb-3">
                          {format(parseISO(t.startDate), "dd/MM")} → {format(parseISO(t.endDate), "dd/MM")}
                          {" · "}
                          {t.scope === "INDIVIDUAL" ? "Individual" : "Squads"}
                        </p>
                        {leader && (
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-eqi/5 border border-eqi/20">
                            <Crown size={20} weight="fill" className="text-secondary" />
                            <span className="font-semibold text-ink flex-1">
                              Liderando: {leader.displayName}
                            </span>
                            <span className="font-mono font-black text-eqi">
                              {(leader.finalScore ?? 0).toLocaleString("pt-BR")}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {recentFinished.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-ink mb-4">Finalizados recentes</h3>
                <div className="space-y-3">
                  {recentFinished.map((t) => {
                    const champion = t.participants.find((p) => p.rank === 1);
                    const topPayout = t.progressivePayoutJson?.["1"] ?? 0;
                    return (
                      <div
                        key={t.id}
                        className="flex items-center gap-4 p-4 rounded-[14px] bg-muted/10 border border-line/20"
                      >
                        <Trophy size={32} weight="fill" className="text-secondary" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-ink">{t.roundLabel}</p>
                          <p className="text-sm text-ink-3">
                            Campeão: <span className="text-ink font-semibold">{champion?.displayName ?? "—"}</span>
                            {" · "}R$ {topPayout.toLocaleString("pt-BR")}
                          </p>
                        </div>
                        <span className="text-xs font-mono text-ink-3">
                          {format(parseISO(t.endDate), "dd/MM")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "ai",
      title: "Análise IA",
      icon: Sparkle,
      render: () => (
        <div className="space-y-6 max-w-4xl mx-auto">
          <h2 className="text-4xl font-display font-bold text-ink text-center">
<Sparkle size={32} weight="bold" className="inline-block mr-2 text-gold-deep align-middle" />Análise IA do Time
          </h2>
          {generateTeam.isPending && !teamInsight ? (
            <div className="flex items-center justify-center gap-3 text-ink-3 py-12">
              <CircleNotch size={24} className="animate-spin text-eqi" />
              <span className="text-lg">Gemini Flash analisando…</span>
            </div>
          ) : teamInsight ? (
            <div className="bg-card border border-line rounded-[14px] p-8 prose prose-invert max-w-none text-base leading-relaxed">
              <Markdown>{teamInsight.textMarkdown}</Markdown>
            </div>
          ) : (
            <div className="text-center py-12">
              <button
                onClick={() =>
                  generateTeam.mutate(
                    { period: period === "weekly" ? "WEEK" : "MONTH" },
                    { onSuccess: (data) => setTeamInsight(data) },
                  )
                }
                className="px-6 py-3 rounded-[14px] bg-ink text-white font-bold hover:bg-ink/90 transition-colors"
              >
                <Sparkle size={20} weight="fill" className="inline mr-2" />
                Gerar análise agora
              </button>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "next-steps",
      title: "Próximos Passos",
      icon: CalendarDays,
      render: () => (
        <div className="space-y-6 max-w-3xl mx-auto">
          <h2 className="text-4xl font-display font-bold text-ink text-center">
<Target size={32} weight="bold" className="inline-block mr-2 text-eqi align-middle" />Foco da Próxima Semana
          </h2>
          <p className="text-center text-ink-3">
            Anchor: segunda{" "}
            <span className="font-mono text-ink">
              {format(new Date(`${nextMonday}T00:00:00.000Z`), "dd/MM (EEEE)", { locale: ptBR })}
            </span>
          </p>

          {nextDirection ? (
            <div className="bg-card border border-line rounded-[14px] p-6 space-y-4">
              <div className="flex items-center gap-2 flex-wrap text-sm">
                <span className="px-2 py-0.5 rounded-full bg-eqi/10 text-eqi font-bold text-xs">
                  {nextDirection.period === "DAILY" ? "Foco Diário"
                    : nextDirection.period === "WEEKLY" ? "Foco Semanal"
                    : "Foco Mensal"}
                </span>
                {nextDirection.targetKpiKeys.length > 0 && (
                  <span className="text-xs text-ink-3">
                    KPIs alvo: {nextDirection.targetKpiKeys.length}
                  </span>
                )}
              </div>
              <p className="text-lg text-ink whitespace-pre-wrap">
                {nextDirection.text}
              </p>
              <button
                onClick={() => setDirectionEditOpen(true)}
                className="px-4 py-2 rounded-lg bg-ink text-white font-semibold text-sm hover:bg-ink/90 transition-colors"
              >
                Editar foco
              </button>
            </div>
          ) : (
            <div className="bg-card border border-line rounded-[14px] p-8 text-center">
              <p className="text-base text-ink-3 mb-4">
                Nenhum foco definido pra próxima semana ainda.
              </p>
              <button
                onClick={() => setDirectionEditOpen(true)}
                className="px-6 py-3 rounded-[14px] bg-ink text-white font-bold hover:bg-ink/90 transition-colors"
              >
                Definir foco da próxima semana
              </button>
            </div>
          )}

          <p className="text-center text-xs text-ink-3">
            Você pode escolher o período (dia/semana/mês) e KPIs alvo no modal.
            Cumprimento aparece em KPIs &amp; Insights.
          </p>
        </div>
      ),
    },
  ];

  // Auto-gerar insight ao entrar no slide de IA
  useEffect(() => {
    if (slides[slideIdx]?.id === "ai" && !teamInsight && !generateTeam.isPending) {
      generateTeam.mutate(
        { period: period === "weekly" ? "WEEK" : "MONTH" },
        { onSuccess: (data) => setTeamInsight(data) },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideIdx]);

  // Resetar insight quando muda de período
  useEffect(() => {
    setTeamInsight(null);
  }, [period]);

  // Auto-advance: quando ligado, avança slide a cada 12s. Útil quando Felipe
  // coloca a apresentação no TV durante reunião de fechamento e quer deixar
  // passando sem precisar clicar.
  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(() => {
      setSlideIdx((i) => (i + 1) % slides.length);
    }, 12_000);
    return () => clearInterval(timer);
  }, [autoPlay, slides.length]);

  // Navegação por teclado
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        setSlideIdx((i) => Math.min(slides.length - 1, i + 1));
      } else if (e.key === "ArrowLeft") {
        setSlideIdx((i) => Math.max(0, i - 1));
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [slides.length, onClose]);

  const current = slides[slideIdx];

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-hidden presentation-mode">
      {/* Header com controles (escondido em print) */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-3 border-b border-line/20 bg-background/80 backdrop-blur-md no-print">
        <div className="flex items-center gap-3">
          <Sparkle size={20} weight="fill" className="text-eqi" />
          <span className="text-sm font-bold text-ink">Modo Apresentação</span>
          <div className="flex gap-1 bg-muted/20 rounded-lg p-1 ml-3">
            {(["weekly", "monthly"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-md text-xs font-semibold ${
                  period === p
                    ? "bg-ink text-white"
                    : "text-ink-3 hover:text-ink"
                }`}
              >
                {p === "weekly" ? "Semanal" : "Mensal"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setSlideIdx(i)}
              className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                i === slideIdx
                  ? "bg-eqi/20 text-eqi"
                  : "text-ink-3 hover:text-ink"
              }`}
            >
              {i + 1}. {s.title}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoPlay((v) => !v)}
            className={`p-2 rounded-lg transition-all ${
              autoPlay
                ? "bg-eqi/20 text-eqi"
                : "bg-muted/30 hover:bg-muted/50 text-ink"
            }`}
            title={autoPlay ? "Pausar auto-advance" : "Auto-advance a cada 12s"}
          >
            {autoPlay ? <Pause size={16} weight="fill" /> : <Play size={16} weight="fill" />}
          </button>
          <button
            onClick={() => window.print()}
            className="p-2 rounded-lg bg-muted/30 hover:bg-muted/50 text-ink"
            title="Exportar como PDF"
          >
            <Printer size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-destructive/20 hover:bg-destructive/30 text-destructive"
            title="Fechar (Esc)"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Slide content —
          `items-start` (não center) evita que conteúdo alto seja cortado por cima.
          `py-8` maior pra ficar longe do header e setas.
          Com content curto, não prejudica: ainda fica próximo do topo mas centralizado horizontalmente. */}
      <div className="h-full pt-20 pb-20 px-12 flex items-start justify-center overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-6xl presentation-slide"
          >
            {current.render()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Setas de navegação (escondidas em print) */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-6 py-4 no-print">
        <button
          onClick={() => setSlideIdx((i) => Math.max(0, i - 1))}
          disabled={slideIdx === 0}
          className="p-3 rounded-full bg-muted/30 hover:bg-muted/50 disabled:opacity-30 transition-all"
        >
          <CaretLeft size={24} weight="bold" />
        </button>

        <span className="text-sm font-mono text-ink-3">
          {slideIdx + 1} / {slides.length}
        </span>

        <button
          onClick={() => setSlideIdx((i) => Math.min(slides.length - 1, i + 1))}
          disabled={slideIdx === slides.length - 1}
          className="p-3 rounded-full bg-muted/30 hover:bg-muted/50 disabled:opacity-30 transition-all"
        >
          <CaretRight size={24} weight="bold" />
        </button>
      </div>

      {/* Print: renderiza TODOS os slides em sequência (não só o atual) */}
      <div className="hidden print-show print-all-slides">
        {slides.map((s) => (
          <div key={s.id} className="presentation-slide-print">
            {s.render()}
          </div>
        ))}
      </div>

      {/* Modal de edição do foco com período + KPIs alvo */}
      <DirectionEditModal
        date={nextMonday}
        open={directionEditOpen}
        onClose={() => setDirectionEditOpen(false)}
      />
    </div>
  );
};

export default PresentationMode;
