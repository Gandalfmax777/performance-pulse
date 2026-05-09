import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

interface AdminSubnavItem {
  to: string;
  label: string;
  /**
   * Slug pra ler badge dinâmico (ex.: count de penalty proposals).
   * Mantido aqui pra abstração; AdminLayout passa o map de counts.
   */
  badge?: string;
}

interface AdminSubnavProps {
  items: readonly AdminSubnavItem[];
  /** Map slug → count. Item com count > 0 mostra badge. */
  badgeCounts?: Record<string, number>;
}

/**
 * Barra horizontal de navegação entre seções admin (alinha com
 * `.admin-subnav` em design/assets/pulse.css). Renderizada acima do
 * conteúdo de cada rota admin pelo AdminLayout.
 *
 * Active state vem de NavLink (router) — não precisa de prop externo.
 */
export const AdminSubnav = ({ items, badgeCounts = {} }: AdminSubnavProps) => (
  <nav
    className={cn(
      "no-print flex flex-wrap gap-0.5 p-1.5 mb-6",
      "rounded-[10px] border border-line bg-card",
    )}
    aria-label="Navegação de configurações"
  >
    {items.map((item) => {
      const count = item.badge ? badgeCounts[item.badge] ?? 0 : 0;
      return (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              "inline-flex items-center gap-2 px-3 py-2 rounded-[6px] text-xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              isActive
                ? "bg-ink text-white"
                : "text-ink-3 hover:bg-surface-2 hover:text-ink",
            )
          }
        >
          {({ isActive }) => (
            <>
              <span>{item.label}</span>
              {count > 0 && (
                <span
                  className={cn(
                    "num text-[10px] font-extrabold px-1.5 rounded-full min-w-[18px] text-center",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-destructive/15 text-destructive",
                  )}
                >
                  {count}
                </span>
              )}
            </>
          )}
        </NavLink>
      );
    })}
  </nav>
);
