import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import {
  Activity,
  LayoutDashboard,
  CalendarDays,
  Trophy,
  BarChart3,
  Swords,
  Tv,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Shield,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useSoundMuted } from "@/hooks/useSoundEffects";
import { clearAuthToken } from "@/api/client";

export type DashboardView = "overview" | "daily" | "results" | "kpis" | "squad";

interface NavItem {
  key: DashboardView;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: NavItem[] = [
  { key: "overview", label: "Visão Geral",     icon: LayoutDashboard },
  { key: "daily",    label: "Por Dia",         icon: CalendarDays },
  { key: "results",  label: "Ranking Geral",   icon: Trophy },
  { key: "kpis",     label: "KPIs & Insights", icon: BarChart3 },
  { key: "squad",    label: "Squad Bet",       icon: Swords },
];

const COLLAPSE_STORAGE_KEY = "pp_sidebar_collapsed";

interface Props {
  view: DashboardView;
  onViewChange: (v: DashboardView) => void;
  onEnterTv: () => void;
  onOpenAssessors: () => void;
  /** Mobile drawer state — controlado pelo Index via hamburger no Topbar. */
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const DashboardSidebar = ({
  view,
  onViewChange,
  onEnterTv,
  onOpenAssessors,
  mobileOpen,
  onMobileClose,
}: Props) => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { isAdmin, user } = useCurrentUser();
  const [muted, setMuted] = useSoundMuted();

  // Collapsed (icon-only) — só vale em desktop. Persistido em localStorage.
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1";
  });

  useEffect(() => {
    window.localStorage.setItem(COLLAPSE_STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  const handleLogout = () => {
    clearAuthToken();
    navigate("/login", { replace: true });
  };

  // Wrapper que fecha drawer mobile ao clicar em qualquer item
  const handleViewChange = (v: DashboardView) => {
    onViewChange(v);
    onMobileClose();
  };

  return (
    <>
      {/* Backdrop mobile (only when drawer open). Esconde em md+. */}
      {mobileOpen && (
        <button
          aria-label="Fechar menu"
          onClick={onMobileClose}
          className="md:hidden fixed inset-0 z-40 bg-background/60 backdrop-blur-sm animate-fade-in"
        />
      )}

      <aside
        className={cn(
          "shrink-0 border-r border-border/30 flex flex-col bg-background/95 backdrop-blur-sm",
          // Desktop: sticky no flow, largura varia com collapsed
          "md:sticky md:top-0 md:h-screen md:translate-x-0 md:flex",
          collapsed ? "md:w-16" : "md:w-60",
          // Mobile: drawer fixo off-canvas
          "fixed left-0 top-0 h-screen w-60 z-50 transition-[transform,width] duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Brand + close mobile */}
        <div className="px-4 py-5 border-b border-border/30 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-primary flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="text-sm font-display font-bold text-foreground leading-tight truncate">Ative+ Performance</h1>
                <p className="text-[10px] text-muted-foreground leading-tight">Dashboard</p>
              </div>
            )}
          </div>
          {/* Botão fechar drawer (mobile only) */}
          <button
            onClick={onMobileClose}
            aria-label="Fechar menu"
            className="md:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/30"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toggle collapse — desktop only */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
          className="hidden md:flex absolute -right-3 top-7 w-6 h-6 rounded-full bg-card border border-border shadow-sm items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all z-10"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        {/* Nav (tabs viram items) */}
        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
          {!collapsed && (
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 px-3 mb-2 mt-1">
              Navegação
            </p>
          )}
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = view === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleViewChange(item.key)}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "w-full flex items-center gap-2.5 rounded-lg text-sm font-medium transition-all border",
                  collapsed ? "px-0 py-2 justify-center" : "px-3 py-2",
                  active
                    // Estilo "chip" EQI: verde escuro de fundo + texto laranja âmbar.
                    // Bate com o print de "Liquidações / 20" do CRM da EQI.
                    ? "bg-primary text-secondary font-bold shadow-sm border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30 border-transparent",
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}

          <div className="pt-3 mt-3 border-t border-border/20" />

          <button
            onClick={() => { onEnterTv(); onMobileClose(); }}
            title={collapsed ? "Modo TV" : undefined}
            className={cn(
              "w-full flex items-center gap-2.5 rounded-lg text-sm font-medium border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 transition-all",
              collapsed ? "px-0 py-2 justify-center" : "px-3 py-2",
            )}
          >
            <Tv className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Modo TV</span>}
          </button>
          <button
            onClick={() => { onOpenAssessors(); onMobileClose(); }}
            title={collapsed ? "Assessores" : undefined}
            className={cn(
              "w-full flex items-center gap-2.5 rounded-lg text-sm font-medium border border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all",
              collapsed ? "px-0 py-2 justify-center" : "px-3 py-2",
            )}
          >
            <Users className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Assessores</span>}
          </button>
          {isAdmin && (
            <button
              onClick={() => { navigate("/admin"); onMobileClose(); }}
              title={collapsed ? "Admin" : undefined}
              className={cn(
                "w-full flex items-center gap-2.5 rounded-lg text-sm font-medium border border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all",
                collapsed ? "px-0 py-2 justify-center" : "px-3 py-2",
              )}
            >
              <Shield className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Admin</span>}
            </button>
          )}
        </nav>

        {/* Footer: ações + user */}
        <div className="px-2 py-3 border-t border-border/30 space-y-2">
          <div className={cn("flex gap-1.5", collapsed && "flex-col")}>
            <button
              onClick={() => setMuted(!muted)}
              title={muted ? "Sons desligados" : "Sons ligados"}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs transition-all",
                muted
                  ? "bg-muted/30 border-border/30 text-muted-foreground hover:text-foreground"
                  : "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20",
              )}
            >
              {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              {!collapsed && <span>Som</span>}
            </button>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title={theme === "dark" ? "Modo claro" : "Modo escuro"}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-muted/30 border border-border/30 text-muted-foreground hover:text-foreground hover:bg-muted/50 text-xs transition-all"
            >
              {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              {!collapsed && <span>Tema</span>}
            </button>
          </div>

          {user && (
            <div
              className={cn(
                "flex items-center gap-2.5 rounded-lg bg-muted/20 border border-border/20",
                collapsed ? "p-1.5 justify-center" : "px-3 py-2",
              )}
              title={collapsed ? `${user.name} — Sair` : undefined}
            >
              <div className="w-7 h-7 shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              {!collapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Sair"
                    className="w-6 h-6 rounded-md bg-muted/30 hover:bg-destructive/20 hover:text-destructive flex items-center justify-center text-muted-foreground transition-all"
                  >
                    <LogOut className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          )}
          {/* Quando colapsado, o avatar não tem botão de logout visível — clique no avatar abre logout */}
          {user && collapsed && (
            <button
              onClick={handleLogout}
              title="Sair"
              className="w-full flex items-center justify-center p-1.5 rounded-lg bg-muted/30 hover:bg-destructive/20 hover:text-destructive text-muted-foreground transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export default DashboardSidebar;
