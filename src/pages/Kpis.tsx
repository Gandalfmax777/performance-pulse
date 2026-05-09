import { useCallback } from "react";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import KpiAnalytics from "@/components/dashboard/KpiAnalytics";
import { AppShellLayout } from "@/components/layouts/AppShellLayout";
import { useAssessors } from "@/hooks/useAssessors";

/**
 * /kpis — análise consolidada de KPIs (matriz por assessor + insights IA).
 *
 * Substitui o redirect placeholder /kpis → /?view=kpis criado na PR #3.
 * Adota AppShellLayout (PR #4) e renderiza KpiAnalytics, que tem
 * filtros próprios (período, agrupamento Geral/Individual, comparação
 * com período anterior) — não há period tabs no slot actions desta
 * topbar; o controle fica dentro do componente.
 */
const Kpis = () => {
  const { assessors } = useAssessors();

  const openTv = useCallback(() => {
    window.open("/tv", "_blank", "noopener,noreferrer");
  }, []);

  const openPresentation = useCallback(() => {
    window.open("/presentation", "_blank", "noopener,noreferrer");
  }, []);

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
          onMenuClick={openMobileNav}
        />
      )}
    >
      <KpiAnalytics assessors={assessors} />
    </AppShellLayout>
  );
};

export default Kpis;
