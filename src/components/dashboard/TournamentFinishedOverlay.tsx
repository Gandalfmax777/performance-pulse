import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Medal, X, Trophy } from "@phosphor-icons/react";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";
import { playGoalHitSound } from "@/lib/sounds";

export interface TournamentFinishedEvent {
  tournamentId: string;
  roundLabel: string;
  winners: Array<{
    rank: number;
    displayName: string;
    photoUrl: string | null;
    initials: string | null;
    payout: number;
    score: number;
  }>;
}

interface Props {
  event: TournamentFinishedEvent | null;
  onDismiss: () => void;
  /** Auto-dismiss em ms. Default 12s. */
  autoDismissMs?: number;
}

function rankColor(rank: number): string {
  if (rank === 1) return "bg-primary text-secondary";
  if (rank === 2) return "bg-silver/20 text-silver";
  if (rank === 3) return "bg-bronze/20 text-bronze";
  return "bg-muted/30 text-muted-foreground";
}

function rankIcon(rank: number) {
  if (rank === 1) return Crown;
  if (rank === 2) return Medal;
  if (rank === 3) return Medal; // Phosphor não tem Award; Medal cobre 2º+3º
  return Crown;
}

/**
 * Overlay fullscreen anunciando o fim de um torneio.
 * Renderizado quando recebe evento SSE `tournament:finished`.
 *
 * Design: dramático, EQI verde + laranja, confetti animado, foto dos winners.
 * Pensado pra TV da sala de vendas — vira o centro das atenções por ~12s.
 * Som de vitória toca no mount.
 */
const TournamentFinishedOverlay = ({ event, onDismiss, autoDismissMs = 12000 }: Props) => {
  useEffect(() => {
    if (!event) return;
    playGoalHitSound();
    const t = setTimeout(onDismiss, autoDismissMs);
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", handler);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", handler);
    };
  }, [event, onDismiss, autoDismissMs]);

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-background/95 backdrop-blur-md"
        >
          {/* Confetti camada 1 — 24 spark laranja irradiando do centro */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(24)].map((_, i) => {
              const angle = (i / 24) * Math.PI * 2;
              const dist = 400 + Math.random() * 200;
              const delay = Math.random() * 0.3;
              return (
                <motion.div
                  key={`spark-${i}`}
                  initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0.8, 0],
                    x: Math.cos(angle) * dist,
                    y: Math.sin(angle) * dist,
                    scale: [0, 1.5, 1, 0],
                  }}
                  transition={{ duration: 2.5, delay, ease: "easeOut" }}
                  className="absolute top-1/2 left-1/2 w-4 h-4 rounded-full bg-secondary"
                  style={{ boxShadow: "0 0 20px hsl(var(--secondary))" }}
                />
              );
            })}
          </div>

          {/* Confetti camada 2 — papéis caindo do topo */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(32)].map((_, i) => {
              const x = Math.random() * 100; // vw %
              const duration = 3 + Math.random() * 2;
              const delay = Math.random() * 2;
              const color = ["bg-primary", "bg-secondary", "bg-success"][i % 3];
              return (
                <motion.div
                  key={`paper-${i}`}
                  initial={{ y: "-10vh", opacity: 1, rotate: 0 }}
                  animate={{ y: "110vh", rotate: 720 }}
                  transition={{ duration, delay, ease: "linear", repeat: Infinity }}
                  className={`absolute w-3 h-5 ${color} rounded-sm`}
                  style={{ left: `${x}vw` }}
                />
              );
            })}
          </div>

          {/* Botão fechar manual */}
          <button
            onClick={onDismiss}
            aria-label="Fechar"
            className="absolute top-6 right-6 z-10 w-12 h-12 rounded-full bg-muted/30 border border-border hover:bg-muted/60 flex items-center justify-center text-foreground transition-all"
          >
            <X size={20} />
          </button>

          {/* Conteúdo central */}
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "backOut" }}
            className="relative z-10 max-w-3xl w-full text-center space-y-8"
          >
            {/* Label do torneio */}
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl md:text-2xl font-display font-semibold text-muted-foreground tracking-wider uppercase"
            >
              {event.roundLabel}
            </motion.p>

            {/* Título dramático */}
            <motion.div
              initial={{ scale: 0, rotate: -5 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.5, type: "spring", damping: 12 }}
              className="relative inline-block"
            >
              <h1 className="text-6xl md:text-8xl font-display font-black text-secondary" style={{ textShadow: "0 4px 40px hsl(var(--secondary) / 0.5)" }}>
                <Trophy size={64} weight="fill" className="inline-block mr-3 align-middle" /> TORNEIO ENCERRADO
              </h1>
              {/* Pulse glow */}
              <motion.div
                animate={{ boxShadow: ["0 0 0 0 hsl(var(--secondary)/0.5)", "0 0 0 40px hsl(var(--secondary)/0)"] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-3xl"
              />
            </motion.div>

            {/* Pódio dos winners */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="grid gap-4 pt-4"
              style={{
                gridTemplateColumns: `repeat(${Math.min(event.winners.length, 3)}, minmax(0, 1fr))`,
              }}
            >
              {event.winners.slice(0, 3).map((w, i) => {
                const RankIcon = rankIcon(w.rank);
                return (
                  <motion.div
                    key={w.rank}
                    initial={{ opacity: 0, y: 40, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 1.2 + i * 0.25, type: "spring", damping: 14 }}
                    className={`p-6 rounded-2xl border-2 ${
                      w.rank === 1
                        ? "border-secondary/60 bg-secondary/5 md:scale-110 md:-mt-4"
                        : w.rank === 2
                        ? "border-silver/40 bg-muted/20"
                        : "border-bronze/40 bg-muted/20"
                    }`}
                  >
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3 ${rankColor(w.rank)}`}>
                      <RankIcon size={16} weight="fill" />
                      <span className="font-black text-sm">{w.rank}º LUGAR</span>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                      <AssessorAvatar
                        initials={w.initials ?? "??"}
                        photoUrl={w.photoUrl}
                        level={w.rank === 1 ? "gold" : w.rank === 2 ? "silver" : "bronze"}
                        size={w.rank === 1 ? 96 : 72}
                      />
                      <p className={`font-display font-bold text-foreground ${w.rank === 1 ? "text-2xl" : "text-xl"}`}>
                        {w.displayName}
                      </p>
                      <div className="space-y-1">
                        <p className={`font-mono font-black text-secondary ${w.rank === 1 ? "text-4xl" : "text-3xl"}`}>
                          R$ {w.payout.toLocaleString("pt-BR")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {w.score.toLocaleString("pt-BR")} pts
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Hint rodapé */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 3 }}
              className="text-xs text-muted-foreground pt-8"
            >
              Auto-dispensa em {Math.round(autoDismissMs / 1000)}s · pressione ESC pra fechar
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TournamentFinishedOverlay;
