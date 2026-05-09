import { useMemo } from "react";
import { Fire, GearSix, Plus } from "@phosphor-icons/react";
import { type Assessor } from "@/types/assessor";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";
import { useSquads } from "@/hooks/useSquads";
import { Eyebrow } from "@/components/shared";
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

  // Sem SectionCard wrapping — design tem só a grid, sem header. O título
  // já vem do DashboardTopbar ("14 assessores") e o botão "+ Gerenciar"
  // está no slot actions da topbar. Removendo o wrapper aqui, ganhamos
  // espaço útil e batemos com `Assessores.html`.
  return (
    <div className="flex flex-col gap-4">
      {/* Action bar minimal — alinhado à direita, só Gerenciar */}
      {assessors.length > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onManage}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[12px] font-semibold bg-ink text-white hover:bg-ink/90 transition-colors"
            title="Gerenciar (adicionar/editar/remover)"
          >
            <GearSix size={12} weight="bold" /> Gerenciar
          </button>
        </div>
      )}

      {assessors.length === 0 ? (
        <div className="rounded-[var(--radius)] border border-line bg-card p-10 text-center text-ink-3">
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
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
        >
          {assessors.map((p) => {
            const sq = squadByAssessor.get(p.id);
            const pct = p.weeklyGoalPercent;
            const pctColor =
              pct >= 100
                ? "text-[hsl(var(--success))]"
                : pct >= 80
                ? "text-ink"
                : "text-destructive";
            const barColor =
              pct >= 100
                ? "bg-primary"
                : pct >= 80
                ? "bg-[hsl(var(--warning))]"
                : "bg-destructive";

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectAssessor?.(p)}
                className={cn(
                  "text-left p-5 rounded-[var(--radius)] border border-line bg-card",
                  "shadow-[0_1px_2px_hsl(240_12%_16%/0.05),0_4px_16px_hsl(240_12%_16%/0.04)]",
                  "transition-all hover:border-primary/50 hover:shadow-md",
                  "flex flex-col gap-3.5",
                )}
              >
                {/* Header: avatar + name+squad + streak badge (alinhado com design) */}
                <div className="flex items-center gap-3 min-w-0">
                  <AssessorAvatar
                    initials={p.avatar}
                    photoUrl={p.photoUrl}
                    level={p.level}
                    size={44}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-ink truncate">
                      {p.name}
                    </p>
                    <Eyebrow className="mt-0.5">
                      Squad {sq?.name ?? "—"}
                    </Eyebrow>
                  </div>
                  {p.streak >= 5 && (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full border shrink-0"
                      style={{
                        background: "hsl(var(--gold-soft))",
                        color: "hsl(var(--gold-deep))",
                        borderColor: "hsl(var(--gold))",
                      }}
                    >
                      <Fire size={10} weight="fill" />
                      {p.streak}
                    </span>
                  )}
                </div>

                {/* Pontos + Meta — 2-col grid após divisor (match design) */}
                <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-line">
                  <div>
                    <Eyebrow className="mb-1">Pontos</Eyebrow>
                    <p className="num font-display font-extrabold text-[20px] text-ink leading-none tracking-[-0.02em]">
                      {p.points.toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <Eyebrow className="mb-1">Meta</Eyebrow>
                    <p
                      className={cn(
                        "num font-display font-bold text-[14px] leading-none",
                        pctColor,
                      )}
                    >
                      {pct}%
                    </p>
                  </div>
                </div>

                {/* Progress bar 4px (design) */}
                <div className="h-1 rounded-[2px] bg-surface-2 overflow-hidden">
                  <div
                    className={cn("h-full rounded-[2px] transition-all", barColor)}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeamScreen;
