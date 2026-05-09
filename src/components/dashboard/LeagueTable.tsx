import { Fire } from "@phosphor-icons/react";
import { type Assessor } from "@/types/assessor";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";
import { SectionCard } from "@/components/shared";
import { cn } from "@/lib/utils";

export interface LeagueTableRow {
  id: string;
  name: string;
  avatar: string;
  photoUrl: string | null;
  level: Assessor["level"];
  points: number;
  weeklyGoalPercent: number;
  streak: number;
  isInactive?: boolean;
  squadName?: string | null;
  /** Soma por kpiKey no período (ex: { leads: 12, ligacoes: 45, reunioes: 8, indicacoes: 3 }). */
  kpis?: Partial<Record<string, number>>;
}

interface LeagueTableProps {
  rows: LeagueTableRow[];
  /** KPIs extras a mostrar como colunas no meio da tabela. */
  kpiColumns?: Array<{ key: string; label: string }>;
}

const DEFAULT_KPI_COLUMNS: Array<{ key: string; label: string }> = [
  { key: "ligacoes", label: "Ligações" },
  { key: "reunioes", label: "Reuniões" },
  { key: "reunioes_realizadas", label: "Real." },
  { key: "indicacoes", label: "Indicações" },
];

/**
 * Tabela completa da liga (alinha com `Ranking.html`).
 *
 * Cabeçalho: # | AAI | Squad | <KPIs configuráveis> | Meta | Streak | Pontos
 * 1ª linha com avatar accent (border primary).
 *
 * Colunas KPI são opcionais — controlador (DailyResults) passa
 * `kpiColumns` decidindo o que mostrar com base nos KPIs ativos do
 * tenant. Default: ligacoes, reunioes, reunioes_realizadas, indicacoes.
 */
const LeagueTable = ({
  rows,
  kpiColumns = DEFAULT_KPI_COLUMNS,
}: LeagueTableProps) => {
  return (
    <SectionCard
      title="Tabela da liga"
      subtitle={`${rows.length} ${rows.length === 1 ? "assessor" : "assessores"} no período`}
      bodyless
    >
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-surface-2">
              <ThNum>#</ThNum>
              <Th>AAI</Th>
              <Th>Squad</Th>
              {kpiColumns.map((c) => (
                <ThNum key={c.key}>{c.label}</ThNum>
              ))}
              <ThNum>Meta</ThNum>
              <ThNum>Streak</ThNum>
              <ThNum>Pontos</ThNum>
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
                    "border-t border-line transition-colors",
                    "hover:bg-surface-2/60",
                    p.isInactive && "opacity-60",
                  )}
                >
                  <td className="num text-[12px] font-mono font-semibold px-3 py-2.5">
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
                      <span className="font-medium text-ink truncate">
                        {p.name}
                      </span>
                      {p.isInactive && (
                        <span className="text-[10px] uppercase tracking-[0.12em] font-mono font-bold text-ink-4 shrink-0">
                          inativo
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    {p.squadName ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-line bg-surface text-[11px] text-ink-2">
                        {p.squadName}
                      </span>
                    ) : (
                      <span className="text-[11px] text-ink-4">—</span>
                    )}
                  </td>
                  {kpiColumns.map((c) => {
                    const v = p.kpis?.[c.key];
                    return (
                      <td
                        key={c.key}
                        className="num text-right px-3 py-2.5 text-ink-2"
                      >
                        {v != null ? Math.round(v).toLocaleString("pt-BR") : "—"}
                      </td>
                    );
                  })}
                  <td
                    className={cn(
                      "num text-right px-3 py-2.5 font-medium",
                      goalColor,
                    )}
                  >
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
                  colSpan={3 + kpiColumns.length + 3}
                  className="px-3 py-8 text-center text-ink-3"
                >
                  Sem assessores no período.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
};

const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-ink-3 text-left px-3 py-2.5">
    {children}
  </th>
);

const ThNum = ({ children }: { children: React.ReactNode }) => (
  <th className="num text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-ink-3 text-right px-3 py-2.5">
    {children}
  </th>
);

export default LeagueTable;
