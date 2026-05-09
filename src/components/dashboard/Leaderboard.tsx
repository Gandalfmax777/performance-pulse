import { useNavigate } from "react-router-dom";
import { Fire } from "@phosphor-icons/react";
import { type Assessor } from "@/types/assessor";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";
import { SectionCard } from "@/components/shared";
import { cn } from "@/lib/utils";
import { useSquads } from "@/hooks/useSquads";

interface LeaderboardProps {
  assessors: Assessor[];
}

/**
 * "Ranking individual · Top 10" — alinha com `Dashboard.html` do design.
 * Tabela compacta com colunas: # | AAI (avatar+nome+streak) | Squad |
 * Meta % | Streak | Pontos. 1ª linha com avatar accent.
 *
 * Fonte: prop `assessors` (já vem com `points`/`weeklyGoalPercent`/`streak`
 * derivados via SSE/useRankingStream — mantido para preservar fluxo
 * legacy do Index).
 */
const Leaderboard = ({ assessors }: LeaderboardProps) => {
  const navigate = useNavigate();
  const { data: squads = [] } = useSquads();

  const squadByAssessor = new Map<string, string>();
  for (const sq of squads) {
    for (const m of sq.members ?? []) {
      // useSquads já filtra active=true; members vêm com membros ativos
      // (sem leftAt no shape do client).
      squadByAssessor.set(m.assessorId, sq.name);
    }
  }

  const sorted = [...assessors].sort((a, b) => b.points - a.points);
  const top = sorted.slice(0, 10);

  const headerActions = (
    <button
      type="button"
      onClick={() => navigate("/ranking")}
      className="text-[12px] font-semibold text-ink-3 hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-[6px] px-2 py-1"
    >
      Ver todos →
    </button>
  );

  return (
    <SectionCard
      title="Ranking individual · Top 10"
      subtitle="Pontos compostos = KPIs × peso + bônus de torneio"
      headerActions={headerActions}
      bodyless
    >
      <table className="w-full text-[13px]">
        <thead>
          <tr className="bg-surface-2">
            <th className="num text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-ink-3 text-left px-3 py-2.5 w-9">
              #
            </th>
            <th className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-ink-3 text-left px-3 py-2.5">
              AAI
            </th>
            <th className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-ink-3 text-left px-3 py-2.5">
              Squad
            </th>
            <th className="num text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-ink-3 text-right px-3 py-2.5">
              Meta
            </th>
            <th className="num text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-ink-3 text-right px-3 py-2.5">
              Streak
            </th>
            <th className="num text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-ink-3 text-right px-3 py-2.5">
              Pontos
            </th>
          </tr>
        </thead>
        <tbody>
          {top.map((a, i) => {
            const goalColor =
              a.weeklyGoalPercent >= 100
                ? "text-[hsl(var(--success))]"
                : a.weeklyGoalPercent >= 80
                ? "text-ink-2"
                : "text-destructive";
            const isFirst = i === 0;
            const squadName = squadByAssessor.get(a.id);
            return (
              <tr
                key={a.id}
                className="border-t border-line hover:bg-surface-2/60 transition-colors"
              >
                <td className="num text-[12px] font-mono font-semibold px-3 py-2.5">
                  <span
                    className={cn(
                      isFirst ? "text-primary" : "text-ink-3",
                    )}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <AssessorAvatar
                      initials={a.avatar}
                      photoUrl={a.photoUrl}
                      level={a.level}
                      size={28}
                    />
                    <span className="font-medium text-ink truncate">
                      {a.name}
                    </span>
                    {a.streak >= 5 && (
                      <span
                        className="inline-flex items-center gap-0.5 text-[10px] font-mono font-bold uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-full border shrink-0"
                        style={{
                          background: "hsl(var(--gold-soft))",
                          color: "hsl(var(--gold-deep))",
                          borderColor: "hsl(var(--gold))",
                        }}
                      >
                        <Fire size={10} weight="fill" /> {a.streak}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  {squadName ? (
                    <span className="num text-[11px] text-ink-3">
                      {squadName}
                    </span>
                  ) : (
                    <span className="text-[11px] text-ink-4">—</span>
                  )}
                </td>
                <td
                  className={cn(
                    "num text-right px-3 py-2.5 font-medium",
                    goalColor,
                  )}
                >
                  {a.weeklyGoalPercent}%
                </td>
                <td className="num text-right px-3 py-2.5 text-ink-2">
                  {a.streak > 0 ? a.streak : "—"}
                </td>
                <td className="num text-right px-3 py-2.5">
                  <span className="font-display font-bold text-[15px] text-ink">
                    {a.points.toLocaleString("pt-BR")}
                  </span>
                </td>
              </tr>
            );
          })}
          {top.length === 0 && (
            <tr>
              <td colSpan={6} className="px-3 py-6 text-center text-ink-3">
                Sem dados no período.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </SectionCard>
  );
};

export default Leaderboard;
