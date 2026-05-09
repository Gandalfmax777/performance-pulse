import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { differenceInDays, format, parseISO, subDays } from "date-fns";
import { Eyebrow, SectionCard, StatDelta } from "@/components/shared";
import { cn } from "@/lib/utils";
import { useOverviewReport } from "@/hooks/useReports";

interface OverviewKpiGridProps {
  from: string;
  to: string;
}

/**
 * Card "KPIs do período" — grid 3-col flat tiles separados por 1px de
 * background-line (técnica de gap-bg do design/assets/pulse.css).
 *
 * Cada tile mostra: label mono + valor display + delta + meta % +
 * progress bar. Status (success/warning/danger) deriva do percent
 * (>=100 success, >=80 warning, <80 danger).
 *
 * Dados via useOverviewReport — mesmo hook usado pelo HeroMetricStrip;
 * compartilha cache com a página inteira.
 */
export const OverviewKpiGrid = ({ from, to }: OverviewKpiGridProps) => {
  const navigate = useNavigate();
  const { data, isLoading } = useOverviewReport({ from, to });

  // Range anterior pra delta vs período passado (mesmo intervalo, shifted back)
  const previousRange = useMemo(() => {
    const days = differenceInDays(parseISO(to), parseISO(from)) + 1;
    return {
      from: format(subDays(parseISO(from), days), "yyyy-MM-dd"),
      to: format(subDays(parseISO(to), days), "yyyy-MM-dd"),
    };
  }, [from, to]);

  const { data: previousData } = useOverviewReport(previousRange);

  const prevByKey = useMemo(() => {
    const map = new Map<string, number>();
    for (const k of previousData?.byKpi ?? []) {
      map.set(k.key, k.actual);
    }
    return map;
  }, [previousData]);

  // Pega só KPIs ativos com target > 0; ordena por % desc para destacar
  // performance no topo. Mostra os 6 primeiros (grid 2 linhas × 3 cols).
  const kpis = (data?.byKpi ?? [])
    .filter((k) => k.target > 0)
    .slice(0, 6);

  const headerActions = (
    <button
      type="button"
      onClick={() => navigate("/kpis")}
      className="text-[12px] font-semibold text-ink-3 hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-[6px] px-2 py-1"
    >
      Ver detalhes →
    </button>
  );

  return (
    <SectionCard
      title="KPIs do período"
      subtitle="Real vs. meta · variação contra o período anterior"
      headerActions={headerActions}
      bodyless
    >
      {isLoading ? (
        <div className="p-5">
          <p className="text-[12px] text-ink-3">Carregando…</p>
        </div>
      ) : kpis.length === 0 ? (
        <div className="p-5">
          <p className="text-[12px] text-ink-3">
            Sem KPIs ativos no período.
          </p>
        </div>
      ) : (
        // Truque visual: bg-line + grid gap=1px + bg-card por tile = linhas
        // finíssimas separando os tiles sem precisar de border individual.
        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
          style={{ gap: 1, background: "hsl(var(--line))" }}
        >
          {kpis.map((k) => {
            const pct = Math.round(k.percent);
            const status: "success" | "warning" | "danger" =
              pct >= 100 ? "success" : pct >= 80 ? "warning" : "danger";
            const barColor =
              status === "success"
                ? "bg-[hsl(var(--success))]"
                : status === "warning"
                ? "bg-[hsl(var(--warning))]"
                : "bg-destructive";
            const valueText = formatValue(k.actual, k.unit);
            const targetText = formatValue(k.target, k.unit);
            const pctColor =
              status === "success"
                ? "text-[hsl(var(--success))]"
                : status === "warning"
                ? "text-[hsl(var(--warning))]"
                : "text-destructive";

            // Delta vs período anterior (mesmo intervalo shifted back).
            // null = sem dado anterior ou comparação inválida (prev=0).
            const prev = prevByKey.get(k.key) ?? 0;
            const deltaPct =
              prev > 0 ? Math.round(((k.actual - prev) / prev) * 100) : null;

            return (
              <div
                key={k.kpiId}
                className="p-[18px] bg-card flex flex-col justify-between min-h-[148px]"
              >
                <div>
                  <Eyebrow className="mb-2">{k.label}</Eyebrow>
                  <div className="flex items-end justify-between gap-2 mb-2">
                    <span className="num font-display font-extrabold text-[30px] leading-none tracking-[-0.03em] text-ink">
                      {valueText}
                    </span>
                    {deltaPct !== null && (
                      <StatDelta direction={deltaPct >= 0 ? "up" : "down"}>
                        {deltaPct >= 0 ? "+" : ""}
                        {deltaPct}%
                      </StatDelta>
                    )}
                  </div>
                  <p className="text-[11px] text-ink-3">
                    Meta {targetText} ·{" "}
                    <span className={cn("font-semibold num", pctColor)}>
                      {pct}%
                    </span>
                  </p>
                </div>
                <div className="mt-3 h-[6px] rounded-[3px] bg-surface-2 overflow-hidden">
                  <div
                    className={cn("h-full rounded-[3px]", barColor)}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
};

/** Formata valores: % → "70%", milhar → "1.284", decimal → "12,3". */
function formatValue(value: number, unit: string): string {
  if (unit === "%") return `${Math.round(value)}%`;
  if (Math.abs(value) >= 1000) return value.toLocaleString("pt-BR");
  if (Number.isInteger(value)) return value.toString();
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

