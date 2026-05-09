import { useCallback } from "react";
import { Outlet, useLocation } from "react-router-dom";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import { AppShellLayout } from "@/components/layouts/AppShellLayout";
import { AdminSubnav } from "@/components/shared";
import { usePenaltyProposalsCount } from "@/hooks/usePenaltyProposals";

interface AdminRoute {
  /** Pathname — alinha com `AdminSubnavItem.to` para forwarding direto. */
  to: string;
  /** Label do tab no AdminSubnav. */
  label: string;
  /** Título completo no topbar (eyebrow comum: "CONFIGURAÇÕES"). */
  title: string;
  /** Badge slug — opcional, casa com chave de `badgeCounts`. */
  badge?: string;
}

const ADMIN_ROUTES: readonly AdminRoute[] = [
  { to: "/admin/goals",         label: "Metas & KPIs",  title: "Metas & KPIs" },
  { to: "/admin/scoring",       label: "Pontuação",     title: "Pontuação" },
  { to: "/admin/penalties",     label: "Penalidades",   title: "Penalidades", badge: "penalty" },
  { to: "/admin/sounds",        label: "Sons dos KPIs", title: "Sons dos KPIs" },
  { to: "/admin/schedule",      label: "Cronograma",    title: "Cronograma" },
  { to: "/admin/biweekly",      label: "Indique Day",   title: "Indique Day" },
  { to: "/admin/bets-config",   label: "Apostas",       title: "Apostas" },
  { to: "/admin/tournaments",   label: "Torneios",      title: "Torneios" },
  { to: "/admin/announcements", label: "Avisos",        title: "Avisos" },
  { to: "/admin/users",         label: "Usuários",      title: "Usuários" },
] as const;

/**
 * AdminLayout — wrapper das rotas /admin/*.
 *
 * Antes da PR redesign-admin-foundations o admin tinha sua própria
 * sidebar (com brand + nav vertical + user footer). Agora reusa o
 * AppShellLayout (sidebar do dashboard, com active state em /admin)
 * e adiciona uma `AdminSubnav` horizontal acima do conteúdo, alinhada
 * com `.admin-subnav` do design (admin-nav.js / pulse.css).
 *
 * Title do topbar é dinâmico baseado na rota atual; eyebrow fixo em
 * "CONFIGURAÇÕES" para todas as sub-rotas. Badge counts (ex.: penalty
 * proposals pendentes) ficam no AdminSubnav.
 */
const AdminLayout = () => {
  const location = useLocation();
  const { data: penaltyCount } = usePenaltyProposalsCount();

  const badgeCounts: Record<string, number> = {
    penalty: penaltyCount?.pending ?? 0,
  };

  // Resolve title da rota atual (fallback: "Configurações" se não bater
  // exato — pode acontecer durante navegações intermediárias).
  const current = ADMIN_ROUTES.find((r) => location.pathname.startsWith(r.to));
  const title = current?.title ?? "Configurações";

  const openTv = useCallback(() => {
    window.open("/tv", "_blank", "noopener,noreferrer");
  }, []);

  const openPresentation = useCallback(() => {
    window.open("/presentation", "_blank", "noopener,noreferrer");
  }, []);

  return (
    <AppShellLayout
      // Sidebar não tem item "admin" no DashboardView type — passamos
      // "overview" como fallback; o item "Configurações" da sidebar usa
      // `pathname.startsWith("/admin")` para o active state.
      sidebarView="overview"
      onEnterTv={openTv}
      onEnterPresentation={openPresentation}
      renderTopbar={({ openMobileNav }) => (
        <DashboardTopbar
          eyebrow="CONFIGURAÇÕES"
          title={title}
          onMenuClick={openMobileNav}
        />
      )}
    >
      <AdminSubnav items={ADMIN_ROUTES} badgeCounts={badgeCounts} />
      <Outlet />
    </AppShellLayout>
  );
};

export default AdminLayout;
