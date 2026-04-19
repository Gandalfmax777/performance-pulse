import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { X, CheckCircle2, XCircle, TrendingUp } from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { type Assessor } from "@/types/assessor";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";
import { useActivities } from "@/hooks/useActivities";
import { useBadges, useBadgeUnlocks } from "@/hooks/useBadges";
import { useMetrics } from "@/hooks/useMetrics";
import { isSalesforceCheck } from "@/lib/meetingBonus";

const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex"];

interface Props {
  assessors: Assessor[];
}

const WeeklyHeatmap = ({ assessors }: Props) => {
  const [showDetail, setShowDetail] = useState(false);

  // ESC fecha o modal de detalhe — padrão UX
  useEffect(() => {
    if (!showDetail) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowDetail(false);
        setSelectedAssessor(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showDetail]);
  const [selectedAssessor, setSelectedAssessor] = useState<Assessor | null>(null);

  // Preview: 3 primeiras atividades ativas hoje (backend resolve biweekly)
  const { data: todayActivities } = useActivities();
  const nextActivities = (todayActivities ?? []).slice(0, 3);

  // Badges definitions + unlocks do time pra mostrar na fila do modal
  const { data: allBadges } = useBadges();
  const { data: allUnlocks } = useBadgeUnlocks();

  // Salesforce check: set de "(assessorId, dayIndex 0-4)" com [SALESFORCE_OK]
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const { data: weekMetrics } = useMetrics({
    from: format(weekStart, "yyyy-MM-dd"),
    to: format(weekEnd, "yyyy-MM-dd"),
  });
  const sfChecks = useMemo(() => {
    const set = new Set<string>();
    for (const m of weekMetrics ?? []) {
      if (!isSalesforceCheck(m.notes)) continue;
      const date = new Date(`${m.date}T00:00:00.000Z`);
      const dow = date.getUTCDay(); // 0=dom..6=sab
      if (dow >= 1 && dow <= 5) set.add(`${m.assessorId}|${dow - 1}`);
    }
    return set;
  }, [weekMetrics]);

  const consistencyScore = (a: Assessor) => {
    const done = a.dailyActivity.filter(Boolean).length;
    return Math.round((done / a.dailyActivity.length) * 100);
  };

  function getEarnedForAssessor(assessorId: string) {
    const slugs = new Set(
      (allUnlocks ?? [])
        .filter((u) => u.assessorId === assessorId)
        .map((u) => u.badgeSlug),
    );
    return (allBadges ?? []).filter((b) => b.scope === "INDIVIDUAL" && slugs.has(b.slug));
  }

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
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">
                {d}
              </div>
            ))}

            {assessors.slice(0, 5).map((a, ai) => (
              <div key={a.id} className="contents">
                <div className="text-xs text-foreground font-medium flex items-center truncate pr-2">
                  {a.name.split(" ")[0]}
                </div>
                {a.dailyActivity.map((done, di) => {
                  const sfOk = sfChecks.has(`${a.id}|${di}`);
                  return (
                    <motion.div
                      key={`${a.id}-${di}`}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: ai * 0.05 + di * 0.03 }}
                      className={`relative h-8 rounded-md flex items-center justify-center text-xs font-mono ${
                        done
                          ? "bg-success/30 text-success border border-success/20"
                          : di < new Date().getDay() - 1
                          ? "bg-destructive/20 text-destructive/60 border border-destructive/10"
                          : "bg-muted/30 text-muted-foreground/40 border border-border/20"
                      }`}
                      title={sfOk ? "Salesforce confirmado" : undefined}
                    >
                      {done ? "✓" : di < new Date().getDay() - 1 ? "✗" : "—"}
                      {sfOk && (
                        <span
                          className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-3 h-3 rounded-full bg-blue-500 text-[7px] flex items-center justify-center text-white font-bold border border-background"
                          title="Salesforce OK"
                        >
                          SF
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border/30">
          <h3 className="text-xs font-semibold text-muted-foreground mb-2">Próximas Atividades</h3>
          <div className="space-y-1.5">
            {nextActivities.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhuma atividade hoje.</p>
            )}
            {nextActivities.map((s) => (
              <div key={s.id} className="flex items-center gap-2 text-xs">
                <span className="w-14 font-mono text-primary">
                  {s.startTime}
                </span>
                <span className="text-foreground font-medium truncate">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetail && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => {
            setShowDetail(false);
            setSelectedAssessor(null);
          }}
        >
          <div
            className="card-glass rounded-2xl p-6 w-full max-w-4xl max-h-[85vh] overflow-y-auto animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-foreground">📊 Consistência dos Assessores</h2>
              <button
                onClick={() => {
                  setShowDetail(false);
                  setSelectedAssessor(null);
                }}
                className="p-2 rounded-lg bg-muted/30 hover:bg-muted/50 text-foreground transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Full heatmap */}
            <div className="overflow-x-auto mb-6">
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `160px repeat(${DAYS.length}, 1fr) 80px` }}
              >
                <div className="text-xs font-semibold text-muted-foreground flex items-center">
                  Assessor
                </div>
                {DAYS.map((d) => (
                  <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">
                    {d}
                  </div>
                ))}
                <div className="text-center text-xs font-semibold text-muted-foreground flex items-center justify-center">
                  Score
                </div>

                {assessors.map((a, ai) => {
                  const score = consistencyScore(a);
                  const isSelected = selectedAssessor?.id === a.id;
                  const earned = getEarnedForAssessor(a.id);
                  return (
                    <div
                      key={a.id}
                      className="contents cursor-pointer"
                      onClick={() => setSelectedAssessor(isSelected ? null : a)}
                    >
                      <div
                        className={`text-sm font-medium flex items-center gap-2 px-2 py-2 rounded-lg transition-all ${
                          isSelected ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/20"
                        }`}
                      >
                        <AssessorAvatar initials={a.avatar} photoUrl={a.photoUrl} level={a.level} size={28} />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold truncate block">{a.name}</span>
                          {earned.length > 0 && (
                            <div className="flex gap-0.5 mt-0.5">
                              {earned.map((b) => (
                                <span key={b.id} className="text-[10px]" title={b.name}>
                                  {b.icon}
                                </span>
                              ))}
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
                          {done ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : di < new Date().getDay() - 1 ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            "—"
                          )}
                        </motion.div>
                      ))}
                      <div
                        className={`flex items-center justify-center rounded-lg text-sm font-bold font-mono ${
                          score >= 80 ? "text-success" : score >= 50 ? "text-chart-orange" : "text-destructive"
                        }`}
                      >
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
                    <p
                      className={`text-xl font-bold font-mono ${
                        consistencyScore(selectedAssessor) >= 80 ? "text-success" : "text-chart-orange"
                      }`}
                    >
                      {consistencyScore(selectedAssessor)}%
                    </p>
                  </div>
                  <div className="bg-muted/20 rounded-xl p-3 border border-border/20 text-center">
                    <p className="text-[10px] text-muted-foreground">Dias Ativos</p>
                    <p className="text-xl font-bold font-mono text-foreground">
                      {selectedAssessor.dailyActivity.filter(Boolean).length}/
                      {selectedAssessor.dailyActivity.length}
                    </p>
                  </div>
                  <div className="bg-muted/20 rounded-xl p-3 border border-border/20 text-center">
                    <p className="text-[10px] text-muted-foreground">Streak</p>
                    <p className="text-xl font-bold font-mono text-chart-orange">
                      🔥 {selectedAssessor.streak}
                    </p>
                  </div>
                  <div className="bg-muted/20 rounded-xl p-3 border border-border/20 text-center">
                    <p className="text-[10px] text-muted-foreground">Meta Semanal</p>
                    <p className="text-xl font-bold font-mono text-primary">
                      {selectedAssessor.weeklyGoalPercent}%
                    </p>
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
                  ].map((k) => (
                    <div key={k.label} className="bg-muted/15 rounded-lg p-2 text-center">
                      <p className="text-[9px] text-muted-foreground">{k.label}</p>
                      <p className="text-sm font-bold font-mono text-foreground">{k.value}</p>
                    </div>
                  ))}
                </div>
                {/* Badges earned pela pessoa selecionada */}
                {(() => {
                  const earned = getEarnedForAssessor(selectedAssessor.id);
                  if (earned.length === 0) return null;
                  return (
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <span className="text-xs text-muted-foreground">Conquistas:</span>
                      {earned.map((b) => (
                        <span
                          key={b.id}
                          className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-lg border border-primary/20"
                        >
                          {b.icon} {b.name}
                        </span>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default WeeklyHeatmap;
