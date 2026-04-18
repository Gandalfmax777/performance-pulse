import { motion } from "framer-motion";
import { Activity, Clock, Shield, Sun, Moon, Volume2, VolumeX } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useSoundMuted } from "@/hooks/useSoundEffects";

const DashboardHeader = () => {
  const [time, setTime] = useState(new Date());
  const { isAdmin } = useCurrentUser();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [muted, setMuted] = useSoundMuted();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const dayName = time.toLocaleDateString("pt-BR", { weekday: "long" });
  const dateStr = time.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between mb-5"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl gradient-neon flex items-center justify-center glow-primary">
          <Activity className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-display font-extrabold text-foreground tracking-tight">
            Dashboard <span className="text-gradient-neon">Ative+</span> Performance
          </h1>
          <p className="text-xs text-muted-foreground capitalize">{dayName}, {dateStr}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isAdmin && (
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">Admin</span>
          </button>
        )}
        <button
          onClick={() => setMuted(!muted)}
          className={`p-2 rounded-lg border transition-all ${
            muted
              ? "bg-muted/30 border-border/30 text-muted-foreground hover:text-foreground"
              : "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
          }`}
          title={muted ? "Sons desligados — clique pra ligar" : "Sons ligados — clique pra silenciar"}
        >
          {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-lg bg-muted/30 border border-border/30 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
          title={theme === "dark" ? "Modo claro" : "Modo escuro"}
        >
          {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/30 border border-border/30">
          <Clock className="w-3.5 h-3.5 text-primary" />
          <span className="font-mono text-sm font-semibold text-foreground">
            {time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20 animate-glow-pulse">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-success font-semibold">AO VIVO</span>
        </div>
      </div>
    </motion.header>
  );
};

export default DashboardHeader;
