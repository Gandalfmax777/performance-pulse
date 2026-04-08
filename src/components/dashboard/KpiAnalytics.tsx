import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";
import { type Assessor } from "@/data/mockData";
import AssessorProfile from "./AssessorProfile";
import { Filter, TrendingUp, Lightbulb, User, Users, BarChart3 } from "lucide-react";

type Period = "dia" | "semana" | "mes";
type Scope = "geral" | "individual";

const KPI_META = {
  leads: { label: "Leads", target: 10, unit: "" },
  cadencia: { label: "Cadência", target: 70, unit: "%" },
  ligacoes: { label: "Ligações", target: 30, unit: "" },
  reunioes: { label: "Reuniões Ag.", target: 3, unit: "" },
  indicacoes: { label: "Indicações", target: 5, unit: "" },
  boletos: { label: "Boletas", target: 10, unit: "" },
};

type KpiKey = keyof typeof KPI_META;

const generateInsights = (assessors: Assessor[], scope: Scope, selectedId: string | null): string[] => {
  const insights: string[] = [];
  const target = scope === "individual" && selectedId
    ? assessors.filter(a => a.id === selectedId)
    : assessors;

  if (target.length === 0) return ["Selecione um assessor para ver insights."];

  const avgLeads = target.reduce((s, a) => s + a.kpis.leads, 0) / target.length;
  const avgCad = target.reduce((s, a) => s + a.kpis.cadencia, 0) / target.length;
  const avgLig = target.reduce((s, a) => s + a.kpis.ligacoes, 0) / target.length;
  const avgReun = target.reduce((s, a) => s + a.kpis.reunioes, 0) / target.length;
  const avgInd = target.reduce((s, a) => s + a.kpis.indicacoes, 0) / target.length;
  const avgBol = target.reduce((s, a) => s + a.kpis.boletos, 0) / target.length;

  if (avgLeads < 8) insights.push(`📉 Geração de leads está ${Math.round(((10 - avgLeads) / 10) * 100)}% abaixo da meta.`);
  else insights.push(`✅ Leads acima de 80% da meta (${avgLeads.toFixed(0)}/10). Bom ritmo!`);

  if (avgCad < 60) insights.push(`⚠️ Cadência média de ${avgCad.toFixed(0)}% está crítica. Revise o follow-up.`);
  else if (avgCad < 80) insights.push(`🔄 Cadência em ${avgCad.toFixed(0)}%. Intensifique contatos.`);

  if (avgLig < 20) insights.push(`📞 Volume de ligações baixo (${avgLig.toFixed(0)}/30). Sessões extras de prospecção.`);

  if (avgReun < 2) insights.push(`🗓️ Reuniões insuficientes (${avgReun.toFixed(1)}/3). Foco em converter ligações.`);
  else insights.push(`🎯 Meta de reuniões sendo atingida (${avgReun.toFixed(1)}/3).`);

  if (avgInd < 3) insights.push(`🤝 Indicações abaixo do esperado. Fortaleça networking.`);
  if (avgBol < 7) insights.push(`💰 Boletas abaixo da meta (${avgBol.toFixed(0)}/10). Revise pipeline.`);

  if (avgLeads > 0) {
    const convRate = (avgReun / avgLeads) * 100;
    insights.push(`📊 Conversão Leads→Reuniões: ${convRate.toFixed(0)}%. ${convRate < 20 ? "Melhore qualificação." : "Boa taxa!"}`);
  }

  if (scope === "geral" && target.length > 1) {
    const best = target.reduce((prev, curr) => curr.weeklyGoalPercent > prev.weeklyGoalPercent ? curr : prev);
    const worst = target.reduce((prev, curr) => curr.weeklyGoalPercent < prev.weeklyGoalPercent ? curr : prev);
    insights.push(`🏆 Melhor: ${best.name} (${best.weeklyGoalPercent}%). Pior: ${worst.name} (${worst.weeklyGoalPercent}%).`);
  }

  return insights;
};

interface KpiAnalyticsProps {
  assessors: Assessor[];
}

const KpiAnalytics = ({ assessors }: KpiAnalyticsProps) => {
  const [period, setPeriod] = useState<Period>("semana");
  const [scope, setScope] = useState<Scope>("geral");
  const [selectedAssessor, setSelectedAssessor] = useState<string | null>(null);
  const [profileAssessor, setProfileAssessor] = useState<Assessor | null>(null);

  const filteredAssessors = useMemo(() => {
    if (scope === "individual" && selectedAssessor) {
      return assessors.filter(a => a.id === selectedAssessor);
    }
    return assessors;
  }, [scope, selectedAssessor, assessors]);

  const periodMultiplier = period === "dia" ? 0.2 : period === "semana" ? 1 : 4;

  const barData = useMemo(() => {
    return (Object.keys(KPI_META) as KpiKey[]).map(key => {
      const meta = KPI_META[key];
      const avg = filteredAssessors.reduce((s, a) => s + a.kpis[key], 0) / filteredAssessors.length;
      return { name: meta.label, Resultado: Math.round(avg * periodMultiplier), Meta: Math.round(meta.target * periodMultiplier) };
    });
  }, [filteredAssessors, periodMultiplier]);

  const radarData = useMemo(() => {
    return (Object.keys(KPI_META) as KpiKey[]).map(key => {
      const meta = KPI_META[key];
      const avg = filteredAssessors.reduce((s, a) => s + a.kpis[key], 0) / filteredAssessors.length;
      return { kpi: meta.label, score: Math.min(100, Math.round((avg / meta.target) * 100)), fullMark: 100 };
    });
  }, [filteredAssessors]);

  const insights = useMemo(() => generateInsights(assessors, scope, selectedAssessor), [assessors, scope, selectedAssessor]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card-glass rounded-xl p-4">
        <div className="flex items-center flex-wrap gap-3">
          <Filter className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-foreground mr-2">Filtros:</span>

          <div className="flex gap-1 bg-muted/20 rounded-lg p-1">
            {(["dia", "semana", "mes"] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {p === "dia" ? "Dia" : p === "semana" ? "Semana" : "Mês"}
              </button>
            ))}
          </div>

          <div className="flex gap-1 bg-muted/20 rounded-lg p-1">
            <button onClick={() => { setScope("geral"); setSelectedAssessor(null); }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${scope === "geral" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <Users className="w-3 h-3" /> Geral
            </button>
            <button onClick={() => setScope("individual")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${scope === "individual" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <User className="w-3 h-3" /> Individual
            </button>
          </div>

          {scope === "individual" && (
            <select value={selectedAssessor || ""} onChange={e => setSelectedAssessor(e.target.value || null)}
              className="px-3 py-1.5 rounded-md bg-muted/30 border border-border/30 text-sm text-foreground focus:outline-none focus:border-primary/50">
              <option value="">Selecione...</option>
              {assessors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card-glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">KPIs vs Meta – {period === "dia" ? "Dia" : period === "semana" ? "Semana" : "Mês"}</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
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
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
              <Radar name="Score %" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Assessor cards — clickable */}
      <div className="card-glass rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Comparativo de Assessores</h3>
          <span className="text-[10px] text-muted-foreground ml-2">Clique no nome para ver perfil completo</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {filteredAssessors.map(a => {
            const overallPct = a.weeklyGoalPercent;
            return (
              <motion.div key={a.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="p-3 rounded-lg bg-muted/20 border border-border/30 hover:border-primary/30 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${
                    a.level === "gold" ? "text-gold border-gold/30 bg-gold/10" :
                    a.level === "silver" ? "text-silver border-silver/30 bg-silver/10" :
                    "text-bronze border-bronze/30 bg-bronze/10"
                  }`}>{a.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <button onClick={() => setProfileAssessor(a)} className="text-sm font-semibold text-primary hover:underline truncate block text-left">{a.name}</button>
                    <p className="text-xs text-muted-foreground">{a.points} pts</p>
                  </div>
                  <span className={`text-sm font-mono font-bold ${overallPct >= 80 ? "text-primary" : overallPct >= 50 ? "text-chart-orange" : "text-destructive"}`}>{overallPct}%</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  {(Object.keys(KPI_META) as KpiKey[]).map(key => {
                    const meta = KPI_META[key];
                    const val = a.kpis[key];
                    const pct = Math.min(100, Math.round((val / meta.target) * 100));
                    return (
                      <div key={key} className="flex items-center justify-between px-1.5 py-0.5 rounded bg-muted/30">
                        <span className="text-muted-foreground">{meta.label}</span>
                        <span className={`font-mono font-semibold ${pct >= 80 ? "text-primary" : pct >= 50 ? "text-chart-orange" : "text-destructive"}`}>{val}{meta.unit}/{meta.target}{meta.unit}</span>
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
          <span className="ml-auto text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-chart-orange/10 border border-chart-orange/20">IA Analysis</span>
        </div>
        <div className="space-y-2">
          {insights.map((insight, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
              className="p-3 rounded-lg bg-muted/10 border border-border/20 text-sm text-foreground leading-relaxed">
              {insight}
            </motion.div>
          ))}
        </div>
      </div>

      {profileAssessor && <AssessorProfile assessor={profileAssessor} onClose={() => setProfileAssessor(null)} />}
    </div>
  );
};

export default KpiAnalytics;
