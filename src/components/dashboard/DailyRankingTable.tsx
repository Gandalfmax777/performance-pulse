import { useMemo } from "react";
import { Fire } from "@phosphor-icons/react";
import { format } from "date-fns";
import { type Assessor } from "@/types/assessor";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";
import { SectionCard } from "@/components/shared";
import { useDailyRanking } from "@/hooks/useRankings";
import { useOverviewReport } from "@/hooks/useReports";
import { cn } from "@/lib/utils";

interface DailyRankingTableProps {
  date: string;
  assessors: Assessor[];
}

const LiveBadge = () => (
  <span
    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-mono font-bold tracking-[0.12em] uppercase"
    style={{
      background: "color-mix(in oklab, hsl(var(--primary)) 12%, transparent)",
      borderColor: "color-mix(in oklab, hsl(var(--primary)) 25%, transparent)",
      color: "hsl(var(--primary))",
    }}
  >
    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" aria-hidden />
    AO VIVO
  </span>
);

const DEFAULT_KPI_COLUMNS: Array<{ key: string; label: string }> = [
  { key: "ligacoes", label: "Ligações" },
  { key: "reunioes", label: "Reuniões" },
  { key: "reunioes_realizadas", label: "Real." },
  { key: "indicacoes", label: "Indicações" },
];

/**
 * Tabela "Ranking · dia" — alinha com `Por-Dia.html`.
 * Ordena por pontos do dia descendente. Mostra colunas KPI compactas
 * + meta % + streak + pontos.
 */
const DailyRankingTable = ({ date, assessors }: DailyRankingTableProps) => {
  const { data: dailyRanking } = useDailyRanking(date);
  const { data: overview } = useOverviewReport({ from: date, to: date });

  const kpisByAssessor = useMemo(() => {
    const map = new Map<string, Record<string, number>>();
    for (const a of overview?.byAssessor ?? []) {
      map.set(a.assessorId, a.kpis);
    }
    return map;
  }, [overview]);

  const rows = useMemo(() => {
    const assessorById = new Map(assessors.map((a) => [a.id, a]));
    return (dailyRanking?.rankings ?? []).map((r) => {
      const a = assessorById.get(r.assessor.id);
      return {
        id: r.assessor.id,
        name: r.assessor.name,
        avatar: a?.avatar ?? r.assessor.initials,
        photoUrl: r.assessor.photoUrl,
        level: a?.level ?? (r.assessor.level.toLowerCase() as Assessor["level"]),
        points: r.rollup.points,
        weeklyGoalPercent: r.rollup.weeklyGoalPercent,
        streak: r.rollup.streak,
        isInactive: r.rollup.points === 0,
        kpis: kpisByAssessor.get(r.assessor.id) ?? {},
      };
    });
  }, [dailyRanking, assessors, kpisByAssessor]);

  const isToday = date === format(new Date(), "yyyy-MM-dd");

  return (
    <SectionCard
      title="Ranking · dia"
      subtitle={
        isToday
          ? "Pontos zeram à meia-noite e são acumulados para a semana."
          : `${rows.length} ${rows.length === 1 ? "AAI" : "AAIs"} no dia`
      }
      headerActions={isToday ? <LiveBadge /> : undefined}
      bodyless
    >
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-surface-2">
              <th className="num text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-ink-3 text-right px-3 py-2.5 w-9">
                #
              </th>
              <th className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-ink-3 text-left px-3 py-2.5">
                AAI
              </th>
              {DEFAULT_KPI_COLUMNS.map((c) => (
                <th
                  key={c.key}
                  className="num text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-ink-3 text-right px-3 py-2.5"
                >
                  {c.label}
                </th>
              ))}
              <th className="num text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-ink-3 text-right px-3 py-2.5">
                Meta
              </th>
              <th className="num text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-ink-3 text-right px-3 py-2.5">
                Streak
              </th>
              <th className="num text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-ink-3 text-right px-3 py-2.5">
                Pontos · dia
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => {
              const goalColor =
                p.weeklyGoalPercent >= 100
                  ? "text-[hsl(var(--success))]"
                  : p.weeklyGoalPercent >= 80
                  ? "text-ink-2"
                  : "text-destructive";
              const isFirst = i === 0;
              return (
                <tr
                  key={p.id}
                  className={cn(
                    "border-t border-line transition-colors hover:bg-surface-2/60",
                    p.isInactive && "opacity-60",
                  )}
                >
                  <td className="num text-right px-3 py-2.5 text-[12px] font-mono font-semibold">
                    <span className={cn(isFirst ? "text-primary" : "text-ink-3")}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <AssessorAvatar
                        initials={p.avatar}
                        photoUrl={p.photoUrl}
                        level={p.level}
                        size={28}
                      />
                      <span className="font-medium text-ink truncate">{p.name}</span>
                      {p.isInactive && (
                        <span className="text-[10px] uppercase tracking-[0.12em] font-mono font-bold text-ink-4 shrink-0">
                          inativo
                        </span>
                      )}
                    </div>
                  </td>
                  {DEFAULT_KPI_COLUMNS.map((c) => {
                    const v = p.kpis[c.key];
                    return (
                      <td
                        key={c.key}
                        className="num text-right px-3 py-2.5 text-ink-2"
                      >
                        {v != null ? Math.round(v).toLocaleString("pt-BR") : "—"}
                      </td>
                    );
                  })}
                  <td className={cn("num text-right px-3 py-2.5 font-medium", goalColor)}>
                    {p.weeklyGoalPercent}%
                  </td>
                  <td className="num text-right px-3 py-2.5 text-ink-2">
                    {p.streak > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        <Fire
                          size={11}
                          weight="fill"
                          className={
                            p.streak >= 5
                              ? "text-[hsl(var(--gold-deep))]"
                              : "text-ink-3"
                          }
                        />
                        {p.streak}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="num text-right px-3 py-2.5">
                    <span className="font-display font-bold text-[16px] text-ink">
                      {p.points.toLocaleString("pt-BR")}
                    </span>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={3 + DEFAULT_KPI_COLUMNS.length + 3}
                  className="px-3 py-8 text-center text-ink-3"
                >
                  Sem assessores no dia.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
};

export default DailyRankingTable;
