import {
  Users,
  Lightning,
  Phone,
  CalendarBlank,
  CheckCircle,
  Sparkle,
  Gift,
  FileText,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { useKpis } from "@/hooks/useKpis";
import { useOverviewReport } from "@/hooks/useReports";

const KPI_ICON: Record<string, PhosphorIcon> = {
  leads: Users,
  cadencia: Lightning,
  ligacoes: Phone,
  reunioes: CalendarBlank,
  reunioes_realizadas: CheckCircle,
  reunioes_ag: CalendarBlank,
  reunioes_real: CheckCircle,
  indicacoes: Gift,
  ativacao: Sparkle,
  ativacao_conta: Sparkle,
};

interface KpiGoalsListProps {
  from: string;
  to: string;
  /** Limita o número de KPIs visíveis (default 6 — match com artboard). */
  limit?: number;
}

/**
 * "Metas por KPI" — card compacto Editorial V1 (artboard DashEditorial,
 * coluna direita). Lista até 6 KPIs com ícone Phosphor + label, valor
 * realizado / target em mono e barra de progresso fina.
 */
const KpiGoalsList = ({ from, to, limit = 6 }: KpiGoalsListProps) => {
  const { kpis } = useKpis();
  const { data: overview } = useOverviewReport({ from, to });
  const items = kpis.slice(0, limit);

  return (
    <div className="rounded-[14px] border border-line bg-card p-5">
      <h3 className="text-[14px] font-extrabold tracking-tight text-ink mb-3.5">
        Metas por KPI
      </h3>
      <div className="flex flex-col gap-3">
        {items.map((kpi) => {
          const Icon = KPI_ICON[kpi.key] ?? FileText;
          const byKpi = overview?.byKpi.find((k) => k.key === kpi.key);
          const value = Math.round(byKpi?.actual ?? 0);
          const target = byKpi?.target ?? kpi.target;
          const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
          const reached = pct >= 100;
          return (
            <div key={kpi.id}>
              <div className="flex justify-between items-baseline mb-1">
                <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-2">
                  <Icon size={12} />
                  {kpi.label}
                </div>
                <span
                  className="font-mono text-[12px] font-bold"
                  style={{
                    color: reached ? "hsl(var(--success))" : "hsl(var(--ink))",
                  }}
                >
                  {value}
                  <span className="text-ink-3">/{target}</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-line overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: reached ? "hsl(var(--success))" : "hsl(var(--brand-primary))",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KpiGoalsList;
