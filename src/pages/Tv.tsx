import { useState, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import { Tv, X, Play, Pause, SkipForward, Timer } from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import KpiCards from "@/components/dashboard/KpiCards";
import AnnouncementTicker from "@/components/dashboard/AnnouncementTicker";
import { useAssessors } from "@/hooks/useAssessors";
import { useRankingStream } from "@/hooks/useRankingStream";

// Lazy: componentes pesados só baixam quando a rotação chega neles.
const TvRanking = lazy(() => import("@/components/dashboard/TvRanking"));
const DailyResults = lazy(() => import("@/components/dashboard/DailyResults"));
const SquadBet = lazy(() => import("@/components/dashboard/SquadBet"));

type TvView = "overview" | "results" | "squad";

const TV_VIEWS: { key: TvView; label: string }[] = [
  { key: "overview", label: "Visão Geral" },
  { key: "results", label: "Ranking Geral" },
  { key: "squad", label: "Squad Bet" },
];

const TV_INTERVALS = [10, 15, 20, 30, 45, 60];

/**
 * Rota /tv — TV pública da mesa de vendas.
 *
 * Sem login. Todos os endpoints que esta página consome são públicos (ver
 * backend/src/routes/*.ts — GETs marcados "PUBLIC"). O apiFetch detecta
 * `window.location.pathname === "/tv"` e pula token + 401-redirect, então
 * os hooks existentes (useAssessors, useRankings, useKpis, etc.) funcionam
 * sem modificação.
 *
 * Features:
 * - Auto-rotação entre 3 views (overview/results/squad)
 * - SSE pra updates em tempo real (<500ms)
 * - Fullscreen automático ao abrir
 * - Controles de play/pause/skip/timer na overlay superior
 */
const TvPage = () => {
  const [view, setView] = useState<TvView>("overview");
  const [playing, setPlaying] = useState(true);
  const [intervalSec, setIntervalSec] = useState(15);
  const [progress, setProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { assessors } = useAssessors();

  // SSE: updates em tempo real
  useRankingStream(true);

  // Fullscreen automático no mount — experiência de kiosk
  useEffect(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
  }, []);

  const now = new Date();
  const overviewRange = {
    from: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    to: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
  };

  const nextTab = useCallback(() => {
    const keys = TV_VIEWS.map(v => v.key);
    const idx = keys.indexOf(view);
    setView(keys[(idx + 1) % keys.length]);
    setProgress(0);
  }, [view]);

  // Auto-rotation
  useEffect(() => {
    if (!playing) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    const tick = 100;
    timerRef.current = setInterval(() => {
      setProgress(prev => {
        const next = prev + (tick / (intervalSec * 1000)) * 100;
        if (next >= 100) {
          nextTab();
          return 0;
        }
        return next;
      });
    }, tick);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing, intervalSec, nextTab]);

  const exitFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden p-6 tv-mode">
      <div className="fixed inset-0 pointer-events-none bg-mesh" />

      {/* Overlay de controles TV */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-2 bg-background/90 backdrop-blur-md border-b border-primary/20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg gradient-neon">
            <Tv className="w-4 h-4 text-primary-foreground" />
            <span className="text-xs font-bold text-primary-foreground tracking-wider">TV</span>
          </div>
          {TV_VIEWS.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setView(tab.key); setProgress(0); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                view === tab.key
                  ? "bg-primary text-secondary border border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={() => setPlaying(p => !p)} className="p-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 text-foreground transition-all">
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button onClick={nextTab} className="p-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 text-foreground transition-all">
            <SkipForward className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setShowSettings(s => !s)} className="p-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 text-foreground transition-all">
            <Timer className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs text-muted-foreground font-mono mx-1">{intervalSec}s</span>
          <button onClick={exitFullscreen} className="p-1.5 rounded-lg bg-destructive/20 hover:bg-destructive/30 text-destructive transition-all" title="Sair fullscreen">
            <X className="w-3.5 h-3.5" />
          </button>

          {showSettings && (
            <div className="absolute right-8 top-12 card-glass rounded-xl p-3 space-y-1 min-w-[160px] animate-fade-in">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Intervalo</p>
              {TV_INTERVALS.map(sec => (
                <button
                  key={sec}
                  onClick={() => { setIntervalSec(sec); setProgress(0); setShowSettings(false); }}
                  className={`block w-full text-left px-3 py-1 rounded-lg text-sm transition-all ${
                    intervalSec === sec ? "bg-primary text-secondary font-bold" : "text-foreground hover:bg-muted/30"
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-muted/20">
          <div className="h-full gradient-neon transition-all duration-100 ease-linear" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="pt-14" />

      <Suspense fallback={<InlineLoader />}>
        {view === "overview" && (
          <div className="space-y-4">
            <AnnouncementTicker assessors={assessors} />
            <KpiCards from={overviewRange.from} to={overviewRange.to} />
            <TvRanking assessors={assessors} />
          </div>
        )}
        {view === "results" && <DailyResults assessors={assessors} />}
        {view === "squad" && <SquadBet assessors={assessors} />}
      </Suspense>
    </div>
  );
};

const InlineLoader = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
  </div>
);

export default TvPage;
