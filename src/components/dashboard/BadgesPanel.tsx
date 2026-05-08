import { motion } from "framer-motion";
import { type Assessor } from "@/types/assessor";
import { useBadges, useBadgeUnlocks } from "@/hooks/useBadges";
import { BadgeIcon } from "@/components/ui/BadgeIcon";

interface BadgesPanelProps {
  // Mantido por retrocompat — Index.tsx ainda passa, mas não é usado
  // agora que badges vêm do backend via useBadgeUnlocks.
  assessors: Assessor[];
}

const BadgesPanel = (_: BadgesPanelProps) => {
  const { data: badgesData } = useBadges();
  const { data: unlocksData } = useBadgeUnlocks();

  const individualBadges = (badgesData ?? []).filter((b) => b.scope === "INDIVIDUAL");
  const unlockedSlugs = new Set(
    (unlocksData ?? []).filter((u) => u.assessorId !== null).map((u) => u.badgeSlug),
  );

  return (
    <div className="card-glass rounded-xl p-5">
      <h2 className="text-sm font-display font-bold text-foreground mb-3">Conquistas</h2>
      <div className="grid grid-cols-5 gap-2">
        {individualBadges.map((b, i) => {
          const unlocked = unlockedSlugs.has(b.slug);
          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, type: "spring" }}
              className={`flex flex-col items-center text-center group cursor-pointer ${
                !unlocked ? "opacity-40 grayscale" : ""
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-shadow ${
                  unlocked
                    ? "bg-primary/10 border-primary/30 group-hover:glow-primary text-primary"
                    : "bg-muted/40 border-border/30 text-muted-foreground"
                }`}
              >
                <BadgeIcon slug={b.icon} size={22} />
              </div>
              <span className="text-[10px] font-semibold text-foreground mt-1.5 leading-tight">
                {b.name}
              </span>
              <span className="text-[9px] text-muted-foreground leading-tight">
                {b.description}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default BadgesPanel;
