import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import DashboardSidebar, { type DashboardView } from "@/components/dashboard/DashboardSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import Leaderboard from "@/components/dashboard/Leaderboard";
import KpiCards from "@/components/dashboard/KpiCards";
import WeeklyHeatmap from "@/components/dashboard/WeeklyHeatmap";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import PerformanceChart from "@/components/dashboard/PerformanceChart";
import ActivationHighlight from "@/components/dashboard/ActivationHighlight";
import BadgesPanel from "@/components/dashboard/BadgesPanel";
import AnnouncementTicker from "@/components/dashboard/AnnouncementTicker";
import TournamentCard from "@/components/dashboard/TournamentCard";
import TournamentFinishedOverlay from "@/components/dashboard/TournamentFinishedOverlay";
import { useActiveTournaments } from "@/hooks/useTournaments";
import { useTournamentFinishedStream } from "@/hooks/useTournamentFinishedStream";

// Lazy: views condicionais (não-overview) e modais carregam só quando o user navega.
// Reduz o bundle inicial e mantém a "Visão Geral" instantânea.
const DayView = lazy(() => import("@/components/dashboard/DayView"));
const DailyResults = lazy(() => import("@/components/dashboard/DailyResults"));
const KpiAnalytics = lazy(() => import("@/components/dashboard/KpiAnalytics"));
const SquadBet = lazy(() => import("@/components/dashboard/SquadBet"));
const PresentationMode = lazy(() => import("@/components/dashboard/PresentationMode"));
const AssessorManager = lazy(() => import("@/components/dashboard/AssessorManager"));
import { Presentation } from "lucide-react";
import { useAssessors } from "@/hooks/useAssessors";
import { useRankingStream } from "@/hooks/useRankingStream";
import { useSystemNotifications } from "@/hooks/useSystemNotifications";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

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
  results: "Ranking Geral",
  kpis: "KPIs & Insights",
  squad: "Squad Bet",
};

const VALID_VIEWS: ReadonlySet<View> = new Set(["overview", "daily", "results", "kpis", "squad"]);
const VALID_PERIODS: ReadonlySet<OverviewPeriod> = new Set(["daily", "weekly", "monthly", "semester"]);

function parseView(raw: string | null): View {
  return raw && VALID_VIEWS.has(raw as View) ? (raw as View) : "overview";
}
function parsePeriod(raw: string | null): OverviewPeriod {
  return raw && VALID_PERIODS.has(raw as OverviewPeriod) ? (raw as OverviewPeriod) : "weekly";
}

const Index = () => {
  const navigate = useNavigate();

  // Legacy: `/?tv=1` virou `/tv` público. Redireciona pra não quebrar bookmarks.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tv") === "1") {
      navigate("/tv", { replace: true });
    }
  }, [navigate]);

  // ─── URL state: view + period viram deep-linkáveis ────────────────────────
  // Permite compartilhar /?view=kpis&period=monthly e abrir direto na KPIs
  // com filtro mensal. Refresh mantém estado. Botão voltar do navegador
  // navega entre views.
  const [searchParams, setSearchParams] = useSearchParams();
  const view = parseView(searchParams.get("view"));
  const overviewPeriod = parsePeriod(searchParams.get("period"));

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
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const { assessors, addAssessor, removeAssessor } = useAssessors();
  const { data: activeTournaments = [] } = useActiveTournaments();
  const { event: finishedEvent, dismiss: dismissFinished } = useTournamentFinishedStream(true);
  const [showManager, setShowManager] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const overviewRange = rangeForPeriod(overviewPeriod);

  // Modo Apresentação: full-screen com slides pra reunião de fechamento
  const [presentationOpen, setPresentationOpen] = useState(false);

  // SSE: dashboard admin também recebe updates em tempo real pra Leaderboard
  // refletir upserts de qualquer origem (mesa de vendas, admin numa outra aba).
  useRankingStream(true);
  // Toasts contextuais quando eventos disparam (ex: assessor bate meta)
  useSystemNotifications(true);

  // Clica "Modo TV" na sidebar → abre `/tv` em nova aba (experiência ideal
  // pra TV da sala de vendas continuar rodando enquanto admin trabalha).
  const openTv = useCallback(() => {
    window.open("/tv", "_blank", "noopener,noreferrer");
  }, []);

  return (
    <div className="min-h-screen bg-background flex relative">
      {/* overflow-x-hidden NÃO pode ficar no wrapper: vira scroll container e
          quebra o `position: sticky` da sidebar (faz a sidebar scrollar junto
          com a página em vez de grudar no topo). Aplicado só no <main>. */}
      <div className="fixed inset-0 pointer-events-none bg-mesh" />

      <DashboardSidebar
        view={view}
        onViewChange={setView}
        onEnterTv={openTv}
        onOpenAssessors={() => setShowManager(true)}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      <main className="flex-1 min-w-0 flex flex-col overflow-x-hidden">
        <DashboardTopbar
          title={VIEW_LABELS[view]}
          onMenuClick={() => setMobileNavOpen(true)}
        />

        <div className="flex-1 p-5 space-y-4">
          {view === "overview" && (
            <div className="space-y-4">
              <AnnouncementTicker assessors={assessors} />

              {/* Filtro de período + botão Apresentação */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Período:</span>
                <div className="flex gap-1 bg-muted/20 rounded-lg p-1">
                  {OVERVIEW_PERIODS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setOverviewPeriod(opt.value)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                        overviewPeriod === opt.value
                          ? "bg-primary text-secondary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setPresentationOpen(true)}
                  className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 text-xs font-semibold transition-all"
                  title="Modo Apresentação — slides full-screen pra reunião de fechamento"
                >
                  <Presentation className="w-3.5 h-3.5" />
                  Apresentação
                </button>
              </div>

              {/* Torneios ativos — aparecem no topo da visão geral */}
              {activeTournaments.length > 0 && (
                <div className={`grid gap-4 ${activeTournaments.length === 1 ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2"}`}>
                  {activeTournaments.map((t) => (
                    <TournamentCard key={t.id} tournament={t} />
                  ))}
                </div>
              )}

              <KpiCards from={overviewRange.from} to={overviewRange.to} />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-4">
                  <Leaderboard assessors={assessors} />
                </div>
                <div className="lg:col-span-5 space-y-4">
                  <ActivationHighlight from={overviewRange.from} to={overviewRange.to} />
                  <PerformanceChart />
                  <BadgesPanel assessors={assessors} />
                </div>
                <div className="md:col-span-2 lg:col-span-3 space-y-4">
                  <WeeklyHeatmap assessors={assessors} />
                  <ActivityFeed />
                </div>
              </div>
            </div>
          )}

          <Suspense fallback={<InlineLoader />}>
            {view === "daily" && <DayView assessors={assessors} />}
            {view === "results" && <DailyResults assessors={assessors} />}
            {view === "kpis" && <KpiAnalytics assessors={assessors} />}
            {view === "squad" && <SquadBet assessors={assessors} />}
          </Suspense>
        </div>
      </main>

      {showManager && (
        <Suspense fallback={null}>
          <AssessorManager
            assessors={assessors}
            onAdd={addAssessor}
            onRemove={removeAssessor}
            onClose={() => setShowManager(false)}
          />
        </Suspense>
      )}

      {presentationOpen && (
        <Suspense fallback={null}>
          <PresentationMode
            assessors={assessors}
            onClose={() => setPresentationOpen(false)}
          />
        </Suspense>
      )}

      {/* Celebração fullscreen quando torneio finaliza (SSE tournament:finished) */}
      <TournamentFinishedOverlay event={finishedEvent} onDismiss={dismissFinished} />
    </div>
  );
};

// Loader inline simples pra fallback de Suspense em views lazy.
const InlineLoader = () => (
  <div className="flex items-center justify-center py-12">
    <div className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
  </div>
);

export default Index;
