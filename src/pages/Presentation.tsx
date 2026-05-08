import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CaretLeft,
  CaretRight,
  Play,
  Pause,
  X,
  Trophy,
  Warning,
  ChartLineUp,
  Medal,
  CornersOut,
  CornersIn,
  Handshake,
  Lightning,
  Users,
} from "@phosphor-icons/react";
import {
  useWeeklyRanking,
  useMonthlyRanking,
  useSemesterRanking,
} from "@/hooks/useRankings";
import {
  useQuarterlyRanking,
  useEvolution,
  useRiskAlerts,
  type RiskReason,
} from "@/hooks/useDashboardWidgets";
import { useBadges, useBadgeUnlocks } from "@/hooks/useBadges";
import { useAssessors } from "@/hooks/useAssessors";
import { useSquads } from "@/hooks/useSquads";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";
import { LevelBadge } from "@/components/ui/LevelBadge";
import { BadgeIcon } from "@/components/ui/BadgeIcon";
import { toLegacyLevel } from "@/lib/levelMeta";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const AUTO_ADVANCE_MS = 12_000;
// Cadência inserida entre Evolution e Achievements — Felipe (08/05/2026)
// pediu pra ser o slide-âncora do fechamento de semana: mostra reuniões
// agenda × realiza + ativação + cadência (volume) + total de leads.
const SLIDES = ["ranking", "evolution", "cadence", "achievements", "risk", "podium"] as const;
type SlideKey = typeof SLIDES[number];

const SLIDE_TITLES: Record<SlideKey, string> = {
  ranking: "Ranking do Período",
  evolution: "Evolução de Desempenho",
  cadence: "Cadência & Reuniões",
  achievements: "Conquistas",
  risk: "Alertas de Risco",
  podium: "Pódio",
};

type Period = "weekly" | "monthly" | "quarterly" | "semester";

const PERIOD_LABEL: Record<Period, string> = {
  weekly: "Semana",
  monthly: "Mês",
  quarterly: "Trimestre",
  semester: "Semestre",
};

const Presentation = () => {
  const navigate = useNavigate();
  const [slideIdx, setSlideIdx] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [period, setPeriod] = useState<Period>("weekly");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const slide = SLIDES[slideIdx];

  const next = () => setSlideIdx((i) => (i + 1) % SLIDES.length);
  const prev = () => setSlideIdx((i) => (i - 1 + SLIDES.length) % SLIDES.length);

  // Auto-advance
  const advanceRef = useRef<number | null>(null);
  useEffect(() => {
    if (!autoAdvance) {
      if (advanceRef.current) window.clearInterval(advanceRef.current);
      return;
    }
    advanceRef.current = window.setInterval(next, AUTO_ADVANCE_MS);
    return () => {
      if (advanceRef.current) window.clearInterval(advanceRef.current);
    };
  }, [autoAdvance]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "Escape") {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          navigate("/");
        }
      } else if (e.key.toLowerCase() === "f") {
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  // Track fullscreen state
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="border-b border-line bg-card px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="text-ink-3 hover:text-ink transition-colors"
            title="Voltar (Esc)"
          >
            <X size={18} weight="bold" />
          </button>
          <h1 className="text-base font-extrabold tracking-tight text-ink">
            Modo Apresentação
          </h1>
          <span className="text-[10px] text-ink-3 font-mono uppercase tracking-wider">
            ← / → ou espaço · F = fullscreen · Esc = sair
          </span>
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-2 bg-surface-2 rounded-md p-1">
          {(Object.keys(PERIOD_LABEL) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded text-xs font-bold transition ${
                period === p
                  ? "bg-ink text-white"
                  : "text-ink-3 hover:text-ink"
              }`}
            >
              {PERIOD_LABEL[p]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoAdvance((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
              autoAdvance
                ? "bg-eqi text-eqi-foreground"
                : "bg-surface-2 text-ink-2 hover:text-ink"
            }`}
            title="Liga/desliga auto-advance (12s por slide)"
          >
            {autoAdvance ? <Pause size={12} weight="bold" /> : <Play size={12} weight="bold" />}
            {autoAdvance ? "Pausar" : "Auto"}
          </button>
          <button
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-2 text-ink-2 hover:text-ink text-xs font-bold transition"
            title="Fullscreen (F)"
          >
            {isFullscreen ? <CornersIn size={12} weight="bold" /> : <CornersOut size={12} weight="bold" />}
          </button>
        </div>
      </header>

      {/* Slide indicator */}
      <div className="flex items-center justify-center gap-2 py-3 border-b border-line bg-card">
        {SLIDES.map((s, i) => (
          <button
            key={s}
            onClick={() => setSlideIdx(i)}
            className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-extrabold transition ${
              slide === s
                ? "bg-ink text-white"
                : "text-ink-3 hover:text-ink-2"
            }`}
          >
            {SLIDE_TITLES[s]}
          </button>
        ))}
      </div>

      {/* Slide content */}
      <main className="flex-1 overflow-y-auto p-8 max-w-[1400px] mx-auto w-full">
        {slide === "ranking" && <SlideRanking period={period} />}
        {slide === "evolution" && <SlideEvolution />}
        {slide === "cadence" && <SlideCadence period={period} />}
        {slide === "achievements" && <SlideAchievements />}
        {slide === "risk" && <SlideRisk />}
        {slide === "podium" && <SlidePodium period={period} />}
      </main>

      {/* Nav buttons */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-line bg-card">
        <button
          onClick={prev}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-surface-2 hover:bg-surface text-ink-2 hover:text-ink text-sm font-bold transition"
        >
          <CaretLeft size={14} weight="bold" /> Anterior
        </button>
        <span className="text-xs text-ink-3 font-mono">
          {slideIdx + 1} / {SLIDES.length}
        </span>
        <button
          onClick={next}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-ink hover:bg-ink/90 text-white text-sm font-bold transition"
        >
          Próximo <CaretRight size={14} weight="bold" />
        </button>
      </div>
    </div>
  );
};

export default Presentation;

// ─── Slides ──────────────────────────────────────────────────────────────────

function usePeriodRanking(period: Period) {
  const weekly = useWeeklyRanking();
  const monthly = useMonthlyRanking();
  const quarterly = useQuarterlyRanking();
  const semester = useSemesterRanking();
  if (period === "weekly") return weekly.data?.rankings ?? null;
  if (period === "monthly") return monthly.data?.rankings ?? null;
  if (period === "quarterly") return quarterly.data?.rankings ?? null;
  return semester.data?.rankings ?? null;
}

function SlideRanking({ period }: { period: Period }) {
  const rankings = usePeriodRanking(period);

  if (!rankings) {
    return <div className="text-center text-ink-3 py-12">Carregando ranking…</div>;
  }
  if (rankings.length === 0) {
    return <div className="text-center text-ink-3 py-12">Nenhum dado pro período.</div>;
  }

  return (
    <div>
      <h2 className="text-3xl font-extrabold tracking-tight text-ink mb-6 flex items-center gap-3">
        <Trophy size={28} weight="fill" className="text-gold-deep" />
        Ranking · {PERIOD_LABEL[period]}
      </h2>
      <div className="space-y-2">
        {rankings.slice(0, 10).map((r, i) => (
          <div
            key={r.assessor.id}
            className={`flex items-center gap-4 p-4 rounded-xl ${
              i === 0
                ? "bg-gold/10 border border-gold/30"
                : "bg-surface-2/50 border border-line"
            }`}
          >
            <span
              className={`font-mono font-extrabold w-12 text-2xl ${
                i === 0 ? "text-gold-deep" : "text-ink-3"
              }`}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <AssessorAvatar
              initials={r.assessor.initials}
              photoUrl={r.assessor.photoUrl}
              level={toLegacyLevel(r.assessor.level).toLowerCase() as "bronze" | "silver" | "gold"}
              size={48}
            />
            <div className="flex-1 min-w-0">
              <p className="text-lg font-extrabold tracking-tight text-ink">{r.assessor.name}</p>
              <div className="mt-1">
                <LevelBadge level={r.assessor.level} size="sm" />
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-mono font-extrabold text-ink">
                {Math.round(r.rollup.points).toLocaleString("pt-BR")}
              </p>
              <p className="text-xs text-ink-3 font-mono uppercase tracking-wider">pts</p>
            </div>
            <div className="text-right border-l border-line pl-4 ml-2">
              <p
                className={`text-2xl font-mono font-extrabold ${
                  r.rollup.weeklyGoalPercent >= 100 ? "text-eqi" : "text-ink-3"
                }`}
              >
                {r.rollup.weeklyGoalPercent}%
              </p>
              <p className="text-xs text-ink-3 font-mono uppercase tracking-wider">meta</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideEvolution() {
  const { data, isLoading } = useEvolution(8);
  if (isLoading || !data) {
    return <div className="text-center text-ink-3 py-12">Carregando evolução…</div>;
  }

  return (
    <div>
      <h2 className="text-3xl font-extrabold tracking-tight text-ink mb-6 flex items-center gap-3">
        <ChartLineUp size={28} weight="bold" className="text-primary" />
        Evolução de Desempenho
      </h2>
      <p className="text-sm text-ink-3 mb-4">
        Comparação semana atual vs anterior + tendência das últimas 8 semanas.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {data.assessors.slice(0, 8).map((a) => {
          const trendMax = Math.max(1, ...a.trend.map((t) => t.points));
          return (
            <div key={a.assessorId} className="rounded-xl border border-line bg-card p-4">
              <div className="flex items-center gap-3 mb-3">
                <AssessorAvatar initials={a.assessorInitials} photoUrl={a.photoUrl} size={32} />
                <p className="text-base font-extrabold text-ink truncate flex-1">{a.assessorName}</p>
                {a.deltaPercent !== null && (
                  <span
                    className={`text-xs font-mono font-extrabold ${
                      a.deltaPercent >= 0 ? "text-eqi" : "text-destructive"
                    }`}
                  >
                    {a.deltaPercent >= 0 ? "▲" : "▼"} {Math.abs(a.deltaPercent)}%
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-ink-3 font-bold">Semana atual</p>
                  <p className="text-2xl font-mono font-extrabold text-ink">
                    {Math.round(a.pointsCurrentWeek)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-ink-3 font-bold">Anterior</p>
                  <p className="text-2xl font-mono font-extrabold text-ink-3">
                    {Math.round(a.pointsPreviousWeek)}
                  </p>
                </div>
              </div>
              {/* Sparkline simples (barras inline) */}
              <div className="flex items-end gap-1 h-12">
                {a.trend.map((t, i) => {
                  const h = (t.points / trendMax) * 100;
                  const isLast = i === a.trend.length - 1;
                  return (
                    <div
                      key={t.weekStart}
                      className={`flex-1 rounded-sm ${isLast ? "bg-primary" : "bg-surface-2"}`}
                      style={{ height: `${Math.max(4, h)}%` }}
                      title={`${t.weekStart}: ${Math.round(t.points)} pts`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Slide-âncora do fechamento de semana (Felipe, 08/05/2026).
 *
 * Mostra a história "agenda → realiza → ativa", reforçada pela cadência em
 * volume (não só %) e o total de leads disponíveis no funil. Cada linha por
 * assessor (top 8 por pontos do período) com:
 *   - Reuniões: agendadas (kpi.reunioes) → realizadas (kpi.reunioes_realizadas)
 *     com taxa de conversão calculada
 *   - Ativações: kpi.ativacao_conta absoluto
 *   - Cadência: kpiPercents.cadencia (média % de uso da lista) + volume real
 *     (assessor.totalLeads)
 *
 * Footer: somatórios da equipe — pra Felipe abrir reunião dizendo "esta
 * semana batemos X reuniões e Y ativações em N leads disponíveis".
 */
function SlideCadence({ period }: { period: Period }) {
  const rankings = usePeriodRanking(period);
  const { assessors } = useAssessors();

  if (!rankings) {
    return <div className="text-center text-ink-3 py-12">Carregando dados…</div>;
  }
  if (rankings.length === 0) {
    return <div className="text-center text-ink-3 py-12">Sem dados pro período.</div>;
  }

  const assessorsById = new Map(assessors.map((a) => [a.id, a]));

  // Top 8 por pontos pra caber bem no slide de TV/projetor.
  const top = rankings.slice(0, 8);

  // Totais da equipe inteira (não só top 8) — Felipe usa pra abrir reunião.
  const totals = rankings.reduce(
    (acc, r) => {
      acc.reunioesAg += r.rollup.kpiTotals?.reunioes ?? 0;
      acc.reunioesReal += r.rollup.kpiTotals?.reunioes_realizadas ?? 0;
      acc.ativacoes += r.rollup.kpiTotals?.ativacao_conta ?? 0;
      acc.leadsTotal += assessorsById.get(r.assessor.id)?.totalLeads ?? 0;
      return acc;
    },
    { reunioesAg: 0, reunioesReal: 0, ativacoes: 0, leadsTotal: 0 },
  );
  const conversaoTime =
    totals.reunioesAg > 0 ? Math.round((totals.reunioesReal / totals.reunioesAg) * 100) : 0;

  return (
    <div>
      <h2 className="text-3xl font-extrabold tracking-tight text-ink mb-2 flex items-center gap-3">
        <Handshake size={28} weight="bold" className="text-primary" />
        Cadência & Reuniões · {PERIOD_LABEL[period]}
      </h2>
      <p className="text-sm text-ink-3 mb-5">
        Reuniões agendadas → realizadas → ativações de conta. Cadência mostrada em
        volume real (lista de leads cadastrada).
      </p>

      {/* KPIs da equipe inteira (header cards) */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <KpiCard
          icon={<Handshake size={16} weight="bold" />}
          label="Reuniões"
          value={`${totals.reunioesReal}/${totals.reunioesAg}`}
          sub={`${conversaoTime}% conversão`}
          tone="primary"
        />
        <KpiCard
          icon={<Lightning size={16} weight="bold" />}
          label="Ativações"
          value={totals.ativacoes.toString()}
          sub="contas ativadas"
          tone="eqi"
        />
        <KpiCard
          icon={<Users size={16} weight="bold" />}
          label="Leads na base"
          value={totals.leadsTotal.toLocaleString("pt-BR")}
          sub={`${rankings.length} assessores`}
          tone="ink"
        />
        <KpiCard
          icon={<ChartLineUp size={16} weight="bold" />}
          label="Cadência média"
          value={`${avgPercent(rankings, "cadencia")}%`}
          sub="da lista trabalhada"
          tone="gold"
        />
      </div>

      {/* Tabela por assessor */}
      <div className="rounded-xl border border-line bg-card overflow-hidden">
        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-2 border-b border-line bg-surface-2 text-[10px] uppercase tracking-wider text-ink-3 font-extrabold">
          <span>Assessor</span>
          <span className="text-center">Reuniões (real/ag)</span>
          <span className="text-center">Ativações</span>
          <span className="text-center">Cadência</span>
          <span className="text-center">Leads na lista</span>
        </div>
        {top.map((r) => {
          const reunAg = r.rollup.kpiTotals?.reunioes ?? 0;
          const reunReal = r.rollup.kpiTotals?.reunioes_realizadas ?? 0;
          const conv = reunAg > 0 ? Math.round((reunReal / reunAg) * 100) : 0;
          const ativ = r.rollup.kpiTotals?.ativacao_conta ?? 0;
          const cad = Math.round(r.rollup.kpiPercents?.cadencia ?? 0);
          const lista = assessorsById.get(r.assessor.id)?.totalLeads ?? 0;
          return (
            <div
              key={r.assessor.id}
              className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 border-b border-line/50 last:border-b-0 items-center"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <AssessorAvatar
                  initials={r.assessor.initials}
                  photoUrl={r.assessor.photoUrl}
                  size={32}
                />
                <span className="text-sm font-bold text-ink truncate">{r.assessor.name}</span>
              </div>
              <div className="text-center">
                <span className="font-mono font-extrabold text-base text-ink">
                  {reunReal}
                  <span className="text-ink-3 font-bold">/{reunAg}</span>
                </span>
                <p
                  className={`text-[10px] font-bold ${
                    conv >= 70 ? "text-eqi" : conv >= 40 ? "text-chart-orange" : "text-destructive"
                  }`}
                >
                  {reunAg > 0 ? `${conv}%` : "—"}
                </p>
              </div>
              <div className="text-center">
                <span
                  className={`font-mono font-extrabold text-lg ${
                    ativ >= 3 ? "text-eqi" : ativ >= 1 ? "text-ink" : "text-ink-3"
                  }`}
                >
                  {ativ}
                </span>
              </div>
              <div className="text-center">
                <span
                  className={`font-mono font-extrabold text-base ${
                    cad >= 70 ? "text-eqi" : cad >= 50 ? "text-chart-orange" : "text-destructive"
                  }`}
                >
                  {cad}%
                </span>
                <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden mx-auto max-w-[80px]">
                  <div
                    className={`h-full ${
                      cad >= 70 ? "bg-eqi" : cad >= 50 ? "bg-chart-orange" : "bg-destructive"
                    }`}
                    style={{ width: `${Math.min(100, cad)}%` }}
                  />
                </div>
              </div>
              <div className="text-center">
                <span className="font-mono font-bold text-base text-ink-2">
                  {lista.toLocaleString("pt-BR")}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {rankings.length > top.length && (
        <p className="mt-3 text-xs text-ink-3 text-center font-mono">
          Mostrando top {top.length} de {rankings.length} assessores · totais consideram todos.
        </p>
      )}
    </div>
  );
}

/** Helper card pra header do slide de cadência. */
function KpiCard({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone: "primary" | "eqi" | "ink" | "gold";
}) {
  const toneClass: Record<typeof tone, string> = {
    primary: "border-primary/30 bg-primary/5 text-primary",
    eqi: "border-eqi/30 bg-eqi/5 text-eqi",
    ink: "border-line bg-surface-2 text-ink",
    gold: "border-gold/30 bg-gold/5 text-gold-deep",
  };
  return (
    <div className={`rounded-xl border p-4 ${toneClass[tone]}`}>
      <div className="flex items-center gap-2 mb-2 opacity-80">
        {icon}
        <span className="text-[10px] uppercase tracking-wider font-extrabold">{label}</span>
      </div>
      <p className="text-3xl font-mono font-extrabold leading-none">{value}</p>
      <p className="text-[10px] mt-1 opacity-70 font-semibold">{sub}</p>
    </div>
  );
}

/** Média de um kpiPercents.{key} considerando só assessores com valor > 0. */
function avgPercent(
  rankings: NonNullable<ReturnType<typeof usePeriodRanking>>,
  key: string,
): number {
  const vals = rankings
    .map((r) => r.rollup.kpiPercents?.[key] ?? 0)
    .filter((v) => v > 0);
  if (vals.length === 0) return 0;
  return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
}

function SlideAchievements() {
  const { data: badges } = useBadges();
  const { data: unlocks } = useBadgeUnlocks();
  const { assessors } = useAssessors();
  const { data: squadsData } = useSquads();

  // Filtra só conquistas das últimas 4 semanas pra mostrar "frescas".
  const cutoff = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 28);
    return d;
  }, []);

  const recent = (unlocks ?? [])
    .filter((u) => u.unlockedAt && new Date(u.unlockedAt) >= cutoff)
    .sort((a, b) => (a.unlockedAt < b.unlockedAt ? 1 : -1));

  const badgesById = new Map((badges ?? []).map((b) => [b.id, b]));
  const assessorsById = new Map(assessors.map((a) => [a.id, a]));
  const squadsById = new Map((squadsData ?? []).map((s) => [s.id, s]));

  if (recent.length === 0) {
    return (
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-ink mb-6 flex items-center gap-3">
          <Medal size={28} weight="fill" className="text-gold-deep" />
          Conquistas
        </h2>
        <div className="text-center text-ink-3 py-12">
          Nenhuma conquista nas últimas 4 semanas. Cron semanal popula automaticamente toda segunda 00:35 BRT.
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-extrabold tracking-tight text-ink mb-6 flex items-center gap-3">
        <Medal size={28} weight="fill" className="text-gold-deep" />
        Conquistas Recentes
        <span className="text-sm text-ink-3 font-normal ml-2">
          ({recent.length} nas últimas 4 semanas)
        </span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {recent.slice(0, 12).map((u) => {
          const badge = badgesById.get(u.badgeId);
          if (!badge) return null;
          const winnerName =
            (u.assessorId && assessorsById.get(u.assessorId)?.name) ??
            (u.squadId && squadsById.get(u.squadId)?.name) ??
            "—";
          return (
            <div
              key={u.id}
              className="flex items-center gap-3 p-4 rounded-xl bg-gold/5 border border-gold/30"
            >
              <div className="w-12 h-12 rounded-full bg-gold/15 flex items-center justify-center shrink-0">
                <BadgeIcon slug={badge.icon} size={22} className="text-gold-deep" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-extrabold text-ink truncate">{badge.name}</p>
                <p className="text-xs text-ink-3 truncate">
                  {winnerName} · {u.periodKey}
                </p>
              </div>
              <span className="text-[10px] text-ink-3 font-mono">
                {format(parseISO(u.unlockedAt), "dd/MM", { locale: ptBR })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const REASON_LABELS: Record<RiskReason, string> = {
  pending_penalty: "Penalty pendente",
  below_meta: "Meta abaixo de 70%",
  level_drop: "Caiu de nível",
};

function SlideRisk() {
  const { data, isLoading } = useRiskAlerts();

  if (isLoading || !data) {
    return <div className="text-center text-ink-3 py-12">Carregando alertas…</div>;
  }
  if (data.alerts.length === 0) {
    return (
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-ink mb-6 flex items-center gap-3">
          <Warning size={28} weight="fill" className="text-eqi" />
          Alertas de Risco
        </h2>
        <div className="text-center text-eqi font-bold py-12">
          Nenhum alerta no momento. Time tá rodando bem.
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-extrabold tracking-tight text-ink mb-6 flex items-center gap-3">
        <Warning size={28} weight="fill" className="text-destructive" />
        Alertas de Risco
        <span className="text-sm text-ink-3 font-normal ml-2">
          ({data.alerts.length} assessores em atenção)
        </span>
      </h2>
      <div className="space-y-3">
        {data.alerts.map((alert) => (
          <div
            key={alert.assessorId}
            className={`p-4 rounded-xl border-l-4 ${
              alert.reasons.length === 3
                ? "bg-destructive/10 border-l-destructive border-y border-r border-destructive/30"
                : alert.reasons.length === 2
                ? "bg-orange-100 border-l-orange-500 border-y border-r border-orange-300"
                : "bg-amber-100/50 border-l-amber-500 border-y border-r border-amber-300"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <AssessorAvatar
                initials={alert.assessorInitials}
                photoUrl={alert.photoUrl}
                size={36}
              />
              <p className="text-base font-extrabold text-ink flex-1">{alert.assessorName}</p>
              <span className="text-xs font-bold uppercase tracking-wider text-ink-3">
                {alert.reasons.length} {alert.reasons.length === 1 ? "motivo" : "motivos"}
              </span>
            </div>
            <ul className="space-y-1 ml-12">
              {alert.reasons.map((r) => (
                <li key={r} className="text-sm text-ink-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                  <span className="font-semibold">{REASON_LABELS[r]}</span>
                  {r === "pending_penalty" && alert.details.pendingPenalties > 0 && (
                    <span className="text-xs text-ink-3 font-mono">
                      ({alert.details.pendingPenalties} pendência{alert.details.pendingPenalties !== 1 ? "s" : ""})
                    </span>
                  )}
                  {r === "below_meta" && alert.details.weeklyGoalPercent !== null && (
                    <span className="text-xs text-ink-3 font-mono">
                      ({alert.details.weeklyGoalPercent}%)
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlidePodium({ period }: { period: Period }) {
  const rankings = usePeriodRanking(period);

  if (!rankings || rankings.length < 3) {
    return (
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-ink mb-6 flex items-center gap-3">
          <Trophy size={28} weight="fill" className="text-gold-deep" />
          Pódio · {PERIOD_LABEL[period]}
        </h2>
        <div className="text-center text-ink-3 py-12">
          Sem assessores suficientes pra montar pódio.
        </div>
      </div>
    );
  }

  const [first, second, third] = rankings;

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-4xl font-extrabold tracking-tight text-ink mb-12 flex items-center gap-3">
        <Trophy size={32} weight="fill" className="text-gold-deep" />
        Pódio · {PERIOD_LABEL[period]}
      </h2>
      <div className="flex items-end gap-6 w-full justify-center">
        {/* 2º */}
        <PodiumPlace position={2} entry={second} barColor="bg-silver/30" textColor="text-silver" height={180} />
        {/* 1º */}
        <PodiumPlace position={1} entry={first} barColor="bg-gold/40" textColor="text-gold-deep" height={240} highlight />
        {/* 3º */}
        <PodiumPlace position={3} entry={third} barColor="bg-bronze/30" textColor="text-bronze" height={140} />
      </div>
    </div>
  );
}

function PodiumPlace({
  position,
  entry,
  barColor,
  textColor,
  height,
  highlight,
}: {
  position: number;
  entry: ReturnType<typeof useWeeklyRanking>["data"] extends infer T
    ? T extends { rankings: Array<infer R> }
      ? R
      : never
    : never;
  barColor: string;
  textColor: string;
  height: number;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col items-center w-48">
      <AssessorAvatar
        initials={entry.assessor.initials}
        photoUrl={entry.assessor.photoUrl}
        level={toLegacyLevel(entry.assessor.level).toLowerCase() as "bronze" | "silver" | "gold"}
        size={highlight ? 96 : 72}
      />
      <p className={`text-lg font-extrabold tracking-tight mt-3 text-center ${highlight ? "text-2xl" : ""} text-ink`}>
        {entry.assessor.name}
      </p>
      <p className={`text-3xl font-mono font-extrabold mt-1 ${textColor}`}>
        {Math.round(entry.rollup.points).toLocaleString("pt-BR")}
      </p>
      <p className="text-[10px] uppercase tracking-wider text-ink-3 font-bold">pts</p>
      <div className="mt-2 mb-3">
        <LevelBadge level={entry.assessor.level} size="sm" />
      </div>
      <div
        className={`w-full ${barColor} rounded-t-xl border-t border-x border-line/40 flex items-start justify-center pt-3`}
        style={{ height: `${height}px` }}
      >
        <p className={`text-7xl font-mono font-extrabold ${textColor} opacity-50`}>
          {position}
        </p>
      </div>
    </div>
  );
}
