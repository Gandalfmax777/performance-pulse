import { useCallback } from "react";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import DayView from "@/components/dashboard/DayView";
import { AppShellLayout } from "@/components/layouts/AppShellLayout";
import { useAssessors } from "@/hooks/useAssessors";

/**
 * /por-dia — drilldown diário (lançamento de métricas + ranking do dia
 * + atividades do cronograma + Pomodoro).
 *
 * Esta rota era um redirect placeholder para `/?view=daily` desde a PR
 * `redesign-dashboard` (#3). A PR `redesign-por-dia` (#5) substitui o
 * redirect por esta página real, que adota o AppShellLayout (PR #4) e
 * renderiza o DayView existente.
 *
 * Lógica/dados/integrações do DayView (useDailyRanking, useActivities,
 * useMetrics, useKpis, lançamento via apiFetch) ficam intactos — esta
 * PR foca em visual/shell, não em regras de negócio.
 */
const PorDia = () => {
  const { assessors } = useAssessors();

  const openTv = useCallback(() => {
    window.open("/tv", "_blank", "noopener,noreferrer");
  }, []);

  const openPresentation = useCallback(() => {
    window.open("/presentation", "_blank", "noopener,noreferrer");
  }, []);

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
          onMenuClick={openMobileNav}
        />
      )}
    >
      <DayView assessors={assessors} />
    </AppShellLayout>
  );
};

export default PorDia;
