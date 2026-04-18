import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Flame, TrendingUp, TrendingDown, ArrowUp } from "lucide-react";
import { type Assessor } from "@/types/assessor";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";
import { playRiseSound } from "@/lib/sounds";

/**
 * Frases provocativas mostradas quando alguém cai de posição.
 * Tom competitivo como Felipe pediu ("implicar mesmo").
 */
const PROVOCATION_PHRASES = [
  "Ficando pra trás...",
  "Quem te viu, quem te vê...",
  "Acorda, craque!",
  "A mesa tá quente!",
  "Vão te ultrapassar!",
  "Hora de reagir!",
  "Posição em risco!",
  "Cuidado com quem vem atrás!",
];

/** Frases positivas pra quem SOBE de posição. */
const RISE_PHRASES = [
  "Subiu pra cima!",
  "Pra cima, fera!",
  "Voa, irmão!",
  "É só o começo!",
  "Disparou!",
  "Bora bora!",
  "Acelera, top!",
  "Que demais!",
];

function getRandomPhrase(): string {
  return PROVOCATION_PHRASES[Math.floor(Math.random() * PROVOCATION_PHRASES.length)];
}

function getRandomRisePhrase(): string {
  return RISE_PHRASES[Math.floor(Math.random() * RISE_PHRASES.length)];
}

interface TvRankingProps {
  assessors: Assessor[];
}

/**
 * Ranking dramático pro Modo TV. Animações agressivas:
 * - layoutId pra reordenação suave
 * - Shake quando assessor cai de posição
 * - Overlay com frase provocativa temporária
 *
 * Projetado pra ficar na TV da mesa de vendas, gerando competição visual.
 */
const TvRanking = ({ assessors }: TvRankingProps) => {
  // Memoizado pra não disparar effect a cada render (SSE invalidation criava loop).
  const sorted = useMemo(
    () => [...assessors].sort((a, b) => b.points - a.points),
    [assessors],
  );
  const prevPositions = useRef<Map<string, number>>(new Map());
  const alertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const riserTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [alerts, setAlerts] = useState<Map<string, string>>(new Map());
  const [risers, setRisers] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const newAlerts = new Map<string, string>();
    const newRisers = new Map<string, string>();

    sorted.forEach((a, i) => {
      const prevPos = prevPositions.current.get(a.id);
      if (prevPos !== undefined) {
        if (i > prevPos) {
          // Caiu de posição (índice maior = pior posição)
          newAlerts.set(a.id, getRandomPhrase());
        } else if (i < prevPos) {
          // Subiu de posição
          newRisers.set(a.id, getRandomRisePhrase());
        }
      }
    });

    // Sempre atualiza posições antes de sair — senão a próxima render detecta
    // a mesma mudança de novo e entra em loop de setState.
    const nextMap = new Map<string, number>();
    sorted.forEach((a, i) => nextMap.set(a.id, i));
    prevPositions.current = nextMap;

    if (newAlerts.size > 0) {
      setAlerts(newAlerts);
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
      alertTimerRef.current = setTimeout(() => {
        setAlerts(new Map());
        alertTimerRef.current = null;
      }, 4000);
    }

    if (newRisers.size > 0) {
      setRisers(newRisers);
      // Toca som de subida (1x, mesmo se vários subiram simultaneamente)
      playRiseSound();
      if (riserTimerRef.current) clearTimeout(riserTimerRef.current);
      riserTimerRef.current = setTimeout(() => {
        setRisers(new Map());
        riserTimerRef.current = null;
      }, 3000);
    }
  }, [sorted]);

  useEffect(
    () => () => {
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
      if (riserTimerRef.current) clearTimeout(riserTimerRef.current);
    },
    [],
  );

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {sorted.map((a, i) => {
          const alert = alerts.get(a.id);
          const rise = risers.get(a.id);
          const isShaking = Boolean(alert);
          const isRising = Boolean(rise);

          return (
            <motion.div
              key={a.id}
              layoutId={`tv-rank-${a.id}`}
              initial={{ opacity: 0, x: -40 }}
              animate={{
                opacity: 1,
                x: isShaking ? [0, -8, 8, -6, 6, -3, 3, 0] : 0,
                // Pulse verde brilhante quando sobe — boxShadow pulsa em 3 ondas
                boxShadow: isRising
                  ? [
                      "0 0 0 0 rgba(34, 197, 94, 0)",
                      "0 0 30px 6px rgba(34, 197, 94, 0.6)",
                      "0 0 50px 12px rgba(34, 197, 94, 0.4)",
                      "0 0 30px 6px rgba(34, 197, 94, 0.6)",
                      "0 0 0 0 rgba(34, 197, 94, 0)",
                    ]
                  : "0 0 0 0 rgba(34, 197, 94, 0)",
                scale: isRising ? [1, 1.02, 1] : 1,
              }}
              exit={{ opacity: 0, x: 40 }}
              transition={{
                layout: { type: "spring", damping: 25, stiffness: 200 },
                x: isShaking
                  ? { duration: 0.5, times: [0, 0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 1] }
                  : { duration: 0.3 },
                boxShadow: isRising ? { duration: 1.6, times: [0, 0.25, 0.5, 0.75, 1] } : { duration: 0.3 },
                scale: isRising ? { duration: 1.6, times: [0, 0.5, 1] } : { duration: 0.3 },
              }}
              className={`relative p-6 rounded-2xl border-2 transition-colors ${
                i === 0
                  ? "border-primary/50 bg-primary/10 glow-primary"
                  : i === 1
                  ? "border-silver/40 bg-silver/5"
                  : i === 2
                  ? "border-bronze/40 bg-bronze/5"
                  : "border-border/30 bg-muted/10"
              }`}
            >
              {/* Alert overlay (caiu) */}
              <AnimatePresence>
                {alert && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -10 }}
                    className="absolute -top-3 right-4 z-10 px-3 py-1.5 rounded-lg gradient-fire text-white text-xs font-bold shadow-lg"
                  >
                    <TrendingDown className="w-3 h-3 inline mr-1" />
                    {alert}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Rise overlay (subiu) — verde brilhante */}
              <AnimatePresence>
                {rise && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 10 }}
                    className="absolute -top-3 left-4 z-10 px-3 py-1.5 rounded-lg bg-success text-white text-xs font-bold shadow-lg flex items-center gap-1"
                  >
                    <ArrowUp className="w-3 h-3" />
                    {rise}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-5">
                {/* Posição — maior pra TV */}
                <div
                  className={`w-16 h-16 rounded-xl flex items-center justify-center font-display font-black text-2xl ${
                    i === 0
                      ? "bg-primary/20 text-primary"
                      : i === 1
                      ? "bg-silver/15 text-silver"
                      : i === 2
                      ? "bg-bronze/15 text-bronze"
                      : "bg-muted/30 text-muted-foreground"
                  }`}
                >
                  {i === 0 ? <Crown className="w-8 h-8" /> : `#${i + 1}`}
                </div>

                {/* Avatar — 80px pra TV */}
                <AssessorAvatar initials={a.avatar} photoUrl={a.photoUrl} level={a.level} size={80} />

                {/* Info — fontes maiores */}
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-2xl text-foreground break-words">{a.name}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-base text-muted-foreground font-mono">
                      {a.points.toLocaleString()} pts
                    </span>
                    {a.streak > 0 && (
                      <span className="flex items-center gap-1.5 text-base text-chart-orange font-semibold">
                        <Flame className="w-5 h-5" /> {a.streak}
                      </span>
                    )}
                  </div>
                </div>

                {/* Score — maior */}
                <div className="text-right">
                  <div
                    className={`flex items-center gap-2 text-3xl font-mono font-black ${
                      a.weeklyGoalPercent >= 80
                        ? "text-primary"
                        : a.weeklyGoalPercent >= 50
                        ? "text-chart-orange"
                        : "text-destructive"
                    }`}
                  >
                    <TrendingUp className="w-6 h-6" />
                    {a.weeklyGoalPercent}%
                  </div>
                  <div className="w-36 h-4 bg-muted/40 rounded-full mt-2.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, a.weeklyGoalPercent)}%` }}
                      transition={{ duration: 0.8 }}
                      className={`h-full rounded-full ${
                        a.weeklyGoalPercent >= 80 ? "gradient-success" : "gradient-primary"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default TvRanking;
