import { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from "react";
import {
  Television,
  X,
  Play,
  Pause,
  SkipForward,
  Timer,
  Sword as Swords,
  Pulse,
} from "@phosphor-icons/react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import KpiCards from "@/components/dashboard/KpiCards";
import TvOverview from "@/components/dashboard/TvOverview";
import AnnouncementTicker from "@/components/dashboard/AnnouncementTicker";
import TournamentCard from "@/components/dashboard/TournamentCard";
import TournamentFinishedOverlay from "@/components/dashboard/TournamentFinishedOverlay";
import { useAssessors } from "@/hooks/useAssessors";
import { useRankingStream } from "@/hooks/useRankingStream";
import { useActiveTournaments } from "@/hooks/useTournaments";
import { useTournamentFinishedStream } from "@/hooks/useTournamentFinishedStream";
import { useSystemNotifications } from "@/hooks/useSystemNotifications";

const TvLeagueTable = lazy(() => import("@/components/dashboard/TvLeagueTable"));
const TvPodium = lazy(() => import("@/components/dashboard/TvPodium"));
const TvSquadBoard = lazy(() => import("@/components/dashboard/TvSquadBoard"));
const TvTournamentBoard = lazy(() => import("@/components/dashboard/TvTournamentBoard"));
const TvLiveTicker = lazy(() => import("@/components/dashboard/TvLiveTicker"));

type TvView = "overview" | "results" | "squad" | "podium" | "tournaments";

const BASE_TV_VIEWS: { key: TvView; label: string }[] = [
  { key: "overview", label: "Visão Geral" },
  { key: "results", label: "Ranking" },
  { key: "squad", label: "Squad Bet" },
  { key: "podium", label: "Hall da Fama" },
];

const TOURNAMENT_VIEW = { key: "tournaments" as TvView, label: "Torneios" };

const TV_INTERVALS = [10, 15, 20, 30, 45, 60];

/**
 * Rota /tv — TV pública da mesa de vendas (kiosk mode).
 *
 * Sem login. Estilo Editorial V1 sério-mas-divertido: header tipo
 * placar de estádio com pulso AO VIVO, controles de rotação e
 * progress bar de transição.
 */
const TvPage = () => {
  const [view, setView] = useState<TvView>("overview");
  const [playing, setPlaying] = useState(true);
  const [intervalSec, setIntervalSec] = useState(15);
  const [progress, setProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [now, setNow] = useState(new Date());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { assessors } = useAssessors();
  const { data: activeTournaments = [] } = useActiveTournaments();

  const TV_VIEWS = useMemo(
    () =>
      activeTournaments.length > 0
        ? [...BASE_TV_VIEWS, TOURNAMENT_VIEW]
        : BASE_TV_VIEWS,
    [activeTournaments.length],
  );

  useRankingStream(true);
  useSystemNotifications(true);
  const { event: finishedEvent, dismiss: dismissFinished } = useTournamentFinishedStream(true);

  useEffect(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (view === "tournaments" && activeTournaments.length === 0) {
      setView("overview");
      setProgress(0);
    }
  }, [view, activeTournaments.length]);

  const overviewRange = {
    from: format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"),
    to: format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"),
  };

  const nextTab = useCallback(() => {
    const keys = TV_VIEWS.map(v => v.key);
    const idx = keys.indexOf(view);
    setView(keys[(idx + 1) % keys.length]);
    setProgress(0);
  }, [view, TV_VIEWS]);

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

  const dt = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const tm = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    // `dark` escopa os tokens dark mode só ao /tv — não toca next-themes
    // global. As CSS vars dentro de .dark (--background, --ink, etc.)
    // sobrescrevem aqui e em tudo que renderizar como descendente.
    <div className="dark min-h-screen relative overflow-x-hidden tv-mode bg-background text-foreground">
      {/* ─── TV Header — placar de estádio (sério mas divertido) ─── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center gap-5 px-8 py-3 border-b text-white"
        style={{ background: 'hsl(var(--ink))', borderColor: 'hsl(var(--ink-2))' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center font-display font-extrabold text-lg"
            style={{ background: 'hsl(var(--gold))', color: 'hsl(var(--ink))' }}
          >
            P
          </div>
          <div className="leading-tight">
            <p className="font-display italic text-[18px] font-extrabold tracking-tight">Performance Pulse</p>
            <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-white/55 mt-0.5">
              Mesa de Vendas · Modo TV
            </p>
          </div>
        </div>

        <div className="w-px h-7 bg-white/20" />

        <div className="flex items-center gap-1.5">
          {TV_VIEWS.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setView(tab.key); setProgress(0); }}
              className={`px-3 py-1.5 rounded-[7px] text-xs font-semibold transition-all ${
                view === tab.key
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* AO VIVO pill */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
          style={{
            background: 'oklch(0.55 0.22 25 / 0.18)',
            borderColor: 'oklch(0.55 0.22 25 / 0.4)',
          }}
        >
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: 'oklch(0.65 0.24 25)' }}
          />
          <span className="font-mono text-[11px] font-extrabold tracking-[0.1em] text-white">AO VIVO</span>
        </div>

        <p className="font-mono text-xs text-white/70 font-semibold capitalize">
          {dt} · {tm}
        </p>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setPlaying(p => !p)}
            className="p-1.5 rounded-[7px] bg-white/10 hover:bg-white/20 text-white transition-all"
            title={playing ? "Pausar rotação" : "Retomar rotação"}
          >
            {playing ? <Pause size={14} weight="bold" /> : <Play size={14} weight="bold" />}
          </button>
          <button
            onClick={nextTab}
            className="p-1.5 rounded-[7px] bg-white/10 hover:bg-white/20 text-white transition-all"
            title="Próxima view"
          >
            <SkipForward size={14} weight="bold" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowSettings(s => !s)}
              className="p-1.5 rounded-[7px] bg-white/10 hover:bg-white/20 text-white transition-all"
              title={`Intervalo: ${intervalSec}s`}
            >
              <Timer size={14} weight="bold" />
            </button>
            {showSettings && (
              <div className="absolute right-0 top-9 rounded-[10px] p-2 min-w-[120px] z-10 shadow-xl"
                   style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--line))' }}>
                <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-ink-3 px-2 pb-1">
                  Intervalo
                </p>
                {TV_INTERVALS.map(sec => (
                  <button
                    key={sec}
                    onClick={() => { setIntervalSec(sec); setProgress(0); setShowSettings(false); }}
                    className={`block w-full text-left px-2 py-1 rounded-[5px] text-xs font-semibold transition-all ${
                      intervalSec === sec ? "bg-ink text-white" : "text-ink-2 hover:bg-surface-2"
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="font-mono text-[11px] text-white/70 mx-1 font-semibold">{intervalSec}s</span>
          <button
            onClick={exitFullscreen}
            className="p-1.5 rounded-[7px] border bg-white/5 hover:bg-white/10 text-white transition-all"
            style={{ borderColor: 'hsl(var(--line) / 0.2)' }}
            title="Sair fullscreen"
          >
            <X size={14} weight="bold" />
          </button>
        </div>

        {/* Progress bar — dourado */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: 'oklch(1 0 0 / 0.1)' }}>
          <div
            className="h-full transition-all duration-100 ease-linear"
            style={{ width: `${progress}%`, background: 'hsl(var(--gold))' }}
          />
        </div>
      </header>

      <div className="pt-[60px]" />

      <div className="p-6">
        <Suspense fallback={<InlineLoader />}>
          {view === "overview" && (
            <div className="space-y-4">
              <AnnouncementTicker assessors={assessors} />
              <TvOverview
                assessors={assessors}
                from={overviewRange.from}
                to={overviewRange.to}
              />
            </div>
          )}
          {view === "results" && <TvLeagueTable assessors={assessors} />}
          {view === "squad" && <TvSquadBoard assessors={assessors} />}
          {view === "podium" && <TvPodium assessors={assessors} />}
          {view === "tournaments" && (
            activeTournaments.length === 1 ? (
              <TvTournamentBoard />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <Swords size={32} className="text-primary" weight="duotone" />
                  <h2 className="text-3xl font-extrabold tracking-tight text-ink">
                    Torneios Ativos
                  </h2>
                </div>
                <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
                  {activeTournaments.map((t) => (
                    <TournamentCard key={t.id} tournament={t} tvMode />
                  ))}
                </div>
              </div>
            )
          )}
        </Suspense>
      </div>

      <TournamentFinishedOverlay event={finishedEvent} onDismiss={dismissFinished} />

      {/* Ticker preto rolante fixo no rodapé com infos dinâmicas (artboard
          TvSquadBoard). Aparece em todas as views TV; deixa pixels embaixo
          das views (h-9) pra evitar sobreposição com cards. */}
      <Suspense fallback={null}>
        <TvLiveTicker assessors={assessors} />
      </Suspense>
      <div className="h-9" />
    </div>
  );
};

const InlineLoader = () => (
  <div className="flex items-center justify-center py-20">
    <Pulse size={28} className="text-primary animate-pulse" weight="duotone" />
  </div>
);

export default TvPage;
