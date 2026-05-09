import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { type DashboardView } from "@/components/dashboard/DashboardSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import { AppShellLayout } from "@/components/layouts/AppShellLayout";
import Leaderboard from "@/components/dashboard/Leaderboard";
import HeroMetricStrip from "@/components/dashboard/HeroMetricStrip";
import WeeklyCadenceChart from "@/components/dashboard/WeeklyCadenceChart";
import KpiGoalsList from "@/components/dashboard/KpiGoalsList";
import TournamentSidebarCard from "@/components/dashboard/TournamentSidebarCard";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import AnnouncementTicker from "@/components/dashboard/AnnouncementTicker";
import TournamentFinishedOverlay from "@/components/dashboard/TournamentFinishedOverlay";
import { SectionCard } from "@/components/shared";
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

import { PresentationChart } from "@phosphor-icons/react";
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

  // Legacy: `/?tv=1` virou `/tv` público
  // Legacy: views internas que viraram rotas próprias do redesign
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tv") === "1") {
      navigate("/tv", { replace: true });
      return;
    }
    const v = params.get("view");
    if (v === "daily") navigate("/por-dia", { replace: true });
    else if (v === "results") navigate("/ranking", { replace: true });
    else if (v === "kpis") navigate("/kpis", { replace: true });
    else if (v === "squad") navigate("/squad-bet", { replace: true });
    else if (v === "tournament") navigate("/torneio", { replace: true });
    else if (v === "team") navigate("/assessores", { replace: true });
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

  const { assessors } = useAssessors();
  const { event: finishedEvent, dismiss: dismissFinished } = useTournamentFinishedStream(true);
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

  // Title por view (legacy — Index só renderiza overview/team agora; demais
  // viraram rotas próprias do redesign).
  const titleFor = (v: View): string => VIEW_LABELS[v];

  // Subtitle (Index só renderiza overview agora — demais viraram rotas próprias)
  const subtitleFor = (v: View): string | undefined => {
    if (v === "overview") {
      const week = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "dd MMM");
      const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "dd MMM");
      return `Semana atual · ${week} — ${weekEnd} · ${assessors.length} assessores`;
    }
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

  const topActionsByView = (v: View): React.ReactNode => {
    if (v === "overview") {
      return (
        <>
          {periodTabs}
          {presentationBtn}
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
                  <TournamentSidebarCard onClick={() => navigate("/torneio")} />
                </div>
              </div>
            </>
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
