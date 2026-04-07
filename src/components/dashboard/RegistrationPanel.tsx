import { ASSESSORS } from "@/data/mockData";
import { Target, Minus, Plus } from "lucide-react";
import type { DayActivity } from "./DayView";

interface RegistrationPanelProps {
  activities: DayActivity[];
  registrations: Record<string, Record<string, number>>;
  onUpdate: (assessorId: string, activityId: string, value: number) => void;
}

const LEVEL_COLORS = {
  gold: "text-gold border-gold/30 bg-gold/10",
  silver: "text-silver border-silver/30 bg-silver/10",
  bronze: "text-bronze border-bronze/30 bg-bronze/10",
};

const RegistrationPanel = ({ activities, registrations, onUpdate }: RegistrationPanelProps) => {
  return (
    <div className="card-glass rounded-xl p-5 h-full">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-success" />
        <h2 className="text-sm font-bold text-foreground">Registrar Resultados</h2>
      </div>

      <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-240px)]">
        {ASSESSORS.map(a => (
          <div key={a.id} className="p-3 rounded-lg bg-muted/20 border border-border/30">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${LEVEL_COLORS[a.level]}`}>
                {a.avatar}
              </div>
              <span className="text-sm font-semibold text-foreground">{a.name}</span>
            </div>

            <div className="space-y-2">
              {activities.map(act => {
                const val = registrations[a.id]?.[act.id] ?? 0;
                const pct = Math.min(100, Math.round((val / act.target) * 100));
                const isPercent = act.unit === "%";

                return (
                  <div key={act.id} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-24 truncate" title={act.kpi}>
                      {act.kpi}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onUpdate(a.id, act.id, Math.max(0, val - (isPercent ? 5 : 1)))}
                        className="w-7 h-7 rounded-md bg-muted/40 hover:bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <input
                        type="number"
                        min={0}
                        max={isPercent ? 100 : 999}
                        value={val}
                        onChange={e => {
                          const v = parseInt(e.target.value) || 0;
                          onUpdate(a.id, act.id, Math.max(0, v));
                        }}
                        className="w-14 h-7 rounded-md bg-muted/30 border border-border/30 text-center text-sm font-mono font-semibold text-foreground focus:outline-none focus:border-primary/50"
                      />

                      <button
                        onClick={() => onUpdate(a.id, act.id, val + (isPercent ? 5 : 1))}
                        className="w-7 h-7 rounded-md bg-muted/40 hover:bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="text-[10px] text-muted-foreground">/ {act.target}{act.unit}</span>

                    {/* Mini progress */}
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          pct >= 80 ? "bg-success" : pct >= 50 ? "bg-chart-orange" : "bg-destructive"
                        }`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RegistrationPanel;
