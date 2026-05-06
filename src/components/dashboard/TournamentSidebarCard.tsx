import { useEffect, useState, useMemo } from "react";
import { ArrowRight, Sword as Swords } from "@phosphor-icons/react";
import { parseISO } from "date-fns";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";
import { useActiveTournaments } from "@/hooks/useTournaments";

interface TournamentSidebarCardProps {
  onClick?: () => void;
}

/**
 * Versão compacta do TournamentCard pra ocupar o slot do sidebar
 * direito da Visão Geral (artboard DashEditorial). Card dark com pill
 * "TORNEIO ATIVO" dourada, título 18px, countdown em mono, top 3
 * avatares e CTA "Ver detalhes" em fundo dourado.
 *
 * Renderiza só quando há torneio ativo.
 */
const TournamentSidebarCard = ({ onClick }: TournamentSidebarCardProps) => {
  const { data: tournaments = [] } = useActiveTournaments();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  const t = tournaments[0];
  const countdown = useMemo(() => {
    if (!t) return null;
    const end = parseISO(t.endDate).getTime() + 24 * 60 * 60 * 1000 - 1;
    const diff = Math.max(0, Math.floor((end - now) / 1000));
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    return `${days > 0 ? `${days}d ` : ""}${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`;
  }, [t, now]);

  if (!t) return null;

  const top3 = [...t.participants]
    .sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0))
    .slice(0, 3);

  return (
    <div
      className="rounded-[14px] p-5 text-white"
      style={{ background: "hsl(var(--ink))" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Swords size={14} weight="fill" style={{ color: "hsl(var(--gold))" }} />
        <p
          className="text-[9px] uppercase tracking-[0.12em] font-semibold"
          style={{ color: "oklch(1 0 0 / 0.6)" }}
        >
          TORNEIO ATIVO
        </p>
      </div>
      <p
        className="font-extrabold tracking-tight"
        style={{ fontSize: 18, letterSpacing: "-0.01em" }}
      >
        {t.roundLabel}
      </p>
      <p className="text-[11px] mt-0.5" style={{ color: "oklch(1 0 0 / 0.6)" }}>
        Termina em{" "}
        <span
          className="font-mono font-bold"
          style={{ color: "hsl(var(--gold))" }}
        >
          {countdown}
        </span>
      </p>
      <div className="flex items-center gap-2 mt-4">
        <div className="flex">
          {top3.map((p, idx) => (
            <div
              key={p.id}
              className="rounded-full border-2"
              style={{
                marginLeft: idx > 0 ? -10 : 0,
                borderColor: "hsl(var(--ink))",
              }}
            >
              <AssessorAvatar
                initials={p.initials ?? "??"}
                photoUrl={p.photoUrl}
                level="bronze"
                size={32}
              />
            </div>
          ))}
        </div>
        <p className="text-[11px]" style={{ color: "oklch(1 0 0 / 0.6)" }}>
          top 3 disputando
        </p>
      </div>
      <button
        onClick={onClick}
        className="w-full mt-4 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-[8px] font-bold text-[13px] transition-opacity hover:opacity-90"
        style={{
          background: "hsl(var(--gold))",
          color: "hsl(var(--ink))",
          border: "none",
        }}
      >
        Ver detalhes <ArrowRight size={13} weight="bold" />
      </button>
    </div>
  );
};

export default TournamentSidebarCard;
