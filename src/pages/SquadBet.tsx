import { useCallback } from "react";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import SquadBetView from "@/components/dashboard/SquadBet";
import { AppShellLayout } from "@/components/layouts/AppShellLayout";
import { useAssessors } from "@/hooks/useAssessors";

/**
 * /squad-bet — squads contra squads (apostas, ranking ao vivo, criação
 * de novas rodadas).
 *
 * Substitui o redirect placeholder /squad-bet → /?view=squad criado na
 * PR #3. Adota AppShellLayout (PR #4) e renderiza o componente de
 * domínio SquadBet (renomeado em import como SquadBetView para evitar
 * colisão de nome com a página).
 */
const SquadBet = () => {
  const { assessors } = useAssessors();

  const openTv = useCallback(() => {
    window.open("/tv", "_blank", "noopener,noreferrer");
  }, []);

  const openPresentation = useCallback(() => {
    window.open("/presentation", "_blank", "noopener,noreferrer");
  }, []);

  return (
    <AppShellLayout
      sidebarView="squad"
      onEnterTv={openTv}
      onEnterPresentation={openPresentation}
      renderTopbar={({ openMobileNav }) => (
        <DashboardTopbar
          eyebrow="ROUND ATIVO"
          title="Squad Bet"
          subtitle="Squads contra squads. Quem cumprir mais % da meta combinada leva o pote."
          onMenuClick={openMobileNav}
        />
      )}
    >
      <SquadBetView assessors={assessors} />
    </AppShellLayout>
  );
};

export default SquadBet;
