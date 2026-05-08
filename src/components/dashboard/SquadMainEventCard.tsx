import { useMemo } from "react";
import { Crown, Trophy } from "@phosphor-icons/react";
import { type Assessor } from "@/types/assessor";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";
import { SquadLogo } from "@/components/ui/SquadLogo";
import { useSquads, type ApiSquad } from "@/hooks/useSquads";
import { useBets } from "@/hooks/useBets";
import { useWeeklyRanking } from "@/hooks/useRankings";

interface SquadMainEventCardProps {
  assessors: Assessor[];
}

/**
 * Hero "Main Event" do design Editorial V1 — championship belt card
 * com os 2 squads no topo da disputa. Versão visual standalone do
 * artboard SquadBet:
 *   - Header dark com pote dourado em mono e pill AO VIVO.
 *   - Split lateral com squad líder em verde EQI tint, perdedor branco.
 *   - VS gigante italic ao centro + gap em p.p.
 *   - Tug-of-war bar no rodapé mostrando proporção.
 *
 * Se não houver bet ativa, o card não é renderizado (retorna null).
 * Os dados são reaproveitados do useSquads + useBets + useWeeklyRanking.
 */
const SquadMainEventCard = ({ assessors: _assessors }: SquadMainEventCardProps) => {
  const { data: squadsData } = useSquads();
  const { data: betsData } = useBets();
  const { data: weeklyRanking } = useWeeklyRanking();

  const activeBet = useMemo(
    () => (betsData ?? []).find((b) => b.status === "ACTIVE"),
    [betsData],
  );

  const ranking = weeklyRanking?.rankings ?? [];

  const standings = useMemo(() => {
    const squads = squadsData ?? [];
    if (squads.length === 0 || ranking.length === 0) return [];
    const perfById = new Map(
      ranking.map((r) => [r.assessor.id, r.rollup.weeklyGoalPercent]),
    );
    return squads
      .map((s) => {
        const memberPcts = s.members
          .map((m) => perfById.get(m.assessorId))
          .filter((v): v is number => typeof v === "number");
        const avgPct = memberPcts.length
          ? Math.round(memberPcts.reduce((sum, v) => sum + v, 0) / memberPcts.length)
          : 0;
        return { squad: s, pct: avgPct };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [squadsData, ranking]);

  const main = standings.slice(0, 2);
  // Sem squads suficientes pra montar disputa, oculta o card por completo
  if (main.length < 2) return null;

  const [a, b] = main;
  const gap = Math.max(0, a.pct - b.pct);
  const total = Math.max(1, a.pct + b.pct);
  const hasActive = !!activeBet;

  return (
    <div className="rounded-[14px] border border-line bg-card overflow-hidden">
      {/* Header dark com pote (ou estado aguardando quando não há bet ativa) */}
      <div
        className="flex items-center justify-between px-6 py-3 text-white"
        style={{
          background:
            "linear-gradient(90deg, hsl(var(--ink)) 0%, hsl(var(--eqi-forest)) 100%)",
        }}
      >
        <div className="flex items-center gap-3">
          <Trophy size={18} weight="fill" style={{ color: "hsl(var(--gold))" }} />
          <div className="leading-tight">
            <p
              className="text-[9px] uppercase tracking-[0.12em] font-semibold"
              style={{ color: "hsl(var(--gold))" }}
            >
              {hasActive
                ? `MAIN EVENT · ${activeBet.roundLabel.toUpperCase()}`
                : "EVENTO PRINCIPAL · AGUARDANDO DISPUTA"}
            </p>
            <p className="text-[14px] font-bold mt-0.5">
              {hasActive
                ? "Disputa pelo cinturão da semana"
                : "Crie uma aposta pra iniciar o round"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-white/60">POTE</p>
          <p
            className="font-mono font-extrabold tracking-[-0.02em]"
            style={{ fontSize: 24, color: hasActive ? "hsl(var(--gold))" : "oklch(1 0 0 / 0.4)" }}
          >
            R$ {hasActive ? activeBet.value.toLocaleString("pt-BR") : "—"}
          </p>
          {hasActive ? (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-extrabold tracking-[0.1em]"
              style={{
                background: "oklch(0.55 0.22 25 / 0.18)",
                borderColor: "oklch(0.55 0.22 25 / 0.4)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "oklch(0.65 0.24 25)" }}
              />
              AO VIVO
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-extrabold tracking-[0.1em] text-white/60"
              style={{
                background: "oklch(1 0 0 / 0.08)",
                borderColor: "oklch(1 0 0 / 0.2)",
              }}
            >
              SEM ROUND ATIVO
            </span>
          )}
        </div>
      </div>

      {/* Split lateral A · VS · B */}
      <div className="grid items-stretch" style={{ gridTemplateColumns: "1fr 100px 1fr" }}>
        <SquadSide squad={a.squad} pct={a.pct} side="left" winning={hasActive} />
        <div
          className="flex flex-col items-center justify-center py-6 border-x border-line bg-surface-2"
        >
          <p
            className="font-extrabold italic leading-none text-ink-2"
            style={{ fontSize: 48, letterSpacing: "-0.05em" }}
          >
            VS
          </p>
          <div className="w-10 h-px bg-line my-2.5" />
          <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-ink-3 text-center">
            {hasActive ? "GAP" : "VANTAGEM"}
          </p>
          <p
            className="font-mono font-extrabold mt-1"
            style={{ fontSize: 20, color: hasActive ? "hsl(var(--eqi-green))" : "hsl(var(--ink-3))" }}
          >
            +{gap}
            <span className="text-[11px] text-ink-3">p.p.</span>
          </p>
        </div>
        <SquadSide squad={b.squad} pct={b.pct} side="right" />
      </div>

      {/* Tug of war */}
      <div
        className="px-7 py-4 border-t border-line"
        style={{ background: "oklch(0.99 0.005 95)" }}
      >
        <div className="flex justify-between items-center mb-2 text-[11px] font-extrabold tracking-[0.05em]">
          <span style={{ color: "hsl(var(--eqi-green))" }}>
            {a.squad.name.toUpperCase()} · {a.pct}%
          </span>
          <span className="text-ink-3">↔ CABO DE GUERRA</span>
          <span className="text-ink-2">
            {b.pct}% · {b.squad.name.toUpperCase()}
          </span>
        </div>
        <div className="relative h-3.5 rounded-full overflow-hidden bg-line">
          <div
            className="absolute inset-y-0 left-0 transition-all duration-700"
            style={{
              width: `${(a.pct / total) * 100}%`,
              background:
                "linear-gradient(90deg, hsl(var(--eqi-green)) 0%, oklch(0.50 0.13 152) 100%)",
            }}
          />
          <div
            className="absolute top-0 bottom-0 w-[3px]"
            style={{
              left: `${(a.pct / total) * 100}%`,
              background: "white",
              boxShadow: "0 0 0 1px rgba(0,0,0,0.2)",
            }}
          />
        </div>
      </div>
    </div>
  );
};

function SquadSide({
  squad,
  pct,
  side,
  winning,
}: {
  squad: ApiSquad;
  pct: number;
  side: "left" | "right";
  winning?: boolean;
}) {
  const align = side === "left" ? "items-start text-left" : "items-end text-right";
  return (
    <div
      className={`p-7 flex flex-col gap-4 ${align}`}
      style={{ background: winning ? "oklch(0.98 0.02 152)" : "white" }}
    >
      <div
        className={`flex items-center gap-3.5 ${
          side === "right" ? "flex-row-reverse" : ""
        }`}
      >
        <SquadLogo squad={squad} size={48} />
        <div className={side === "right" ? "text-right" : "text-left"}>
          <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-ink-3">
            SQUAD
          </p>
          <p
            className="font-extrabold tracking-[-0.02em] leading-none mt-0.5"
            style={{ fontSize: 24 }}
          >
            {squad.name}
          </p>
          {winning && (
            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-accent text-primary text-[10px] font-extrabold border border-primary/15">
              <Crown size={10} weight="fill" /> CAMPEÃO
            </span>
          )}
        </div>
      </div>
      <p
        className="font-mono font-extrabold leading-none tracking-[-0.04em]"
        style={{
          fontSize: 76,
          color: winning ? "hsl(var(--eqi-green))" : "hsl(var(--ink-2))",
        }}
      >
        {pct}
        <span className="text-[32px] text-ink-3">%</span>
      </p>
      <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-ink-3">
        DA META COMBINADA
      </p>
      <div
        className={`flex items-center gap-2 ${
          side === "right" ? "flex-row-reverse" : ""
        }`}
      >
        <div className={`flex ${side === "right" ? "flex-row-reverse" : ""}`}>
          {squad.members.slice(0, 5).map((m, idx) => (
            <div
              key={m.assessorId}
              className="rounded-full border-[3px] border-white"
              style={{
                marginLeft: side === "left" && idx > 0 ? -8 : 0,
                marginRight: side === "right" && idx > 0 ? -8 : 0,
              }}
            >
              <AssessorAvatar
                initials={m.initials}
                photoUrl={m.photoUrl}
                level={m.level.toLowerCase() as "bronze" | "silver" | "gold"}
                size={36}
              />
            </div>
          ))}
        </div>
        <p className="text-[11px] text-ink-3 font-semibold">
          {squad.members.length} assessores
        </p>
      </div>
    </div>
  );
}

export default SquadMainEventCard;
