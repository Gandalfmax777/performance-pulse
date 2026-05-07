import { useMemo } from "react";
import { useOverviewReport } from "@/hooks/useReports";

interface DayHeroMetricsProps {
  /** Data alvo (YYYY-MM-DD). */
  date: string;
}

/**
 * 3 hero cards do dia (artboard DailyDrilldown): ATIVAÇÕES DO DIA /
 * REUNIÕES REALIZADAS / REUNIÕES AGENDADAS — números mono 64px, label
 * uppercase acima e delta com "vs média" abaixo.
 *
 * 2026-05-07: Boletas saiu do funil. O slot principal agora destaca
 * Ativações de Conta (KPI mais valioso, 10 pts cada).
 */
const DayHeroMetrics = ({ date }: DayHeroMetricsProps) => {
  const { data: dayReport } = useOverviewReport({ from: date, to: date });

  const metrics = useMemo(() => {
    const find = (...keys: string[]) =>
      dayReport?.byKpi.find((k) => keys.includes(k.key));

    const ativacoes = find("ativacao_conta", "ativacao", "ativacoes");
    const reunioesReal = find("reunioes_realizadas", "reunioes_real");
    const reunioesAg = find("reunioes", "reunioes_ag");

    return [
      {
        label: "ATIVAÇÕES DO DIA",
        value: ativacoes ? Math.round(ativacoes.actual) : 0,
        color: "hsl(var(--eqi-green))",
      },
      {
        label: "REUNIÕES REALIZADAS",
        value: reunioesReal ? Math.round(reunioesReal.actual) : 0,
        color: "hsl(var(--gold-deep))",
      },
      {
        label: "REUNIÕES AGENDADAS",
        value: reunioesAg ? Math.round(reunioesAg.actual) : 0,
        color: "hsl(var(--ink))",
      },
    ];
  }, [dayReport]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {metrics.map((m) => (
        <div key={m.label} className="rounded-[14px] border border-line bg-card p-6">
          <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-ink-3 mb-2">
            {m.label}
          </p>
          <p
            className="font-mono font-extrabold leading-none tracking-[-0.04em]"
            style={{ fontSize: 64, color: m.color }}
          >
            {m.value}
          </p>
        </div>
      ))}
    </div>
  );
};

export default DayHeroMetrics;
