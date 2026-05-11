import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, SkipForward, Timer, X } from "@phosphor-icons/react";
import { TvSlides, TV_SLIDES } from "@/components/dashboard/TvSlides";
import TournamentFinishedOverlay from "@/components/dashboard/TournamentFinishedOverlay";
import { useAssessors } from "@/hooks/useAssessors";
import { usePublicTenantBrand } from "@/hooks/usePublicTenantBrand";
import { useRankingStream } from "@/hooks/useRankingStream";
import { useTournamentFinishedStream } from "@/hooks/useTournamentFinishedStream";
import { useSystemNotifications } from "@/hooks/useSystemNotifications";
import {
  DEFAULT_TENANT_SLUG,
  isTenantSlug,
  type TenantSlug,
} from "@/config/tenants";

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

/**
 * Tela genérica pra /tv sem slug válido — visual NotFound (`pages/NotFound.tsx`).
 *
 * Mensagem propositalmente neutra (sem listar tenants conhecidos) pra não
 * precisar manutenção quando novas mesas forem onboardadas. Aplica o tenant
 * default no <html> só pro tema CSS renderizar.
 */
const TvMissingTenant = () => {
  useEffect(() => {
    // /tv é o único surface dark do sistema (DESIGN.md § Elevation).
    // Mesmo a tela 404 vive em dark + tenant default pra herdar o clima.
    const html = document.documentElement;
    html.setAttribute("data-tenant", DEFAULT_TENANT_SLUG);
    html.classList.add("dark");
    return () => {
      html.classList.remove("dark");
    };
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-12">
      <div className="text-center max-w-[560px]">
        <p className="num text-[11px] uppercase tracking-[0.22em] text-primary mb-4">
          Modo TV indisponível
        </p>
        <p
          className="num font-display font-extrabold text-primary leading-none mb-2"
          style={{ fontSize: 140, letterSpacing: "-0.06em" }}
        >
          404
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tight leading-tight mb-3 text-ink">
          Não existe Modo TV pra esta URL.
        </h1>
        <p className="text-[15px] leading-relaxed text-ink-3">
          Verifique o link com o administrador da sua mesa.
        </p>
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

  // Aplica `data-tenant` + classe `dark` no <html> pra ativar a paleta
  // dark tenant-scoped (`.dark[data-tenant="<slug>"]` em src/index.css).
  // Limpa `.dark` ao desmontar pra não vazar dark em outras rotas; o
  // `data-tenant` fica (AppShell/Login lê last-login slug ao montar).
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-tenant", tenantSlug);
    html.classList.add("dark");
    return () => {
      html.classList.remove("dark");
    };
  }, [tenantSlug]);

  const { assessors } = useAssessors();

  // Brand público (logo R2 + nome) via endpoint sem auth. Usado pra mostrar
  // a marca real do tenant no chrome header do TvSlides — sem isso, cai
  // pra letra inicial do label do tenant (TENANT_META em TvSlides.tsx).
  const brandQuery = usePublicTenantBrand(tenantSlug);
  const tenantLogoUrl =
    typeof brandQuery.data?.brandConfig?.logoUrl === "string"
      ? (brandQuery.data.brandConfig.logoUrl as string)
      : null;

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
    <div className="min-h-screen w-screen overflow-hidden relative bg-background">
      {/* Slide ocupa tela inteira — TvSlides tem seu próprio Chrome */}
      <div className="absolute inset-0">
        <TvSlides
          slideIdx={slideIdx}
          assessors={assessors}
          tenant={tenantSlug}
          logoUrl={tenantLogoUrl}
        />
      </div>

      {/* Controles flutuantes — auto-hide após 3s idle. Posicionados
          ABAIXO do chrome top header (top-72px) pra não sobrepor o
          rangeLabel "Semana de XX a YY". Tokens semânticos: foreground/5
          segue o tenant (verde EQI / cyan BDN translúcido). */}
      <div
        className={`fixed top-[72px] right-4 z-50 flex items-center gap-1 transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onMouseEnter={() => setControlsVisible(true)}
      >
        <button
          onClick={() => setPlaying((p) => !p)}
          className="p-2 rounded-[6px] bg-foreground/5 hover:bg-foreground/15 text-foreground/70 hover:text-foreground backdrop-blur-sm transition-all"
          title={playing ? "Pausar rotação" : "Retomar rotação"}
        >
          {playing ? <Pause size={14} weight="bold" /> : <Play size={14} weight="bold" />}
        </button>
        <button
          onClick={nextSlide}
          className="p-2 rounded-[6px] bg-foreground/5 hover:bg-foreground/15 text-foreground/70 hover:text-foreground backdrop-blur-sm transition-all"
          title="Próximo slide"
        >
          <SkipForward size={14} weight="bold" />
        </button>
        <div className="relative">
          <button
            onClick={() => setShowSettings((s) => !s)}
            className="p-2 rounded-[6px] bg-foreground/5 hover:bg-foreground/15 text-foreground/70 hover:text-foreground backdrop-blur-sm transition-all"
            title={`Intervalo: ${intervalSec}s`}
          >
            <Timer size={14} weight="bold" />
          </button>
          {showSettings && (
            <div
              className="absolute right-0 top-9 rounded-[6px] p-2 min-w-[120px] z-10 shadow-xl backdrop-blur-sm border border-foreground/10"
              style={{ background: "hsl(var(--card) / 0.92)" }}
            >
              <p className="text-[10px] uppercase tracking-[0.16em] font-mono font-semibold text-foreground/50 px-2 pb-1">
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
                      ? "bg-foreground text-background"
                      : "text-foreground/70 hover:bg-foreground/10"
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
          className="p-2 rounded-[6px] bg-foreground/5 hover:bg-foreground/15 text-foreground/70 hover:text-foreground backdrop-blur-sm transition-all"
          title="Sair fullscreen"
        >
          <X size={14} weight="bold" />
        </button>
      </div>

      {/* Progress bar — fino no topo. Cor segue --primary do tenant. */}
      <div
        className="fixed top-0 left-0 right-0 h-[2px] z-50 bg-foreground/5"
      >
        <div
          className="h-full transition-all duration-100 ease-linear"
          style={{ width: `${progress}%`, background: "hsl(var(--primary))" }}
        />
      </div>

      <TournamentFinishedOverlay event={finishedEvent} onDismiss={dismissFinished} />
    </div>
  );
};

export default TvPage;
