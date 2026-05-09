import { useState, type ReactNode } from "react";
import DashboardSidebar, {
  type DashboardView,
} from "@/components/dashboard/DashboardSidebar";

interface AppShellLayoutProps {
  /**
   * Topbar — geralmente <DashboardTopbar />. Recebido como render prop
   * para que o shell possa injetar `openMobileNav` (que abre o drawer
   * < md). Permite que o caller controle eyebrow/title/actions específicos
   * da rota sem o shell precisar saber sobre isso.
   */
  renderTopbar: (api: { openMobileNav: () => void }) => ReactNode;
  /** Conteúdo principal — renderizado dentro do <main>, abaixo do topbar. */
  children: ReactNode;
  /**
   * View atual (compat legacy enquanto Index usa ?view=). A sidebar usa
   * isso como fallback de active state quando estamos em "/". Quando
   * todas as rotas internas virarem páginas próprias (PRs #5-#10), este
   * prop sai e o active state passa a ser 100% pathname.
   */
  sidebarView: DashboardView;
  onEnterTv: () => void;
  onEnterPresentation: () => void;
}

/**
 * AppShellLayout — wrapper editorial das rotas internas autenticadas.
 *
 * Estrutura: outer flex (sidebar + main), sidebar sticky 248px, main com
 * topbar sticky e conteúdo com padding default. Estado do drawer mobile
 * vive aqui; o topbar recebe `openMobileNav` via render prop.
 *
 * **Escopo desta PR (#4)**: aplicado apenas ao Dashboard (Index). As
 * demais rotas (Por Dia, Ranking, KPIs, Squad Bet, Torneio, Assessores)
 * adotam este shell dentro das suas próprias PRs (#5-#10).
 *
 * Modais top-level (AssessorManager, PresentationMode,
 * TournamentFinishedOverlay) NÃO ficam dentro do shell — são irmãos no
 * caller, porque usam portais/dialogs que renderizam fora da tree.
 */
export const AppShellLayout = ({
  renderTopbar,
  children,
  sidebarView,
  onEnterTv,
  onEnterPresentation,
}: AppShellLayoutProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex relative">
      {/* Atmospheric overlay — sai quando bg-mesh for desativada (cleanup). */}
      <div className="fixed inset-0 pointer-events-none bg-mesh" />

      <DashboardSidebar
        view={sidebarView}
        onEnterTv={onEnterTv}
        onEnterPresentation={onEnterPresentation}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <main className="flex-1 min-w-0 flex flex-col overflow-x-hidden">
        {renderTopbar({ openMobileNav: () => setMobileOpen(true) })}

        <div className="flex-1 p-7 space-y-5">{children}</div>
      </main>
    </div>
  );
};
