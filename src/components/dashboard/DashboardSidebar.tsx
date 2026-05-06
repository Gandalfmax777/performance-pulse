import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import {
  Pulse,
  Stack as Layers,
  CalendarBlank,
  Trophy,
  ChartBar,
  Sword as Swords,
  Crown,
  User,
  Television as Tv,
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

export type DashboardView =
  | "overview"
  | "daily"
  | "results"
  | "kpis"
  | "squad"
  | "tournament"
  | "profile";

interface NavItem {
  key: DashboardView;
  label: string;
  icon: typeof Layers;
}

const NAV_ITEMS: NavItem[] = [
  { key: "overview",   label: "Visão Geral", icon: Layers },
  { key: "daily",      label: "Por Dia",     icon: CalendarBlank },
  { key: "results",    label: "Ranking",     icon: Trophy },
  { key: "kpis",       label: "KPIs",        icon: ChartBar },
  { key: "squad",      label: "Squad Bet",   icon: Swords },
  { key: "tournament", label: "Torneio",     icon: Crown },
  { key: "profile",    label: "Meu Perfil",  icon: User },
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

  const handleViewChange = (v: DashboardView) => {
    onViewChange(v);
    onMobileClose();
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
          collapsed ? "md:w-[72px]" : "md:w-[220px]",
          "fixed left-0 top-0 h-screen w-[220px] z-50 transition-[transform,width] duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Brand */}
        <div className="px-5 py-5 border-b border-line flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-[30px] h-[30px] shrink-0 rounded-[7px] bg-primary flex items-center justify-center">
              <Pulse weight="bold" size={15} className="text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="min-w-0 leading-tight">
                <h1 className="text-[13px] font-extrabold text-ink tracking-tight truncate">Performance Pulse</h1>
                <p className="text-[8px] uppercase tracking-[0.12em] font-semibold text-ink-3 mt-0.5">EQI · MESA</p>
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

        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
          className="hidden md:flex absolute -right-3 top-7 w-6 h-6 rounded-full bg-card border border-line shadow-sm items-center justify-center text-ink-3 hover:text-ink hover:bg-surface-2 transition-all z-10"
        >
          {collapsed ? <CaretRight size={12} weight="bold" /> : <CaretLeft size={12} weight="bold" />}
        </button>

        <nav className="flex-1 px-3 py-3.5 space-y-0.5 overflow-y-auto">
          {!collapsed && (
            <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-ink-3 px-2.5 mb-1">
              NAVEGAÇÃO
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
                  "w-full flex items-center gap-2.5 rounded-[7px] text-[13px] transition-all",
                  collapsed ? "px-0 py-2 justify-center" : "px-2.5 py-2",
                  active
                    ? "bg-ink text-white font-bold"
                    : "text-ink-2 hover:bg-surface-2 hover:text-ink font-medium",
                )}
              >
                <Icon size={14} weight={active ? "bold" : "regular"} className="shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}

          <div className="h-px bg-line my-3 mx-1.5" />

          {!collapsed && (
            <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-ink-3 px-2.5 mb-1">
              FERRAMENTAS
            </p>
          )}

          <button
            onClick={() => { onEnterTv(); onMobileClose(); }}
            title={collapsed ? "Modo TV" : undefined}
            className={cn(
              "w-full flex items-center gap-2.5 rounded-[7px] text-[13px] font-bold border bg-accent text-primary border-primary/15 hover:bg-accent/80 transition-all",
              collapsed ? "px-0 py-2 justify-center" : "px-2.5 py-2",
            )}
          >
            <Tv size={14} weight="regular" className="shrink-0" />
            {!collapsed && <span>Modo TV</span>}
          </button>
          <button
            onClick={() => { onOpenAssessors(); onMobileClose(); }}
            title={collapsed ? "Assessores" : undefined}
            className={cn(
              "w-full flex items-center gap-2.5 rounded-[7px] text-[13px] font-medium text-ink-2 hover:bg-surface-2 hover:text-ink transition-all",
              collapsed ? "px-0 py-2 justify-center" : "px-2.5 py-2",
            )}
          >
            <Users size={14} weight="regular" className="shrink-0" />
            {!collapsed && <span>Assessores</span>}
          </button>
          {isAdmin && (
            <button
              onClick={() => { navigate("/admin"); onMobileClose(); }}
              title={collapsed ? "Admin" : undefined}
              className={cn(
                "w-full flex items-center gap-2.5 rounded-[7px] text-[13px] font-medium text-ink-2 hover:bg-surface-2 hover:text-ink transition-all",
                collapsed ? "px-0 py-2 justify-center" : "px-2.5 py-2",
              )}
            >
              <ShieldCheck size={14} weight="regular" className="shrink-0" />
              {!collapsed && <span>Admin</span>}
            </button>
          )}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-line space-y-2">
          <div className={cn("flex gap-1.5", collapsed && "flex-col")}>
            <button
              onClick={() => setMuted(!muted)}
              title={muted ? "Sons desligados" : "Sons ligados"}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-[7px] border text-[11px] font-semibold transition-all",
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
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-[7px] bg-surface-2 border border-line text-ink-3 hover:text-ink hover:bg-surface text-[11px] font-semibold transition-all"
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
                    className="w-6 h-6 rounded-md hover:bg-destructive/10 hover:text-destructive flex items-center justify-center text-ink-3 transition-all"
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
              className="w-full flex items-center justify-center p-1.5 rounded-[7px] bg-surface-2 hover:bg-destructive/10 hover:text-destructive text-ink-3 transition-all"
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
