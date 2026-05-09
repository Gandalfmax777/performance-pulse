import { useMemo } from "react";
import { useOverviewReport } from "@/hooks/useReports";
import { useDailyRanking } from "@/hooks/useRankings";
import { KpiTile } from "@/components/shared";

interface DayKpiTilesRowProps {
  /** Data alvo (YYYY-MM-DD). */
  date: string;
}

/**
 * 4 KPI tiles do dia (alinha com `Por-Dia.html`):
 *
 *   • Pontos · hoje (soma de rollup.points do daily ranking, accent)
 *   • Ligações
 *   • Reuniões agendadas
 *   • Reuniões realizadas
 *
 * Usa `useOverviewReport` filtrado pelo dia pra valores agregados
 * (consistente com restante da telabarra). Soma de pontos vem do
 * daily ranking (mesmo cálculo do "Ranking diário").
 */
const DayKpiTilesRow = ({ date }: DayKpiTilesRowProps) => {
  const { data: dayReport } = useOverviewReport({ from: date, to: date });
  const { data: dailyRanking } = useDailyRanking(date);

  const tiles = useMemo(() => {
    const find = (...keys: string[]) =>
      dayReport?.byKpi.find((k) => keys.includes(k.key));

    const ligacoes = find("ligacoes", "ligacao", "ligacoes_conectadas");
    const reunioesAg = find("reunioes", "reunioes_ag", "reunioes_agendadas");
    const reunioesReal = find("reunioes_realizadas", "reunioes_real");

    const pontosTotal = (dailyRanking?.rankings ?? []).reduce(
      (s, r) => s + (r.rollup.points ?? 0),
      0,
    );

    const formatPercent = (k: { actual: number; target: number; percent: number } | undefined) =>
      k && k.target > 0 ? `${Math.round(k.percent)}% da meta · ${Math.round(k.actual)}/${Math.round(k.target)}` : "Sem meta cadastrada";

    return [
      {
        label: "Pontos · hoje",
        value: pontosTotal.toLocaleString("pt-BR"),
        sub: `${dailyRanking?.rankings?.length ?? 0} AAIs ranqueados`,
        accent: true,
      },
      {
        label: "Ligações conectadas",
        value: ligacoes ? Math.round(ligacoes.actual).toLocaleString("pt-BR") : "0",
        sub: formatPercent(ligacoes),
        progress: ligacoes?.percent ?? 0,
        progressColor:
          (ligacoes?.percent ?? 0) >= 100
            ? ("success" as const)
            : (ligacoes?.percent ?? 0) >= 80
            ? ("primary" as const)
            : ("warning" as const),
      },
      {
        label: "Reuniões agendadas",
        value: reunioesAg ? Math.round(reunioesAg.actual).toLocaleString("pt-BR") : "0",
        sub: formatPercent(reunioesAg),
        progress: reunioesAg?.percent ?? 0,
        progressColor:
          (reunioesAg?.percent ?? 0) >= 100
            ? ("success" as const)
            : (reunioesAg?.percent ?? 0) >= 80
            ? ("primary" as const)
            : ("warning" as const),
      },
      {
        label: "Reuniões realizadas",
        value: reunioesReal ? Math.round(reunioesReal.actual).toLocaleString("pt-BR") : "0",
        sub: formatPercent(reunioesReal),
        progress: reunioesReal?.percent ?? 0,
        progressColor:
          (reunioesReal?.percent ?? 0) >= 100
            ? ("success" as const)
            : (reunioesReal?.percent ?? 0) >= 80
            ? ("primary" as const)
            : ("warning" as const),
      },
    ];
  }, [dayReport, dailyRanking]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {tiles.map((t) => (
        <KpiTile
          key={t.label}
          label={t.label}
          value={t.value}
          sub={t.sub}
          accent={t.accent}
          progress={t.progress}
          progressColor={t.progressColor}
          size="lg"
        />
      ))}
    </div>
  );
};

export default DayKpiTilesRow;
