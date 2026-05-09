import { Crown, Fire } from "@phosphor-icons/react";
import { type Assessor } from "@/types/assessor";
import { type ApiSquad } from "@/hooks/useSquads";
import { SquadLogo } from "@/components/ui/SquadLogo";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";
import { SectionCard, Eyebrow } from "@/components/shared";
import { cn } from "@/lib/utils";

export interface SquadStanding {
  sq: ApiSquad;
  members: Assessor[];
  stats: {
    avgGoal: number;
    totalPoints: number;
  };
  wins: number;
  totalWon: number;
}

interface SquadStandingsGridProps {
  rows: SquadStanding[];
  /** Período (label) — mostra como subtitle. */
  periodLabel?: string;
}

/**
 * Grid de squad standings (3-col em desktop) — alinha com `Squad-Bet.html`.
 *
 * Cada card:
 *   • Header: SquadLogo + nome + ranking badge (LÍDER / VICE / etc)
 *   • Body: avgGoal % font-display gigante + totalPoints
 *   • Members preview (até 4 avatares + count)
 *   • Footer: wins + cofre acumulado
 *
 * Ordenado por avgGoal desc (refletindo critério padrão do design).
 */
const SquadStandingsGrid = ({ rows, periodLabel }: SquadStandingsGridProps) => {
  if (rows.length === 0) {
    return (
      <SectionCard title="Squads" subtitle="Nenhuma squad criada ainda">
        <p className="text-[12px] text-ink-3 py-4">
          Use "Criar Squad" abaixo pra montar o primeiro time.
        </p>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Squads · standings"
      subtitle={periodLabel ? `Ranqueado por meta % média no período ${periodLabel}` : "Ranqueado por meta % média"}
      bodyless
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-line">
        {rows.map((row, i) => {
          const sq = row.sq;
          const isLeader = i === 0;
          const isVice = i === 1;
          const goalColor =
            row.stats.avgGoal >= 100
              ? "text-[hsl(var(--success))]"
              : row.stats.avgGoal >= 80
              ? "text-ink"
              : "text-destructive";

          return (
            <div
              key={sq.id}
              className={cn(
                "p-5 bg-card relative flex flex-col",
                isLeader && "border-t-[3px] border-t-primary",
              )}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <SquadLogo squad={sq} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold text-ink truncate">
                    {sq.name}
                  </p>
                  <p className="text-[11px] text-ink-3">
                    {row.members.length}{" "}
                    {row.members.length === 1 ? "membro" : "membros"}
                  </p>
                </div>
                {isLeader && (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full border"
                    style={{
                      background: "hsl(var(--gold-soft))",
                      color: "hsl(var(--gold-deep))",
                      borderColor: "hsl(var(--gold))",
                    }}
                  >
                    <Crown size={10} weight="fill" /> Líder
                  </span>
                )}
                {isVice && (
                  <span className="text-[10px] font-mono font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full border border-line bg-surface text-ink-3">
                    Vice
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-end justify-between mb-4">
                <div>
                  <Eyebrow className="mb-1">Meta % média</Eyebrow>
                  <p
                    className={cn(
                      "num font-display font-extrabold leading-none tracking-[-0.03em]",
                      goalColor,
                    )}
                    style={{ fontSize: 38 }}
                  >
                    {row.stats.avgGoal}%
                  </p>
                </div>
                <div className="text-right">
                  <Eyebrow className="mb-1">Pontos</Eyebrow>
                  <p className="num font-mono font-bold text-ink text-[20px]">
                    {row.stats.totalPoints.toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>

              {/* Members preview */}
              <div className="flex items-center gap-1 mb-3">
                {row.members.slice(0, 4).map((m) => (
                  <AssessorAvatar
                    key={m.id}
                    initials={m.avatar}
                    photoUrl={m.photoUrl}
                    level={m.level}
                    size={24}
                  />
                ))}
                {row.members.length > 4 && (
                  <span className="text-[11px] font-mono font-semibold text-ink-3 ml-1">
                    +{row.members.length - 4}
                  </span>
                )}
              </div>

              {/* Footer */}
              <div className="mt-auto pt-3 border-t border-line flex items-center justify-between text-[11px]">
                <span className="text-ink-3 inline-flex items-center gap-1">
                  <Fire
                    size={11}
                    weight="fill"
                    className={
                      row.wins > 0 ? "text-[hsl(var(--gold-deep))]" : "text-ink-4"
                    }
                  />
                  <span className="num font-mono font-semibold text-ink">
                    {row.wins}
                  </span>{" "}
                  {row.wins === 1 ? "vitória" : "vitórias"}
                </span>
                <span className="num font-mono font-semibold text-ink">
                  R$ {row.totalWon.toLocaleString("pt-BR")}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
};

export default SquadStandingsGrid;
