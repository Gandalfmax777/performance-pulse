import { motion } from "framer-motion";
import { Fire } from "@phosphor-icons/react";
import { type Assessor } from "@/types/assessor";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";
import { Eyebrow } from "@/components/shared";
import { cn } from "@/lib/utils";

interface RankingPodiumCardProps {
  rank: 1 | 2 | 3;
  name: string;
  avatar: string;
  photoUrl: string | null;
  level: Assessor["level"];
  points: number;
  weeklyGoalPercent: number;
  streak: number;
  squadName?: string | null;
  index: number; // animation stagger
}

const MEDAL: Record<1 | 2 | 3, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

/**
 * Card individual de pódio (1º/2º/3º) seguindo `Ranking.html`. Card 1
 * com border accent, número 64px font-display, medal emoji 32px,
 * avatar 48px, nome bold, squad eyebrow, pontos font-display 36px,
 * meta % em success, streak badge.
 */
export const RankingPodiumCard = ({
  rank,
  name,
  avatar,
  photoUrl,
  level,
  points,
  weeklyGoalPercent,
  streak,
  squadName,
  index,
}: RankingPodiumCardProps) => {
  const isFirst = rank === 1;
  // Design Ranking.html: 1º em accent, 2º/3º em ink-4 (não silver/bronze).
  // Mantém o destaque hierárquico via tamanho/border, não cor.
  const accentColor = isFirst ? "hsl(var(--primary))" : "hsl(var(--ink-4))";
  const goalColor =
    weeklyGoalPercent >= 100
      ? "text-[hsl(var(--success))]"
      : "text-ink-2";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className={cn(
        "relative rounded-[var(--radius)] border bg-card overflow-hidden",
        "shadow-[0_1px_2px_hsl(240_12%_16%/0.05),0_4px_16px_hsl(240_12%_16%/0.04)]",
        isFirst ? "border-primary" : "border-line",
      )}
    >
      {/* Top accent bar — só no 1º */}
      {isFirst && (
        <span
          aria-hidden
          className="absolute top-0 inset-x-0 h-[3px] bg-primary"
        />
      )}

      <div className="p-7 flex flex-col gap-3.5">
        <div className="flex items-baseline justify-between">
          <span
            className="num font-display font-extrabold leading-none tracking-[-0.04em]"
            style={{
              fontSize: 64,
              color: isFirst ? accentColor : "hsl(var(--ink-4))",
            }}
          >
            {String(rank).padStart(2, "0")}
          </span>
          <span style={{ fontSize: 32 }} aria-hidden>
            {MEDAL[rank]}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <AssessorAvatar
            initials={avatar}
            photoUrl={photoUrl}
            level={level}
            size={48}
          />
          <div className="min-w-0">
            <div className="text-[18px] font-bold text-ink leading-tight tracking-[-0.01em] truncate">
              {name}
            </div>
            {squadName && (
              <Eyebrow className="mt-1">Squad {squadName}</Eyebrow>
            )}
          </div>
        </div>

        <div className="flex justify-between items-end pt-3.5 border-t border-line">
          <div>
            <Eyebrow className="mb-1">Pontos</Eyebrow>
            <div
              className="num font-display font-extrabold text-[36px] leading-none tracking-[-0.03em]"
              style={{ color: isFirst ? accentColor : "hsl(var(--ink))" }}
            >
              {points.toLocaleString("pt-BR")}
            </div>
          </div>
          <div className="text-right">
            <Eyebrow className="mb-1">Meta</Eyebrow>
            <div
              className={cn("num text-[18px] font-semibold", goalColor)}
            >
              {weeklyGoalPercent}%
            </div>
          </div>
        </div>

        {streak > 0 && (
          <span
            className="self-start inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-mono font-bold uppercase tracking-[0.12em]"
            style={{
              background: "hsl(var(--gold-soft))",
              color: "hsl(var(--gold-deep))",
              borderColor: "hsl(var(--gold))",
            }}
          >
            <Fire size={11} weight="fill" /> Streak {streak} dia{streak > 1 ? "s" : ""}
          </span>
        )}
      </div>
    </motion.div>
  );
};
