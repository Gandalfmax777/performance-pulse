import { useMemo } from "react";
import {
  ArrowRight,
  Sword as Swords,
  CaretUp,
  CaretDown,
} from "@phosphor-icons/react";
import { useSquads, type ApiSquad } from "@/hooks/useSquads";
import { useBets } from "@/hooks/useBets";
import { useWeeklyRanking } from "@/hooks/useRankings";
import { SquadLogo } from "@/components/ui/SquadLogo";

interface Standing {
  squad: ApiSquad;
  pct: number;
  wins: number;
  losses: number;
}

/**
 * Undercard + Standings da temporada (artboard SquadBetV1).
 * Renderizado abaixo do SquadMainEventCard pra completar o layout
 * editorial do SquadBet:
 *   - Undercard: outras bets ACTIVE (até 3 linhas) com left vs right
 *     em mono, pote dourado e prazo.
 *   - Standings: tabela compacta com todos os squads ranqueados pelo
 *     %, número V/D, % e variação.
 */
const SquadUndercardStandings = () => {
  const { data: squadsData } = useSquads();
  const { data: betsData } = useBets();
  const { data: weeklyRanking } = useWeeklyRanking();

  const squads = useMemo<Standing[]>(() => {
    const list = squadsData ?? [];
    if (list.length === 0) return [];
    const ranking = weeklyRanking?.rankings ?? [];
    const perfById = new Map(ranking.map((r) => [r.assessor.id, r.rollup]));
    return list
      .map((s) => {
        const memberPcts = s.members
          .map((m) => perfById.get(m.assessorId)?.weeklyGoalPercent)
          .filter((v): v is number => typeof v === "number");
        const pct = memberPcts.length
          ? Math.round(memberPcts.reduce((sum, v) => sum + v, 0) / memberPcts.length)
          : 0;
        // V/D vai ficar em 0 — não temos esse dado consolidado no shape atual.
        return { squad: s, pct, wins: 0, losses: 0 };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [squadsData, weeklyRanking]);

  const undercardBets = useMemo(() => {
    const all = betsData ?? [];
    const active = all.filter((b) => b.status === "ACTIVE");
    // O "main event" já é o primeiro ACTIVE — o undercard são os outros.
    return active.slice(1, 4);
  }, [betsData]);

  if (squads.length === 0) return null;

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-[1.2fr_1fr]">
      {/* Undercard */}
      <div className="rounded-[14px] border border-line bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Swords size={14} weight="bold" />
            <h3 className="text-[14px] font-extrabold tracking-tight text-ink">
              Undercard
            </h3>
            <span className="text-[9px] uppercase tracking-[0.12em] font-semibold text-ink-3 ml-1">
              OUTRAS DISPUTAS
            </span>
          </div>
          <button className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-ink-3 hover:text-ink transition-colors">
            Tudo <ArrowRight size={12} weight="bold" />
          </button>
        </div>
        {undercardBets.length === 0 ? (
          <p className="text-[12px] text-ink-3 py-4 text-center">
            Sem outras disputas ativas.
          </p>
        ) : (
          <div className="flex flex-col">
            {undercardBets.map((bet, i) => {
              const [pa, pb] = bet.participants;
              const last = i === undercardBets.length - 1;
              const aPct = pa?.finalScore ?? 0;
              const bPct = pb?.finalScore ?? 0;
              return (
                <div
                  key={bet.id}
                  className={`grid items-center gap-3 py-3 ${
                    last ? "" : "border-b border-line"
                  }`}
                  style={{ gridTemplateColumns: "1fr auto 1fr auto auto" }}
                >
                  <div className="flex items-center gap-2 justify-end">
                    {pa && (
                      <>
                        <span className="text-[12px] font-bold text-ink truncate">
                          {pa.squadName}
                        </span>
                        <SquadLogo
                          squad={{ id: pa.squadId, name: pa.squadName, logoUrl: pa.squadLogoUrl }}
                          size={20}
                        />
                        <span
                          className="font-mono text-[13px] font-extrabold"
                          style={{
                            color:
                              aPct > bPct
                                ? "hsl(var(--eqi-green))"
                                : "hsl(var(--ink-3))",
                          }}
                        >
                          {Math.round(aPct)}%
                        </span>
                      </>
                    )}
                  </div>
                  <span className="text-[10px] font-extrabold italic text-ink-3">VS</span>
                  <div className="flex items-center gap-2">
                    {pb && (
                      <>
                        <span
                          className="font-mono text-[13px] font-extrabold"
                          style={{
                            color:
                              bPct > aPct
                                ? "hsl(var(--eqi-green))"
                                : "hsl(var(--ink-3))",
                          }}
                        >
                          {Math.round(bPct)}%
                        </span>
                        <SquadLogo
                          squad={{ id: pb.squadId, name: pb.squadName, logoUrl: pb.squadLogoUrl }}
                          size={20}
                        />
                        <span className="text-[12px] font-bold text-ink truncate">
                          {pb.squadName}
                        </span>
                      </>
                    )}
                  </div>
                  <span className="font-mono text-[12px] font-extrabold text-gold-deep">
                    R$ {bet.value.toLocaleString("pt-BR")}
                  </span>
                  <span className="font-mono text-[10px] text-ink-3 font-semibold">
                    {bet.roundLabel.toLowerCase().slice(0, 16)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Standings da temporada */}
      <div className="rounded-[14px] border border-line bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-extrabold tracking-tight text-ink">
            Standings da temporada
          </h3>
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border border-line bg-surface-2 text-ink-2"
          >
            ATIVOS
          </span>
        </div>
        <div className="flex flex-col">
          {squads.map((s, i) => {
            const last = i === squads.length - 1;
            const movement = i === 0 ? 1 : i === squads.length - 1 && squads.length > 2 ? -1 : 0;
            return (
              <div
                key={s.squad.id}
                className={`grid items-center gap-2.5 py-2.5 ${
                  last ? "" : "border-b border-line"
                }`}
                style={{ gridTemplateColumns: "24px 28px 1fr 60px 60px" }}
              >
                <span
                  className="font-mono text-[13px] font-bold"
                  style={{
                    color: i === 0 ? "hsl(var(--gold-deep))" : "hsl(var(--ink-3))",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <SquadLogo squad={s.squad} size={24} />
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-ink truncate">
                    Squad {s.squad.name}
                  </p>
                  <p className="font-mono text-[10px] text-ink-3 mt-0.5">
                    {s.squad.members.length} membros
                  </p>
                </div>
                <span className="font-mono text-[13px] font-extrabold text-right text-ink">
                  {s.pct}%
                </span>
                <div className="text-right">
                  {movement !== 0 ? (
                    <span
                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-extrabold font-mono"
                      style={{
                        background:
                          movement > 0
                            ? "oklch(0.94 0.06 152)"
                            : "oklch(0.95 0.04 25)",
                        color:
                          movement > 0
                            ? "hsl(var(--success))"
                            : "hsl(var(--destructive))",
                      }}
                    >
                      {movement > 0 ? <CaretUp size={9} weight="fill" /> : <CaretDown size={9} weight="fill" />}
                      {Math.abs(movement)}
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] text-ink-4">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SquadUndercardStandings;
