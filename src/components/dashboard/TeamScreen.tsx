import { useMemo } from "react";
import { Fire, Funnel, GearSix, Plus } from "@phosphor-icons/react";
import { type Assessor } from "@/types/assessor";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";
import { useSquads } from "@/hooks/useSquads";
import { SectionCard } from "@/components/shared";
import { cn } from "@/lib/utils";

interface TeamScreenProps {
  assessors: Assessor[];
  /** Callback quando o usuário clica num card de assessor (abre profile). */
  onSelectAssessor?: (assessor: Assessor) => void;
  /** Callback do botão "Adicionar" / "Gerenciar" (abre manager). */
  onManage?: () => void;
}

/**
 * `/assessores` — alinha com `Assessores.html` do design.
 *
 * Removidos os 4 KPI cards do topo (Total, Acima da meta, Em risco,
 * Streaks) — não estão no design e duplicavam dados visíveis nos
 * próprios cards de pessoas.
 *
 * Layout: SectionCard "Equipe completa" com grid auto-fill cards.
 * Cada card: avatar 48px + nome + squad badge + pontos + meta %
 * com progress bar + streak.
 *
 * Click no card → AssessorProfile modal (preservado).
 * Header tem GearSix → AssessorManager.
 */
const TeamScreen = ({ assessors, onSelectAssessor, onManage }: TeamScreenProps) => {
  const { data: squadsData = [] } = useSquads();

  const squadByAssessor = useMemo(() => {
    const map = new Map<string, { id: string; name: string; color: string }>();
    for (const sq of squadsData) {
      for (const m of sq.members ?? []) {
        map.set(m.assessorId, { id: sq.id, name: sq.name, color: sq.color });
      }
    }
    return map;
  }, [squadsData]);

  const headerActions = (
    <>
      <button
        type="button"
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[11px] font-mono font-semibold uppercase tracking-[0.12em] text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
        title="Filtrar por squad"
      >
        <Funnel size={12} /> Squad
      </button>
      <button
        type="button"
        onClick={onManage}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[12px] font-semibold bg-ink text-white hover:bg-ink/90 transition-colors"
        title="Gerenciar (adicionar/editar/remover)"
      >
        <GearSix size={12} weight="bold" /> Gerenciar
      </button>
    </>
  );

  return (
    <SectionCard
      title="Equipe completa"
      subtitle={`${assessors.length} ${
        assessors.length === 1 ? "assessor" : "assessores"
      } ativos`}
      headerActions={headerActions}
      bodyless
    >
      {assessors.length === 0 ? (
        <div className="p-10 text-center text-ink-3">
          <p className="text-[13px] font-semibold mb-3">Nenhum assessor cadastrado.</p>
          <button
            type="button"
            onClick={onManage}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-ink text-white text-[12px] font-semibold hover:bg-ink/90 transition-colors"
          >
            <Plus size={13} weight="bold" /> Adicionar primeiro assessor
          </button>
        </div>
      ) : (
        <div
          className="grid gap-px bg-line"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
        >
          {assessors.map((p) => {
            const sq = squadByAssessor.get(p.id);
            const pct = p.weeklyGoalPercent;
            const pctColor =
              pct >= 100
                ? "text-[hsl(var(--success))]"
                : pct >= 70
                ? "text-ink"
                : "text-destructive";
            const barColor =
              pct >= 100
                ? "bg-[hsl(var(--success))]"
                : pct >= 70
                ? "bg-primary"
                : "bg-destructive";

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectAssessor?.(p)}
                className="text-left p-5 bg-card transition-colors hover:bg-surface-2 flex flex-col gap-3"
              >
                {/* Header */}
                <div className="flex items-center gap-3 min-w-0">
                  <AssessorAvatar
                    initials={p.avatar}
                    photoUrl={p.photoUrl}
                    level={p.level}
                    size={48}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-ink truncate">
                      {p.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {sq ? (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full border border-line bg-surface text-[10px] font-mono font-semibold uppercase tracking-[0.08em] text-ink-2"
                          title={sq.name}
                        >
                          <span
                            className="inline-block w-1.5 h-1.5 rounded-full mr-1.5"
                            style={{ background: sq.color }}
                          />
                          {sq.name}
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase tracking-[0.12em] font-mono text-ink-4">
                          Sem squad
                        </span>
                      )}
                      <span className="text-[10px] uppercase tracking-[0.12em] font-mono text-ink-3">
                        NV <span className="text-ink-2 capitalize">{p.level}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Meta + progress */}
                <div>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-[10px] uppercase tracking-[0.12em] font-mono font-semibold text-ink-3">
                      Meta · semana
                    </span>
                    <span
                      className={cn(
                        "num font-display font-extrabold leading-none tracking-[-0.02em]",
                        "text-[20px]",
                        pctColor,
                      )}
                    >
                      {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-[2px] bg-surface-2 overflow-hidden">
                    <div
                      className={cn("h-full rounded-[2px] transition-all", barColor)}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>

                {/* Footer: pontos + streak */}
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-line">
                  <span className="text-ink-3">
                    Pontos:{" "}
                    <span className="num font-mono font-bold text-ink">
                      {p.points.toLocaleString("pt-BR")}
                    </span>
                  </span>
                  {p.streak > 0 ? (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full border"
                      style={{
                        background:
                          p.streak >= 5 ? "hsl(var(--gold-soft))" : "hsl(var(--surface-2))",
                        color:
                          p.streak >= 5 ? "hsl(var(--gold-deep))" : "hsl(var(--ink-3))",
                        borderColor:
                          p.streak >= 5 ? "hsl(var(--gold))" : "hsl(var(--line))",
                      }}
                    >
                      <Fire size={10} weight="fill" />
                      {p.streak}d
                    </span>
                  ) : (
                    <span className="text-[10px] text-ink-4 uppercase tracking-[0.12em] font-mono">
                      Sem streak
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
};

export default TeamScreen;
