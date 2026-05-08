import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Target,
  CalendarBlank,
  Repeat,
  Trophy,
  Users,
  SignOut,
  ShieldCheck,
  Megaphone,
  Sword as Swords,
  SpeakerHigh,
  Pulse,
  Sliders,
  Warning,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { clearAuthToken } from "@/api/client";
import { usePenaltyProposalsCount } from "@/hooks/usePenaltyProposals";

interface NavItem {
  to: string;
  label: string;
  icon: PhosphorIcon;
}

interface NavItemDef extends NavItem {
  /** Slug pra ler o badge dinâmico (penalty count etc.). Opcional. */
  badge?: "penalty";
}

const NAV_ITEMS: NavItemDef[] = [
  { to: "/admin/goals",         label: "Metas & KPIs",  icon: Target },
  { to: "/admin/scoring",       label: "Pontuação",     icon: Sliders },
  { to: "/admin/penalties",     label: "Penalidades",   icon: Warning, badge: "penalty" },
  { to: "/admin/sounds",        label: "Sons dos KPIs", icon: SpeakerHigh },
  { to: "/admin/schedule",      label: "Cronograma",    icon: CalendarBlank },
  { to: "/admin/biweekly",      label: "Indique Day",   icon: Repeat },
  { to: "/admin/bets-config",   label: "Apostas",       icon: Trophy },
  { to: "/admin/tournaments",   label: "Torneios",      icon: Swords },
  { to: "/admin/announcements", label: "Avisos",        icon: Megaphone },
  { to: "/admin/users",         label: "Usuários",      icon: Users },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { data: penaltyCount } = usePenaltyProposalsCount();
  const pendingBadges: Record<string, number> = {
    penalty: penaltyCount?.pending ?? 0,
  };

  const handleLogout = () => {
    clearAuthToken();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Editorial V1 */}
      <aside className="w-[220px] shrink-0 border-r border-line flex flex-col bg-surface md:sticky md:top-0 md:h-screen">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-line">
          <div className="flex items-center gap-2.5">
            <div className="w-[30px] h-[30px] shrink-0 rounded-[7px] bg-ink flex items-center justify-center">
              <Pulse weight="bold" size={15} className="text-white" />
            </div>
            <div className="leading-tight min-w-0">
              <h1 className="text-[13px] font-extrabold text-ink tracking-tight truncate">
                Performance Pulse
              </h1>
              <p className="text-[8px] uppercase tracking-[0.12em] font-semibold text-ink-3 mt-0.5 inline-flex items-center gap-1">
                <ShieldCheck size={10} weight="bold" />
                EQI · ADMIN
              </p>
            </div>
          </div>
        </div>

        {/* Back to dashboard */}
        <div className="px-3 pt-3">
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-[7px] text-[12px] font-semibold text-ink-3 hover:text-ink hover:bg-surface-2 transition-all"
          >
            <ArrowLeft size={13} weight="bold" />
            Voltar ao Dashboard
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-ink-3 px-2.5 mb-1 mt-2">
            Configurações
          </p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const badgeCount = item.badge ? pendingBadges[item.badge] ?? 0 : 0;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-2 rounded-[7px] text-[13px] transition-all ${
                    isActive
                      ? "bg-ink text-white font-bold"
                      : "text-ink-2 hover:bg-surface-2 hover:text-ink font-medium"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={14} weight={isActive ? "bold" : "regular"} className="shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {badgeCount > 0 && (
                      <span
                        className={`text-[10px] font-extrabold font-mono px-1.5 rounded-full min-w-[18px] text-center ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-destructive/15 text-destructive"
                        }`}
                      >
                        {badgeCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="px-3 py-3 border-t border-line">
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-[7px] bg-surface-2 border border-line">
            <div className="w-7 h-7 shrink-0 rounded-full bg-ink text-white flex items-center justify-center text-[10px] font-extrabold font-mono">
              {user?.name.slice(0, 2).toUpperCase() ?? "??"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold text-ink truncate leading-tight">
                {user?.name ?? "—"}
              </p>
              <p className="text-[9px] font-mono text-ink-3 truncate mt-0.5">
                {user?.email ?? ""}
              </p>
            </div>
            <button
              onClick={handleLogout}
              title="Sair"
              className="w-6 h-6 rounded-md hover:bg-destructive/10 hover:text-destructive flex items-center justify-center text-ink-3 transition-all"
            >
              <SignOut size={12} weight="bold" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-7 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
