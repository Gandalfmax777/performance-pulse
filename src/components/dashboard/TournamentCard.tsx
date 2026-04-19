import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Trophy, Clock, Target, Flame, Crown, Medal, Award } from "lucide-react";
import { parseISO, differenceInSeconds, format } from "date-fns";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";
import { useKpis } from "@/hooks/useKpis";
import type { ApiTournament } from "@/hooks/useTournaments";

interface Props {
  tournament: ApiTournament;
  /** Modo TV usa fontes/espaçamentos maiores. */
  tvMode?: boolean;
}

/** Countdown live — recalcula a cada segundo. */
function useCountdown(endIso: string): { days: number; hours: number; minutes: number; seconds: number; finished: boolean } {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  const end = parseISO(endIso).getTime();
  // endDate é YYYY-MM-DD — considera fim do dia pra não encerrar cedo
  const endOfDay = end + 24 * 60 * 60 * 1000 - 1;
  const diff = Math.max(0, Math.floor((endOfDay - now) / 1000));
  return {
    days: Math.floor(diff / 86400),
    hours: Math.floor((diff % 86400) / 3600),
    minutes: Math.floor((diff % 3600) / 60),
    seconds: diff % 60,
    finished: diff === 0,
  };
}

function rankBadgeColor(rank: number): string {
  if (rank === 1) return "bg-primary text-secondary"; // verde escuro + laranja EQI
  if (rank === 2) return "bg-silver/20 text-silver";
  if (rank === 3) return "bg-bronze/20 text-bronze";
  return "bg-muted/30 text-muted-foreground";
}

function rankIcon(rank: number): typeof Crown {
  if (rank === 1) return Crown;
  if (rank === 2) return Medal;
  if (rank === 3) return Award;
  return Trophy;
}

const TournamentCard = ({ tournament, tvMode = false }: Props) => {
  const { kpis } = useKpis();
  const countdown = useCountdown(tournament.endDate);

  const kpiLabel = useMemo(() => {
    const found = kpis.find((k) => k.key === tournament.goalKpiKey);
    return found?.label ?? tournament.goalKpiKey;
  }, [kpis, tournament.goalKpiKey]);

  const payouts = tournament.progressivePayoutJson ?? {};
  const payoutEntries = Object.entries(payouts)
    .map(([rank, amount]) => ({ rank: Number(rank), amount }))
    .sort((a, b) => a.rank - b.rank);

  const sortedParticipants = [...tournament.participants].sort((a, b) => {
    const scoreA = a.finalScore ?? 0;
    const scoreB = b.finalScore ?? 0;
    return scoreB - scoreA;
  });

  const leaderScore = sortedParticipants[0]?.finalScore ?? 0;
  const isActive = tournament.status === "ACTIVE";
  const isFinished = tournament.status === "FINISHED";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card-glass rounded-2xl overflow-hidden border-2 ${
        isActive
          ? "border-secondary/40 glow-primary"
          : isFinished
          ? "border-primary/30"
          : "border-border/30"
      }`}
    >
      {/* Header */}
      <div className="relative p-5 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Swords className={`${tvMode ? "w-6 h-6" : "w-4 h-4"} text-secondary`} />
              <h3 className={`font-display font-black text-foreground ${tvMode ? "text-2xl" : "text-base"}`}>
                {tournament.roundLabel}
              </h3>
              {isActive && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/15 border border-success/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  <span className="text-[10px] font-bold text-success tracking-wider">AO VIVO</span>
                </span>
              )}
              {isFinished && (
                <span className="px-2 py-0.5 rounded-full bg-primary/15 border border-primary/30 text-[10px] font-bold text-primary tracking-wider">
                  FINALIZADO
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                {kpiLabel}
                {tournament.goalTargetValue && ` · meta ${tournament.goalTargetValue}`}
              </span>
              <span>
                {format(parseISO(tournament.startDate), "dd/MM")} → {format(parseISO(tournament.endDate), "dd/MM")}
              </span>
              <span className="text-[10px] uppercase tracking-wider">
                {tournament.scope === "INDIVIDUAL" ? "Individual" : "Por Squad"}
              </span>
            </div>
          </div>

          {/* Prize pool */}
          <div className="text-right">
            <div className={`font-mono font-black text-secondary ${tvMode ? "text-3xl" : "text-xl"}`}>
              R$ {tournament.totalPrizePool.toLocaleString("pt-BR")}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Pote total</div>
          </div>
        </div>

        {/* Countdown (só em ACTIVE) */}
        {isActive && (
          <div className={`mt-3 flex items-center gap-2 ${tvMode ? "text-2xl" : "text-base"}`}>
            <Clock className={`${tvMode ? "w-6 h-6" : "w-4 h-4"} text-primary`} />
            <span className="font-mono font-bold text-foreground">
              {countdown.days > 0 && `${countdown.days}d `}
              {String(countdown.hours).padStart(2, "0")}:
              {String(countdown.minutes).padStart(2, "0")}:
              {String(countdown.seconds).padStart(2, "0")}
            </span>
            <span className="text-xs text-muted-foreground">restantes</span>
          </div>
        )}
      </div>

      {/* Payout breakdown */}
      {payoutEntries.length > 0 && (
        <div className="px-5 py-3 border-t border-border/20 flex items-center gap-4 flex-wrap bg-muted/10">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Prêmios:</span>
          {payoutEntries.map(({ rank, amount }) => {
            const Icon = rankIcon(rank);
            return (
              <span
                key={rank}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold ${rankBadgeColor(rank)}`}
              >
                <Icon className="w-3 h-3" />
                {rank}º · R$ {amount.toLocaleString("pt-BR")}
              </span>
            );
          })}
        </div>
      )}

      {/* Leaderboard */}
      <div className="p-5 space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
          Ranking {isFinished ? "final" : "atual"}
        </h4>
        <AnimatePresence mode="popLayout">
          {sortedParticipants.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">Sem participantes.</p>
          ) : (
            sortedParticipants.slice(0, tvMode ? 10 : 6).map((p, idx) => {
              const rank = isFinished && p.rank ? p.rank : idx + 1;
              const score = p.finalScore ?? 0;
              const pctOfLeader = leaderScore > 0 ? (score / leaderScore) * 100 : 0;
              const isWinner = isFinished && p.rank === 1;
              const isTopN = isFinished && p.rank !== null && p.rank <= tournament.maxWinners;
              const RankIcon = rankIcon(rank);

              return (
                <motion.div
                  key={p.id}
                  layoutId={`tour-${p.id}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`relative flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                    isWinner
                      ? "border-secondary/50 bg-secondary/5"
                      : isTopN
                      ? "border-primary/30 bg-primary/5"
                      : "border-border/20 bg-muted/10"
                  }`}
                >
                  {/* Rank badge */}
                  <div
                    className={`${tvMode ? "w-10 h-10" : "w-7 h-7"} rounded-lg flex items-center justify-center font-mono font-black shrink-0 ${rankBadgeColor(rank)}`}
                  >
                    {rank <= 3 ? <RankIcon className={tvMode ? "w-5 h-5" : "w-3.5 h-3.5"} /> : `#${rank}`}
                  </div>

                  {/* Avatar (só INDIVIDUAL) */}
                  {p.assessorId && (
                    <AssessorAvatar
                      initials={p.initials ?? "??"}
                      photoUrl={p.photoUrl}
                      level="BRONZE"
                      size={tvMode ? 44 : 32}
                    />
                  )}

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-foreground truncate ${tvMode ? "text-lg" : "text-sm"}`}>
                      {p.displayName}
                    </p>
                    {/* Progress bar vs leader */}
                    <div className="h-1 bg-muted/30 rounded-full mt-1 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pctOfLeader}%` }}
                        transition={{ duration: 0.6 }}
                        className={`h-full rounded-full ${
                          rank === 1 ? "bg-primary" : "bg-primary/70"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div className={`font-mono font-black text-primary ${tvMode ? "text-xl" : "text-sm"}`}>
                      {score.toLocaleString("pt-BR")}
                    </div>
                    <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{kpiLabel}</div>
                  </div>

                  {/* Winner badge */}
                  {isWinner && (
                    <motion.div
                      initial={{ scale: 0, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-primary text-secondary text-[10px] font-black flex items-center gap-1 shadow-lg"
                    >
                      <Flame className="w-2.5 h-2.5" />
                      CAMPEÃO
                    </motion.div>
                  )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>

        {sortedParticipants.length > (tvMode ? 10 : 6) && (
          <p className="text-[10px] text-muted-foreground text-center pt-1">
            +{sortedParticipants.length - (tvMode ? 10 : 6)} participantes
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default TournamentCard;
