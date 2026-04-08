import { motion } from "framer-motion";
import { X, Printer, Trophy, TrendingUp, Flame, Award } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { BADGES, type Assessor } from "@/data/mockData";
import { useRef } from "react";

interface AssessorProfileProps {
  assessor: Assessor;
  onClose: () => void;
}

const KPI_META = {
  leads: { label: "Leads", target: 10, unit: "" },
  cadencia: { label: "Cadência", target: 70, unit: "%" },
  ligacoes: { label: "Ligações", target: 30, unit: "" },
  reunioes: { label: "Reuniões Ag.", target: 3, unit: "" },
  indicacoes: { label: "Indicações", target: 5, unit: "" },
  boletos: { label: "Boletas", target: 10, unit: "" },
};

type KpiKey = keyof typeof KPI_META;

const AssessorProfile = ({ assessor, onClose }: AssessorProfileProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  const a = assessor;

  const earnedBadges = BADGES.filter(b => b.check(a));
  const pendingBadges = BADGES.filter(b => !b.check(a));

  const barData = (Object.keys(KPI_META) as KpiKey[]).map(key => ({
    name: KPI_META[key].label,
    Resultado: a.kpis[key],
    Meta: KPI_META[key].target,
  }));

  const radarData = (Object.keys(KPI_META) as KpiKey[]).map(key => ({
    kpi: KPI_META[key].label,
    score: Math.min(100, Math.round((a.kpis[key] / KPI_META[key].target) * 100)),
    fullMark: 100,
  }));

  const overallPct = Math.round(
    (Object.keys(KPI_META) as KpiKey[]).reduce((sum, key) => {
      return sum + Math.min(100, (a.kpis[key] / KPI_META[key].target) * 100);
    }, 0) / Object.keys(KPI_META).length
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm overflow-y-auto py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        ref={printRef}
        className="card-glass rounded-2xl p-6 w-full max-w-4xl mx-4 border border-primary/20"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 no-print">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg border-2 ${
              a.level === "gold" ? "text-gold border-gold/40 bg-gold/10" :
              a.level === "silver" ? "text-silver border-silver/40 bg-silver/10" :
              "text-bronze border-bronze/40 bg-bronze/10"
            }`}>
              {a.avatar}
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{a.name}</h2>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-sm text-muted-foreground font-mono">{a.points} pts</span>
                <span className="text-sm capitalize text-muted-foreground">Nível {a.level}</span>
                {a.streak > 0 && (
                  <span className="flex items-center gap-1 text-sm text-chart-orange font-semibold">
                    <Flame className="w-4 h-4" /> {a.streak} dias
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/30 text-primary font-semibold text-sm flex items-center gap-2 hover:bg-primary/20 transition-all"
            >
              <Printer className="w-4 h-4" /> Imprimir
            </button>
            <button onClick={onClose} className="w-9 h-9 rounded-lg bg-muted/30 hover:bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Print header */}
        <div className="hidden print:flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full border-2 border-gray-400 flex items-center justify-center font-bold">{a.avatar}</div>
          <div>
            <h2 className="text-xl font-bold">{a.name}</h2>
            <p className="text-sm text-gray-600">{a.points} pts • Nível {a.level} • Streak {a.streak} dias</p>
          </div>
        </div>

        {/* Overall */}
        <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
          <TrendingUp className="w-6 h-6 text-primary" />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Desempenho Geral</p>
            <p className="text-2xl font-mono font-bold text-primary">{overallPct}%</p>
          </div>
          <div className="w-32 h-3 bg-muted/40 rounded-full overflow-hidden">
            <div className="h-full rounded-full gradient-primary" style={{ width: `${overallPct}%` }} />
          </div>
        </div>

        {/* KPI Details */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {(Object.keys(KPI_META) as KpiKey[]).map(key => {
            const meta = KPI_META[key];
            const val = a.kpis[key];
            const pct = Math.min(100, Math.round((val / meta.target) * 100));
            return (
              <div key={key} className="p-3 rounded-xl bg-muted/10 border border-border/20">
                <p className="text-xs text-muted-foreground mb-1">{meta.label}</p>
                <div className="flex items-baseline gap-1">
                  <span className={`text-lg font-mono font-bold ${pct >= 80 ? "text-primary" : pct >= 50 ? "text-chart-orange" : "text-destructive"}`}>
                    {val}{meta.unit}
                  </span>
                  <span className="text-xs text-muted-foreground">/ {meta.target}{meta.unit}</span>
                </div>
                <div className="w-full h-1.5 bg-muted/30 rounded-full mt-2 overflow-hidden">
                  <div className={`h-full rounded-full ${pct >= 80 ? "gradient-success" : "gradient-primary"}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-muted/10 border border-border/20">
            <h3 className="text-sm font-bold text-foreground mb-3">KPIs vs Meta</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="Resultado" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Meta" fill="hsl(var(--muted-foreground))" opacity={0.3} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="p-4 rounded-xl bg-muted/10 border border-border/20">
            <h3 className="text-sm font-bold text-foreground mb-3">Radar de Desempenho</h3>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" opacity={0.3} />
                <PolarAngleAxis dataKey="kpi" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} />
                <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Badges */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-muted/10 border border-border/20">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Conquistas Desbloqueadas</h3>
            </div>
            {earnedBadges.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhuma conquista ainda.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {earnedBadges.map(b => (
                  <div key={b.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                    <span className="text-lg">{b.icon}</span>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{b.name}</p>
                      <p className="text-[10px] text-muted-foreground">{b.desc}</p>
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
              {pendingBadges.map(b => (
                <div key={b.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/20 border border-border/20 opacity-50">
                  <span className="text-lg grayscale">{b.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{b.name}</p>
                    <p className="text-[10px] text-muted-foreground">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AssessorProfile;
