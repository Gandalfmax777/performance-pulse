import { useMemo } from "react";
import { differenceInDays, parseISO, subDays, format } from "date-fns";
import { useOverviewReport } from "@/hooks/useReports";
import { SectionCard, StatDelta } from "@/components/shared";
import { cn } from "@/lib/utils";

interface KpiDetailGridProps {
  range: { from: string; to: string };
}

type Status = "ok" | "atencao" | "abaixo";

const statusMeta: Record<Status, { label: string; bg: string; color: string; border: string }> = {
  ok: {
    label: "OK",
    bg: "bg-[hsl(var(--success)/0.12)]",
    color: "text-[hsl(var(--success))]",
    border: "border-[hsl(var(--success)/0.3)]",
  },
  atencao: {
    label: "Atenção",
    bg: "bg-[hsl(var(--warning)/0.12)]",
    color: "text-[hsl(var(--warning))]",
    border: "border-[hsl(var(--warning)/0.3)]",
  },
  abaixo: {
    label: "Abaixo",
    bg: "bg-destructive/12",
    color: "text-destructive",
    border: "border-destructive/30",
  },
};

/**
 * Grid 2-col com KpiDetailCard pra cada KPI ativo — alinha com `KPIs.html`.
 *
 * Cada card:
 *   • Header: label + status badge (OK / ATENÇÃO / ABAIXO)
 *   • Real: valor 42px font-display
 *   • Meta: target + unit
 *   • Progress bar
 *   • Delta vs período anterior (mesmo intervalo, shifted back)
 */
const KpiDetailGrid = ({ range }: KpiDetailGridProps) => {
  const { data: overview } = useOverviewReport(range);

  // Range anterior pro delta — shift back pelo comprimento do range atual
  const previousRange = useMemo(() => {
    const days = differenceInDays(parseISO(range.to), parseISO(range.from)) + 1;
    return {
      from: format(subDays(parseISO(range.from), days), "yyyy-MM-dd"),
      to: format(subDays(parseISO(range.to), days), "yyyy-MM-dd"),
    };
  }, [range]);

  const { data: previousOverview } = useOverviewReport(previousRange);

  const prevByKey = useMemo(() => {
    const map = new Map<string, number>();
    for (const k of previousOverview?.byKpi ?? []) {
      map.set(k.key, k.actual);
    }
    return map;
  }, [previousOverview]);

  const kpis = overview?.byKpi ?? [];
  if (kpis.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {kpis.map((k) => {
        const pct = Math.round(k.percent);
        const status: Status = pct >= 100 ? "ok" : pct >= 80 ? "atencao" : "abaixo";
        const meta = statusMeta[status];

        const prev = prevByKey.get(k.key) ?? 0;
        const delta = k.actual - prev;
        const deltaPct = prev > 0 ? Math.round((delta / prev) * 100) : null;

        const barWidth = Math.max(0, Math.min(100, pct));
        const barColor =
          status === "ok"
            ? "bg-[hsl(var(--success))]"
            : status === "atencao"
            ? "bg-[hsl(var(--warning))]"
            : "bg-destructive";

        const headerActions = (
          <span
            className={cn(
              "text-[10px] font-mono font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full border",
              meta.bg,
              meta.color,
              meta.border,
            )}
          >
            {meta.label}
          </span>
        );

        return (
          <SectionCard
            key={k.kpiId}
            title={k.label}
            subtitle={`Meta ${Math.round(k.target).toLocaleString("pt-BR")}${k.unit}`}
            headerActions={headerActions}
          >
            <div className="flex items-end justify-between gap-3 mb-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] font-mono font-semibold text-ink-3 mb-1">
                  Real
                </p>
                <p
                  className={cn(
                    "num font-display font-extrabold leading-none tracking-[-0.03em]",
                    "text-[42px]",
                    meta.color,
                  )}
                >
                  {Math.round(k.actual).toLocaleString("pt-BR")}
                  <span className="text-[18px] font-medium text-ink-3 ml-1">
                    {k.unit}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.12em] font-mono font-semibold text-ink-3 mb-1">
                  % da meta
                </p>
                <p
                  className={cn(
                    "num font-display font-extrabold leading-none tracking-[-0.03em] text-[28px]",
                    meta.color,
                  )}
                >
                  {pct}%
                </p>
              </div>
            </div>

            <div className="h-2 rounded-[3px] bg-surface-2 overflow-hidden">
              <div
                className={cn("h-full rounded-[3px] transition-all", barColor)}
                style={{ width: `${barWidth}%` }}
              />
            </div>

            {deltaPct !== null && (
              <div className="mt-3 flex items-center justify-between text-[12px] text-ink-3">
                <span>vs período anterior</span>
                <StatDelta direction={delta > 0 ? "up" : delta < 0 ? "down" : "flat"}>
                  {delta > 0 ? "+" : ""}
                  {Math.round(delta).toLocaleString("pt-BR")}
                  {k.unit}
                  {" · "}
                  {deltaPct > 0 ? "+" : ""}
                  {deltaPct}%
                </StatDelta>
              </div>
            )}
            {deltaPct === null && prev === 0 && k.actual > 0 && (
              <div className="mt-3 flex items-center justify-between text-[12px] text-ink-3">
                <span>vs período anterior</span>
                <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.12em] text-primary">
                  novo
                </span>
              </div>
            )}
          </SectionCard>
        );
      })}
    </div>
  );
};

export default KpiDetailGrid;
