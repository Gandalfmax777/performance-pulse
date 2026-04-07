import { motion } from "framer-motion";
import { BADGES } from "@/data/mockData";

const BadgesPanel = () => (
  <div className="card-glass rounded-xl p-5">
    <h2 className="text-sm font-bold text-foreground mb-3">Conquistas</h2>
    <div className="grid grid-cols-5 gap-2">
      {BADGES.map((b, i) => (
        <motion.div
          key={b.id}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1, type: "spring" }}
          className="flex flex-col items-center text-center group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-muted/40 border border-border/30 flex items-center justify-center text-2xl group-hover:glow-primary transition-shadow">
            {b.icon}
          </div>
          <span className="text-[10px] font-semibold text-foreground mt-1.5 leading-tight">{b.name}</span>
          <span className="text-[9px] text-muted-foreground leading-tight">{b.desc}</span>
        </motion.div>
      ))}
    </div>
  </div>
);

export default BadgesPanel;
