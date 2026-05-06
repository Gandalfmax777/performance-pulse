import { useEffect, useState } from "react";
import { Bell, MagnifyingGlass, TextAlignJustify } from "@phosphor-icons/react";

interface Props {
  title: string;
  /** Eyebrow opcional acima do título — segue padrão Editorial V1. */
  eyebrow?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  onMenuClick: () => void;
}

const DashboardTopbar = ({ title, eyebrow, subtitle, actions, onMenuClick }: Props) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const dayName = time.toLocaleDateString("pt-BR", { weekday: "long" });
  const dateStr = time.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
  const computedSubtitle = subtitle ?? `${dayName.charAt(0).toUpperCase() + dayName.slice(1)}, ${dateStr}`;

  return (
    <header className="flex items-center gap-4 px-7 py-5 border-b border-line bg-card/70 backdrop-blur-md sticky top-0 z-30">
      <button
        onClick={onMenuClick}
        aria-label="Abrir menu"
        className="md:hidden p-1.5 rounded-md text-ink-3 hover:text-ink hover:bg-surface-2"
      >
        <TextAlignJustify size={18} weight="bold" />
      </button>

      <div className="flex-1 min-w-0">
        {eyebrow && (
          <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-ink-3 mb-1">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[22px] font-extrabold text-ink tracking-tight leading-none truncate">{title}</h1>
        {computedSubtitle && (
          <p className="text-[12px] text-ink-3 mt-1 truncate capitalize">{computedSubtitle}</p>
        )}
      </div>

      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}

      <div className="relative hidden md:block">
        <MagnifyingGlass
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none"
        />
        <input
          placeholder="Buscar..."
          className="pl-8 pr-3 py-1.5 text-xs rounded-[7px] border border-line bg-surface-2 outline-none w-[180px] focus:bg-card focus:border-line-2 transition-colors"
        />
      </div>

      <button
        title="Notificações"
        className="hidden md:inline-flex shrink-0 p-2 rounded-[7px] border border-line bg-surface text-ink-2 hover:bg-surface-2 transition-colors"
      >
        <Bell size={14} />
      </button>
    </header>
  );
};

export default DashboardTopbar;
