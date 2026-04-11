import { useMemo, useState, useEffect } from "react";
import { Target, Minus, Plus, Loader2 } from "lucide-react";
import type { Assessor } from "@/types/assessor";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";
import { useMetrics, useUpsertMetric } from "@/hooks/useMetrics";
import { useKpis } from "@/hooks/useKpis";

interface RegistrationPanelProps {
  assessors: Assessor[];
  /** Lista de KPI keys que aparecem nas atividades do dia. Único por dia. */
  kpiKeys: string[];
}

const LEVEL_COLORS = {
  gold: "text-gold border-gold/30 bg-gold/10",
  silver: "text-silver border-silver/30 bg-silver/10",
  bronze: "text-bronze border-bronze/30 bg-bronze/10",
};

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

const RegistrationPanel = ({ assessors, kpiKeys }: RegistrationPanelProps) => {
  const { kpis: allKpis } = useKpis();
  const upsert = useUpsertMetric();
  const today = todayString();
  const { data: todayMetrics } = useMetrics({ from: today, to: today });

  // Filtra os KPIs do dia (mantém ordem do kpiKeys)
  const kpisForDay = useMemo(
    () => kpiKeys.map((k) => allKpis.find((x) => x.key === k)).filter((x): x is NonNullable<typeof x> => Boolean(x)),
    [kpiKeys, allKpis],
  );

  // Lookup { assessorId → { kpiKey → rawValue } } a partir das entries do dia
  const persistedValues = useMemo(() => {
    const m: Record<string, Record<string, number>> = {};
    for (const e of todayMetrics ?? []) {
      m[e.assessorId] ??= {};
      m[e.assessorId][e.kpiKey] = e.rawValue;
    }
    return m;
  }, [todayMetrics]);

  // Estado local (otimista) — espelha persistedValues + edits inline
  const [localValues, setLocalValues] = useState<Record<string, Record<string, number>>>({});

  // Sincroniza local quando o backend retorna novos dados
  useEffect(() => {
    setLocalValues(persistedValues);
  }, [persistedValues]);

  function getValue(assessorId: string, kpiKey: string): number {
    return localValues[assessorId]?.[kpiKey] ?? 0;
  }

  function setValueLocal(assessorId: string, kpiKey: string, value: number) {
    setLocalValues((prev) => ({
      ...prev,
      [assessorId]: { ...prev[assessorId], [kpiKey]: Math.max(0, value) },
    }));
  }

  function commit(assessorId: string, kpiKey: string, value: number) {
    if (value < 0) return;
    upsert.mutate({ assessorId, kpiKey, rawValue: value, date: today });
  }

  return (
    <div className="card-glass rounded-xl p-5 h-full">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-success" />
        <h2 className="text-sm font-bold text-foreground">Registrar Resultados</h2>
        {upsert.isPending && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
      </div>

      <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-240px)]">
        {assessors.map((a) => (
          <div key={a.id} className="p-3 rounded-lg bg-muted/20 border border-border/30">
            <div className="flex items-center gap-2 mb-3">
              <AssessorAvatar initials={a.avatar} photoUrl={a.photoUrl} level={a.level} size={28} />
              <span className="text-sm font-semibold text-foreground">{a.name}</span>
            </div>

            <div className="space-y-2">
              {kpisForDay.map((kpi) => {
                const val = getValue(a.id, kpi.key);
                const target = kpi.target || 1;
                const pct = Math.min(100, Math.round((val / target) * 100));
                const step = kpi.unit === "%" ? 5 : 1;

                return (
                  <div key={kpi.key} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-24 truncate" title={kpi.label}>
                      {kpi.label}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          const next = Math.max(0, val - step);
                          setValueLocal(a.id, kpi.key, next);
                          commit(a.id, kpi.key, next);
                        }}
                        className="w-7 h-7 rounded-md bg-muted/40 hover:bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <input
                        type="number"
                        min={0}
                        max={kpi.unit === "%" ? 100 : 999}
                        value={val}
                        onChange={(e) => setValueLocal(a.id, kpi.key, parseInt(e.target.value) || 0)}
                        onBlur={() => commit(a.id, kpi.key, val)}
                        className="w-14 h-7 rounded-md bg-muted/30 border border-border/30 text-center text-sm font-mono font-semibold text-foreground focus:outline-none focus:border-primary/50"
                      />

                      <button
                        onClick={() => {
                          const next = val + step;
                          setValueLocal(a.id, kpi.key, next);
                          commit(a.id, kpi.key, next);
                        }}
                        className="w-7 h-7 rounded-md bg-muted/40 hover:bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="text-[10px] text-muted-foreground">
                      / {kpi.target}
                      {kpi.unit}
                    </span>

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
