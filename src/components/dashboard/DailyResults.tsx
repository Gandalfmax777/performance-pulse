import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, TrendingDown, TrendingUp, Flame, Loader2, Moon } from "lucide-react";
import { type Assessor } from "@/types/assessor";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";
import {
  useDailyRanking,
  useWeeklyRanking,
  useMonthlyRanking,
  useSemesterRanking,
  type ApiRankingEntry,
} from "@/hooks/useRankings";

type Period = "daily" | "weekly" | "monthly" | "semester";

const PERIOD_OPTIONS: Array<{ value: Period; label: string }> = [
  { value: "daily", label: "Diário" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "semester", label: "Semestral" },
];

interface DailyResultsProps {
  assessors: Assessor[];
}

/** Item enriquecido com dados visuais do assessor (avatar/level). */
interface RankedRow {
  id: string;
  name: string;
  avatar: string;
  photoUrl: string | null;
  level: Assessor["level"];
  points: number;
  weeklyGoalPercent: number;
  streak: number;
  isInactive: boolean;
}

const DailyResults = ({ assessors }: DailyResultsProps) => {
  const [period, setPeriod] = useState<Period>("weekly");

  // Endpoints dedicados por período (antes era fallback degradado em
  // useOverviewReport). Ranking já vem ordenado pelo backend com zero-guard
  // — assessores inativos (0 pts E 0 dias ativos) caem pro fim.
  const dailyQ = useDailyRanking();
  const weeklyQ = useWeeklyRanking();
  const monthlyQ = useMonthlyRanking();
  const semesterQ = useSemesterRanking();

  const activeQuery =
    period === "daily" ? dailyQ
    : period === "weekly" ? weeklyQ
    : period === "monthly" ? monthlyQ
    : semesterQ;

  const apiRankings: ApiRankingEntry[] = activeQuery.data?.rankings ?? [];

  // Mapeia rankings do backend pra rows enriquecidas com avatar/level/streak
  // (que vêm do estado local de assessors). Mantém a ORDEM do backend pra
  // preservar o tie-break com zero-guard.
  const ranked = useMemo<RankedRow[]>(() => {
    const assessorById = new Map(assessors.map((a) => [a.id, a]));
    return apiRankings.map((r) => {
      const a = assessorById.get(r.assessor.id);
      return {
        id: r.assessor.id,
        name: r.assessor.name,
        avatar: a?.avatar ?? r.assessor.initials,
        photoUrl: r.assessor.photoUrl,
        level: a?.level ?? (r.assessor.level.toLowerCase() as Assessor["level"]),
        points: r.rollup.points,
        weeklyGoalPercent: r.rollup.weeklyGoalPercent,
        streak: r.rollup.streak,
        isInactive: r.rollup.points === 0 && r.rollup.activeDays.length === 0,
      };
    });
  }, [apiRankings, assessors]);

  // Top 3 inclui só quem realmente pontuou (points > 0). Felipe reportou
  // confusão vendo "Diego 1º com 0 pts + 43%" — isso acontecia porque havia
  // atividade (convertedPercent > 0) mas nenhum scoring rule pagou pts
  // (ex: cadência abaixo do threshold). Mostrar pódio nesses casos engana.
  const top3 = ranked.filter((r) => r.points > 0).slice(0, 3);
  const bottom3 = ranked.slice(-3).reverse();
  const hasAnyPoints = top3.length > 0;
  const podiumOrder = [top3[1], top3[0], top3[2]];
  const podiumHeights = [140, 180, 110];
  const podiumLabels = ["2º", "1º", "3º"];
  const podiumColors = [
    "from-silver/30 to-silver/10 border-silver/40",
    "from-primary/30 to-primary/10 border-primary/40",
    "from-bronze/30 to-bronze/10 border-bronze/40",
  ];
  const podiumTextColors = ["text-silver", "text-primary", "text-bronze"];

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="card-glass rounded-xl p-4 flex items-center gap-3 flex-wrap">
        <Trophy className="w-5 h-5 text-primary" />
        <span className="text-sm font-bold text-foreground">Ranking Geral</span>
        <div className="flex gap-1 bg-muted/20 rounded-lg p-1 ml-auto">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                period === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {activeQuery.isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
      </div>

      {/* Podium */}
      <div className="card-glass rounded-xl p-6">
        {!hasAnyPoints ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Trophy className="w-12 h-12 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-semibold text-foreground mb-1">
              Ninguém pontuou ainda neste período
            </p>
            <p className="text-xs text-muted-foreground max-w-md">
              Pode haver atividade registrada (cadência, ligações) mas as regras de
              pontuação ainda não premiaram nenhum assessor. Veja as % nos cards abaixo.
            </p>
          </div>
        ) : (
          <div className="flex items-end justify-center gap-4 pt-8 pb-4">
            {podiumOrder.map((a, i) => {
              if (!a) return null;
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  className="flex flex-col items-center"
                >
                  <AssessorAvatar initials={a.avatar} photoUrl={a.photoUrl} level={a.level} size={56} className="mb-2" />
                  <p className="text-sm font-semibold text-foreground mb-1 break-words text-center max-w-[120px]">{a.name}</p>
                  <div className="flex items-center gap-1 mb-2">
                    <TrendingUp className="w-3 h-3 text-primary" />
                    <span className="text-sm font-mono font-bold text-primary">{a.weeklyGoalPercent}%</span>
                  </div>
                  {a.streak > 0 && (
                    <span className="flex items-center gap-0.5 text-xs text-chart-orange mb-2">
                      <Flame className="w-3 h-3" /> {a.streak} dias
                    </span>
                  )}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: podiumHeights[i] }}
                    transition={{ delay: 0.3 + i * 0.15, duration: 0.6 }}
                    className={`w-28 rounded-t-xl bg-gradient-to-t border border-b-0 flex flex-col items-center justify-start pt-4 ${podiumColors[i]}`}
                  >
                    <span className={`text-3xl font-black ${podiumTextColors[i]}`}>{podiumLabels[i]}</span>
                    <span className="text-xs text-muted-foreground mt-1 font-mono">{a.points} pts</span>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top 3 + Bottom 3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card-glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Medal className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Top 3</h3>
          </div>
          <div className="space-y-3">
            {top3.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6 italic">
                Ninguém pontuou neste período ainda
              </p>
            )}
            {top3.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-3 rounded-lg bg-muted/20 border border-border/30"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                  <AssessorAvatar initials={a.avatar} photoUrl={a.photoUrl} level={a.level} size={36} />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-foreground break-words">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{a.points} pts • {a.level}</p>
                  </div>
                  <span className="text-lg font-mono font-bold text-primary">{a.weeklyGoalPercent}%</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="card-glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-4 h-4 text-destructive" />
            <h3 className="text-sm font-bold text-foreground">Piores Resultados</h3>
          </div>
          <div className="space-y-3">
            {bottom3.map((a, i) => {
              const rank = ranked.length - i;
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`p-3 rounded-lg border ${
                    a.isInactive
                      ? "bg-muted/10 border-border/20"
                      : "bg-destructive/5 border-destructive/20"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                      a.isInactive
                        ? "bg-muted/30 text-muted-foreground"
                        : "bg-destructive/10 text-destructive"
                    }`}>
                      #{rank}
                    </span>
                    <AssessorAvatar initials={a.avatar} photoUrl={a.photoUrl} level={a.level} size={36} />
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-foreground break-words flex items-center gap-2">
                        {a.name}
                        {a.isInactive && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">
                            <Moon className="w-2.5 h-2.5" /> inativo
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{a.points} pts</p>
                    </div>
                    <span className={`text-lg font-mono font-bold ${
                      a.isInactive ? "text-muted-foreground" : "text-destructive"
                    }`}>
                      {a.weeklyGoalPercent}%
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyResults;
