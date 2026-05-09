import { useMemo } from "react";
import { useMetrics } from "@/hooks/useMetrics";
import { SectionCard } from "@/components/shared";
import { cn } from "@/lib/utils";

interface HourlyBarChartProps {
  /** Data alvo (YYYY-MM-DD). */
  date: string;
}

/** Hours rendered (08h–18h, 11 colunas). */
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
/** Janela de prime time da mesa: 09–11 e 14–16 — destacadas em accent. */
const PRIME_HOURS = new Set([9, 10, 14, 15]);

/**
 * Distribuição de pontos por hora — alinha com `Por-Dia.html`.
 * Bucketiza `pointsAwarded` por hora de `createdAt` da MetricEntry.
 *
 * Tradeoff: `createdAt` é o momento do registro, não da execução real
 * (assessor pode ter ligado às 10h e registrado às 11h). Aceitável
 * porque (a) Felipe registra ao fim de cada bloco do cronograma, (b)
 * sem schema novo só dá pra agregar por createdAt mesmo. Se precisar
 * granularidade real, criar campo `executedAt` em MetricEntry.
 */
const HourlyBarChart = ({ date }: HourlyBarChartProps) => {
  const { data: metrics = [] } = useMetrics({ from: date, to: date });

  const hourlyData = useMemo(() => {
    const byHour = new Map<number, number>();
    for (const m of metrics) {
      const points = m.pointsAwarded ?? 0;
      if (points <= 0) continue;
      const hour = new Date(m.createdAt).getHours();
      byHour.set(hour, (byHour.get(hour) ?? 0) + points);
    }
    return HOURS.map((h) => ({
      hour: h,
      points: Math.round(byHour.get(h) ?? 0),
    }));
  }, [metrics]);

  const maxPoints = Math.max(1, ...hourlyData.map((h) => h.points));
  const totalPoints = hourlyData.reduce((s, h) => s + h.points, 0);
  const peakHour = hourlyData.reduce(
    (best, h) => (h.points > best.points ? h : best),
    hourlyData[0],
  );

  return (
    <SectionCard
      title="Distribuição de pontos · hora a hora"
      subtitle={
        totalPoints > 0
          ? `Pico às ${String(peakHour.hour).padStart(2, "0")}h · ${peakHour.points} pts`
          : "Sem pontos registrados ainda"
      }
    >
      <div className="flex items-end gap-2 h-[160px]">
        {hourlyData.map(({ hour, points }) => {
          const heightPercent = (points / maxPoints) * 100;
          const isPrime = PRIME_HOURS.has(hour);
          return (
            <div key={hour} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
              <div className="num text-[10px] font-mono font-semibold text-ink-3">
                {points > 0 ? points : ""}
              </div>
              <div className="w-full flex-1 flex items-end">
                <div
                  className={cn(
                    "w-full rounded-t-[3px] transition-all",
                    points === 0
                      ? "bg-surface-2"
                      : isPrime
                      ? "bg-primary"
                      : "bg-ink-3/40",
                  )}
                  style={{
                    height: points === 0 ? "4px" : `${Math.max(4, heightPercent)}%`,
                  }}
                />
              </div>
              <div
                className={cn(
                  "num text-[10px] font-mono font-semibold uppercase tracking-[0.08em]",
                  isPrime ? "text-primary" : "text-ink-3",
                )}
              >
                {String(hour).padStart(2, "0")}h
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-4 text-[11px] text-ink-3">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-[2px] bg-primary" />
          Prime time (09–11 / 14–16)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-[2px] bg-ink-3/40" />
          Outras horas
        </span>
      </div>
    </SectionCard>
  );
};

export default HourlyBarChart;
