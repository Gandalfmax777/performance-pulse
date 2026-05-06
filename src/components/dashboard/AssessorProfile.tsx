import { useMemo, useState } from "react";
import { useModalDismiss } from "@/hooks/useModalDismiss";
import { motion } from "framer-motion";
import { X, Printer, Trophy, TrendingUp, Flame, Award, Loader2, Sparkles, RefreshCw } from "lucide-react";
import Markdown from "react-markdown";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { type Assessor } from "@/types/assessor";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";
import { useAssessorReport } from "@/hooks/useReports";
import { useBadges } from "@/hooks/useBadges";
import { useInsight, useGenerateInsight } from "@/hooks/useInsight";
import InsightHistoryPanel from "./InsightHistoryPanel";
import { usePrizes } from "@/hooks/usePrizes";
import { isMeetingNote, isMeetingAreaNote, stripMeetingPrefix, MEETING_BONUS_POINTS, MEETING_AREA_POINTS } from "@/lib/meetingBonus";

interface AssessorProfileProps {
  assessor: Assessor;
  onClose: () => void;
}

function defaultWeekRange() {
  const now = new Date();
  return {
    from: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    to: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
  };
}

/** Ranges fixos pra card "Resultados por Período" — daily/weekly/monthly */
function buildBreakdownRanges() {
  const now = new Date();
  const fmt = (d: Date) => format(d, "yyyy-MM-dd");
  return {
    day: { from: fmt(now), to: fmt(now) },
    week: {
      from: fmt(startOfWeek(now, { weekStartsOn: 1 })),
      to: fmt(endOfWeek(now, { weekStartsOn: 1 })),
    },
    month: {
      from: fmt(new Date(now.getFullYear(), now.getMonth(), 1)),
      to: fmt(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    },
  };
}

const AssessorProfile = ({ assessor, onClose }: AssessorProfileProps) => {
  const [range, setRange] = useState(defaultWeekRange);
  const { data: report, isLoading } = useAssessorReport(assessor.id, range);

  // Breakdown por período (Hoje/Semana/Mês) pro Felipe pegar rápido números
  // sem precisar trocar o DateRangePicker 3 vezes
  const bRanges = useMemo(buildBreakdownRanges, []);
  const { data: dayReport } = useAssessorReport(assessor.id, bRanges.day);
  const { data: weekReport } = useAssessorReport(assessor.id, bRanges.week);
  const { data: monthReport } = useAssessorReport(assessor.id, bRanges.month);
  const { data: allBadgesData } = useBadges();
  const { data: insightData } = useInsight(assessor.id, "WEEK");
  const generateInsight = useGenerateInsight();
  const { data: prizes } = usePrizes({ assessorId: assessor.id });

  const barData = useMemo(() => {
    if (!report) return [];
    return report.kpis.map((k) => ({
      name: k.label,
      Resultado: k.total,
      Meta: k.target,
    }));
  }, [report]);

  const radarData = useMemo(() => {
    if (!report) return [];
    return report.kpis.map((k) => ({
      kpi: k.label,
      score: Math.min(100, Math.round(k.percentOfTarget)),
      fullMark: 100,
    }));
  }, [report]);

  const overallPct = report?.rollup.weeklyGoalPercent ?? 0;

  // Badges ganhos no período + pendentes (individuais ainda não unlocked)
  const earnedSlugs = new Set((report?.badgeUnlocks ?? []).map((u) => u.slug));
  const individualBadges = (allBadgesData ?? []).filter((b) => b.scope === "INDIVIDUAL");
  const earnedBadges = individualBadges.filter((b) => earnedSlugs.has(b.slug));
  const pendingBadges = individualBadges.filter((b) => !earnedSlugs.has(b.slug));

  const handlePrint = () => {
    // Abre relatório individual dedicado em nova aba e dispara print automático.
    // Página standalone evita problemas de CSS print do dashboard (saía vazio antes).
    window.open(`/relatorio/assessor/${assessor.id}?period=weekly&autoprint=1`, "_blank");
  };

  const { onBackdropClick } = useModalDismiss(onClose);

  const a = assessor;

  return (
    <div
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 flex items-start justify-center bg-background/80 backdrop-blur-sm overflow-y-auto py-8"
    >
      {/* Botão X flutuante fixo no topo da viewport — sempre acessível,
          mesmo quando o user scrolla dentro do modal. */}
      <button
        onClick={onClose}
        aria-label="Fechar"
        title="Fechar (ESC)"
        className="fixed top-4 right-4 z-[60] w-10 h-10 rounded-full bg-card border border-border shadow-lg hover:bg-muted/60 flex items-center justify-center text-foreground transition-all"
      >
        <X className="w-5 h-5" />
      </button>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="printable card-glass rounded-2xl p-6 w-full max-w-4xl mx-4 border border-primary/20"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 no-print">
          <div className="flex items-center gap-3">
            <AssessorAvatar initials={a.avatar} photoUrl={a.photoUrl} level={a.level} size={56} />
            <div>
              <h2 className="text-xl font-bold text-foreground">{a.name}</h2>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-sm text-muted-foreground font-mono">
                  {report?.rollup.points ?? a.points} pts
                </span>
                <span className="text-sm capitalize text-muted-foreground">Nível {a.level}</span>
                {(report?.rollup.streak ?? a.streak) > 0 && (
                  <span className="flex items-center gap-1 text-sm text-chart-orange font-semibold">
                    <Flame className="w-4 h-4" /> {report?.rollup.streak ?? a.streak} dias
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DateRangePicker value={range} onChange={setRange} />
            <button
              onClick={handlePrint}
              title="Abre relatório PDF individual em nova aba e auto-imprime"
              className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/30 text-primary font-semibold text-sm flex items-center gap-2 hover:bg-primary/20 transition-all"
            >
              <Printer className="w-4 h-4" /> PDF
            </button>
            {/* X inline removido — usa o botão floating fixo no canto superior
                da viewport pra não sumir quando user scrolla. */}
          </div>
        </div>

        {/* Print header (só aparece no print, usa classe no-screen via hidden + print:flex) */}
        <div className="hidden print:flex items-center gap-3 mb-6">
          <AssessorAvatar initials={a.avatar} photoUrl={a.photoUrl} level={a.level} size={48} />
          <div>
            <h2 className="text-xl font-bold">{a.name}</h2>
            <p className="text-sm text-gray-600">
              {report?.rollup.points ?? 0} pts • Nível {a.level} • Período {range.from} → {range.to}
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}

        {!isLoading && report && (
          <>
            {/* Overall */}
            <div className="flex items-center gap-4 mb-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <TrendingUp className="w-6 h-6 text-primary" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Desempenho Geral</p>
                <p className="text-2xl font-mono font-bold text-primary">{overallPct}%</p>
              </div>
              <div className="w-32 h-3 bg-muted/40 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${overallPct}%` }}
                />
              </div>
            </div>

            {/* Breakdown por período — resultados rápidos pra registrar no Sales */}
            <div className="grid grid-cols-3 gap-2 mb-6 no-print">
              {([
                { key: "day",   label: "Hoje",    report: dayReport },
                { key: "week",  label: "Semana",  report: weekReport },
                { key: "month", label: "Mês",     report: monthReport },
              ]).map(({ key, label, report: r }) => (
                <div
                  key={key}
                  className="p-3 rounded-xl bg-muted/10 border border-border/20 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
                    <span className={`text-[10px] font-mono ${(r?.rollup.weeklyGoalPercent ?? 0) >= 80 ? "text-success" : (r?.rollup.weeklyGoalPercent ?? 0) >= 50 ? "text-chart-orange" : "text-muted-foreground"}`}>
                      {r?.rollup.weeklyGoalPercent ?? 0}%
                    </span>
                  </div>
                  <p className="text-2xl font-mono font-bold text-foreground leading-none">
                    {r?.rollup.points ?? 0}
                    <span className="text-xs font-normal text-muted-foreground ml-1">pts</span>
                  </p>
                  {/* Mini-tabela dos KPIs do período (compacto) */}
                  <div className="space-y-0.5 pt-1 border-t border-border/20">
                    {(r?.kpis ?? []).slice(0, 4).map((k) => (
                      <div key={k.key} className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground truncate">{k.label}</span>
                        <span className="font-mono font-semibold text-foreground">
                          {k.total.toLocaleString("pt-BR")}{k.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* KPI Details */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {report.kpis.map((k) => {
                const pct = Math.min(100, Math.round(k.percentOfTarget));
                return (
                  <div
                    key={k.key}
                    className="p-3 rounded-xl bg-muted/10 border border-border/20"
                  >
                    <p className="text-xs text-muted-foreground mb-1">{k.label}</p>
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`text-lg font-mono font-bold ${
                          pct >= 80
                            ? "text-primary"
                            : pct >= 50
                            ? "text-chart-orange"
                            : "text-destructive"
                        }`}
                      >
                        {k.total}
                        {k.unit}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        / {k.target}
                        {k.unit}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-muted/30 rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          pct >= 80 ? "bg-success" : "bg-primary"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Print-only: tabela limpa dos KPIs (substitui os charts que renderizam mal em papel) */}
            <div className="hidden print-show mb-6">
              <h3 className="text-sm font-bold mb-2" style={{ color: "#111" }}>Detalhamento por KPI</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #333" }}>
                    <th style={{ textAlign: "left", padding: "6px 8px" }}>KPI</th>
                    <th style={{ textAlign: "right", padding: "6px 8px" }}>Resultado</th>
                    <th style={{ textAlign: "right", padding: "6px 8px" }}>Meta</th>
                    <th style={{ textAlign: "right", padding: "6px 8px" }}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {report.kpis.map((k) => (
                    <tr key={k.key} style={{ borderBottom: "1px solid #ddd" }}>
                      <td style={{ padding: "4px 8px" }}>{k.label}</td>
                      <td style={{ textAlign: "right", padding: "4px 8px", fontFamily: "monospace" }}>{k.total}{k.unit}</td>
                      <td style={{ textAlign: "right", padding: "4px 8px", fontFamily: "monospace" }}>{k.target}{k.unit}</td>
                      <td style={{ textAlign: "right", padding: "4px 8px", fontFamily: "monospace", fontWeight: "bold" }}>{Math.round(k.percentOfTarget)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ fontSize: "10px", color: "#999", marginTop: "8px" }}>
                Gerado em {new Date().toLocaleDateString("pt-BR")} • Performance Pulse
              </p>
            </div>

            {/* Charts (hidden on print — renderizam mal em papel) */}
            <div className="grid grid-cols-2 gap-4 mb-6 print-hide">
              <div className="p-4 rounded-xl bg-muted/10 border border-border/20">
                <h3 className="text-sm font-bold text-foreground mb-3">KPIs vs Meta</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="Resultado" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar
                      dataKey="Meta"
                      fill="hsl(var(--muted-foreground))"
                      opacity={0.3}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="p-4 rounded-xl bg-muted/10 border border-border/20">
                <h3 className="text-sm font-bold text-foreground mb-3">Radar de Desempenho</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={radarData} margin={{ top: 15, right: 25, bottom: 15, left: 25 }}>
                    <PolarGrid stroke="hsl(var(--border))" opacity={0.3} />
                    <PolarAngleAxis dataKey="kpi" tick={{ fontSize: 11, fill: "hsl(var(--foreground))", fontWeight: 600 }} />
                    {/* angle=90 = eixo vertical pra cima;
                        domain 110 cria padding acima do 100 pra não grudar
                        no label "Leads" do topo. */}
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 110]}
                      ticks={[0, 25, 50, 75, 100] as never}
                      tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Radar
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.25}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI Insight */}
            <div className="p-5 rounded-xl bg-muted/10 border border-primary/20 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Insight IA</h3>
                  {insightData?.cached && (
                    <span className="text-[9px] text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">
                      cache
                    </span>
                  )}
                </div>
                <button
                  onClick={() =>
                    generateInsight.mutate({
                      assessorId: assessor.id,
                      period: "WEEK",
                      force: true,
                    })
                  }
                  disabled={generateInsight.isPending}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all disabled:opacity-50"
                >
                  {generateInsight.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  {generateInsight.isPending ? "Gerando…" : "Gerar"}
                </button>
              </div>
              {generateInsight.isPending ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  Analisando desempenho com IA…
                </div>
              ) : insightData ? (
                <div className="prose prose-sm prose-invert max-w-none text-sm text-foreground/90 leading-relaxed [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-foreground [&_h3]:text-sm [&_h3]:font-semibold [&_ul]:text-xs [&_li]:text-xs">
                  <Markdown>{insightData.textMarkdown}</Markdown>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-2">
                  Clique em "Gerar" pra analisar o desempenho deste assessor com IA.
                </p>
              )}
              {generateInsight.isError && (
                <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-xs text-destructive font-semibold mb-1">Não foi possível gerar o insight</p>
                  <p className="text-[11px] text-destructive/80">
                    {generateInsight.error instanceof Error
                      ? generateInsight.error.message
                      : "Erro ao gerar insight"}
                  </p>
                </div>
              )}

              {/* Histórico de análises IA deste assessor — collapsible */}
              <InsightHistoryPanel kind="assessor" assessorId={assessor.id} periodKind="WEEK" limit={20} />
            </div>

            {/* Badges */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-muted/10 border border-border/20">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Conquistas Desbloqueadas</h3>
                </div>
                {earnedBadges.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhuma conquista no período.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {earnedBadges.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20"
                      >
                        <span className="text-lg">{b.icon}</span>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{b.name}</p>
                          <p className="text-[10px] text-muted-foreground">{b.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-4 rounded-xl bg-muted/10 border border-border/20">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-bold text-foreground">Pendentes</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {pendingBadges.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/20 border border-border/20 opacity-50"
                    >
                      <span className="text-lg grayscale">{b.icon}</span>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{b.name}</p>
                        <p className="text-[10px] text-muted-foreground">{b.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Prêmios individuais */}
            {prizes && prizes.length > 0 && (
              <div className="p-4 rounded-xl bg-muted/10 border border-primary/20 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🏅</span>
                  <h3 className="text-sm font-bold text-foreground">Prêmios Recebidos</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {prizes.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 border border-accent/20"
                    >
                      <span className="text-lg">🎁</span>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{p.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {p.period} • por {p.awardedByName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Observações/justificativas */}
            {report.observations && report.observations.length > 0 && (
              <div className="p-4 rounded-xl bg-muted/10 border border-border/20 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">📝</span>
                  <h3 className="text-sm font-bold text-foreground">Observações do Período</h3>
                </div>
                <div className="space-y-2">
                  {report.observations.map((obs, i) => {
                    const meetingVenda = isMeetingNote(obs.notes);
                    const meetingArea = isMeetingAreaNote(obs.notes);
                    const displayText = (meetingVenda || meetingArea) ? stripMeetingPrefix(obs.notes) : obs.notes;
                    return (
                      <div
                        key={i}
                        className={`flex items-start gap-3 p-2.5 rounded-lg border ${
                          meetingVenda
                            ? "bg-success/10 border-success/30"
                            : meetingArea
                            ? "bg-blue-500/10 border-blue-500/30"
                            : "bg-muted/20 border-border/20"
                        }`}
                      >
                        <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap mt-0.5">
                          {obs.date.split("-").reverse().join("/")}
                        </span>
                        <div className="flex-1 min-w-0">
                          {meetingVenda && (
                            <span className="inline-block mb-1 px-1.5 py-0.5 rounded bg-success/20 text-success text-[9px] font-bold">
                              REUNIÃO DE VENDA +{MEETING_BONUS_POINTS} PTS
                            </span>
                          )}
                          {meetingArea && (
                            <span className="inline-block mb-1 px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[9px] font-bold">
                              REUNIÃO C/ ÁREAS +{MEETING_AREA_POINTS} PTS
                            </span>
                          )}
                          <p className="text-xs text-foreground">{displayText}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default AssessorProfile;
