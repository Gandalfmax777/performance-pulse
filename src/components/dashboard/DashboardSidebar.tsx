import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import {
  Pulse,
  Stack as Layers,
  CalendarBlank,
  Trophy,
  ChartBar,
  Sword as Swords,
  Crown,
  Television as Tv,
  Presentation,
  Sun,
  Moon,
  SpeakerHigh,
  SpeakerSimpleSlash,
  ShieldCheck,
  Users,
  SignOut,
  CaretLeft,
  CaretRight,
  X,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useSoundMuted } from "@/hooks/useSoundEffects";
import { clearAuthToken } from "@/api/client";
import { TenantSwitcher } from "@/components/shared/TenantSwitcher";

export type DashboardView =
  | "overview"
  | "daily"
  | "results"
  | "kpis"
  | "squad"
  | "tournament"
  | "team";

interface NavItem {
  /** Pathname para `<Link to>` (rota nova do redesign). */
  path: string;
  /** Search param `view` correspondente (compat com Index legacy). */
  view: DashboardView;
  label: string;
  icon: typeof Layers;
}

const NAV_ITEMS: NavItem[] = [
  { path: "/",          view: "overview",   label: "Visão Geral", icon: Layers },
  { path: "/por-dia",   view: "daily",      label: "Por Dia",     icon: CalendarBlank },
  { path: "/ranking",   view: "results",    label: "Ranking",     icon: Trophy },
  { path: "/kpis",      view: "kpis",       label: "KPIs",        icon: ChartBar },
  { path: "/squad-bet", view: "squad",      label: "Squad Bet",   icon: Swords },
  { path: "/torneio",   view: "tournament", label: "Torneio",     icon: Crown },
];

const COLLAPSE_STORAGE_KEY = "pp_sidebar_collapsed";

interface Props {
  /** Mantido para fallback enquanto Index ainda usa ?view=... — quando
   *  cada rota virar página própria, o active state passa a ser 100%
   *  pathname e este prop sai. */
  view: DashboardView;
  onEnterTv: () => void;
  onEnterPresentation: () => void;
  /** Mobile drawer state — controlado pelo Index via hamburger no Topbar. */
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const DashboardSidebar = ({
  view,
  onEnterTv,
  onEnterPresentation,
  mobileOpen,
  onMobileClose,
}: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { isAdmin, user, tenantConfig } = useCurrentUser();
  const [muted, setMuted] = useSoundMuted();

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

  /** Active state: pathname (rota nova) OU `?view=...` em `/` (legacy). */
  const isActive = (item: NavItem) => {
    // Rotas placeholder: match exato de pathname (excluindo "/" porque
    // "/" sempre é o Index e o active depende de ?view=).
    if (item.path !== "/" && location.pathname === item.path) return true;
    // Em "/" o active state vem do searchParam ?view=.
    if (location.pathname === "/") {
      return item.path === "/" ? view === "overview" : view === item.view;
    }
    return false;
  };

  return (
    <>
      {mobileOpen && (
        <button
          aria-label="Fechar menu"
          onClick={onMobileClose}
          className="md:hidden fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm"
        />
      )}

      <aside
        className={cn(
          "shrink-0 border-r border-line flex flex-col bg-surface",
          "md:sticky md:top-0 md:h-screen md:translate-x-0 md:flex",
          collapsed ? "md:w-[72px]" : "md:w-[248px]",
          "fixed left-0 top-0 h-screen w-[248px] z-50 transition-[transform,width] duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Brand — alinha com .sidebar-brand do design */}
        <div className="px-4 py-[18px] pb-[14px] border-b border-line flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-primary flex items-center justify-center">
              <Pulse weight="bold" size={16} className="text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="min-w-0 leading-tight">
                <h1 className="text-[13px] font-bold text-ink tracking-tight truncate">
                  Performance Pulse
                </h1>
                <p className="num text-[9px] uppercase tracking-[0.16em] text-ink-3 mt-0.5">
                  {tenantConfig.sidebarEyebrow}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={onMobileClose}
            aria-label="Fechar menu"
            className="md:hidden p-1.5 rounded-md text-ink-3 hover:text-ink hover:bg-surface-2"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Tenant switcher — só aparece se user tem >1 membership */}
        <div className="px-2 py-2 border-b border-line">
          <TenantSwitcher collapsed={collapsed} />
        </div>

        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
          className="hidden md:flex absolute -right-3 top-7 w-6 h-6 rounded-full bg-card border border-line shadow-sm items-center justify-center text-ink-3 hover:text-ink hover:bg-surface-2 transition-all z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {collapsed ? <CaretRight size={12} weight="bold" /> : <CaretLeft size={12} weight="bold" />}
        </button>

        <nav className="flex-1 px-3 py-3 space-y-px overflow-y-auto">
          {!collapsed && (
            <p className="num text-[9px] uppercase tracking-[0.18em] text-ink-4 px-2 pt-2 pb-1">
              Navegação
            </p>
          )}
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onMobileClose}
                title={collapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative w-full flex items-center gap-2.5 rounded-[7px] text-[13px] transition-colors",
                  collapsed ? "px-0 py-2 justify-center" : "px-2.5 py-2",
                  active
                    ? "bg-surface-2 text-ink font-semibold"
                    : "text-ink-2 hover:bg-surface-2 hover:text-ink font-medium",
                )}
              >
                {/* Accent bar à esquerda quando active (alinha com pulse.css) */}
                {active && !collapsed && (
                  <span
                    aria-hidden
                    className="absolute left-0 top-2 bottom-2 w-[2px] rounded-[2px] bg-primary"
                  />
                )}
                <Icon
                  size={14}
                  weight={active ? "bold" : "regular"}
                  className={cn("shrink-0", active && "text-primary")}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}

          <div className="h-px bg-line my-3 mx-1.5" />

          {!collapsed && (
            <p className="num text-[9px] uppercase tracking-[0.18em] text-ink-4 px-2 pt-2 pb-1">
              Ferramentas
            </p>
          )}

          <button
            onClick={() => { onEnterTv(); onMobileClose(); }}
            title={collapsed ? "Modo TV" : undefined}
            className={cn(
              "w-full flex items-center gap-2.5 rounded-[7px] text-[13px] font-semibold border bg-accent text-primary border-primary/15 hover:bg-accent/80 transition-colors",
              collapsed ? "px-0 py-2 justify-center" : "px-2.5 py-2",
            )}
          >
            <Tv size={14} weight="regular" className="shrink-0" />
            {!collapsed && <span>Modo TV</span>}
          </button>
          <button
            onClick={() => { onEnterPresentation(); onMobileClose(); }}
            title={collapsed ? "Modo Apresentação" : undefined}
            className={cn(
              "w-full flex items-center gap-2.5 rounded-[7px] text-[13px] font-semibold border bg-surface-2 text-ink-2 border-line hover:bg-surface transition-colors mt-1",
              collapsed ? "px-0 py-2 justify-center" : "px-2.5 py-2",
            )}
          >
            <Presentation size={14} weight="regular" className="shrink-0" />
            {!collapsed && <span>Apresentação</span>}
          </button>
          <Link
            to="/assessores"
            onClick={onMobileClose}
            title={collapsed ? "Assessores" : undefined}
            aria-current={
              location.pathname === "/assessores" ||
              (location.pathname === "/" && view === "team")
                ? "page"
                : undefined
            }
            className={cn(
              "relative w-full flex items-center gap-2.5 rounded-[7px] text-[13px] transition-colors mt-1",
              collapsed ? "px-0 py-2 justify-center" : "px-2.5 py-2",
              location.pathname === "/assessores" ||
                (location.pathname === "/" && view === "team")
                ? "bg-surface-2 text-ink font-semibold"
                : "text-ink-2 hover:bg-surface-2 hover:text-ink font-medium",
            )}
          >
            <Users
              size={14}
              weight={
                location.pathname === "/assessores" ||
                (location.pathname === "/" && view === "team")
                  ? "bold"
                  : "regular"
              }
              className="shrink-0"
            />
            {!collapsed && <span>Assessores</span>}
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              onClick={onMobileClose}
              title={collapsed ? "Configurações" : undefined}
              aria-current={
                location.pathname.startsWith("/admin") ? "page" : undefined
              }
              className={cn(
                "relative w-full flex items-center gap-2.5 rounded-[7px] text-[13px] transition-colors mt-1",
                collapsed ? "px-0 py-2 justify-center" : "px-2.5 py-2",
                location.pathname.startsWith("/admin")
                  ? "bg-surface-2 text-ink font-semibold"
                  : "text-ink-2 hover:bg-surface-2 hover:text-ink font-medium",
              )}
            >
              <ShieldCheck
                size={14}
                weight={
                  location.pathname.startsWith("/admin") ? "bold" : "regular"
                }
                className="shrink-0"
              />
              {!collapsed && <span>Configurações</span>}
            </Link>
          )}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-line space-y-2">
          <div className={cn("flex gap-1.5", collapsed && "flex-col")}>
            <button
              onClick={() => setMuted(!muted)}
              title={muted ? "Sons desligados" : "Sons ligados"}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-[7px] border text-[11px] font-semibold transition-colors",
                muted
                  ? "bg-surface-2 border-line text-ink-3 hover:text-ink"
                  : "bg-accent border-primary/15 text-primary hover:bg-accent/80",
              )}
            >
              {muted ? <SpeakerSimpleSlash size={13} /> : <SpeakerHigh size={13} />}
              {!collapsed && <span>Som</span>}
            </button>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title={theme === "dark" ? "Modo claro" : "Modo escuro"}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-[7px] bg-surface-2 border border-line text-ink-3 hover:text-ink hover:bg-surface text-[11px] font-semibold transition-colors"
            >
              {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
              {!collapsed && <span>Tema</span>}
            </button>
          </div>

          {user && (
            <div
              className={cn(
                "flex items-center gap-2.5 rounded-[7px] bg-surface-2 border border-line",
                collapsed ? "p-1.5 justify-center" : "px-2.5 py-2",
              )}
              title={collapsed ? user.name : undefined}
            >
              <div className="w-7 h-7 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-extrabold font-mono">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              {!collapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-ink truncate leading-tight">{user.name}</p>
                    <p className="text-[9px] font-mono text-ink-3 truncate mt-0.5">{user.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Sair"
                    className="w-6 h-6 rounded-md hover:bg-destructive/10 hover:text-destructive flex items-center justify-center text-ink-3 transition-colors"
                  >
                    <SignOut size={12} weight="bold" />
                  </button>
                </>
              )}
            </div>
          )}
          {user && collapsed && (
            <button
              onClick={handleLogout}
              title="Sair"
              className="w-full flex items-center justify-center p-1.5 rounded-[7px] bg-surface-2 hover:bg-destructive/10 hover:text-destructive text-ink-3 transition-colors"
            >
              <SignOut size={13} weight="bold" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export default DashboardSidebar;
