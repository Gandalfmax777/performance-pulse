import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { type DashboardView } from "@/components/dashboard/DashboardSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import { AppShellLayout } from "@/components/layouts/AppShellLayout";
import Leaderboard from "@/components/dashboard/Leaderboard";
import HeroMetricStrip from "@/components/dashboard/HeroMetricStrip";
import { OverviewKpiGrid } from "@/components/dashboard/OverviewKpiGrid";
import { ScheduleStripCard } from "@/components/dashboard/ScheduleStripCard";
import { AnnouncementsCard } from "@/components/dashboard/AnnouncementsCard";
import { InsightFeaturedCard } from "@/components/dashboard/InsightFeaturedCard";
import TournamentSidebarCard from "@/components/dashboard/TournamentSidebarCard";
import AnnouncementTicker from "@/components/dashboard/AnnouncementTicker";
import TournamentFinishedOverlay from "@/components/dashboard/TournamentFinishedOverlay";
import { useTournamentFinishedStream } from "@/hooks/useTournamentFinishedStream";

// Lazy: views condicionais carregam só quando o user navega.
// `daily`      migrou para /por-dia      (PR redesign-por-dia)
// `results`    migrou para /ranking      (PR redesign-ranking)
// `kpis`       migrou para /kpis         (PR redesign-kpis)
// `squad`      migrou para /squad-bet    (PR redesign-squad-bet)
// `tournament` migrou para /torneio      (PR redesign-torneio)
// `team`       migrou para /assessores   (PR redesign-assessores)
// Index agora só renderiza `overview` (Visão Geral). PresentationMode
// continua aqui porque é um modal aberto pelo botão "Apresentação" na
// topbar do overview.
const PresentationMode = lazy(() => import("@/components/dashboard/PresentationMode"));

import { PresentationChart, Television } from "@phosphor-icons/react";
import { useAssessors } from "@/hooks/useAssessors";
import { LoadingState, ErrorState } from "@/components/shared";
import { useRankingStream } from "@/hooks/useRankingStream";
import { useSystemNotifications } from "@/hooks/useSystemNotifications";
import { useOpenTv } from "@/hooks/useOpenTv";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { DateRangePicker } from "@/components/ui/DateRangePicker";

type OverviewPeriod = "daily" | "weekly" | "monthly" | "semester";

const OVERVIEW_PERIODS: { value: OverviewPeriod; label: string }[] = [
  { value: "daily", label: "Diário" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "semester", label: "Semestral" },
];

function rangeForPeriod(period: OverviewPeriod): { from: string; to: string } {
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
      const m = now.getMonth();
      const semStart = m < 6 ? new Date(now.getFullYear(), 0, 1) : new Date(now.getFullYear(), 6, 1);
      const semEnd = m < 6 ? new Date(now.getFullYear(), 5, 30) : new Date(now.getFullYear(), 11, 31);
      return { from: fmt(semStart), to: fmt(semEnd) };
    }
  }
}

type View = DashboardView;

const VIEW_LABELS: Record<View, string> = {
  overview: "Visão Geral",
  daily: "Por Dia",
  results: "Ranking",
  kpis: "KPIs",
  squad: "Squad Bet",
  tournament: "Torneio",
  team: "Assessores",
};

const VIEW_EYEBROWS: Partial<Record<View, string>> = {
  overview: undefined,
  daily: "VISÃO POR DIA",
  results: undefined,
  kpis: "ANÁLISE CONSOLIDADA",
  squad: "ROUND ATIVO",
  tournament: "TORNEIO ATIVO",
  team: "ADMINISTRAÇÃO",
};

// Index só aceita `overview` agora — todas as outras views viraram rotas
// próprias do redesign (ver comentário do bloco lazy acima). Permanecem
// no type DashboardView porque a sidebar usa as keys para active state
// legacy enquanto rotas novas convivem com `?view=` antigo.
const VALID_VIEWS: ReadonlySet<View> = new Set(["overview"]);
const VALID_PERIODS: ReadonlySet<OverviewPeriod> = new Set(["daily", "weekly", "monthly", "semester"]);

function parseView(raw: string | null): View {
  return raw && VALID_VIEWS.has(raw as View) ? (raw as View) : "overview";
}
function parsePeriod(raw: string | null): OverviewPeriod {
  return raw && VALID_PERIODS.has(raw as OverviewPeriod) ? (raw as OverviewPeriod) : "weekly";
}

const Index = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useCurrentUser();

  // Legacy: `/?tv=1` virou `/tv?tenant=<slug>` público
  // Legacy: views internas que viraram rotas próprias do redesign
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tv") === "1") {
      navigate(tenantSlug ? `/tv?tenant=${tenantSlug}` : "/tv", { replace: true });
      return;
    }
    const v = params.get("view");
    if (v === "daily") navigate("/por-dia", { replace: true });
    else if (v === "results") navigate("/ranking", { replace: true });
    else if (v === "kpis") navigate("/kpis", { replace: true });
    else if (v === "squad") navigate("/squad-bet", { replace: true });
    else if (v === "tournament") navigate("/torneio", { replace: true });
    else if (v === "team") navigate("/assessores", { replace: true });
  }, [navigate, tenantSlug]);

  const [searchParams, setSearchParams] = useSearchParams();
  const view = parseView(searchParams.get("view"));
  const overviewPeriod = parsePeriod(searchParams.get("period"));
  // Range custom (DateRangePicker) tem precedência sobre period tab.
  // Se ambos `from` e `to` estiverem nos URL params, usa o custom range
  // e o period tab fica deselecionado.
  const customFrom = searchParams.get("from");
  const customTo = searchParams.get("to");
  const usingCustomRange = !!(customFrom && customTo);

  const setView = useCallback((v: View) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set("view", v);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const setOverviewPeriod = useCallback((p: OverviewPeriod) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set("period", p);
      // Period tab clicado → limpa custom range
      next.delete("from");
      next.delete("to");
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const setCustomRange = useCallback((range: { from: string; to: string }) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set("from", range.from);
      next.set("to", range.to);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const { assessors, isLoading: assessorsLoading, isError: assessorsError, refetch: refetchAssessors } = useAssessors();
  const { event: finishedEvent, dismiss: dismissFinished } = useTournamentFinishedStream(true);
  const overviewRange = usingCustomRange
    ? { from: customFrom!, to: customTo! }
    : rangeForPeriod(overviewPeriod);

  const [presentationOpen, setPresentationOpen] = useState(false);

  useRankingStream(true);
  useSystemNotifications(true);

  const openTv = useOpenTv();

  const openPresentation = useCallback(() => {
    window.open("/presentation", "_blank", "noopener,noreferrer");
  }, []);

  // Title por view (legacy — Index só renderiza overview/team agora; demais
  // viraram rotas próprias do redesign).
  const titleFor = (v: View): string => VIEW_LABELS[v];

  // Subtitle (Index só renderiza overview agora — demais viraram rotas próprias).
  // Reflete o range ativo (period preset ou custom range).
  const subtitleFor = (v: View): string | undefined => {
    if (v === "overview") {
      const fromD = new Date(overviewRange.from);
      const toD = new Date(overviewRange.to);
      const fromLabel = format(fromD, "dd MMM");
      const toLabel = format(toD, "dd MMM");
      const periodLabel =
        usingCustomRange
          ? "Período customizado"
          : overviewPeriod === "daily"
          ? "Hoje"
          : overviewPeriod === "weekly"
          ? "Semana atual"
          : overviewPeriod === "monthly"
          ? "Mês atual"
          : "Semestre atual";
      return `${periodLabel} · ${fromLabel} — ${toLabel} · ${assessors.length} assessores`;
    }
    return undefined;
  };

  // Period tabs render no slot `actions` da TopBar (segue mockup).
  // Active state vai pra "none" quando há custom range — usuário escolheu
  // datas livremente e nenhuma preset bate.
  const periodTabs = (
    <div className="flex gap-1 p-[3px] bg-surface-2 rounded-[8px] border border-line">
      {OVERVIEW_PERIODS.map((opt) => {
        const isActive = !usingCustomRange && overviewPeriod === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setOverviewPeriod(opt.value)}
            className={`px-3 py-[5px] rounded-[5px] text-xs font-semibold transition-all ${
              isActive ? "bg-ink text-white" : "text-ink-2 hover:text-ink"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );

  const datePickerBtn = (
    <DateRangePicker
      value={overviewRange}
      onChange={setCustomRange}
      className="h-[34px] px-3 text-xs"
    />
  );

  const presentationBtn = (
    <button
      onClick={() => setPresentationOpen(true)}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[8px] border border-line bg-surface text-ink-2 hover:bg-surface-2 hover:text-ink text-xs font-semibold transition-all"
      title="Modo Apresentação — slides full-screen"
    >
      <PresentationChart size={14} />
      Apresentação
    </button>
  );

  const tvBtn = (
    <button
      onClick={openTv}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold transition-all"
      title="Modo TV — abre em nova aba"
    >
      <Television size={14} weight="bold" />
      Modo TV
    </button>
  );

  const topActionsByView = (v: View): React.ReactNode => {
    if (v === "overview") {
      return (
        <>
          {periodTabs}
          {datePickerBtn}
          {presentationBtn}
          {tvBtn}
        </>
      );
    }
    return null;
  };

  return (
    <>
      <AppShellLayout
        sidebarView={view}
        onEnterTv={openTv}
        onEnterPresentation={openPresentation}
        renderTopbar={({ openMobileNav }) => (
          <DashboardTopbar
            eyebrow={VIEW_EYEBROWS[view]}
            title={titleFor(view)}
            subtitle={subtitleFor(view)}
            actions={topActionsByView(view)}
            onMenuClick={openMobileNav}
          />
        )}
      >
        {view === "overview" && assessorsError && assessors.length === 0 ? (
          <ErrorState
            message="Falha ao carregar o dashboard. Verifique a conexão e tente de novo."
            onRetry={refetchAssessors}
          />
        ) : view === "overview" && assessorsLoading && assessors.length === 0 ? (
          <LoadingState label="Carregando dashboard…" />
        ) : (
          view === "overview" && (
            <>
              {/* AnnouncementTicker continua acima do hero — feature de
                  marquee animado (não é o card "Avisos da mesa" abaixo). */}
              <AnnouncementTicker assessors={assessors} />

              {/* Hero KPI strip 3-col (alinha com Dashboard.html) */}
              <HeroMetricStrip from={overviewRange.from} to={overviewRange.to} />

              {/* KPIs do período — grid 6 tiles flat */}
              <OverviewKpiGrid from={overviewRange.from} to={overviewRange.to} />

              {/* Linha 2-col 1.3fr | 1fr: Ranking top 10 | (Torneio + Avisos) */}
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-[1.3fr_1fr]">
                <Leaderboard assessors={assessors} />
                <div className="flex flex-col gap-4">
                  <TournamentSidebarCard onClick={() => navigate("/torneio")} />
                  <AnnouncementsCard />
                </div>
              </div>

              {/* Linha 2-col 1fr | 1fr: Cronograma | Análise IA */}
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                <ScheduleStripCard />
                <InsightFeaturedCard />
              </div>
            </>
          )
        )}

      </AppShellLayout>

      {/* Modais top-level — irmãos do shell porque usam portais. */}
      {presentationOpen && (
        <Suspense fallback={null}>
          <PresentationMode
            assessors={assessors}
            onClose={() => setPresentationOpen(false)}
          />
        </Suspense>
      )}

      <TournamentFinishedOverlay event={finishedEvent} onDismiss={dismissFinished} />
    </>
  );
};

export default Index;
