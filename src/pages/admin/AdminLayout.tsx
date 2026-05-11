import { useCallback } from "react";
import { Outlet, useLocation } from "react-router-dom";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import { AppShellLayout } from "@/components/layouts/AppShellLayout";
import { AdminSubnav } from "@/components/shared";
import { usePenaltyProposalsCount } from "@/hooks/usePenaltyProposals";
import { useOpenTv } from "@/hooks/useOpenTv";

interface AdminRoute {
  /** Pathname — alinha com `AdminSubnavItem.to` para forwarding direto. */
  to: string;
  /** Label do tab no AdminSubnav. */
  label: string;
  /** Título completo no topbar (eyebrow comum: "CONFIGURAÇÕES"). */
  title: string;
  /** Subtitle do topbar — descreve o propósito da página. */
  subtitle?: string;
  /** Badge slug — opcional, casa com chave de `badgeCounts`. */
  badge?: string;
}

const ADMIN_ROUTES: readonly AdminRoute[] = [
  {
    to: "/admin/goals",
    label: "Metas & KPIs",
    title: "Metas & KPIs",
    subtitle:
      "Edite as definições dos KPIs e suas metas ativas. Mudança retroativa recalcula os históricos.",
  },
  {
    to: "/admin/scoring",
    label: "Pontuação",
    title: "Pontuação",
    subtitle: "Regras de scoring por KPI: divisor, pontos por bucket, threshold.",
  },
  {
    to: "/admin/penalties",
    label: "Penalidades",
    title: "Penalidades",
    subtitle: "Aprovar / rejeitar propostas de penalidade abertas pelos gestores.",
    badge: "penalty",
  },
  {
    to: "/admin/sounds",
    label: "Sons dos KPIs",
    title: "Sons dos KPIs",
    subtitle:
      "Suba MP3/WAV (até 2MB) por KPI. Marcado como broadcast, toca em todos os dispositivos conectados ao registrar o evento.",
  },
  {
    to: "/admin/schedule",
    label: "Cronograma",
    title: "Cronograma",
    subtitle:
      "Edite atividades, horários e KPIs vinculados. Activities desativadas não aparecem no cronograma do dashboard.",
  },
  {
    to: "/admin/biweekly",
    label: "Indique Day",
    title: "Indique Day",
    subtitle:
      "O Indique Day roda a cada 15 dias. Cada atividade BIWEEKLY tem uma âncora; quartas a N×14 dias dela são ativadas.",
  },
  {
    to: "/admin/bets-config",
    label: "Apostas",
    title: "Apostas",
    subtitle:
      "Crie apostas entre squads, escolha o critério de vitória e acompanhe o histórico.",
  },
  {
    to: "/admin/tournaments",
    label: "Torneios",
    title: "Torneios",
    subtitle:
      "Corridas time-boxed com prêmio progressivo · top N ganham do cofre.",
  },
  {
    to: "/admin/announcements",
    label: "Avisos",
    title: "Avisos",
    subtitle:
      "Mensagens manuais que aparecem no ticker do topo da Visão Geral. Aparecem ANTES das mensagens auto-geradas.",
  },
  {
    to: "/admin/users",
    label: "Usuários",
    title: "Usuários",
    subtitle: "Gerencie os gestores que têm acesso ao sistema.",
  },
  {
    to: "/admin/tenants",
    label: "Mesas",
    title: "Mesas",
    subtitle:
      "Configure mesas (tenants): branding, logo, ativação. Super admin (BDN) cria novas mesas.",
  },
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

  // Resolve title/subtitle da rota atual (fallback: "Configurações" se não bater
  // exato — pode acontecer durante navegações intermediárias).
  const current = ADMIN_ROUTES.find((r) => location.pathname.startsWith(r.to));
  const title = current?.title ?? "Configurações";
  const subtitle = current?.subtitle;

  const openTv = useOpenTv();

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
          subtitle={subtitle}
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
