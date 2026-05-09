import { useCallback } from "react";
import { Plus } from "@phosphor-icons/react";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import SquadBetView from "@/components/dashboard/SquadBet";
import { AppShellLayout } from "@/components/layouts/AppShellLayout";
import { useAssessors } from "@/hooks/useAssessors";
import { useBets } from "@/hooks/useBets";

/**
 * /squad-bet — squads contra squads (apostas, ranking ao vivo, criação
 * de novas rodadas).
 *
 * Topbar tem botão "+ Nova aposta" que rola pra seção de criação dentro
 * do SquadBetView. Se já há aposta ATIVA, o botão fica disabled (regra
 * de domínio: só uma aposta ativa por vez).
 */
const SquadBet = () => {
  const { assessors } = useAssessors();
  const { data: bets = [] } = useBets();
  const hasActiveBet = bets.some((b) => b.status === "ACTIVE");

  const openTv = useCallback(() => {
    window.open("/tv", "_blank", "noopener,noreferrer");
  }, []);

  const openPresentation = useCallback(() => {
    window.open("/presentation", "_blank", "noopener,noreferrer");
  }, []);

  const scrollToNewBet = useCallback(() => {
    const el = document.getElementById("nova-aposta-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      // Highlight visual breve para chamar atenção
      el.classList.add("ring-2", "ring-primary", "ring-offset-2");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-primary", "ring-offset-2");
      }, 1500);
    }
  }, []);

  const newBetBtn = (
    <button
      onClick={scrollToNewBet}
      disabled={hasActiveBet}
      title={
        hasActiveBet
          ? "Há aposta ativa — encerre antes de iniciar outra"
          : "Iniciar nova aposta entre squads"
      }
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-xs font-semibold transition-all"
    >
      <Plus size={14} weight="bold" />
      Nova aposta
    </button>
  );

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
          actions={newBetBtn}
          onMenuClick={openMobileNav}
        />
      )}
    >
      <SquadBetView assessors={assessors} />
    </AppShellLayout>
  );
};

export default SquadBet;
