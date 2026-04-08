import { motion } from "framer-motion";
import { BADGES, type Assessor } from "@/data/mockData";

interface BadgesPanelProps {
  assessors: Assessor[];
}

const BadgesPanel = ({ assessors }: BadgesPanelProps) => {
  return (
    <div className="card-glass rounded-xl p-5">
      <h2 className="text-sm font-bold text-foreground mb-3">Conquistas</h2>
      <div className="grid grid-cols-5 gap-2">
        {BADGES.map((b, i) => {
          const unlocked = assessors.some(a => b.check(a));
          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, type: "spring" }}
              className={`flex flex-col items-center text-center group cursor-pointer ${!unlocked ? "opacity-40 grayscale" : ""}`}
            >
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-2xl transition-shadow ${
                unlocked ? "bg-primary/10 border-primary/30 group-hover:glow-primary" : "bg-muted/40 border-border/30"
              }`}>
                {b.icon}
              </div>
              <span className="text-[10px] font-semibold text-foreground mt-1.5 leading-tight">{b.name}</span>
              <span className="text-[9px] text-muted-foreground leading-tight">{b.desc}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default BadgesPanel;
