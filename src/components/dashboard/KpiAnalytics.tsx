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
import { format, startOfWeek, endOfWeek } from "date-fns";
import { type Assessor } from "@/types/assessor";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";
import AssessorProfile from "./AssessorProfile";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { useOverviewReport } from "@/hooks/useReports";
import { Filter, TrendingUp, Lightbulb, User, Users, BarChart3, Loader2 } from "lucide-react";

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

  const { data: overview, isLoading } = useOverviewReport({
    from: range.from,
    to: range.to,
  });

  const filteredAssessors = useMemo(() => {
    if (scope === "individual" && selectedAssessor) {
      return assessors.filter((a) => a.id === selectedAssessor);
    }
    return assessors;
  }, [scope, selectedAssessor, assessors]);

  // Bar chart data vem direto do overview (byKpi). Quando scope=individual,
  // escalamos dividindo pelo teamSize (backend retorna target do time inteiro).
  const barData = useMemo(() => {
    if (!overview) return [];
    const teamSize = Math.max(assessors.length, 1);
    const divisor = scope === "individual" ? teamSize : 1;
    return overview.byKpi.map((k) => ({
      name: k.label,
      Resultado: Math.round(k.actual / divisor),
      Meta: Math.round(k.target / divisor),
    }));
  }, [overview, scope, assessors.length]);

  const radarData = useMemo(() => {
    if (!overview) return [];
    return overview.byKpi.map((k) => ({
      kpi: k.label,
      score: Math.min(100, Math.round(k.percent)),
      fullMark: 100,
    }));
  }, [overview]);

  // Insights simples baseados no overview.byKpi (fórmulas locais, Fase 9 troca por IA real).
  const insights = useMemo(() => {
    if (!overview) return [];
    const out: string[] = [];
    for (const k of overview.byKpi) {
      if (k.percent < 30) out.push(`⚠️ ${k.label} em ${k.percent.toFixed(0)}% da meta — crítico.`);
      else if (k.percent < 60) out.push(`🔄 ${k.label} em ${k.percent.toFixed(0)}% — abaixo do ideal.`);
      else if (k.percent >= 100) out.push(`🚀 ${k.label} acima de 100% — meta batida!`);
      else out.push(`✅ ${k.label} em ${k.percent.toFixed(0)}% — bom ritmo.`);
    }
    if (overview.topPerformers.length > 0 && overview.bottomPerformers.length > 0) {
      const top = overview.topPerformers[0];
      const bot = overview.bottomPerformers[0];
      if (top.assessorId !== bot.assessorId) {
        out.push(`🏆 Melhor: ${top.name} (${top.points} pts). Pior: ${bot.name} (${bot.points} pts).`);
      }
    }
    return out;
  }, [overview]);

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

          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground ml-auto" />}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card-glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              KPIs vs Meta — {range.from} → {range.to}
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Resultado" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
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
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(var(--border))" opacity={0.3} />
              <PolarAngleAxis dataKey="kpi" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
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
        <div className="grid grid-cols-3 gap-3">
          {filteredAssessors.map((a) => {
            const overallPct = a.weeklyGoalPercent;
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
                    <p className="text-xs text-muted-foreground">{a.points} pts</p>
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
                    const perPersonTarget = Math.max(
                      1,
                      Math.round(kpi.target / Math.max(assessors.length, 1)),
                    );
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

      {/* Insights */}
      <div className="card-glass rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-chart-orange" />
          <h3 className="text-sm font-bold text-foreground">Insights Automatizados</h3>
          <span className="ml-auto text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-chart-orange/10 border border-chart-orange/20">
            Local (Fase 9 → IA)
          </span>
        </div>
        <div className="space-y-2">
          {insights.map((insight, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="p-3 rounded-lg bg-muted/10 border border-border/20 text-sm text-foreground leading-relaxed"
            >
              {insight}
            </motion.div>
          ))}
        </div>
      </div>

      {profileAssessor && (
        <AssessorProfile assessor={profileAssessor} onClose={() => setProfileAssessor(null)} />
      )}
    </div>
  );
};

export default KpiAnalytics;
