import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, SkipForward, Timer, X, Warning } from "@phosphor-icons/react";
import { TvSlides, TV_SLIDES } from "@/components/dashboard/TvSlides";
import TournamentFinishedOverlay from "@/components/dashboard/TournamentFinishedOverlay";
import { useAssessors } from "@/hooks/useAssessors";
import { useRankingStream } from "@/hooks/useRankingStream";
import { useTournamentFinishedStream } from "@/hooks/useTournamentFinishedStream";
import { useSystemNotifications } from "@/hooks/useSystemNotifications";
import { isTenantSlug, type TenantSlug } from "@/config/tenants";

const TV_INTERVALS = [10, 15, 20, 30, 45, 60];

/**
 * /tv — Modo TV editorial alinhado com `tv-slides.jsx` do design v3.
 *
 * 8 slides editoriais (Capa, Destaques, Pódio, KPIs, Ranking, Torneios,
 * Análise IA, Próximos passos) com tipografia gigante (até 156px),
 * grid forte com linhas finas 1px, números monospace tabular, lots of
 * negative space — referência Bloomberg, não placar de UFC.
 *
 * Controles flutuantes top-right (play/pause/skip/timer/exit). O
 * `TvSlides` em si tem chrome editorial próprio (top header com tenant
 * + range, body central, footer com slide title + index/count).
 *
 * Tenant obrigatório via `?tenant=eqi|bdn` — sem fallback silencioso pra
 * evitar TV mostrar dados do tenant errado. Sem slug válido, renderiza
 * tela de erro com instruções.
 */
const TvPage = () => {
  // Tenant via query param `?tenant=eqi|bdn`. /tv é público (sem JWT), por
  // isso não usa useCurrentUser. A plataforma roda em domínio único (BDN
  // hospeda todos os tenants), então a URL é a fonte única de verdade.
  // Sem slug válido → tela de erro (sem fallback silencioso).
  const tenantSlug = useMemo<TenantSlug | null>(() => {
    const slug = new URLSearchParams(window.location.search).get("tenant") ?? "";
    return isTenantSlug(slug) ? slug : null;
  }, []);

  if (!tenantSlug) {
    return <TvMissingTenant />;
  }

  return <TvPageContent tenantSlug={tenantSlug} />;
};

const TvMissingTenant = () => {
  // Reseta `data-tenant` pro fallback do <html> não afetar a tela de erro.
  useEffect(() => {
    document.documentElement.setAttribute("data-tenant", "eqi");
  }, []);

  return (
    <div
      className="min-h-screen w-screen flex items-center justify-center p-8"
      style={{ background: "#000b14", color: "rgba(255,255,255,0.92)" }}
    >
      <div className="max-w-md text-center">
        <div
          className="mx-auto mb-6 w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <Warning size={24} weight="bold" />
        </div>
        <p className="num text-[11px] uppercase tracking-[0.22em] text-white/55 mb-3">
          Modo TV · tenant obrigatório
        </p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight mb-4">
          Especifique o tenant na URL.
        </h1>
        <p className="text-sm text-white/65 leading-relaxed mb-5">
          /tv não tem fallback automático. Adicione <code>?tenant=&lt;slug&gt;</code> na URL pra escolher a mesa que vai aparecer.
        </p>
        <div className="grid gap-2 text-sm">
          <a
            href="/tv?tenant=eqi"
            className="block px-4 py-2 rounded-md font-mono text-xs hover:bg-white/10 transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.18)" }}
          >
            /tv?tenant=eqi
          </a>
          <a
            href="/tv?tenant=bdn"
            className="block px-4 py-2 rounded-md font-mono text-xs hover:bg-white/10 transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.18)" }}
          >
            /tv?tenant=bdn
          </a>
        </div>
      </div>
    </div>
  );
};

const TvPageContent = ({ tenantSlug }: { tenantSlug: TenantSlug }) => {
  const [slideIdx, setSlideIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [intervalSec, setIntervalSec] = useState(15);
  const [progress, setProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Aplica data-tenant no <html> pra ativar tema CSS escopado.
  useEffect(() => {
    document.documentElement.setAttribute("data-tenant", tenantSlug);
  }, [tenantSlug]);

  const { assessors } = useAssessors();

  // Auto-hide controls on idle (3s sem movimento de mouse). Visíveis em
  // qualquer mousemove ou quando o popover de Settings está aberto.
  useEffect(() => {
    const resetIdle = () => {
      setControlsVisible(true);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        if (!showSettings) setControlsVisible(false);
      }, 3000);
    };
    resetIdle();
    window.addEventListener("mousemove", resetIdle);
    window.addEventListener("touchstart", resetIdle);
    return () => {
      window.removeEventListener("mousemove", resetIdle);
      window.removeEventListener("touchstart", resetIdle);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [showSettings]);

  useRankingStream(true);
  useSystemNotifications(true);
  const { event: finishedEvent, dismiss: dismissFinished } = useTournamentFinishedStream(true);

  // Fullscreen on mount
  useEffect(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
  }, []);

  const nextSlide = useCallback(() => {
    setSlideIdx((i) => (i + 1) % TV_SLIDES.length);
    setProgress(0);
  }, []);

  // Rotation timer
  useEffect(() => {
    if (!playing) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    const tick = 100;
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (tick / (intervalSec * 1000)) * 100;
        if (next >= 100) {
          nextSlide();
          return 0;
        }
        return next;
      });
    }, tick);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, intervalSec, nextSlide]);

  const exitFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  };

  return (
    <div className="min-h-screen w-screen overflow-hidden relative" style={{ background: "#000b14" }}>
      {/* Slide ocupa tela inteira — TvSlides tem seu próprio Chrome */}
      <div className="absolute inset-0">
        <TvSlides slideIdx={slideIdx} assessors={assessors} tenant={tenantSlug} />
      </div>

      {/* Controles flutuantes — auto-hide após 3s idle. Posicionados
          ABAIXO do chrome top header (top-72px) pra não sobrepor o
          rangeLabel "Semana de XX a YY". */}
      <div
        className={`fixed top-[72px] right-4 z-50 flex items-center gap-1 transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onMouseEnter={() => setControlsVisible(true)}
      >
        <button
          onClick={() => setPlaying((p) => !p)}
          className="p-2 rounded-[6px] bg-white/5 hover:bg-white/15 text-white/70 hover:text-white backdrop-blur-sm transition-all"
          title={playing ? "Pausar rotação" : "Retomar rotação"}
        >
          {playing ? <Pause size={14} weight="bold" /> : <Play size={14} weight="bold" />}
        </button>
        <button
          onClick={nextSlide}
          className="p-2 rounded-[6px] bg-white/5 hover:bg-white/15 text-white/70 hover:text-white backdrop-blur-sm transition-all"
          title="Próximo slide"
        >
          <SkipForward size={14} weight="bold" />
        </button>
        <div className="relative">
          <button
            onClick={() => setShowSettings((s) => !s)}
            className="p-2 rounded-[6px] bg-white/5 hover:bg-white/15 text-white/70 hover:text-white backdrop-blur-sm transition-all"
            title={`Intervalo: ${intervalSec}s`}
          >
            <Timer size={14} weight="bold" />
          </button>
          {showSettings && (
            <div
              className="absolute right-0 top-9 rounded-[6px] p-2 min-w-[120px] z-10 shadow-xl backdrop-blur-sm"
              style={{ background: "oklch(0 0 0 / 0.85)", border: "1px solid oklch(1 0 0 / 0.1)" }}
            >
              <p className="text-[10px] uppercase tracking-[0.16em] font-mono font-semibold text-white/50 px-2 pb-1">
                Intervalo
              </p>
              {TV_INTERVALS.map((sec) => (
                <button
                  key={sec}
                  onClick={() => {
                    setIntervalSec(sec);
                    setProgress(0);
                    setShowSettings(false);
                  }}
                  className={`block w-full text-left px-2 py-1 rounded-[4px] text-xs font-mono font-semibold transition-all ${
                    intervalSec === sec
                      ? "bg-white text-black"
                      : "text-white/70 hover:bg-white/10"
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={exitFullscreen}
          className="p-2 rounded-[6px] bg-white/5 hover:bg-white/15 text-white/70 hover:text-white backdrop-blur-sm transition-all"
          title="Sair fullscreen"
        >
          <X size={14} weight="bold" />
        </button>
      </div>

      {/* Progress bar — dourado fino no topo */}
      <div
        className="fixed top-0 left-0 right-0 h-[2px] z-50"
        style={{ background: "oklch(1 0 0 / 0.05)" }}
      >
        <div
          className="h-full transition-all duration-100 ease-linear"
          style={{ width: `${progress}%`, background: "var(--tv-accent, #1bccf6)" }}
        />
      </div>

      <TournamentFinishedOverlay event={finishedEvent} onDismiss={dismissFinished} />
    </div>
  );
};

export default TvPage;
