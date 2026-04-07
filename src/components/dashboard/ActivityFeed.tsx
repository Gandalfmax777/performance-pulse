import { motion } from "framer-motion";
import { CheckCircle2, Target, Phone, Award } from "lucide-react";

const FEED = [
  { user: "Lucas M.", action: "completou Bloco 1", icon: CheckCircle2, color: "text-success", time: "2min" },
  { user: "Ana B.", action: "agendou 2 reuniões", icon: Target, color: "text-chart-purple", time: "5min" },
  { user: "Rafael C.", action: "gerou 4 leads quentes", icon: Phone, color: "text-primary", time: "8min" },
  { user: "Lucas M.", action: "desbloqueou Hunter Elite 🎯", icon: Award, color: "text-gold", time: "12min" },
  { user: "Mariana S.", action: "completou cadência 70%", icon: CheckCircle2, color: "text-success", time: "15min" },
  { user: "Pedro A.", action: "processou 3 boletos", icon: CheckCircle2, color: "text-chart-blue", time: "18min" },
];

const ActivityFeed = () => (
  <div className="card-glass rounded-xl p-5 h-full">
    <h2 className="text-sm font-bold text-foreground mb-3">Atividade Recente</h2>
    <div className="space-y-2.5 overflow-y-auto max-h-[300px]">
      {FEED.map((f, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex items-start gap-2.5"
        >
          <div className={`mt-0.5 ${f.color}`}>
            <f.icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-foreground">
              <span className="font-semibold">{f.user}</span>{" "}
              <span className="text-muted-foreground">{f.action}</span>
            </p>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono shrink-0">{f.time}</span>
        </motion.div>
      ))}
    </div>
  </div>
);

export default ActivityFeed;
