import { motion } from "framer-motion";
import { Trophy, Flame, TrendingUp } from "lucide-react";
import { ASSESSORS } from "@/data/mockData";

const LEVEL_COLORS = {
  gold: "text-gold border-gold/30 bg-gold/10",
  silver: "text-silver border-silver/30 bg-silver/10",
  bronze: "text-bronze border-bronze/30 bg-bronze/10",
};

const RANK_STYLES = [
  "gradient-gold glow-gold",
  "bg-silver/20 border-silver/30",
  "bg-bronze/20 border-bronze/30",
];

const Leaderboard = () => {
  const sorted = [...ASSESSORS].sort((a, b) => b.points - a.points);

  return (
    <div className="card-glass rounded-xl p-5 h-full">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-gold" />
        <h2 className="text-lg font-bold text-foreground">Ranking Semanal</h2>
      </div>

      <div className="space-y-2.5">
        {sorted.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`flex items-center gap-3 p-3 rounded-lg border ${
              i < 3 ? RANK_STYLES[i] : "border-border/30 bg-muted/20"
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-sm ${
              i === 0 ? "text-background" : i < 3 ? "text-foreground" : "text-muted-foreground"
            }`}>
              {i === 0 ? "👑" : `#${i + 1}`}
            </div>

            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${LEVEL_COLORS[a.level]}`}>
              {a.avatar}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate text-foreground">{a.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground font-mono">{a.points.toLocaleString()} pts</span>
                {a.streak > 0 && (
                  <span className="flex items-center gap-0.5 text-xs text-chart-orange">
                    <Flame className="w-3 h-3" /> {a.streak}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-1 text-success text-xs font-semibold">
                <TrendingUp className="w-3 h-3" />
                {a.weeklyGoalPercent}%
              </div>
              <div className="w-16 h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${a.weeklyGoalPercent}%` }}
                  transition={{ duration: 1, delay: i * 0.1 }}
                  className="h-full rounded-full gradient-success"
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
