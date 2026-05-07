import { useMemo } from "react";
import { format, parseISO, startOfWeek, addDays } from "date-fns";
import { useOverviewReport } from "@/hooks/useReports";

const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex"];

interface DayBucket {
  label: string;
  reunioesReal: number;
  ativacoes: number;
}

interface WeeklyCadenceChartProps {
  /** Range opcional. Default: semana corrente (seg–sex). */
  from?: string;
  to?: string;
}

/**
 * Mini-chart compacto da Visão Geral (artboard DashEditorial > "Cadência
 * da Semana"). 5 barras stacked por dia útil, base verde EQI (reuniões
 * realizadas) + topo dourado (ativações × 3 pra ficar visível). Sem axis
 * labels — só o nome do dia abaixo.
 *
 * 2026-05-07: trocou base de "boletas" → "reuniões realizadas" depois que
 * Boletas saiu do funil. Reuniões realizadas + ativações são os 2
 * indicadores que mais impactam o ranking (junto com reuniões agendadas).
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
    const reunioesRealSeries =
      overview?.byKpi.find(
        (k) => k.key === "reunioes_realizadas" || k.key === "reunioes_real",
      )?.series ?? [];
    const ativacoesSeries =
      overview?.byKpi.find(
        (k) => k.key === "ativacao_conta" || k.key === "ativacao" || k.key === "ativacoes",
      )?.series ?? [];

    const sumReunioesReal = (date: string) =>
      reunioesRealSeries.filter((s) => s.date === date).reduce((sum, s) => sum + s.value, 0);
    const sumAtivacoes = (date: string) =>
      ativacoesSeries.filter((s) => s.date === date).reduce((sum, s) => sum + s.value, 0);

    return days.map((d, i) => ({
      label: DAY_LABELS[i] ?? format(parseISO(d), "EEE"),
      reunioesReal: sumReunioesReal(d),
      ativacoes: sumAtivacoes(d),
    }));
  }, [overview, weekStart]);

  const max = Math.max(1, ...buckets.map((b) => b.reunioesReal + b.ativacoes * 3));

  if (isLoading) {
    return <div className="h-[140px] animate-pulse bg-surface-2 rounded" />;
  }

  return (
    <div className="flex items-end gap-4 pt-3" style={{ height: 140 }}>
      {buckets.map((b, i) => {
        const hReunioes = max > 0 ? (b.reunioesReal / max) * 100 : 0;
        const hAtivacoes = max > 0 ? ((b.ativacoes * 3) / max) * 100 : 0;
        return (
          <div key={i} className="flex-1 flex flex-col gap-1.5 h-full">
            <div className="flex-1 flex flex-col-reverse gap-[2px] min-h-0">
              <div
                style={{
                  height: `${hReunioes}%`,
                  background: "hsl(var(--eqi-green))",
                  borderRadius: hAtivacoes > 0 ? "0 0 3px 3px" : 3,
                }}
                title={`${b.reunioesReal} reuniões realizadas`}
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
      {buckets.some((b) => b.reunioesReal + b.ativacoes > 0) && (
        <div className="absolute" />
      )}
    </div>
  );
};

export default WeeklyCadenceChart;
