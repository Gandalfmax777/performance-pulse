import { motion } from "framer-motion";
import { Trophy, Flame, TrendingUp, Crown } from "lucide-react";
import { BADGES, type Assessor } from "@/data/mockData";

const LEVEL_COLORS = {
  gold: "text-gold border-gold/40 bg-gold/10",
  silver: "text-silver border-silver/40 bg-silver/10",
  bronze: "text-bronze border-bronze/40 bg-bronze/10",
};

interface LeaderboardProps {
  assessors: Assessor[];
}

const Leaderboard = ({ assessors }: LeaderboardProps) => {
  const sorted = [...assessors].sort((a, b) => b.points - a.points);

  return (
    <div className="card-glass rounded-xl p-5 h-full">
      <div className="flex items-center gap-2 mb-5">
        <Trophy className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">Ranking Semanal</h2>
      </div>

      <div className="space-y-2.5">
        {sorted.map((a, i) => {
          const earned = BADGES.filter(b => b.check(a));
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                i === 0
                  ? "bg-primary/10 border-primary/30 glow-primary"
                  : i === 1
                  ? "bg-silver/5 border-silver/20"
                  : i === 2
                  ? "bg-bronze/5 border-bronze/20"
                  : "border-border/30 bg-muted/10"
              }`}
            >
              {/* Rank */}
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-sm ${
                i === 0 ? "bg-primary/20 text-primary" : i === 1 ? "bg-silver/15 text-silver" : i === 2 ? "bg-bronze/15 text-bronze" : "bg-muted/30 text-muted-foreground"
              }`}>
                {i === 0 ? <Crown className="w-5 h-5" /> : `#${i + 1}`}
              </div>

              {/* Avatar */}
              <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm border-2 ${LEVEL_COLORS[a.level]}`}>
                {a.avatar}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-foreground truncate">{a.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground font-mono">{a.points.toLocaleString()} pts</span>
                  {a.streak > 0 && (
                    <span className="flex items-center gap-0.5 text-xs text-chart-orange font-semibold">
                      <Flame className="w-3.5 h-3.5" /> {a.streak}
                    </span>
                  )}
                </div>
                {/* Badges inline */}
                {earned.length > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    {earned.map(b => (
                      <span
                        key={b.id}
                        title={`${b.name}: ${b.desc}`}
                        className="text-xs bg-primary/10 border border-primary/20 rounded px-1 py-0.5 cursor-default"
                      >
                        {b.icon}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Score */}
              <div className="text-right">
                <div className={`flex items-center gap-1 text-sm font-mono font-bold ${
                  a.weeklyGoalPercent >= 80 ? "text-primary" : a.weeklyGoalPercent >= 50 ? "text-chart-orange" : "text-destructive"
                }`}>
                  <TrendingUp className="w-3.5 h-3.5" />
                  {a.weeklyGoalPercent}%
                </div>
                <div className="w-20 h-2 bg-muted/40 rounded-full mt-1.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${a.weeklyGoalPercent}%` }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                    className={`h-full rounded-full ${a.weeklyGoalPercent >= 80 ? "gradient-success" : "gradient-primary"}`}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Leaderboard;