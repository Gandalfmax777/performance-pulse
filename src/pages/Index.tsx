import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import DashboardSidebar, { type DashboardView } from "@/components/dashboard/DashboardSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import Leaderboard from "@/components/dashboard/Leaderboard";
import HeroMetricStrip from "@/components/dashboard/HeroMetricStrip";
import WeeklyCadenceChart from "@/components/dashboard/WeeklyCadenceChart";
import KpiGoalsList from "@/components/dashboard/KpiGoalsList";
import TournamentSidebarCard from "@/components/dashboard/TournamentSidebarCard";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import AnnouncementTicker from "@/components/dashboard/AnnouncementTicker";
import TournamentCard from "@/components/dashboard/TournamentCard";
import TournamentFinishedOverlay from "@/components/dashboard/TournamentFinishedOverlay";
import { SectionCard } from "@/components/shared";
import { useActiveTournaments } from "@/hooks/useTournaments";
import { useTournamentFinishedStream } from "@/hooks/useTournamentFinishedStream";

// Lazy: views condicionais carregam só quando o user navega
const DayView = lazy(() => import("@/components/dashboard/DayView"));
const DailyResults = lazy(() => import("@/components/dashboard/DailyResults"));
const KpiAnalytics = lazy(() => import("@/components/dashboard/KpiAnalytics"));
const SquadBet = lazy(() => import("@/components/dashboard/SquadBet"));
const PresentationMode = lazy(() => import("@/components/dashboard/PresentationMode"));
const AssessorManager = lazy(() => import("@/components/dashboard/AssessorManager"));
const AssessorProfile = lazy(() => import("@/components/dashboard/AssessorProfile"));
const TeamScreen = lazy(() => import("@/components/dashboard/TeamScreen"));

import { PresentationChart, Plus } from "@phosphor-icons/react";
import { useAssessors } from "@/hooks/useAssessors";
import { useCurrentUser } from "@/hooks/useCurrentUser";
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

const VALID_VIEWS: ReadonlySet<View> = new Set([
  "overview", "daily", "results", "kpis", "squad", "tournament", "team",
]);
const VALID_PERIODS: ReadonlySet<OverviewPeriod> = new Set(["daily", "weekly", "monthly", "semester"]);

function parseView(raw: string | null): View {
  return raw && VALID_VIEWS.has(raw as View) ? (raw as View) : "overview";
}
function parsePeriod(raw: string | null): OverviewPeriod {
  return raw && VALID_PERIODS.has(raw as OverviewPeriod) ? (raw as OverviewPeriod) : "weekly";
}

const Index = () => {
  const navigate = useNavigate();

  // Legacy: `/?tv=1` virou `/tv` público
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tv") === "1") {
      navigate("/tv", { replace: true });
    }
  }, [navigate]);

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
  const { user } = useCurrentUser();
  const { data: activeTournaments = [] } = useActiveTournaments();
  const { event: finishedEvent, dismiss: dismissFinished } = useTournamentFinishedStream(true);
  const [showManager, setShowManager] = useState(false);
  // Profile modal aberto a partir do TeamScreen — clicar em um card de
  // assessor abre o AssessorProfile com os dados dele.
  const [selectedProfile, setSelectedProfile] = useState<Parameters<typeof AssessorProfile>[0]["assessor"] | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const overviewRange = rangeForPeriod(overviewPeriod);

  const [presentationOpen, setPresentationOpen] = useState(false);

  useRankingStream(true);
  useSystemNotifications(true);

  const openTv = useCallback(() => {
    window.open("/tv", "_blank", "noopener,noreferrer");
  }, []);

  const openPresentation = useCallback(() => {
    window.open("/presentation", "_blank", "noopener,noreferrer");
  }, []);

  // Title custom por view — geralmente vem de VIEW_LABELS, mas Torneio
  // usa o nome do round atual (ex: "Liga das Ativações") quando há torneio
  // ativo, seguindo o artboard TournamentScreen.
  const titleFor = (v: View): string => {
    if (v === "tournament" && activeTournaments[0]) {
      return activeTournaments[0].roundLabel;
    }
    return VIEW_LABELS[v];
  };

  // Subtitle por view (segue artboards do design)
  const subtitleFor = (v: View): string | undefined => {
    if (v === "overview") {
      const week = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "dd MMM");
      const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "dd MMM");
      return `Semana atual · ${week} — ${weekEnd} · ${assessors.length} assessores`;
    }
    if (v === "results") return "Atualizado em tempo real";
    if (v === "kpis") return "Funil completo · todos os assessores";
    if (v === "squad") return "Squads contra squads. Quem cumprir mais % da meta combinada leva o pote.";
    if (v === "tournament") {
      const t = activeTournaments[0];
      if (!t) return "Sem torneio ativo no momento.";
      const monthLabel = format(new Date(t.startDate), "MMMM");
      return `${monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)} · ${t.scope === "INDIVIDUAL" ? "Individual" : "Por squad"}`;
    }
    if (v === "team") return `Gerencie a mesa · ${assessors.length} ativos`;
    return undefined;
  };

  // Period tabs render no slot `actions` da TopBar (segue mockup)
  const periodTabs = (
    <div className="flex gap-1 p-[3px] bg-surface-2 rounded-[8px] border border-line">
      {OVERVIEW_PERIODS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setOverviewPeriod(opt.value)}
          className={`px-3 py-[5px] rounded-[5px] text-xs font-semibold transition-all ${
            overviewPeriod === opt.value ? "bg-ink text-white" : "text-ink-2 hover:text-ink"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
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

  const teamManageBtn = (
    <button
      onClick={() => setShowManager(true)}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-ink text-white text-xs font-semibold hover:bg-ink/90 transition-colors"
    >
      <Plus size={14} weight="bold" />
      Gerenciar
    </button>
  );

  const topActionsByView = (v: View): React.ReactNode => {
    if (v === "overview") {
      return (
        <>
          {periodTabs}
          {presentationBtn}
        </>
      );
    }
    if (v === "kpis" || v === "results" || v === "tournament") {
      return periodTabs;
    }
    if (v === "team") {
      return teamManageBtn;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background flex relative">
      <div className="fixed inset-0 pointer-events-none bg-mesh" />

      <DashboardSidebar
        view={view}
        onEnterTv={openTv}
        onEnterPresentation={openPresentation}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      <main className="flex-1 min-w-0 flex flex-col overflow-x-hidden">
        <DashboardTopbar
          eyebrow={VIEW_EYEBROWS[view]}
          title={titleFor(view)}
          subtitle={subtitleFor(view)}
          actions={topActionsByView(view)}
          onMenuClick={() => setMobileNavOpen(true)}
        />

        <div className="flex-1 p-7 space-y-5">
          {view === "overview" && (
            <>
              <AnnouncementTicker assessors={assessors} />

              <HeroMetricStrip from={overviewRange.from} to={overviewRange.to} />

              {/* 3-column body editorial: Ranking | Cadência+Atividade | Metas+Tournament */}
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-[1.2fr_1.6fr_1fr]">
                {/* LEFT: Ranking */}
                <Leaderboard assessors={assessors} />

                {/* MIDDLE: Cadência + Atividade ao vivo */}
                <div className="flex flex-col gap-4">
                  <SectionCard
                    title="Cadência da Semana"
                    subtitle="Reuniões realizadas e ativações por dia"
                  >
                    <WeeklyCadenceChart from={overviewRange.from} to={overviewRange.to} />
                    <div className="flex items-center gap-4 mt-3 text-[10px] uppercase tracking-[0.12em] font-semibold text-ink-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "hsl(var(--eqi-green))" }} />
                        Reuniões Real.
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "hsl(var(--gold))" }} />
                        Ativações
                      </span>
                    </div>
                  </SectionCard>

                  <ActivityFeed />
                </div>

                {/* RIGHT: Metas por KPI + Tournament card */}
                <div className="flex flex-col gap-4">
                  <KpiGoalsList from={overviewRange.from} to={overviewRange.to} />
                  <TournamentSidebarCard onClick={() => setView("tournament")} />
                </div>
              </div>
            </>
          )}

          <Suspense fallback={<InlineLoader />}>
            {view === "daily" && <DayView assessors={assessors} />}
            {view === "results" && <DailyResults assessors={assessors} period={overviewPeriod} />}
            {view === "kpis" && <KpiAnalytics assessors={assessors} />}
            {view === "squad" && <SquadBet assessors={assessors} />}
            {view === "tournament" && (
              <TournamentView tournaments={activeTournaments} />
            )}
            {view === "team" && (
              <TeamScreen
                assessors={assessors}
                onSelectAssessor={(a) => setSelectedProfile(a)}
                onManage={() => setShowManager(true)}
              />
            )}
          </Suspense>

          {/* Profile modal — abre quando o user clica num card de assessor no TeamScreen */}
          {selectedProfile && (
            <Suspense fallback={null}>
              <AssessorProfile
                assessor={selectedProfile}
                onClose={() => setSelectedProfile(null)}
              />
            </Suspense>
          )}
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

      <TournamentFinishedOverlay event={finishedEvent} onDismiss={dismissFinished} />
    </div>
  );
};

const InlineLoader = () => (
  <div className="flex items-center justify-center py-12">
    <div className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
  </div>
);

interface ApiTournament {
  id: string;
  // tipos parciais — só pra prop forward
  [k: string]: unknown;
}

interface TournamentViewProps {
  tournaments: unknown[];
}

const TournamentView = ({ tournaments }: TournamentViewProps) => {
  if (tournaments.length === 0) {
    return (
      <SectionCard className="text-center">
        <p className="text-ink-3 text-sm py-6">Sem torneio ativo no momento.</p>
      </SectionCard>
    );
  }
  return (
    <div className={`grid gap-4 ${tournaments.length === 1 ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2"}`}>
      {tournaments.map((t) => {
        const tour = t as ApiTournament;
        return (
          <TournamentCard key={tour.id} tournament={tour as unknown as Parameters<typeof TournamentCard>[0]["tournament"]} />
        );
      })}
    </div>
  );
};

export default Index;
