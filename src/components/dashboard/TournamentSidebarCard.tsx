import { useEffect, useState, useMemo } from "react";
import { parseISO } from "date-fns";
import { SectionCard, Eyebrow } from "@/components/shared";
import { useActiveTournaments } from "@/hooks/useTournaments";
import { cn } from "@/lib/utils";

interface TournamentSidebarCardProps {
  onClick?: () => void;
}

/**
 * Card "Torneio em jogo" — alinha com `Dashboard.html` do design.
 * Light card editorial (não mais dark) com:
 *   - Header: "Torneio em jogo" + subtitle (roundLabel) + badge AO VIVO
 *   - Body:
 *     • Eyebrow "Liderando" + nome com 🏆 + score em font-display accent
 *     • Progress bar % vs 2º colocado
 *     • Sub: "vs <2º> (<score2>)" · "<N dias restantes>"
 *     • Divisor + Eyebrow "Premiação total" + R$ valor (font-display 30px)
 *
 * Renderiza só quando há torneio ativo. Click chama `onClick` (default
 * navegação delegada ao caller).
 */
const TournamentSidebarCard = ({ onClick }: TournamentSidebarCardProps) => {
  const { data: tournaments = [] } = useActiveTournaments();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(i);
  }, []);

  const t = tournaments[0];

  const daysLeft = useMemo(() => {
    if (!t) return null;
    const end = parseISO(t.endDate).getTime() + 24 * 60 * 60 * 1000 - 1;
    const diff = Math.max(0, Math.floor((end - now) / 1000));
    const days = Math.floor(diff / 86400);
    return days;
  }, [t, now]);

  if (!t) return null;

  const sortedParticipants = [...t.participants].sort(
    (a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0),
  );
  const leader = sortedParticipants[0];
  const second = sortedParticipants[1];
  const leaderScore = leader?.finalScore ?? 0;
  const secondScore = second?.finalScore ?? 0;
  const leaderName = leader?.displayName ?? "—";
  const secondName = second?.displayName ?? null;
  const progress =
    leaderScore > 0
      ? Math.min(100, Math.round((secondScore / leaderScore) * 100))
      : 0;
  const remainingProgress = Math.max(0, 100 - progress);

  return (
    <SectionCard
      title="Torneio em jogo"
      subtitle={t.roundLabel}
      headerActions={<LiveBadge />}
    >
      <div className="flex flex-col gap-3">
        <div>
          <Eyebrow className="mb-1">Liderando</Eyebrow>
          <div className="flex items-baseline justify-between gap-3 mb-2">
            <span className="text-[15px] font-bold text-ink truncate">
              🏆 {leaderName}
            </span>
            <span className="num font-display font-extrabold text-[22px] text-primary leading-none">
              {leaderScore.toLocaleString("pt-BR")}
            </span>
          </div>
          {/* Progress bar — fração 2º/1º (visualiza a vantagem do líder).
              `--success` quando vantagem é grande (>=50%); ink-2 senão. */}
          <div className="h-[6px] rounded-[3px] bg-surface-2 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-[3px]",
                remainingProgress >= 50 ? "bg-primary" : "bg-ink-2",
              )}
              style={{ width: `${Math.max(8, remainingProgress)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-ink-3 mt-2">
            <span>
              {secondName
                ? `vs ${secondName} (${secondScore.toLocaleString("pt-BR")})`
                : "Sem 2º colocado"}
            </span>
            <span className="num">
              {daysLeft != null
                ? daysLeft === 0
                  ? "Termina hoje"
                  : `${daysLeft} dia${daysLeft > 1 ? "s" : ""} restante${daysLeft > 1 ? "s" : ""}`
                : "—"}
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-line">
          <Eyebrow className="mb-1">Premiação total</Eyebrow>
          <button
            type="button"
            onClick={onClick}
            className="font-display font-extrabold text-[30px] text-ink leading-none tracking-[-0.02em] hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            R$ {Number(t.totalPrizePool ?? 0).toLocaleString("pt-BR")}
          </button>
        </div>
      </div>
    </SectionCard>
  );
};

const LiveBadge = () => (
  <span
    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-mono font-bold tracking-[0.12em] uppercase"
    style={{
      background: "color-mix(in oklab, hsl(var(--primary)) 12%, transparent)",
      borderColor:
        "color-mix(in oklab, hsl(var(--primary)) 25%, transparent)",
      color: "hsl(var(--primary))",
    }}
  >
    <span
      className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"
      aria-hidden
    />
    AO VIVO
  </span>
);

export default TournamentSidebarCard;
