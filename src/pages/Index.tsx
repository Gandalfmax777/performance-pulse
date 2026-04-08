import { useState, useEffect, useCallback, useRef } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import Leaderboard from "@/components/dashboard/Leaderboard";
import KpiCards from "@/components/dashboard/KpiCards";
import WeeklyHeatmap from "@/components/dashboard/WeeklyHeatmap";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import PerformanceChart from "@/components/dashboard/PerformanceChart";
import BadgesPanel from "@/components/dashboard/BadgesPanel";
import DayView from "@/components/dashboard/DayView";
import DailyResults from "@/components/dashboard/DailyResults";
import KpiAnalytics from "@/components/dashboard/KpiAnalytics";
import AssessorManager from "@/components/dashboard/AssessorManager";
import SquadBet from "@/components/dashboard/SquadBet";
import { DEFAULT_ASSESSORS, type Assessor } from "@/data/mockData";
import { Settings, Tv, X, Play, Pause, SkipForward, Timer } from "lucide-react";

type View = "overview" | "daily" | "results" | "kpis" | "squad";

const TABS: { key: View; label: string }[] = [
  { key: "overview", label: "Visão Geral" },
  { key: "daily", label: "Por Dia" },
  { key: "results", label: "Resultado do Dia" },
  { key: "kpis", label: "KPIs & Insights" },
  { key: "squad", label: "⚔️ Squad Bet" },
];

const TV_INTERVALS = [10, 15, 20, 30, 45, 60];

const Index = () => {
  const [view, setView] = useState<View>("overview");
  const [assessors, setAssessors] = useState<Assessor[]>(DEFAULT_ASSESSORS);
  const [showManager, setShowManager] = useState(false);

  // TV Mode state
  const [tvMode, setTvMode] = useState(false);
  const [tvPlaying, setTvPlaying] = useState(true);
  const [tvInterval, setTvInterval] = useState(15); // seconds
  const [tvProgress, setTvProgress] = useState(0);
  const [showTvSettings, setShowTvSettings] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addAssessor = (a: Assessor) => setAssessors(prev => [...prev, a]);
  const removeAssessor = (id: string) => setAssessors(prev => prev.filter(a => a.id !== id));

  const nextTab = useCallback(() => {
    setView(prev => {
      const idx = TABS.findIndex(t => t.key === prev);
      return TABS[(idx + 1) % TABS.length].key;
    });
    setTvProgress(0);
  }, []);

  // Auto-rotation
  useEffect(() => {
    if (!tvMode || !tvPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    const tick = 100; // ms
    timerRef.current = setInterval(() => {
      setTvProgress(prev => {
        const next = prev + (tick / (tvInterval * 1000)) * 100;
        if (next >= 100) {
          nextTab();
          return 0;
        }
        return next;
      });
    }, tick);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [tvMode, tvPlaying, tvInterval, nextTab]);

  // Fullscreen API
  const enterTvMode = useCallback(() => {
    setTvMode(true);
    setTvPlaying(true);
    setTvProgress(0);
    document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);

  const exitTvMode = useCallback(() => {
    setTvMode(false);
    setTvPlaying(false);
    setTvProgress(0);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  }, []);

  // Listen for ESC exiting fullscreen
  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement && tvMode) {
        setTvMode(false);
        setTvPlaying(false);
      }
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, [tvMode]);

  const currentTabLabel = TABS.find(t => t.key === view)?.label ?? "";

  return (
    <div className={`min-h-screen bg-background ${tvMode ? "p-8" : "p-5"}`}>
      {/* TV Mode overlay controls */}
      {tvMode && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 bg-background/80 backdrop-blur-md border-b border-border/30">
          {/* Left: tab indicators */}
          <div className="flex items-center gap-2">
            <Tv className="w-5 h-5 text-primary" />
            <span className="text-sm font-bold text-primary">MODO TV</span>
            <span className="mx-2 text-border">|</span>
            {TABS.map((tab, i) => (
              <button
                key={tab.key}
                onClick={() => { setView(tab.key); setTvProgress(0); }}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                  view === tab.key
                    ? "gradient-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Right: controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTvPlaying(p => !p)}
              className="p-2 rounded-lg bg-muted/30 hover:bg-muted/50 text-foreground transition-all"
              title={tvPlaying ? "Pausar" : "Retomar"}
            >
              {tvPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => { nextTab(); }}
              className="p-2 rounded-lg bg-muted/30 hover:bg-muted/50 text-foreground transition-all"
              title="Próxima aba"
            >
              <SkipForward className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowTvSettings(s => !s)}
              className="p-2 rounded-lg bg-muted/30 hover:bg-muted/50 text-foreground transition-all"
              title="Intervalo"
            >
              <Timer className="w-4 h-4" />
            </button>
            <button
              onClick={exitTvMode}
              className="p-2 rounded-lg bg-destructive/20 hover:bg-destructive/30 text-destructive transition-all"
              title="Sair do modo TV"
            >
              <X className="w-4 h-4" />
            </button>

            {showTvSettings && (
              <div className="absolute right-6 top-14 card-glass rounded-xl p-4 space-y-2 min-w-[200px] animate-fade-in">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Intervalo de rotação</p>
                {TV_INTERVALS.map(sec => (
                  <button
                    key={sec}
                    onClick={() => { setTvInterval(sec); setTvProgress(0); setShowTvSettings(false); }}
                    className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all ${
                      tvInterval === sec
                        ? "gradient-primary text-primary-foreground font-bold"
                        : "text-foreground hover:bg-muted/30"
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/20">
            <div
              className="h-full gradient-primary transition-all duration-100 ease-linear"
              style={{ width: `${tvProgress}%` }}
            />
          </div>
        </div>
      )}

      {!tvMode && <DashboardHeader />}
      {tvMode && <div className="pt-14"><DashboardHeader /></div>}

      {/* View Toggle */}
      {!tvMode && (
        <div className="flex items-center gap-2 mb-5">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                view === tab.key
                  ? "gradient-primary text-primary-foreground glow-primary"
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-border/30"
              }`}
            >
              {tab.label}
            </button>
          ))}

          <button
            onClick={enterTvMode}
            className="px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 text-sm font-semibold flex items-center gap-2 transition-all"
          >
            <Tv className="w-4 h-4" /> Modo TV
          </button>

          <button
            onClick={() => setShowManager(true)}
            className="ml-auto px-4 py-2 rounded-lg bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-border/30 text-sm font-semibold flex items-center gap-2 transition-all hover:text-foreground"
          >
            <Settings className="w-4 h-4" /> Assessores
          </button>
        </div>
      )}

      {view === "overview" && (
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-5 space-y-4">
            <KpiCards />
            <PerformanceChart />
            <BadgesPanel assessors={assessors} />
          </div>
          <div className="col-span-4">
            <Leaderboard assessors={assessors} />
          </div>
          <div className="col-span-3 space-y-4">
            <WeeklyHeatmap />
            <ActivityFeed />
          </div>
        </div>
      )}

      {view === "daily" && <DayView assessors={assessors} />}
      {view === "results" && <DailyResults assessors={assessors} />}
      {view === "kpis" && <KpiAnalytics assessors={assessors} />}
      {view === "squad" && <SquadBet assessors={assessors} />}

      {showManager && (
        <AssessorManager
          assessors={assessors}
          onAdd={addAssessor}
          onRemove={removeAssessor}
          onClose={() => setShowManager(false)}
        />
      )}
    </div>
  );
};

export default Index;
