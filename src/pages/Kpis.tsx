import { useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { GearSix } from "@phosphor-icons/react";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import KpiAnalytics from "@/components/dashboard/KpiAnalytics";
import { AppShellLayout } from "@/components/layouts/AppShellLayout";
import { useAssessors } from "@/hooks/useAssessors";
import { useOpenTv } from "@/hooks/useOpenTv";

type KpisPeriod = "weekly" | "monthly";

const PERIODS: { value: KpisPeriod; label: string }[] = [
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
];

const VALID_PERIODS = new Set<KpisPeriod>(["weekly", "monthly"]);

function parsePeriod(raw: string | null): KpisPeriod {
  return raw && VALID_PERIODS.has(raw as KpisPeriod) ? (raw as KpisPeriod) : "weekly";
}

function rangeForPeriod(p: KpisPeriod): { from: string; to: string } {
  const now = new Date();
  const fmt = (d: Date) => format(d, "yyyy-MM-dd");
  if (p === "weekly")
    return {
      from: fmt(startOfWeek(now, { weekStartsOn: 1 })),
      to: fmt(endOfWeek(now, { weekStartsOn: 1 })),
    };
  return { from: fmt(startOfMonth(now)), to: fmt(endOfMonth(now)) };
}

/**
 * /kpis — análise consolidada de KPIs (matriz por assessor + insights IA).
 *
 * Topbar tem tabs "Semanal / Mensal" + botão "⚙ Configurar metas" (admin
 * → /admin/goals). Range default vem do period selecionado; usuário pode
 * refinar via DateRangePicker dentro do filter bar do KpiAnalytics.
 */
const Kpis = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const period = parsePeriod(searchParams.get("period"));
  const initialRange = rangeForPeriod(period);

  const { assessors } = useAssessors();

  const setPeriod = useCallback(
    (p: KpisPeriod) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("period", p);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const openTv = useOpenTv();

  const openPresentation = useCallback(() => {
    window.open("/presentation", "_blank", "noopener,noreferrer");
  }, []);

  const periodTabs = (
    <div className="flex gap-1 p-[3px] bg-surface-2 rounded-[8px] border border-line">
      {PERIODS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setPeriod(opt.value)}
          aria-pressed={period === opt.value}
          className={`px-3 py-[5px] rounded-[5px] text-xs font-semibold transition-colors ${
            period === opt.value
              ? "bg-ink text-white"
              : "text-ink-2 hover:text-ink"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  const configBtn = (
    <button
      onClick={() => navigate("/admin/goals")}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[8px] border border-line bg-surface text-ink-2 hover:bg-surface-2 hover:text-ink text-xs font-semibold transition-all"
      title="Configurar metas — Admin"
    >
      <GearSix size={14} weight="bold" />
      Configurar metas
    </button>
  );

  return (
    <AppShellLayout
      sidebarView="kpis"
      onEnterTv={openTv}
      onEnterPresentation={openPresentation}
      renderTopbar={({ openMobileNav }) => (
        <DashboardTopbar
          eyebrow="ANÁLISE CONSOLIDADA"
          title="KPIs"
          subtitle="Funil completo · todos os assessores"
          actions={
            <>
              {periodTabs}
              {configBtn}
            </>
          }
          onMenuClick={openMobileNav}
        />
      )}
    >
      <KpiAnalytics assessors={assessors} initialRange={initialRange} />
    </AppShellLayout>
  );
};

export default Kpis;
