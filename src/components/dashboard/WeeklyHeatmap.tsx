import { motion } from "framer-motion";
import { ASSESSORS, SCHEDULE } from "@/data/mockData";

const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex"];

const WeeklyHeatmap = () => {
  return (
    <div className="card-glass rounded-xl p-5">
      <h2 className="text-sm font-bold text-foreground mb-4">Heatmap Semanal</h2>

      <div className="overflow-x-auto">
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `100px repeat(${DAYS.length}, 1fr)` }}>
          {/* Header */}
          <div />
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
          ))}

          {/* Rows */}
          {ASSESSORS.slice(0, 5).map((a, ai) => (
            <>
              <div key={`name-${a.id}`} className="text-xs text-foreground font-medium flex items-center truncate pr-2">
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
            </>
          ))}
        </div>
      </div>

      {/* Schedule */}
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
  );
};

export default WeeklyHeatmap;
