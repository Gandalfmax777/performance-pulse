import { useState } from "react";
import { motion } from "framer-motion";
import { ASSESSORS, SCHEDULE, BADGES, type Assessor } from "@/data/mockData";
import { X, CheckCircle2, XCircle, TrendingUp } from "lucide-react";

const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex"];

interface Props {
  assessors?: Assessor[];
}

const WeeklyHeatmap = ({ assessors }: Props) => {
  const [showDetail, setShowDetail] = useState(false);
  const [selectedAssessor, setSelectedAssessor] = useState<Assessor | null>(null);

  const list = assessors || ASSESSORS;

  const handleCellClick = (a: Assessor) => {
    setSelectedAssessor(a);
    setShowDetail(true);
  };

  const consistencyScore = (a: Assessor) => {
    const done = a.dailyActivity.filter(Boolean).length;
    return Math.round((done / a.dailyActivity.length) * 100);
  };

  return (
    <>
      <div
        className="card-glass rounded-xl p-5 cursor-pointer hover:border-primary/30 transition-all border border-transparent"
        onClick={() => setShowDetail(true)}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-foreground">Heatmap Semanal</h2>
          <span className="text-[10px] text-primary font-semibold">Clique para detalhes →</span>
        </div>

        <div className="overflow-x-auto">
          <div className="grid gap-1.5" style={{ gridTemplateColumns: `100px repeat(${DAYS.length}, 1fr)` }}>
            <div />
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
            ))}

            {list.slice(0, 5).map((a, ai) => (
              <div key={a.id} className="contents">
                <div className="text-xs text-foreground font-medium flex items-center truncate pr-2">
                  {a.name.split(" ")[0]}
                </div>
                {a.dailyActivity.map((done, di) => (
                  <motion.div
                    key={`${a.id}-${di}`}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: ai * 0.05 + di * 0.03 }}
                    className={`h-8 rounded-md flex items-center justify-center text-xs font-mono ${
                      done
                        ? "bg-success/30 text-success border border-success/20"
                        : di < new Date().getDay() - 1
                          ? "bg-destructive/20 text-destructive/60 border border-destructive/10"
                          : "bg-muted/30 text-muted-foreground/40 border border-border/20"
                    }`}
                  >
                    {done ? "✓" : di < new Date().getDay() - 1 ? "✗" : "—"}
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border/30">
          <h3 className="text-xs font-semibold text-muted-foreground mb-2">Próximas Atividades</h3>
          <div className="space-y-1.5">
            {SCHEDULE.slice(0, 3).map(s => (
              <div key={s.id} className="flex items-center gap-2 text-xs">
                <span className="w-14 font-mono text-primary">{s.day.slice(0, 3)}</span>
                <span className="text-muted-foreground">{s.time}</span>
                <span className="text-foreground font-medium truncate">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => { setShowDetail(false); setSelectedAssessor(null); }}>
          <div className="card-glass rounded-2xl p-6 w-full max-w-4xl max-h-[85vh] overflow-y-auto animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-foreground">📊 Consistência dos Assessores</h2>
              <button onClick={() => { setShowDetail(false); setSelectedAssessor(null); }} className="p-2 rounded-lg bg-muted/30 hover:bg-muted/50 text-foreground transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Full heatmap */}
            <div className="overflow-x-auto mb-6">
              <div className="grid gap-2" style={{ gridTemplateColumns: `160px repeat(${DAYS.length}, 1fr) 80px` }}>
                <div className="text-xs font-semibold text-muted-foreground flex items-center">Assessor</div>
                {DAYS.map(d => (
                  <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
                ))}
                <div className="text-center text-xs font-semibold text-muted-foreground flex items-center justify-center">Score</div>

                {list.map((a, ai) => {
                  const score = consistencyScore(a);
                  const isSelected = selectedAssessor?.id === a.id;
                  const earned = BADGES.filter(b => b.check(a));
                  return (
                    <div key={a.id} className={`contents cursor-pointer`} onClick={() => setSelectedAssessor(isSelected ? null : a)}>
                      <div className={`text-sm font-medium flex items-center gap-2 px-2 py-2 rounded-lg transition-all ${isSelected ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/20"}`}>
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">{a.avatar}</div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold truncate block">{a.name}</span>
                          {earned.length > 0 && (
                            <div className="flex gap-0.5 mt-0.5">
                              {earned.map(b => <span key={b.id} className="text-[10px]" title={b.name}>{b.icon}</span>)}
                            </div>
                          )}
                        </div>
                      </div>
                      {a.dailyActivity.map((done, di) => (
                        <motion.div
                          key={`${a.id}-${di}`}
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: ai * 0.03 + di * 0.02 }}
                          className={`h-10 rounded-lg flex items-center justify-center text-sm font-mono transition-all ${
                            done
                              ? "bg-success/25 text-success border border-success/20"
                              : di < new Date().getDay() - 1
                                ? "bg-destructive/15 text-destructive/70 border border-destructive/10"
                                : "bg-muted/20 text-muted-foreground/40 border border-border/20"
                          } ${isSelected ? "ring-1 ring-primary/30" : ""}`}
                        >
                          {done ? <CheckCircle2 className="w-4 h-4" /> : di < new Date().getDay() - 1 ? <XCircle className="w-4 h-4" /> : "—"}
                        </motion.div>
                      ))}
                      <div className={`flex items-center justify-center rounded-lg text-sm font-bold font-mono ${
                        score >= 80 ? "text-success" : score >= 50 ? "text-chart-orange" : "text-destructive"
                      }`}>
                        {score}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected assessor detail */}
            {selectedAssessor && (
              <div className="border-t border-border/30 pt-5 animate-fade-in">
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Detalhes: {selectedAssessor.name}
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-muted/20 rounded-xl p-3 border border-border/20 text-center">
                    <p className="text-[10px] text-muted-foreground">Consistência</p>
                    <p className={`text-xl font-bold font-mono ${consistencyScore(selectedAssessor) >= 80 ? "text-success" : "text-chart-orange"}`}>{consistencyScore(selectedAssessor)}%</p>
                  </div>
                  <div className="bg-muted/20 rounded-xl p-3 border border-border/20 text-center">
                    <p className="text-[10px] text-muted-foreground">Dias Ativos</p>
                    <p className="text-xl font-bold font-mono text-foreground">{selectedAssessor.dailyActivity.filter(Boolean).length}/{selectedAssessor.dailyActivity.length}</p>
                  </div>
                  <div className="bg-muted/20 rounded-xl p-3 border border-border/20 text-center">
                    <p className="text-[10px] text-muted-foreground">Streak</p>
                    <p className="text-xl font-bold font-mono text-chart-orange">🔥 {selectedAssessor.streak}</p>
                  </div>
                  <div className="bg-muted/20 rounded-xl p-3 border border-border/20 text-center">
                    <p className="text-[10px] text-muted-foreground">Meta Semanal</p>
                    <p className="text-xl font-bold font-mono text-primary">{selectedAssessor.weeklyGoalPercent}%</p>
                  </div>
                </div>
                <div className="grid grid-cols-6 gap-2 mt-3">
                  {[
                    { label: "Leads", value: selectedAssessor.kpis.leads },
                    { label: "Cadência", value: `${selectedAssessor.kpis.cadencia}%` },
                    { label: "Ligações", value: selectedAssessor.kpis.ligacoes },
                    { label: "Reuniões", value: selectedAssessor.kpis.reunioes },
                    { label: "Indicações", value: selectedAssessor.kpis.indicacoes },
                    { label: "Boletos", value: selectedAssessor.kpis.boletos },
                  ].map(k => (
                    <div key={k.label} className="bg-muted/15 rounded-lg p-2 text-center">
                      <p className="text-[9px] text-muted-foreground">{k.label}</p>
                      <p className="text-sm font-bold font-mono text-foreground">{k.value}</p>
                    </div>
                  ))}
                </div>
                {/* Badges */}
                {BADGES.filter(b => b.check(selectedAssessor)).length > 0 && (
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs text-muted-foreground">Conquistas:</span>
                    {BADGES.filter(b => b.check(selectedAssessor)).map(b => (
                      <span key={b.id} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-lg border border-primary/20">{b.icon} {b.name}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default WeeklyHeatmap;