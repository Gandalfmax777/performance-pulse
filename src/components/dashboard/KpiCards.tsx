import { motion } from "framer-motion";
import { Users, PhoneCall, CalendarCheck, Gift, FileText, Zap } from "lucide-react";

const KPIS = [
  { label: "Leads Gerados", value: 52, target: 60, icon: Users, color: "text-primary", bg: "bg-primary/10" },
  { label: "Cadência", value: 78, target: 100, icon: Zap, color: "text-success", bg: "bg-success/10", suffix: "%" },
  { label: "Ligações", value: 124, target: 150, icon: PhoneCall, color: "text-chart-blue", bg: "bg-chart-blue/10" },
  { label: "Reuniões", value: 16, target: 18, icon: CalendarCheck, color: "text-chart-purple", bg: "bg-chart-purple/10" },
  { label: "Indicações", value: 24, target: 30, icon: Gift, color: "text-chart-orange", bg: "bg-chart-orange/10" },
  { label: "Boletos", value: 44, target: 60, icon: FileText, color: "text-gold", bg: "bg-gold/10" },
];

const KpiCards = () => (
  <div className="grid grid-cols-6 gap-3">
    {KPIS.map((kpi, i) => {
      const pct = Math.min(100, Math.round((kpi.value / kpi.target) * 100));
      return (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="card-glass rounded-xl p-4 relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center`}>
              <kpi.icon className={`w-4.5 h-4.5 ${kpi.color}`} />
            </div>
            <span className="font-mono text-2xl font-bold text-foreground">
              {kpi.value}{kpi.suffix || ""}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">{kpi.label}</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1.2, delay: i * 0.1 }}
                className={`h-full rounded-full ${pct >= 80 ? "gradient-success" : "gradient-primary"}`}
              />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">{pct}%</span>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5">
            <kpi.icon className="w-20 h-20" />
          </div>
        </motion.div>
      );
    })}
  </div>
);

export default KpiCards;
