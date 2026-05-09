import { useMemo } from "react";
import { useOverviewReport } from "@/hooks/useReports";
import { SectionCard } from "@/components/shared";
import { cn } from "@/lib/utils";

interface KpiStatusOverviewCardProps {
  /** Range YYYY-MM-DD do período. */
  range: { from: string; to: string };
}

/**
 * "Status geral" — alinha com `KPIs.html`.
 *
 * Grid 4-col: label (2fr) | progress bar (3fr) | actual/target (1fr) | percent (auto)
 * Subtitle conta quantos KPIs estão acima da meta.
 */
const KpiStatusOverviewCard = ({ range }: KpiStatusOverviewCardProps) => {
  const { data: overview } = useOverviewReport(range);

  const kpis = useMemo(() => overview?.byKpi ?? [], [overview]);
  const aboveTarget = kpis.filter((k) => k.percent >= 100).length;

  return (
    <SectionCard
      title="Status geral"
      subtitle={
        kpis.length > 0
          ? `${aboveTarget} de ${kpis.length} ${
              kpis.length === 1 ? "indicador" : "indicadores"
            } acima da meta`
          : "Sem dados no período"
      }
    >
      {kpis.length === 0 ? (
        <p className="text-[12px] text-ink-3 py-4">
          Nenhum KPI ativo cadastrado para o período selecionado.
        </p>
      ) : (
        <div className="space-y-3">
          {kpis.map((k) => {
            const pct = Math.round(k.percent);
            const barWidth = Math.max(0, Math.min(100, pct));
            const status =
              pct >= 100
                ? "success"
                : pct >= 80
                ? "primary"
                : pct >= 50
                ? "warning"
                : "danger";
            const barColor =
              status === "success"
                ? "bg-[hsl(var(--success))]"
                : status === "primary"
                ? "bg-primary"
                : status === "warning"
                ? "bg-[hsl(var(--warning))]"
                : "bg-destructive";
            const valueColor =
              status === "success"
                ? "text-[hsl(var(--success))]"
                : status === "danger"
                ? "text-destructive"
                : "text-ink";

            return (
              <div
                key={k.kpiId}
                className="grid items-center gap-3"
                style={{
                  gridTemplateColumns: "minmax(140px, 2fr) 3fr minmax(80px, 1fr) auto",
                }}
              >
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-ink truncate">
                    {k.label}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.12em] font-mono text-ink-3 mt-0.5">
                    Meta {Math.round(k.target).toLocaleString("pt-BR")}
                    {k.unit}
                  </p>
                </div>
                <div className="h-2 rounded-[3px] bg-surface-2 overflow-hidden">
                  <div
                    className={cn("h-full rounded-[3px] transition-all", barColor)}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <p className="num text-[12px] font-mono text-ink-2 text-right">
                  <span className="font-semibold text-ink">
                    {Math.round(k.actual).toLocaleString("pt-BR")}
                  </span>
                  <span className="text-ink-3">
                    {" / "}
                    {Math.round(k.target).toLocaleString("pt-BR")}
                  </span>
                </p>
                <p
                  className={cn(
                    "num font-display font-bold text-[18px] text-right min-w-[60px]",
                    valueColor,
                  )}
                >
                  {pct}%
                </p>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
};

export default KpiStatusOverviewCard;
