import { useMemo } from "react";
import { Fire, Funnel, GearSix, Plus } from "@phosphor-icons/react";
import { type Assessor } from "@/types/assessor";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";

interface TeamScreenProps {
  assessors: Assessor[];
  /** Callback quando o usuário clica num card de assessor (abre profile). */
  onSelectAssessor?: (assessor: Assessor) => void;
  /** Callback do botão "Adicionar" / "Gerenciar" (abre manager). */
  onManage?: () => void;
}

/**
 * Página "Assessores" (artboard TeamScreen). Layout fiel:
 *   - 4 KPI cards no topo: TOTAL / ACIMA DA META / EM RISCO (<70%) /
 *     STREAKS ATIVAS
 *   - Card "Equipe completa" com grid 2-col de cards por assessor
 *     (avatar 42px, nome, email, level, mesa, streak, % semana)
 *
 * Clicar no card abre o AssessorProfile (modal). O botão "Gerenciar"
 * no header continua abrindo o AssessorManager pra ações de
 * adicionar/remover/foto/férias.
 */
const TeamScreen = ({ assessors, onSelectAssessor, onManage }: TeamScreenProps) => {
  const stats = useMemo(() => {
    const total = assessors.length;
    const acimaMeta = assessors.filter((a) => a.weeklyGoalPercent >= 100).length;
    const emRisco = assessors.filter((a) => a.weeklyGoalPercent < 70).length;
    const streaksAtivas = assessors.filter((a) => a.streak >= 4).length;
    return { total, acimaMeta, emRisco, streaksAtivas };
  }, [assessors]);

  const kpiCards = [
    { label: "TOTAL", value: stats.total, color: "hsl(var(--ink))" },
    { label: "ACIMA DA META", value: stats.acimaMeta, color: "hsl(var(--success))" },
    { label: "EM RISCO (< 70%)", value: stats.emRisco, color: "hsl(var(--destructive))" },
    { label: "STREAKS ATIVAS", value: stats.streaksAtivas, color: "hsl(var(--gold-deep))" },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* 4 KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.map((c) => (
          <div key={c.label} className="rounded-[14px] border border-line bg-card p-5">
            <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-ink-3">
              {c.label}
            </p>
            <p
              className="font-mono font-extrabold leading-none mt-1.5"
              style={{ fontSize: 32, color: c.color }}
            >
              {c.value}
            </p>
          </div>
        ))}
      </div>

      {/* Equipe completa */}
      <div className="rounded-[14px] border border-line bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-line">
          <h3 className="text-[14px] font-extrabold tracking-tight text-ink">
            Equipe completa
          </h3>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[11px] font-semibold text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors">
              <Funnel size={12} /> Mesa
            </button>
            <button
              onClick={onManage}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[11px] font-semibold text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
              title="Gerenciar (adicionar/editar/remover)"
            >
              <GearSix size={12} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {assessors.length === 0 ? (
            <div className="col-span-full p-10 text-center text-ink-3">
              <p className="text-[13px] font-semibold mb-3">Nenhum assessor cadastrado.</p>
              <button
                onClick={onManage}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-ink text-white text-[12px] font-semibold hover:bg-ink/90 transition-colors"
              >
                <Plus size={13} weight="bold" /> Adicionar primeiro assessor
              </button>
            </div>
          ) : (
            assessors.map((p, i) => {
              const evenColumn = i % 2 === 0;
              const onLastRow = i >= assessors.length - (assessors.length % 2 || 2);
              const pctColor =
                p.weeklyGoalPercent >= 100
                  ? "hsl(var(--success))"
                  : p.weeklyGoalPercent >= 70
                  ? "hsl(var(--ink))"
                  : "hsl(var(--destructive))";
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectAssessor?.(p)}
                  className={`text-left p-4 flex items-center gap-3 transition-colors hover:bg-surface-2 ${
                    onLastRow ? "" : "border-b border-line"
                  } ${evenColumn ? "md:border-r border-line" : ""}`}
                >
                  <AssessorAvatar
                    initials={p.avatar}
                    photoUrl={p.photoUrl}
                    level={p.level}
                    size={42}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-ink truncate">{p.name}</p>
                    <p className="font-mono text-[10px] text-ink-3 mt-0.5 truncate">
                      {`${p.name.toLowerCase().replace(/ /g, ".")}@eqi.com.br`}
                    </p>
                    <div className="flex gap-3 mt-1.5 flex-wrap">
                      <span className="text-[10px] text-ink-3">
                        NV{" "}
                        <strong className="text-ink capitalize">{p.level}</strong>
                      </span>
                      <span className="text-[10px] text-ink-3">
                        Mesa{" "}
                        <strong className="text-ink font-mono">
                          SP-{p.id.slice(-2).toUpperCase()}
                        </strong>
                      </span>
                      {p.streak > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-gold-deep">
                          <Fire size={10} weight="fill" /> {p.streak}d
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className="font-mono font-extrabold leading-none"
                      style={{ fontSize: 18, color: pctColor }}
                    >
                      {p.weeklyGoalPercent}%
                    </p>
                    <p className="text-[8px] uppercase tracking-[0.12em] font-semibold text-ink-3 mt-1">
                      SEMANA
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamScreen;
