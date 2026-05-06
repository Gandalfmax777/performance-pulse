import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sword as Swords,
  Trophy,
  Clock,
  Target,
  Fire,
  Crown,
  Medal,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { parseISO, format } from "date-fns";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";
import { useKpis } from "@/hooks/useKpis";
import type { ApiTournament } from "@/hooks/useTournaments";

interface Props {
  tournament: ApiTournament;
  /** Modo TV usa fontes/espaçamentos maiores. */
  tvMode?: boolean;
}

/** Countdown live — recalcula a cada segundo. */
function useCountdown(endIso: string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  finished: boolean;
} {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  const end = parseISO(endIso).getTime();
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

function rankIcon(rank: number): PhosphorIcon {
  if (rank === 1) return Crown;
  if (rank === 2 || rank === 3) return Medal;
  return Trophy;
}

function rankColor(rank: number): { bg: string; text: string } {
  if (rank === 1) return { bg: "hsl(var(--gold))", text: "hsl(var(--ink))" };
  if (rank === 2) return { bg: "hsl(var(--silver) / 0.2)", text: "hsl(var(--silver))" };
  if (rank === 3) return { bg: "hsl(var(--bronze) / 0.2)", text: "hsl(var(--bronze))" };
  return { bg: "hsl(var(--surface-2))", text: "hsl(var(--ink-3))" };
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[14px] border border-line bg-card overflow-hidden"
    >
      {/* HERO — gradiente ink + glow dourado, estilo TournamentScreen */}
      <div
        className="relative p-6 text-white overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--ink)) 0%, hsl(var(--eqi-forest)) 100%)",
        }}
      >
        <div
          className="absolute pointer-events-none"
          style={{
            top: -80,
            right: -80,
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: "radial-gradient(circle, hsl(var(--gold) / 0.18) 0%, transparent 70%)",
          }}
        />

        <div className="relative grid gap-6" style={{ gridTemplateColumns: "1.5fr 1fr 1fr" }}>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-[0.1em]"
                style={{ background: "hsl(var(--gold))", color: "hsl(var(--ink))" }}
              >
                <Swords size={11} weight="bold" />
                {isActive ? "ROUND ATIVO" : isFinished ? "FINALIZADO" : "PRÉ"}
              </span>
              {isActive && (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-extrabold tracking-[0.1em]"
                  style={{
                    background: "oklch(0.55 0.22 25 / 0.18)",
                    borderColor: "oklch(0.55 0.22 25 / 0.4)",
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: "oklch(0.65 0.24 25)" }}
                  />
                  AO VIVO
                </span>
              )}
            </div>
            <h3
              className="font-extrabold tracking-[-0.02em] mt-3 leading-none"
              style={{ fontSize: tvMode ? 40 : 28 }}
            >
              {tournament.roundLabel}
            </h3>
            <p className="mt-2 text-[13px] text-white/70 leading-relaxed inline-flex items-center gap-1.5 flex-wrap">
              <Target size={13} />
              {kpiLabel}
              {tournament.goalTargetValue && (
                <span className="text-white/50">· meta {tournament.goalTargetValue}</span>
              )}
              <span className="text-white/40 mx-0.5">·</span>
              <span>
                {format(parseISO(tournament.startDate), "dd/MM")} →{" "}
                {format(parseISO(tournament.endDate), "dd/MM")}
              </span>
              <span
                className="text-[9px] uppercase tracking-[0.12em] font-semibold ml-1"
                style={{ color: "hsl(var(--gold))" }}
              >
                {tournament.scope === "INDIVIDUAL" ? "Individual" : "Por Squad"}
              </span>
            </p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/50">
              PRÊMIO
            </p>
            <p
              className="font-mono font-extrabold tracking-[-0.02em] mt-1.5 leading-none"
              style={{ fontSize: tvMode ? 36 : 28, color: "hsl(var(--gold))" }}
            >
              R$ {tournament.totalPrizePool.toLocaleString("pt-BR")}
            </p>
            <p className="text-[11px] text-white/70 mt-1">{payoutEntries.length} colocados</p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/50">
              {isActive ? "RESTAM" : "PERÍODO"}
            </p>
            {isActive ? (
              <>
                <p
                  className="font-mono font-extrabold tracking-[-0.02em] mt-1.5 leading-none inline-flex items-center gap-2"
                  style={{ fontSize: tvMode ? 36 : 28 }}
                >
                  <Clock size={tvMode ? 26 : 20} weight="bold" className="text-white/70" />
                  {countdown.days > 0 ? `${countdown.days}d` : ""}
                  {String(countdown.hours).padStart(2, "0")}:
                  {String(countdown.minutes).padStart(2, "0")}
                </p>
                <p className="font-mono text-[11px] text-white/70 mt-1">
                  até encerrar
                </p>
              </>
            ) : (
              <p className="font-mono font-bold mt-1.5 text-white/80">
                {format(parseISO(tournament.startDate), "dd MMM")} →{" "}
                {format(parseISO(tournament.endDate), "dd MMM")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Payouts strip */}
      {payoutEntries.length > 0 && (
        <div className="px-6 py-3 border-t border-line flex items-center gap-3 flex-wrap bg-surface-2">
          <span className="text-[10px] uppercase tracking-[0.12em] font-semibold text-ink-3">
            Prêmios
          </span>
          {payoutEntries.map(({ rank, amount }) => {
            const Icon = rankIcon(rank);
            const c = rankColor(rank);
            return (
              <span
                key={rank}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-bold"
                style={{ background: c.bg, color: c.text }}
              >
                <Icon size={11} weight="fill" />
                {rank}º · R$ {amount.toLocaleString("pt-BR")}
              </span>
            );
          })}
        </div>
      )}

      {/* Standings */}
      <div className="px-6 py-5">
        <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-ink-3 mb-3">
          Classificação {isFinished ? "final" : "atual"}
        </p>
        <AnimatePresence mode="popLayout">
          {sortedParticipants.length === 0 ? (
            <p className="text-xs text-ink-3 py-4 text-center">Sem participantes.</p>
          ) : (
            <div className="flex flex-col">
              {sortedParticipants.slice(0, tvMode ? 10 : 6).map((p, idx) => {
                const rank = isFinished && p.rank ? p.rank : idx + 1;
                const score = p.finalScore ?? 0;
                const pctOfLeader = leaderScore > 0 ? (score / leaderScore) * 100 : 0;
                const isWinner = isFinished && p.rank === 1;
                const RankIcon = rankIcon(rank);
                const c = rankColor(rank);

                return (
                  <motion.div
                    key={p.id}
                    layoutId={`tour-${p.id}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className={`relative grid items-center gap-3 py-3 ${
                      idx < sortedParticipants.length - 1 ? "border-b border-line" : ""
                    }`}
                    style={{
                      gridTemplateColumns: tvMode
                        ? "44px 48px 1fr 200px 90px"
                        : "32px 36px 1fr 140px 70px",
                      background: isWinner ? "oklch(0.99 0.04 90)" : "transparent",
                    }}
                  >
                    <div
                      className="flex items-center justify-center font-mono font-extrabold rounded-lg shrink-0"
                      style={{
                        width: tvMode ? 40 : 28,
                        height: tvMode ? 40 : 28,
                        fontSize: tvMode ? 16 : 13,
                        background: c.bg,
                        color: c.text,
                      }}
                    >
                      {rank <= 3 ? (
                        <RankIcon size={tvMode ? 18 : 14} weight="fill" />
                      ) : (
                        String(rank).padStart(2, "0")
                      )}
                    </div>

                    {p.assessorId ? (
                      <AssessorAvatar
                        initials={p.initials ?? "??"}
                        photoUrl={p.photoUrl}
                        level="bronze"
                        size={tvMode ? 44 : 30}
                      />
                    ) : (
                      <div className="w-8 h-8" />
                    )}

                    <div className="min-w-0">
                      <p
                        className={`font-bold text-ink truncate ${
                          tvMode ? "text-lg" : "text-[14px]"
                        }`}
                      >
                        {p.displayName}
                      </p>
                    </div>

                    <div>
                      <div className="h-1.5 bg-line rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pctOfLeader}%` }}
                          transition={{ duration: 0.7 }}
                          className="h-full rounded-full"
                          style={{
                            background:
                              rank === 1
                                ? "linear-gradient(90deg, hsl(var(--gold)), hsl(var(--gold-deep)))"
                                : "hsl(var(--ink-2))",
                          }}
                        />
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={`font-mono font-extrabold text-ink ${
                          tvMode ? "text-2xl" : "text-[15px]"
                        }`}
                      >
                        {score.toLocaleString("pt-BR")}
                      </p>
                      <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-ink-3">
                        {kpiLabel}
                      </p>
                    </div>

                    {isWinner && (
                      <motion.span
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold inline-flex items-center gap-1 shadow-lg"
                        style={{ background: "hsl(var(--gold))", color: "hsl(var(--ink))" }}
                      >
                        <Fire size={10} weight="fill" />
                        CAMPEÃO
                      </motion.span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {sortedParticipants.length > (tvMode ? 10 : 6) && (
          <p className="text-[10px] text-ink-3 text-center pt-3">
            +{sortedParticipants.length - (tvMode ? 10 : 6)} participantes
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default TournamentCard;
