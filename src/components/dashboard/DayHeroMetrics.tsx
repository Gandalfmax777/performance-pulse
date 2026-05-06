import { useMemo } from "react";
import { useOverviewReport } from "@/hooks/useReports";

interface DayHeroMetricsProps {
  /** Data alvo (YYYY-MM-DD). */
  date: string;
}

/**
 * 3 hero cards do dia (artboard DailyDrilldown): BOLETAS DO DIA /
 * ATIVAÇÕES / REUNIÕES REALIZADAS — números mono 64px, label uppercase
 * acima e delta com "vs média" abaixo.
 */
const DayHeroMetrics = ({ date }: DayHeroMetricsProps) => {
  const { data: dayReport } = useOverviewReport({ from: date, to: date });

  const metrics = useMemo(() => {
    const find = (...keys: string[]) =>
      dayReport?.byKpi.find((k) => keys.includes(k.key));

    const boletas = find("boletas", "boletos");
    const ativacoes = find("ativacao", "ativacao_conta", "ativacoes");
    const reunioes = find("reunioes_realizadas", "reunioes_real", "reunioes");

    return [
      {
        label: "BOLETAS DO DIA",
        value: boletas ? Math.round(boletas.actual) : 0,
        color: "hsl(var(--eqi-green))",
      },
      {
        label: "ATIVAÇÕES",
        value: ativacoes ? Math.round(ativacoes.actual) : 0,
        color: "hsl(var(--gold-deep))",
      },
      {
        label: "REUNIÕES REALIZADAS",
        value: reunioes ? Math.round(reunioes.actual) : 0,
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
