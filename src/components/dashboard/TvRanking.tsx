import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Flame, TrendingUp, Target } from "lucide-react";
import { type Assessor } from "@/types/assessor";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";
import { playRiseSound, playGoalHitSound } from "@/lib/sounds";

// Frases provocativas/elogiosas hardcoded foram removidas (Felipe quer
// avisos só do banco). Animação shake (queda) e pulse verde (subida)
// continuam — apenas sem texto sobreposto.

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
  // Track de % anterior pra detectar cruzamento de 100% (meta batida).
  // Diferente de rank: % é mais "personal best" — não importa onde está
  // no ranking, importa se cruzou a linha da meta semanal.
  const prevPercents = useRef<Map<string, number>>(new Map());
  const alertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const riserTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const goalTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  // alerts/risers viraram Sets (sem texto) — só sinaliza "está em estado de
  // animação". Antes eram Maps com frase aleatória, removidas pra deixar o
  // controle de texto 100% no admin via Announcements.
  const [alerts, setAlerts] = useState<Set<string>>(new Set());
  const [risers, setRisers] = useState<Set<string>>(new Set());
  const [goalHits, setGoalHits] = useState<Set<string>>(new Set());

  useEffect(() => {
    const newAlerts = new Set<string>();
    const newRisers = new Set<string>();
    const newGoalHits = new Set<string>();

    sorted.forEach((a, i) => {
      const prevPos = prevPositions.current.get(a.id);
      if (prevPos !== undefined) {
        if (i > prevPos) {
          // Caiu de posição (índice maior = pior posição)
          newAlerts.add(a.id);
        } else if (i < prevPos) {
          // Subiu de posição
          newRisers.add(a.id);
        }
      }

      // Cruzou 100%? prev < 100 && curr >= 100 = meta batida agora.
      // O cap em 0 no prev evita falso positivo no primeiro render.
      const prevPct = prevPercents.current.get(a.id) ?? 0;
      const currPct = a.weeklyGoalPercent ?? 0;
      if (prevPct < 100 && currPct >= 100) {
        newGoalHits.add(a.id);
      }
    });

    // Sempre atualiza posições antes de sair — senão a próxima render detecta
    // a mesma mudança de novo e entra em loop de setState.
    const nextMap = new Map<string, number>();
    sorted.forEach((a, i) => nextMap.set(a.id, i));
    prevPositions.current = nextMap;

    // Atualiza percents anteriores em paralelo
    const nextPctMap = new Map<string, number>();
    sorted.forEach((a) => nextPctMap.set(a.id, a.weeklyGoalPercent ?? 0));
    prevPercents.current = nextPctMap;

    if (newAlerts.size > 0) {
      setAlerts(newAlerts);
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
      alertTimerRef.current = setTimeout(() => {
        setAlerts(new Set());
        alertTimerRef.current = null;
      }, 4000);
    }

    if (newRisers.size > 0) {
      setRisers(newRisers);
      // Toca som de subida (1x, mesmo se vários subiram simultaneamente)
      playRiseSound();
      if (riserTimerRef.current) clearTimeout(riserTimerRef.current);
      riserTimerRef.current = setTimeout(() => {
        setRisers(new Set());
        riserTimerRef.current = null;
      }, 3000);
    }

    if (newGoalHits.size > 0) {
      setGoalHits((prev) => {
        const merged = new Set(prev);
        newGoalHits.forEach((id) => merged.add(id));
        return merged;
      });
      // Toca som de meta batida no navegador da TV pra equipe ouvir.
      // 1x mesmo se vários baterem simultaneamente.
      playGoalHitSound();
      // Cada celebração tem timer próprio — se outro bater meta no meio,
      // não cancela a anterior.
      newGoalHits.forEach((id) => {
        const existing = goalTimersRef.current.get(id);
        if (existing) clearTimeout(existing);
        const timer = setTimeout(() => {
          setGoalHits((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          goalTimersRef.current.delete(id);
        }, 5000);
        goalTimersRef.current.set(id, timer);
      });
    }
  }, [sorted]);

  useEffect(
    () => () => {
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
      if (riserTimerRef.current) clearTimeout(riserTimerRef.current);
      goalTimersRef.current.forEach((t) => clearTimeout(t));
      goalTimersRef.current.clear();
    },
    [],
  );

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {sorted.map((a, i) => {
          const isShaking = alerts.has(a.id);
          const isRising = risers.has(a.id);
          const isCelebrating = goalHits.has(a.id);

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
              {/* Overlays de queda/subida com texto provocativo foram removidos.
                  Animação shake (queda) e pulse verde (subida) já indicam o
                  movimento sem texto. Felipe controla mensagens via Avisos. */}

              {/* Celebration overlay (bateu meta — cruzou 100%) */}
              <AnimatePresence>
                {isCelebrating && (
                  <>
                    {/* Badge "META BATIDA" flutuando no topo do card */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0, y: -30 }}
                      animate={{
                        opacity: 1,
                        scale: [0, 1.2, 1],
                        y: [-30, 0, -4, 0],
                      }}
                      exit={{ opacity: 0, scale: 0.5, y: -20 }}
                      transition={{
                        duration: 0.7,
                        scale: { times: [0, 0.6, 1] },
                        y: { times: [0, 0.4, 0.7, 1] },
                      }}
                      className="absolute -top-5 left-1/2 -translate-x-1/2 z-20 px-5 py-2 rounded-full bg-primary text-secondary font-display font-black text-base shadow-2xl flex items-center gap-2 border-2 border-secondary/40"
                    >
                      <Target className="w-5 h-5" />
                      META BATIDA!
                    </motion.div>

                    {/* Pulse dourado expandindo em ondas — chama atenção na TV */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: [0, 1, 0, 1, 0, 1, 0],
                        boxShadow: [
                          "0 0 0 0px hsl(var(--secondary) / 0)",
                          "0 0 0 8px hsl(var(--secondary) / 0.5)",
                          "0 0 0 24px hsl(var(--secondary) / 0)",
                          "0 0 0 8px hsl(var(--secondary) / 0.5)",
                          "0 0 0 24px hsl(var(--secondary) / 0)",
                          "0 0 0 8px hsl(var(--secondary) / 0.5)",
                          "0 0 0 36px hsl(var(--secondary) / 0)",
                        ],
                      }}
                      transition={{ duration: 4.5, ease: "easeOut" }}
                      className="absolute inset-0 rounded-2xl pointer-events-none"
                    />

                    {/* "Confetti" minimalista: 8 sparks dourados spawnados em ângulos */}
                    {[...Array(8)].map((_, idx) => {
                      const angle = (idx / 8) * Math.PI * 2;
                      const dist = 80;
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                          animate={{
                            opacity: [0, 1, 0],
                            scale: [0, 1.4, 0],
                            x: Math.cos(angle) * dist,
                            y: Math.sin(angle) * dist,
                          }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                          className="absolute top-1/2 left-1/2 w-2.5 h-2.5 rounded-full bg-secondary pointer-events-none"
                          style={{ boxShadow: "0 0 8px hsl(var(--secondary))" }}
                        />
                      );
                    })}
                  </>
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
                        a.weeklyGoalPercent >= 80 ? "bg-success" : "bg-primary"
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
