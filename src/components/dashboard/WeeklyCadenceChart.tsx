import { useMemo } from "react";
import { format, parseISO, startOfWeek, addDays } from "date-fns";
import { useOverviewReport } from "@/hooks/useReports";

const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex"];

interface DayBucket {
  label: string;
  boletas: number;
  ativacoes: number;
}

interface WeeklyCadenceChartProps {
  /** Range opcional. Default: semana corrente (seg–sex). */
  from?: string;
  to?: string;
}

/**
 * Mini-chart compacto da Visão Geral (artboard DashEditorial > "Cadência
 * da Semana"). 5 barras stacked por dia útil, base verde EQI (boletas)
 * + topo dourado (ativações × 3 pra ficar visível). Sem axis labels —
 * só o nome do dia abaixo.
 *
 * Pega dados de useOverviewReport, agrupando por dia da semana atual.
 */
const WeeklyCadenceChart = ({ from, to }: WeeklyCadenceChartProps) => {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const defaultFrom = format(weekStart, "yyyy-MM-dd");
  const defaultTo = format(addDays(weekStart, 4), "yyyy-MM-dd");
  const fromDate = from ?? defaultFrom;
  const toDate = to ?? defaultTo;

  const { data: overview, isLoading } = useOverviewReport({ from: fromDate, to: toDate });

  const buckets: DayBucket[] = useMemo(() => {
    const days = Array.from({ length: 5 }).map((_, i) => format(addDays(weekStart, i), "yyyy-MM-dd"));
    const boletasSeries =
      overview?.byKpi.find((k) => k.key === "boletas" || k.key === "boletos")?.series ?? [];
    const ativacoesSeries =
      overview?.byKpi.find(
        (k) => k.key === "ativacao" || k.key === "ativacao_conta" || k.key === "ativacoes",
      )?.series ?? [];

    const sumBoletas = (date: string) =>
      boletasSeries.filter((s) => s.date === date).reduce((sum, s) => sum + s.value, 0);
    const sumAtivacoes = (date: string) =>
      ativacoesSeries.filter((s) => s.date === date).reduce((sum, s) => sum + s.value, 0);

    return days.map((d, i) => ({
      label: DAY_LABELS[i] ?? format(parseISO(d), "EEE"),
      boletas: sumBoletas(d),
      ativacoes: sumAtivacoes(d),
    }));
  }, [overview, weekStart]);

  const max = Math.max(1, ...buckets.map((b) => b.boletas + b.ativacoes * 3));

  if (isLoading) {
    return <div className="h-[140px] animate-pulse bg-surface-2 rounded" />;
  }

  return (
    <div className="flex items-end gap-4 pt-3" style={{ height: 140 }}>
      {buckets.map((b, i) => {
        const total = b.boletas + b.ativacoes * 3;
        const hBoletas = max > 0 ? (b.boletas / max) * 100 : 0;
        const hAtivacoes = max > 0 ? ((b.ativacoes * 3) / max) * 100 : 0;
        return (
          <div key={i} className="flex-1 flex flex-col gap-1.5 h-full">
            <div className="flex-1 flex flex-col-reverse gap-[2px] min-h-0">
              <div
                style={{
                  height: `${hBoletas}%`,
                  background: "hsl(var(--eqi-green))",
                  borderRadius: hAtivacoes > 0 ? "0 0 3px 3px" : 3,
                }}
                title={`${b.boletas} boletas`}
              />
              {hAtivacoes > 0 && (
                <div
                  style={{
                    height: `${hAtivacoes}%`,
                    background: "hsl(var(--gold))",
                    borderRadius: "3px 3px 0 0",
                  }}
                  title={`${b.ativacoes} ativações`}
                />
              )}
            </div>
            <p className="font-mono text-[10px] text-center text-ink-3 font-semibold">
              {b.label}
            </p>
          </div>
        );
      })}
      {/* Legenda — só aparece se temos dados */}
      {buckets.some((b) => b.boletas + b.ativacoes > 0) && (
        <div className="absolute" />
      )}
    </div>
  );
};

export default WeeklyCadenceChart;
