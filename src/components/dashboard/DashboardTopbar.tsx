import { useEffect, useState } from "react";
import { Clock, Menu } from "lucide-react";

interface Props {
  title: string;
  /** Abre o drawer da sidebar no mobile. */
  onMenuClick: () => void;
}

const DashboardTopbar = ({ title, onMenuClick }: Props) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const dayName = time.toLocaleDateString("pt-BR", { weekday: "long" });
  const dateStr = time.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });

  return (
    <header className="flex items-center justify-between h-12 px-5 border-b border-border/30 bg-background/40 backdrop-blur-sm sticky top-0 z-30">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onMenuClick}
          aria-label="Abrir menu"
          className="md:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/30"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div className="flex items-baseline gap-2 min-w-0">
          <h2 className="text-sm font-display font-bold text-foreground truncate">{title}</h2>
          <span className="hidden sm:inline text-[11px] text-muted-foreground capitalize whitespace-nowrap">· {dayName}, {dateStr}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/30 border border-border/30">
          <Clock className="w-3 h-3 text-primary" />
          <span className="font-mono text-xs font-semibold text-foreground">
            {time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-success/10 border border-success/20">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-[10px] text-success font-semibold tracking-wider">AO VIVO</span>
        </div>
      </div>
    </header>
  );
};

export default DashboardTopbar;
