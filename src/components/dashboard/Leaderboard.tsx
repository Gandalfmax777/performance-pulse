import { motion } from "framer-motion";
import { ArrowRight, Crown, Fire } from "@phosphor-icons/react";
import { type Assessor } from "@/types/assessor";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";
import { useBadges, useBadgeUnlocks } from "@/hooks/useBadges";

interface LeaderboardProps {
  assessors: Assessor[];
}

/**
 * Ranking semanal compacto (Editorial V1) — versão de side panel
 * usada na Visão Geral. Lista até 7 linhas com nº, avatar pequeno,
 * nome + pts em mono, e % meta com cor adaptativa. Linhas separadas
 * por divisor de 1px no padrão Editorial.
 */
const Leaderboard = ({ assessors }: LeaderboardProps) => {
  const sorted = [...assessors].sort((a, b) => b.points - a.points);
  const top = sorted.slice(0, 7);
  const { data: allBadges } = useBadges();
  const { data: allUnlocks } = useBadgeUnlocks();

  const badgesByAssessor = new Map<
    string,
    Array<{ id: string; slug: string; name: string; icon: string; description: string }>
  >();
  if (allBadges && allUnlocks) {
    const badgeBySlug = new Map(allBadges.map((b) => [b.slug, b]));
    for (const u of allUnlocks) {
      if (!u.assessorId || u.badgeScope !== "INDIVIDUAL") continue;
      const badge = badgeBySlug.get(u.badgeSlug);
      if (!badge) continue;
      if (!badgesByAssessor.has(u.assessorId)) badgesByAssessor.set(u.assessorId, []);
      const arr = badgesByAssessor.get(u.assessorId)!;
      if (!arr.some((b) => b.slug === badge.slug)) arr.push(badge);
    }
  }

  return (
    <div className="rounded-[14px] border border-line bg-card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-extrabold tracking-tight text-ink">Ranking Semanal</h3>
        <button className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-ink-3 hover:text-ink transition-colors">
          Ver tudo <ArrowRight size={12} weight="bold" />
        </button>
      </div>

      <div className="flex flex-col">
        {top.map((a, i) => {
          const earned = badgesByAssessor.get(a.id) ?? [];
          const pctColor =
            a.weeklyGoalPercent >= 100
              ? "hsl(var(--success))"
              : a.weeklyGoalPercent >= 70
              ? "hsl(var(--ink))"
              : "hsl(var(--destructive))";
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`grid items-center gap-2.5 py-2.5 ${
                i < top.length - 1 ? "border-b border-line" : ""
              }`}
              style={{ gridTemplateColumns: "26px 32px 1fr auto" }}
            >
              <span
                className="font-mono font-bold text-[13px]"
                style={{ color: i === 0 ? "hsl(var(--gold-deep))" : "hsl(var(--ink-3))" }}
              >
                {i === 0 ? (
                  <Crown size={15} weight="fill" />
                ) : (
                  String(i + 1).padStart(2, "0")
                )}
              </span>
              <AssessorAvatar
                initials={a.avatar}
                photoUrl={a.photoUrl}
                level={a.level}
                size={28}
              />
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-ink truncate flex items-center gap-1.5">
                  {a.name}
                  {a.streak >= 5 && (
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-gold-deep">
                      <Fire size={10} weight="fill" /> {a.streak}
                    </span>
                  )}
                </p>
                <p className="font-mono text-[10px] text-ink-3 mt-0.5">
                  {a.points.toLocaleString("pt-BR")} pts
                  {earned.length > 0 && (
                    <span className="ml-1.5 text-ink-4">· {earned.length} conquistas</span>
                  )}
                </p>
              </div>
              <span
                className="font-mono font-extrabold text-[14px] text-right"
                style={{ color: pctColor }}
              >
                {a.weeklyGoalPercent}%
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Leaderboard;
