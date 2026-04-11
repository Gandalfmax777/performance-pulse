import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Target,
  Calendar,
  Repeat,
  Trophy,
  Users,
  LogOut,
  Shield,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { clearAuthToken } from "@/api/client";

interface NavItem {
  to: string;
  label: string;
  icon: typeof Target;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/admin/goals",       label: "Metas & KPIs",  icon: Target },
  { to: "/admin/schedule",    label: "Cronograma",    icon: Calendar },
  { to: "/admin/biweekly",    label: "Indique Day",   icon: Repeat },
  { to: "/admin/bets-config", label: "Apostas",       icon: Trophy },
  { to: "/admin/users",       label: "Usuários",      icon: Users },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const { user } = useCurrentUser();

  const handleLogout = () => {
    clearAuthToken();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* ─── Sidebar ───────────────────────────────────────────────────────── */}
      <aside className="w-60 border-r border-border/30 flex flex-col bg-background/50 backdrop-blur-sm">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-border/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg gradient-neon flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-display font-bold text-foreground leading-tight">Performance Pulse</h1>
              <p className="text-[10px] text-muted-foreground leading-tight">Painel Admin</p>
            </div>
          </div>
        </div>

        {/* Back to dashboard */}
        <div className="px-3 pt-3">
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar ao Dashboard
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-3 space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 px-3 mb-2 mt-2">
            Configurações
          </p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-transparent"
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="px-3 py-3 border-t border-border/30">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/20 border border-border/20">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {user?.name.slice(0, 2).toUpperCase() ?? "??"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{user?.name ?? "—"}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email ?? ""}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sair"
              className="w-7 h-7 rounded-md bg-muted/30 hover:bg-destructive/20 hover:text-destructive flex items-center justify-center text-muted-foreground transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Main ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
