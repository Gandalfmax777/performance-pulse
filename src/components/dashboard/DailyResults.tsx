import { motion } from "framer-motion";
import { Trophy, Medal, TrendingDown, TrendingUp, Flame } from "lucide-react";
import { type Assessor } from "@/types/assessor";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";

const LEVEL_COLORS = {
  gold: "text-gold border-gold/30 bg-gold/10",
  silver: "text-silver border-silver/30 bg-silver/10",
  bronze: "text-bronze border-bronze/30 bg-bronze/10",
};

interface DailyResultsProps {
  assessors: Assessor[];
}

const DailyResults = ({ assessors }: DailyResultsProps) => {
  const getScore = (a: Assessor) => {
    const leadsPct = Math.min(100, (a.kpis.leads / 10) * 100);
    const cadPct = Math.min(100, (a.kpis.cadencia / 70) * 100);
    const ligPct = Math.min(100, (a.kpis.ligacoes / 30) * 100);
    const reuPct = Math.min(100, (a.kpis.reunioes / 3) * 100);
    const indPct = Math.min(100, (a.kpis.indicacoes / 5) * 100);
    const bolPct = Math.min(100, (a.kpis.boletos / 10) * 100);
    return Math.round((leadsPct + cadPct + ligPct + reuPct + indPct + bolPct) / 6);
  };

  const sorted = [...assessors].sort((a, b) => getScore(b) - getScore(a));
  const top3 = sorted.slice(0, 3);
  const bottom3 = sorted.slice(-3).reverse();

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
      <div className="card-glass rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Trophy className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-display font-bold text-foreground">Pódio do Dia</h2>
        </div>
        <div className="flex items-end justify-center gap-4 pt-8 pb-4">
          {podiumOrder.map((a, i) => {
            if (!a) return null;
            const score = getScore(a);
            return (
              <motion.div key={a.id} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15, duration: 0.5 }} className="flex flex-col items-center">
                <AssessorAvatar initials={a.avatar} photoUrl={a.photoUrl} level={a.level} size={56} className="mb-2" />
                <p className="text-sm font-semibold text-foreground mb-1">{a.name}</p>
                <div className="flex items-center gap-1 mb-2">
                  <TrendingUp className="w-3 h-3 text-primary" />
                  <span className="text-sm font-mono font-bold text-primary">{score}%</span>
                </div>
                {a.streak > 0 && (
                  <span className="flex items-center gap-0.5 text-xs text-chart-orange mb-2">
                    <Flame className="w-3 h-3" /> {a.streak} dias
                  </span>
                )}
                <motion.div initial={{ height: 0 }} animate={{ height: podiumHeights[i] }} transition={{ delay: 0.3 + i * 0.15, duration: 0.6 }}
                  className={`w-28 rounded-t-xl bg-gradient-to-t border border-b-0 flex flex-col items-center justify-start pt-4 ${podiumColors[i]}`}>
                  <span className={`text-3xl font-display font-black ${podiumTextColors[i]}`}>{podiumLabels[i]}</span>
                  <span className="text-xs text-muted-foreground mt-1 font-mono">{a.points} pts</span>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card-glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Medal className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Top 3 – Detalhes</h3>
          </div>
          <div className="space-y-3">
            {top3.map((a, i) => {
              const score = getScore(a);
              return (
                <motion.div key={a.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  className="p-3 rounded-lg bg-muted/20 border border-border/30">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                    <AssessorAvatar initials={a.avatar} photoUrl={a.photoUrl} level={a.level} size={36} />
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-foreground">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.points} pontos • Nível {a.level}</p>
                    </div>
                    <span className="text-lg font-mono font-bold text-primary">{score}%</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-muted/30 rounded p-1.5 text-center">
                      <p className="text-muted-foreground">Leads</p>
                      <p className="font-mono font-semibold text-foreground">{a.kpis.leads}/10</p>
                    </div>
                    <div className="bg-muted/30 rounded p-1.5 text-center">
                      <p className="text-muted-foreground">Ligações</p>
                      <p className="font-mono font-semibold text-foreground">{a.kpis.ligacoes}/30</p>
                    </div>
                    <div className="bg-muted/30 rounded p-1.5 text-center">
                      <p className="text-muted-foreground">Reuniões</p>
                      <p className="font-mono font-semibold text-foreground">{a.kpis.reunioes}/3</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="card-glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-4 h-4 text-destructive" />
            <h3 className="text-sm font-bold text-foreground">3 Piores Resultados</h3>
          </div>
          <div className="space-y-3">
            {bottom3.map((a, i) => {
              const score = getScore(a);
              const rank = sorted.length - i;
              return (
                <motion.div key={a.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-7 h-7 rounded-full bg-destructive/10 flex items-center justify-center text-xs font-mono font-bold text-destructive">#{rank}</span>
                    <AssessorAvatar initials={a.avatar} photoUrl={a.photoUrl} level={a.level} size={36} />
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-foreground">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.points} pontos</p>
                    </div>
                    <span className="text-lg font-mono font-bold text-destructive">{score}%</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {a.kpis.leads < 8 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">⚠ Leads baixo</span>}
                    {a.kpis.cadencia < 60 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">⚠ Cadência fraca</span>}
                    {a.kpis.ligacoes < 20 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">⚠ Poucas ligações</span>}
                    {a.kpis.reunioes < 3 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">⚠ Reuniões abaixo</span>}
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
