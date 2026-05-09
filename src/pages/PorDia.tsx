import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import DayView from "@/components/dashboard/DayView";
import { AppShellLayout } from "@/components/layouts/AppShellLayout";
import { useAssessors } from "@/hooks/useAssessors";

/**
 * /por-dia — drilldown diário (lançamento de métricas + ranking do dia
 * + atividades do cronograma + Pomodoro).
 *
 * Topbar tem tabs "Por Dia / Semanal / Mensal" pra alternar granularidade
 * — Semanal e Mensal navegam para `/?period=weekly` e `/?period=monthly`,
 * mantendo o usuário no fluxo familiar (Visão Geral é o agregado natural).
 */
const PorDia = () => {
  const navigate = useNavigate();
  const { assessors } = useAssessors();

  const openTv = useCallback(() => {
    window.open("/tv", "_blank", "noopener,noreferrer");
  }, []);

  const openPresentation = useCallback(() => {
    window.open("/presentation", "_blank", "noopener,noreferrer");
  }, []);

  // Tabs no topbar — "Por Dia" é a aba ativa; demais redirecionam.
  const tabs: Array<{ key: "weekly" | "daily" | "monthly"; label: string }> = [
    { key: "weekly", label: "Semanal" },
    { key: "daily", label: "Por dia" },
    { key: "monthly", label: "Mensal" },
  ];
  const onTabClick = (key: "weekly" | "daily" | "monthly") => {
    if (key === "daily") return; // já estamos aqui
    navigate(`/?period=${key}`);
  };
  const periodTabs = (
    <div className="flex gap-1 p-[3px] bg-surface-2 rounded-[8px] border border-line">
      {tabs.map((t) => {
        const active = t.key === "daily";
        return (
          <button
            key={t.key}
            onClick={() => onTabClick(t.key)}
            className={`px-3 py-[5px] rounded-[5px] text-xs font-semibold transition-all ${
              active ? "bg-ink text-white" : "text-ink-2 hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <AppShellLayout
      sidebarView="daily"
      onEnterTv={openTv}
      onEnterPresentation={openPresentation}
      renderTopbar={({ openMobileNav }) => (
        <DashboardTopbar
          eyebrow="VISÃO POR DIA"
          title="Por Dia"
          subtitle="Lançamentos do dia · ranking ao vivo · cronograma"
          actions={periodTabs}
          onMenuClick={openMobileNav}
        />
      )}
    >
      <DayView assessors={assessors} />
    </AppShellLayout>
  );
};

export default PorDia;
