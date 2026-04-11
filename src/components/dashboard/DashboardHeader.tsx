import { motion } from "framer-motion";
import { Activity, Clock, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const DashboardHeader = () => {
  const [time, setTime] = useState(new Date());
  const { isAdmin } = useCurrentUser();
  const navigate = useNavigate();

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
