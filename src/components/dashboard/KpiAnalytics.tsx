import { useState, useMemo } from "react";
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
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, differenceInDays, parseISO, subDays } from "date-fns";
import { type Assessor } from "@/types/assessor";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";
import AssessorProfile from "./AssessorProfile";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { useOverviewReport } from "@/hooks/useReports";
import { useGenerateTeamInsight, type ApiInsight } from "@/hooks/useInsight";
import InsightHistoryPanel from "./InsightHistoryPanel";
import DirectionComplianceTable from "./DirectionComplianceTable";
import Markdown from "react-markdown";
import {
  Funnel,
  TrendUp,
  Sparkle,
  ArrowClockwise,
  User,
  Users,
  ChartBar,
  CircleNotch,
  Printer,
  GitDiff,
  ArrowUp,
  ArrowDown,
  Minus,
} from "@phosphor-icons/react";
import { ChartBar as ChartBarIcon } from "@phosphor-icons/react";
import ConversionFunnel from "./ConversionFunnel";
import KpiStatusOverviewCard from "./KpiStatusOverviewCard";
import KpiDetailGrid from "./KpiDetailGrid";
import { Eyebrow } from "@/components/shared";

type Scope = "geral" | "individual";

function defaultWeekRange() {
  const now = new Date();
  return {
    from: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    to: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
  };
}

/**
 * Atalhos de período pro Felipe pegar rápido: Hoje / Semana / Mês / Semestre.
 * Cada um snap a `range` (from/to) pro intervalo correspondente. Usado ao
 * lado do DateRangePicker — evita o ritual de clicar-selecionar-confirmar
 * 3 vezes quando quer extrair número pra jogar no Sales.
 */
type QuickPeriod = "day" | "week" | "month" | "semester";

function rangeForPeriod(p: QuickPeriod): { from: string; to: string } {
  const now = new Date();
  const fmt = (d: Date) => format(d, "yyyy-MM-dd");
  switch (p) {
    case "day":
      return { from: fmt(now), to: fmt(now) };
    case "week":
      return {
        from: fmt(startOfWeek(now, { weekStartsOn: 1 })),
        to: fmt(endOfWeek(now, { weekStartsOn: 1 })),
      };
    case "month":
      return { from: fmt(startOfMonth(now)), to: fmt(endOfMonth(now)) };
    case "semester": {
      const m = now.getMonth();
      const s = m < 6 ? new Date(now.getFullYear(), 0, 1) : new Date(now.getFullYear(), 6, 1);
      const e = m < 6 ? new Date(now.getFullYear(), 5, 30) : new Date(now.getFullYear(), 11, 31);
      return { from: fmt(s), to: fmt(e) };
    }
  }
}

function matchActivePeriod(range: { from: string; to: string }): QuickPeriod | null {
  for (const p of ["day", "week", "month", "semester"] as const) {
    const r = rangeForPeriod(p);
    if (r.from === range.from && r.to === range.to) return p;
  }
  return null;
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

  // Lookup kpiTotals por assessor do range selecionado — antes os cards usavam
  // `a.kpis` (sempre weekly corrente via useAssessors) o que causava mismatch
  // com % e points (que já vinham do range). Bug #6.
  const kpisByAssessorId = useMemo(() => {
    const map = new Map<string, Record<string, number>>();
    for (const x of overview?.byAssessor ?? []) {
      map.set(x.assessorId, x.kpis);
    }
    return map;
  }, [overview]);

  // IA insights pro time via OpenRouter
  const generateTeam = useGenerateTeamInsight();
  const [teamInsight, setTeamInsight] = useState<ApiInsight | null>(null);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="rounded-[14px] border border-line bg-card p-4">
        <div className="flex items-center flex-wrap gap-3">
          <Funnel size={16} className="text-eqi" />
          <span className="text-sm font-bold text-ink mr-2">Filtros:</span>

          <DateRangePicker value={range} onChange={setRange} />

          {/* Atalhos rápidos — Felipe pede esses períodos o tempo todo
              pra bater números com Sales. Cada botão snap o range atual. */}
          <div className="flex gap-1 bg-muted/20 rounded-lg p-1">
            {([
              { key: "day" as QuickPeriod, label: "Hoje" },
              { key: "week" as QuickPeriod, label: "Semana" },
              { key: "month" as QuickPeriod, label: "Mês" },
              { key: "semester" as QuickPeriod, label: "Semestre" },
            ]).map((p) => {
              const active = matchActivePeriod(range) === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => setRange(rangeForPeriod(p.key))}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    active
                      ? "bg-ink text-white"
                      : "text-ink-3 hover:text-ink"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <div className="flex gap-1 bg-muted/20 rounded-lg p-1">
            <button
              onClick={() => {
                setScope("geral");
                setSelectedAssessor(null);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                scope === "geral"
                  ? "bg-ink text-white"
                  : "text-ink-3 hover:text-ink"
              }`}
            >
              <Users size={12} /> Geral
            </button>
            <button
              onClick={() => setScope("individual")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                scope === "individual"
                  ? "bg-ink text-white"
                  : "text-ink-3 hover:text-ink"
              }`}
            >
              <User size={12} /> Individual
            </button>
          </div>

          {scope === "individual" && (
            <select
              value={selectedAssessor || ""}
              onChange={(e) => setSelectedAssessor(e.target.value || null)}
              className="px-3 py-1.5 rounded-md bg-muted/30 border border-line/30 text-sm text-ink focus:outline-none focus:border-eqi/50"
            >
              <option value="">Selecione...</option>
              {assessors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          )}

          {/* Toggle compare — shift back pelo mesmo intervalo
              Felipe reportou que não entendia o que o botão fazia. Tooltip
              + subtitle abaixo deixam claro: "vs o mesmo intervalo anterior". */}
          <button
            onClick={() => setCompareEnabled((v) => !v)}
            title={
              compareEnabled
                ? `Comparando com ${previousRange.from} → ${previousRange.to}. Clique pra desativar.`
                : `Liga a comparação de evolução: mostra números da semana atual vs mesmo intervalo anterior (${previousRange.from} → ${previousRange.to}) com delta percentual.`
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
              compareEnabled
                ? "bg-ink text-white border-ink"
                : "text-ink-3 bg-muted/20 border-line/30 hover:text-ink"
            }`}
          >
            <GitDiff size={12} />
            {compareEnabled ? "Comparação ativa" : "Comparar com período anterior"}
          </button>

          {isLoading && <CircleNotch size={16} className="animate-spin text-ink-3 ml-auto" />}
        </div>

        {/* Subtitle explicativo — aparece embaixo quando compare está ativo
            pra deixar ÓBVIO o que está sendo comparado (Felipe pediu clareza). */}
        {compareEnabled && (
          <p className="mt-2 text-[11px] text-ink-3 inline-flex items-center gap-1.5 flex-wrap">
            <ChartBarIcon size={12} /> Comparando <span className="font-mono text-ink">{range.from} → {range.to}</span>
            {" vs "}
            <span className="font-mono text-ink">{previousRange.from} → {previousRange.to}</span>
            {" (evolução entre períodos)"}
          </p>
        )}

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
                  ? "text-ink-3"
                  : pct > 1
                  ? "text-success"
                  : pct < -1
                  ? "text-destructive"
                  : "text-ink-3";
              const Icon = pct === null ? Minus : pct > 1 ? ArrowUp : pct < -1 ? ArrowDown : Minus;
              return (
                <div
                  key={k.key}
                  className="p-2 rounded-lg bg-muted/20 border border-line/30"
                  title={`Atual: ${k.actual.toFixed(0)} · Anterior: ${d.prevActual.toFixed(0)}`}
                >
                  <div className="text-[10px] text-ink-3 truncate">{k.label}</div>
                  <div className={`flex items-center gap-1 text-sm font-mono font-bold ${color}`}>
                    <Icon size={12} />
                    {label}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Status geral · 1 linha por KPI com label / progress / actual-target / % */}
      <KpiStatusOverviewCard range={range} />

      {/* Grid 2-col · 1 KpiDetailCard por KPI ativo com badge OK/ATENÇÃO/ABAIXO,
          valor 42px font-display, meta, progress e delta vs período anterior */}
      <KpiDetailGrid range={range} />

      {/* Divisor "Análise consolidada" — separa cards editoriais (acima) das
          tabs/matriz/charts existentes (abaixo). */}
      <div className="flex items-center gap-3 pt-2">
        <Eyebrow>Análise consolidada</Eyebrow>
        <div className="flex-1 h-px bg-line" />
        <span className="text-[11px] text-ink-3">
          {range.from} → {range.to}
        </span>
      </div>

      {/* Funil de conversão Editorial V1 — barras horizontais empilhadas */}
      <ConversionFunnel
        from={range.from}
        to={range.to}
        assessorId={scope === "individual" && selectedAssessor ? selectedAssessor : undefined}
      />

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-[14px] border border-line bg-card p-5">
          <div className="flex items-baseline justify-between mb-4">
            <div className="flex items-center gap-2">
              <ChartBar size={16} className="text-eqi" />
              <h3 className="text-sm font-bold text-ink">
                Cumprimento de Metas — {range.from} → {range.to}
              </h3>
            </div>
            <span className="text-[10px] text-ink-3 font-mono">% da meta</span>
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

        <div className="rounded-[14px] border border-line bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendUp size={16} className="text-eqi" />
            <h3 className="text-sm font-bold text-ink">Radar de Desempenho</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <PolarGrid stroke="hsl(var(--border))" opacity={0.3} />
              <PolarAngleAxis dataKey="kpi" tick={{ fontSize: 13, fill: "hsl(var(--foreground))", fontWeight: 600 }} />
              {/* angle=90 = eixo vertical pra cima; números empilhados, cada
                  um com texto horizontal.
                  domain [0, 110] + ticks explícitos cria 10% de padding acima
                  do 100 pra ele não grudar no label "Leads" do topo. */}
              <PolarRadiusAxis
                angle={90}
                domain={[0, 110]}
                ticks={[0, 25, 50, 75, 100] as never}
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

      {/* Matriz por assessor — tabela compacta Editorial V1 (artboard KPIs).
          Substitui os antigos cards 3-col que ocupavam muita altura por uma
          tabela densa com 1 linha por assessor + colunas por KPI + %meta + var.
          Clicar no nome abre o AssessorProfile modal (mantém o fluxo). */}
      <div className="rounded-[14px] border border-line bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-line">
          <Users size={16} className="text-ink-3" />
          <h3 className="text-sm font-extrabold tracking-tight text-ink">Matriz por assessor</h3>
          <span className="text-[10px] text-ink-3 ml-2">Clique no nome para ver perfil completo</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-line bg-surface-2/30">
                <th className="text-left text-[10px] uppercase tracking-wider font-semibold text-ink-3 px-5 py-2 w-8">#</th>
                <th className="text-left text-[10px] uppercase tracking-wider font-semibold text-ink-3 px-3 py-2">NOME</th>
                {overview?.byKpi.map((kpi) => (
                  <th
                    key={kpi.key}
                    className="text-right text-[10px] uppercase tracking-wider font-semibold text-ink-3 px-3 py-2 whitespace-nowrap"
                  >
                    {kpi.label}
                  </th>
                ))}
                <th className="text-right text-[10px] uppercase tracking-wider font-semibold text-ink-3 px-3 py-2">% META</th>
                {compareEnabled && (
                  <th className="text-right text-[10px] uppercase tracking-wider font-semibold text-ink-3 px-3 py-2">VAR</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredAssessors
                .slice()
                .sort((x, y) => {
                  const ax = performerById.get(x.id)?.weeklyGoalPercent ?? 0;
                  const ay = performerById.get(y.id)?.weeklyGoalPercent ?? 0;
                  return ay - ax;
                })
                .map((a, i) => {
                  const perf = performerById.get(a.id);
                  const overallPct = perf?.weeklyGoalPercent ?? 0;
                  // Variação do assessor: compara overallPct atual vs período anterior
                  // usando previousOverview.allPerformers
                  const prevPerf = previousOverview?.allPerformers.find((p) => p.assessorId === a.id);
                  const varDelta = prevPerf && prevPerf.weeklyGoalPercent > 0
                    ? overallPct - prevPerf.weeklyGoalPercent
                    : null;
                  return (
                    <tr
                      key={a.id}
                      className="border-b border-line last:border-b-0 hover:bg-surface-2/40 transition-colors"
                    >
                      <td className="px-5 py-2 font-mono text-[11px] text-ink-3">
                        {String(i + 1).padStart(2, "0")}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => setProfileAssessor(a)}
                          className="flex items-center gap-2 hover:underline"
                        >
                          <AssessorAvatar
                            initials={a.avatar}
                            photoUrl={a.photoUrl}
                            level={a.level}
                            size={22}
                          />
                          <span className="text-xs font-semibold text-ink whitespace-nowrap">
                            {a.name}
                          </span>
                        </button>
                      </td>
                      {overview?.byKpi.map((kpi) => {
                        const val = kpisByAssessorId.get(a.id)?.[kpi.key] ?? 0;
                        const isPercent = kpi.unit === "%";
                        const perPersonTarget = isPercent
                          ? Math.round(kpi.target)
                          : Math.max(1, Math.round(kpi.target / Math.max(assessors.length, 1)));
                        const cellPct = perPersonTarget > 0 ? (val / perPersonTarget) * 100 : 0;
                        return (
                          <td
                            key={kpi.key}
                            className={`px-3 py-2 text-right font-mono font-semibold whitespace-nowrap ${
                              cellPct >= 80
                                ? "text-eqi-green"
                                : cellPct >= 50
                                ? "text-ink"
                                : "text-destructive"
                            }`}
                          >
                            {Math.round(val)}{kpi.unit}
                          </td>
                        );
                      })}
                      <td
                        className={`px-3 py-2 text-right font-mono font-bold whitespace-nowrap ${
                          overallPct >= 100
                            ? "text-eqi-green"
                            : overallPct >= 70
                            ? "text-ink"
                            : "text-destructive"
                        }`}
                      >
                        {overallPct}%
                      </td>
                      {compareEnabled && (
                        <td
                          className={`px-3 py-2 text-right font-mono font-semibold whitespace-nowrap ${
                            varDelta === null
                              ? "text-ink-3"
                              : varDelta > 0
                              ? "text-eqi-green"
                              : varDelta < 0
                              ? "text-destructive"
                              : "text-ink-3"
                          }`}
                        >
                          {varDelta === null
                            ? "—"
                            : `${varDelta > 0 ? "+" : ""}${Math.round(varDelta)}p.p.`}
                        </td>
                      )}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Insights do Time */}
      <div className="rounded-[14px] border border-line bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkle size={20} className="text-eqi" />
            <h3 className="text-sm font-bold text-ink">Análise IA do Time</h3>
            {teamInsight?.cached && (
              <span className="text-[9px] text-ink-3 bg-muted/30 px-1.5 py-0.5 rounded">
                cache
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.open("/relatorio?period=weekly&autoprint=1", "_blank")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-ink-3 bg-muted/20 border border-line/30 hover:bg-muted/40 transition-all"
              title="Abre relatório dedicado em nova aba e auto-imprime"
            >
              <Printer size={12} />
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-eqi bg-eqi/10 border border-eqi/20 hover:bg-eqi/20 transition-all disabled:opacity-50"
            >
              {generateTeam.isPending ? (
                <CircleNotch size={12} className="animate-spin" />
              ) : (
                <ArrowClockwise size={12} />
              )}
              {generateTeam.isPending ? "Analisando…" : "Gerar Análise"}
            </button>
          </div>
        </div>

        {generateTeam.isPending ? (
          <div className="flex items-center gap-3 text-sm text-ink-3 py-6">
            <CircleNotch size={20} className="animate-spin text-eqi" />
            Gemini Flash analisando desempenho do time…
          </div>
        ) : teamInsight ? (
          <div className="prose prose-sm prose-invert max-w-none text-sm text-ink/90 leading-relaxed [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-ink [&_h3]:text-sm [&_h3]:font-semibold [&_ul]:text-xs [&_li]:text-xs [&_p]:text-sm">
            <Markdown>{teamInsight.textMarkdown}</Markdown>
          </div>
        ) : (
          <p className="text-sm text-ink-3 py-4">
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

      {/* Cumprimento de Foco — directions com KPIs alvo + delta vs baseline */}
      <DirectionComplianceTable limit={10} />

      {/* Histórico de análises IA do time — collapsible, default fechado */}
      <InsightHistoryPanel kind="team" periodKind="WEEK" limit={20} />

      {profileAssessor && (
        <AssessorProfile assessor={profileAssessor} onClose={() => setProfileAssessor(null)} />
      )}
    </div>
  );
};

export default KpiAnalytics;
