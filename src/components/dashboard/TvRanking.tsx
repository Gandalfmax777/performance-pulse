import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Flame, TrendingUp, TrendingDown } from "lucide-react";
import { type Assessor } from "@/types/assessor";

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

function getRandomPhrase(): string {
  return PROVOCATION_PHRASES[Math.floor(Math.random() * PROVOCATION_PHRASES.length)];
}

const LEVEL_COLORS = {
  gold: "text-gold border-gold/40 bg-gold/10",
  silver: "text-silver border-silver/40 bg-silver/10",
  bronze: "text-bronze border-bronze/40 bg-bronze/10",
};

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
  const sorted = [...assessors].sort((a, b) => b.points - a.points);
  const prevPositions = useRef<Map<string, number>>(new Map());
  const [alerts, setAlerts] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const newAlerts = new Map<string, string>();

    sorted.forEach((a, i) => {
      const prevPos = prevPositions.current.get(a.id);
      if (prevPos !== undefined && i > prevPos) {
        // Caiu de posição → provocação
        newAlerts.set(a.id, getRandomPhrase());
      }
    });

    if (newAlerts.size > 0) {
      setAlerts(newAlerts);
      // Limpa alerts após 4s
      const timer = setTimeout(() => setAlerts(new Map()), 4000);
      return () => clearTimeout(timer);
    }

    // Atualiza posições pro próximo render
    const map = new Map<string, number>();
    sorted.forEach((a, i) => map.set(a.id, i));
    prevPositions.current = map;
  }, [sorted]);

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {sorted.map((a, i) => {
          const alert = alerts.get(a.id);
          const isShaking = Boolean(alert);

          return (
            <motion.div
              key={a.id}
              layoutId={`tv-rank-${a.id}`}
              initial={{ opacity: 0, x: -40 }}
              animate={{
                opacity: 1,
                x: isShaking ? [0, -8, 8, -6, 6, -3, 3, 0] : 0,
              }}
              exit={{ opacity: 0, x: 40 }}
              transition={{
                layout: { type: "spring", damping: 25, stiffness: 200 },
                x: isShaking
                  ? { duration: 0.5, times: [0, 0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 1] }
                  : { duration: 0.3 },
              }}
              className={`relative p-5 rounded-2xl border-2 transition-colors ${
                i === 0
                  ? "border-primary/50 bg-primary/10 glow-primary"
                  : i === 1
                  ? "border-silver/40 bg-silver/5"
                  : i === 2
                  ? "border-bronze/40 bg-bronze/5"
                  : "border-border/30 bg-muted/10"
              }`}
            >
              {/* Alert overlay */}
              <AnimatePresence>
                {alert && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -10 }}
                    className="absolute -top-3 right-4 z-10 px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-bold shadow-lg"
                  >
                    <TrendingDown className="w-3 h-3 inline mr-1" />
                    {alert}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-4">
                {/* Posição */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-black text-lg ${
                    i === 0
                      ? "bg-primary/20 text-primary"
                      : i === 1
                      ? "bg-silver/15 text-silver"
                      : i === 2
                      ? "bg-bronze/15 text-bronze"
                      : "bg-muted/30 text-muted-foreground"
                  }`}
                >
                  {i === 0 ? <Crown className="w-6 h-6" /> : `#${i + 1}`}
                </div>

                {/* Avatar */}
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg border-2 ${LEVEL_COLORS[a.level]}`}
                >
                  {a.avatar}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-lg text-foreground truncate">{a.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-muted-foreground font-mono">
                      {a.points.toLocaleString()} pts
                    </span>
                    {a.streak > 0 && (
                      <span className="flex items-center gap-1 text-sm text-chart-orange font-semibold">
                        <Flame className="w-4 h-4" /> {a.streak}
                      </span>
                    )}
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div
                    className={`flex items-center gap-1.5 text-xl font-mono font-black ${
                      a.weeklyGoalPercent >= 80
                        ? "text-primary"
                        : a.weeklyGoalPercent >= 50
                        ? "text-chart-orange"
                        : "text-destructive"
                    }`}
                  >
                    <TrendingUp className="w-5 h-5" />
                    {a.weeklyGoalPercent}%
                  </div>
                  <div className="w-28 h-3 bg-muted/40 rounded-full mt-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${a.weeklyGoalPercent}%` }}
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
