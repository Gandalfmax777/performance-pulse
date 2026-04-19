import { useState, useMemo } from "react";
import { motion } from "framer-motion";
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
  Legend,
} from "recharts";
import { format, startOfWeek, endOfWeek, differenceInDays, parseISO, subDays } from "date-fns";
import { type Assessor } from "@/types/assessor";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";
import AssessorProfile from "./AssessorProfile";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { useOverviewReport } from "@/hooks/useReports";
import { useGenerateTeamInsight, type ApiInsight } from "@/hooks/useInsight";
import InsightHistoryPanel from "./InsightHistoryPanel";
import Markdown from "react-markdown";
import { Filter, TrendingUp, Lightbulb, Sparkles, RefreshCw, User, Users, BarChart3, Loader2, Printer, GitCompare, ArrowUp, ArrowDown, Minus } from "lucide-react";

type Scope = "geral" | "individual";

function defaultWeekRange() {
  const now = new Date();
  return {
    from: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    to: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
  };
}

interface KpiAnalyticsProps {
  assessors: Assessor[];
}

const KpiAnalytics = ({ assessors }: KpiAnalyticsProps) => {
  const [range, setRange] = useState(defaultWeekRange);
  const [scope, setScope] = useState<Scope>("geral");
  const [selectedAssessor, setSelectedAssessor] = useState<string | null>(null);
  const [profileAssessor, setProfileAssessor] = useState<Assessor | null>(null);
  // Compara com o mesmo intervalo imediatamente anterior (ex: semana → 7 dias antes)
  const [compareEnabled, setCompareEnabled] = useState(false);

  const { data: overview, isLoading } = useOverviewReport({
    from: range.from,
    to: range.to,
  });

  // Range anterior: shift back pelo comprimento do range atual (+1 pra incluir ambos os extremos)
  const previousRange = useMemo(() => {
    const days = differenceInDays(parseISO(range.to), parseISO(range.from)) + 1;
    return {
      from: format(subDays(parseISO(range.from), days), "yyyy-MM-dd"),
      to: format(subDays(parseISO(range.to), days), "yyyy-MM-dd"),
    };
  }, [range]);

  const { data: previousOverview } = useOverviewReport(previousRange, {
    enabled: compareEnabled,
  });

  const filteredAssessors = useMemo(() => {
    if (scope === "individual" && selectedAssessor) {
      return assessors.filter((a) => a.id === selectedAssessor);
    }
    return assessors;
  }, [scope, selectedAssessor, assessors]);

  // Bar chart: mostra % de cumprimento pra TODOS os KPIs (escala uniforme 0-150).
  // Antes mostrávamos valores absolutos misturados (ligações 0-300 vs cadência 0-100%)
  // que distorcia visualmente o gráfico. % é universal e comparável.
  // Quando compareEnabled=true, adiciona coluna "Anterior" (mesmo intervalo, shift back).
  const barData = useMemo(() => {
    if (!overview) return [];
    const prevByKey = new Map<string, number>();
    if (compareEnabled && previousOverview) {
      for (const pk of previousOverview.byKpi) {
        prevByKey.set(pk.key, Math.round(pk.percent));
      }
    }
    return overview.byKpi.map((k) => ({
      name: k.label,
      Realizado: Math.round(k.percent),
      Meta: 100,
      ...(compareEnabled ? { Anterior: prevByKey.get(k.key) ?? 0 } : {}),
    }));
  }, [overview, previousOverview, compareEnabled]);

  // Delta por KPI: (atual - anterior) / anterior * 100, com proteção pra divisão por zero.
  const deltaByKpiKey = useMemo(() => {
    const map = new Map<string, { delta: number; pct: number | null; prevActual: number }>();
    if (!compareEnabled || !overview || !previousOverview) return map;
    const prevByKey = new Map(previousOverview.byKpi.map((p) => [p.key, p.actual]));
    for (const k of overview.byKpi) {
      const prev = prevByKey.get(k.key) ?? 0;
      const delta = k.actual - prev;
      const pct = prev > 0 ? (delta / prev) * 100 : null; // null = "novo" (antes era zero)
      map.set(k.key, { delta, pct, prevActual: prev });
    }
    return map;
  }, [overview, previousOverview, compareEnabled]);

  const radarData = useMemo(() => {
    if (!overview) return [];
    return overview.byKpi.map((k) => ({
      kpi: k.label,
      score: Math.min(100, Math.round(k.percent)),
      fullMark: 100,
    }));
  }, [overview]);

  // Lookup performer do range selecionado (pra cards consistentes)
  const performerById = useMemo(() => {
    const map = new Map<string, { points: number; weeklyGoalPercent: number }>();
    for (const p of overview?.allPerformers ?? []) {
      map.set(p.assessorId, { points: p.points, weeklyGoalPercent: p.weeklyGoalPercent });
    }
    return map;
  }, [overview]);

  // IA insights pro time via OpenRouter
  const generateTeam = useGenerateTeamInsight();
  const [teamInsight, setTeamInsight] = useState<ApiInsight | null>(null);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card-glass rounded-xl p-4">
        <div className="flex items-center flex-wrap gap-3">
          <Filter className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-foreground mr-2">Filtros:</span>

          <DateRangePicker value={range} onChange={setRange} />

          <div className="flex gap-1 bg-muted/20 rounded-lg p-1">
            <button
              onClick={() => {
                setScope("geral");
                setSelectedAssessor(null);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                scope === "geral"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="w-3 h-3" /> Geral
            </button>
            <button
              onClick={() => setScope("individual")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                scope === "individual"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="w-3 h-3" /> Individual
            </button>
          </div>

          {scope === "individual" && (
            <select
              value={selectedAssessor || ""}
              onChange={(e) => setSelectedAssessor(e.target.value || null)}
              className="px-3 py-1.5 rounded-md bg-muted/30 border border-border/30 text-sm text-foreground focus:outline-none focus:border-primary/50"
            >
              <option value="">Selecione...</option>
              {assessors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          )}

          {/* Toggle compare — shift back pelo mesmo intervalo */}
          <button
            onClick={() => setCompareEnabled((v) => !v)}
            title={`Compara com ${previousRange.from} → ${previousRange.to}`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
              compareEnabled
                ? "bg-primary text-secondary border-primary"
                : "text-muted-foreground bg-muted/20 border-border/30 hover:text-foreground"
            }`}
          >
            <GitCompare className="w-3 h-3" />
            Comparar período anterior
          </button>

          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground ml-auto" />}
        </div>

        {/* Delta cards por KPI — só aparecem quando compareEnabled */}
        {compareEnabled && overview && previousOverview && (
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {overview.byKpi.map((k) => {
              const d = deltaByKpiKey.get(k.key);
              if (!d) return null;
              const pct = d.pct;
              const label = pct === null
                ? "novo"
                : `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`;
              const color =
                pct === null
                  ? "text-muted-foreground"
                  : pct > 1
                  ? "text-success"
                  : pct < -1
                  ? "text-destructive"
                  : "text-muted-foreground";
              const Icon = pct === null ? Minus : pct > 1 ? ArrowUp : pct < -1 ? ArrowDown : Minus;
              return (
                <div
                  key={k.key}
                  className="p-2 rounded-lg bg-muted/20 border border-border/30"
                  title={`Atual: ${k.actual.toFixed(0)} · Anterior: ${d.prevActual.toFixed(0)}`}
                >
                  <div className="text-[10px] text-muted-foreground truncate">{k.label}</div>
                  <div className={`flex items-center gap-1 text-sm font-mono font-bold ${color}`}>
                    <Icon className="w-3 h-3" />
                    {label}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card-glass rounded-xl p-5">
          <div className="flex items-baseline justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">
                Cumprimento de Metas — {range.from} → {range.to}
              </h3>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">% da meta</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                domain={[0, 150]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Realizado" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              {/* Ghost bar: período anterior pra comparação visual lado-a-lado.
                  Cor secondary (laranja âmbar) com opacity baixa pra não competir
                  com a barra principal. */}
              {compareEnabled && (
                <Bar dataKey="Anterior" fill="hsl(var(--secondary))" opacity={0.45} radius={[4, 4, 0, 0]} />
              )}
              <Bar dataKey="Meta" fill="hsl(var(--muted-foreground))" opacity={0.3} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card-glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Radar de Desempenho</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <PolarGrid stroke="hsl(var(--border))" opacity={0.3} />
              <PolarAngleAxis dataKey="kpi" tick={{ fontSize: 13, fill: "hsl(var(--foreground))", fontWeight: 600 }} />
              {/* angle=90 = eixo vertical pra cima; números empilhados, cada
                  um com texto horizontal. */}
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              />
              <Radar
                name="Score %"
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

      {/* Assessor cards */}
      <div className="card-glass rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Comparativo de Assessores</h3>
          <span className="text-[10px] text-muted-foreground ml-2">Clique no nome para ver perfil completo</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredAssessors.map((a) => {
            // Usa dados do RANGE selecionado, não da semana corrente
            const perf = performerById.get(a.id);
            const overallPct = perf?.weeklyGoalPercent ?? 0;
            const points = perf?.points ?? 0;
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 rounded-lg bg-muted/20 border border-border/30 hover:border-primary/30 transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <AssessorAvatar initials={a.avatar} photoUrl={a.photoUrl} level={a.level} size={32} />
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => setProfileAssessor(a)}
                      className="text-sm font-semibold text-primary hover:underline truncate block text-left"
                    >
                      {a.name}
                    </button>
                    <p className="text-xs text-muted-foreground">{points} pts</p>
                  </div>
                  <span
                    className={`text-sm font-mono font-bold ${
                      overallPct >= 80
                        ? "text-primary"
                        : overallPct >= 50
                        ? "text-chart-orange"
                        : "text-destructive"
                    }`}
                  >
                    {overallPct}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  {overview?.byKpi.map((kpi) => {
                    const val = (a.kpis as Record<string, number>)[kpi.key] ?? 0;
                    // Pra unit "%" (cadência, touchpoint), o target é threshold direto
                    // (não dividir por team). Pra absolutos, dividir é razoável.
                    const isPercent = kpi.unit === "%";
                    const perPersonTarget = isPercent
                      ? Math.round(kpi.target)
                      : Math.max(1, Math.round(kpi.target / Math.max(assessors.length, 1)));
                    const pct = Math.min(100, Math.round((val / perPersonTarget) * 100));
                    return (
                      <div
                        key={kpi.key}
                        className="flex items-center justify-between px-1.5 py-0.5 rounded bg-muted/30"
                      >
                        <span className="text-muted-foreground">{kpi.label}</span>
                        <span
                          className={`font-mono font-semibold ${
                            pct >= 80
                              ? "text-primary"
                              : pct >= 50
                              ? "text-chart-orange"
                              : "text-destructive"
                          }`}
                        >
                          {val}
                          {kpi.unit}/{perPersonTarget}
                          {kpi.unit}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* AI Insights do Time */}
      <div className="card-glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Análise IA do Time</h3>
            {teamInsight?.cached && (
              <span className="text-[9px] text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">
                cache
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.open("/relatorio?period=weekly&autoprint=1", "_blank")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground bg-muted/20 border border-border/30 hover:bg-muted/40 transition-all"
              title="Abre relatório dedicado em nova aba e auto-imprime"
            >
              <Printer className="w-3 h-3" />
              PDF
            </button>
            <button
              onClick={() =>
                generateTeam.mutate(
                  { period: "WEEK", force: true },
                  { onSuccess: (data) => setTeamInsight(data) },
                )
              }
              disabled={generateTeam.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all disabled:opacity-50"
            >
              {generateTeam.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              {generateTeam.isPending ? "Analisando…" : "Gerar Análise"}
            </button>
          </div>
        </div>

        {generateTeam.isPending ? (
          <div className="flex items-center gap-3 text-sm text-muted-foreground py-6">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            Gemini Flash analisando desempenho do time…
          </div>
        ) : teamInsight ? (
          <div className="prose prose-sm prose-invert max-w-none text-sm text-foreground/90 leading-relaxed [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-foreground [&_h3]:text-sm [&_h3]:font-semibold [&_ul]:text-xs [&_li]:text-xs [&_p]:text-sm">
            <Markdown>{teamInsight.textMarkdown}</Markdown>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4">
            Clique em "Gerar Análise" pra que a IA analise o desempenho geral do time neste período.
          </p>
        )}

        {generateTeam.isError && (
          <p className="text-xs text-destructive mt-2">
            {generateTeam.error instanceof Error
              ? generateTeam.error.message
              : "Erro ao gerar análise"}
          </p>
        )}
      </div>

      {/* Histórico de análises IA do time — collapsible, default fechado */}
      <InsightHistoryPanel kind="team" periodKind="WEEK" limit={20} />

      {profileAssessor && (
        <AssessorProfile assessor={profileAssessor} onClose={() => setProfileAssessor(null)} />
      )}
    </div>
  );
};

export default KpiAnalytics;
