import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { useOverviewReport } from "@/hooks/useReports";
import { useKpis } from "@/hooks/useKpis";

function dayLabelFromYmd(s: string): string {
  const [y, m, d] = s.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const labels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  return labels[date.getUTCDay()];
}

function todayYmd(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Paleta determinística por KPI key pra manter cores consistentes entre renders.
// Paleta categórica EQI — cores um pouco menos saturadas pra visual corporativo.
const KPI_COLORS: Record<string, string> = {
  ligacoes: "hsl(217, 91%, 50%)",        // chart-blue
  reunioes: "hsl(262, 70%, 55%)",        // chart-purple
  reunioes_realizadas: "hsl(290, 70%, 55%)",
  leads: "hsl(148, 70%, 30%)",           // primary EQI
  cadencia: "hsl(38, 92%, 50%)",         // chart-orange
  ativacao_conta: "hsl(340, 70%, 50%)",
  indicacoes: "hsl(180, 60%, 40%)",
};
const FALLBACK_COLORS = [
  "hsl(217, 91%, 50%)",
  "hsl(262, 70%, 55%)",
  "hsl(148, 70%, 30%)",
  "hsl(38, 92%, 50%)",
];

const PerformanceChart = () => {
  const now = new Date();
  const from = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const to = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const today = todayYmd();

  const { data: overview } = useOverviewReport({ from, to });
  const { kpis } = useKpis();

  // KPIs diretos (useKpis já filtra derivados) que têm pelo menos uma entrada na semana.
  // Pega no máximo 4 pra não poluir o gráfico.
  const visibleKpis = useMemo(() => {
    if (!overview) return [];
    return overview.byKpi
      .filter((k) => {
        const kpi = kpis.find((x) => x.key === k.key);
        if (!kpi) return false;
        return k.series.some((p) => p.value > 0);
      })
      .slice(0, 4);
  }, [overview, kpis]);

  // Série normalizada por % de cumprimento da meta DIÁRIA, truncada no hoje.
  // Motivo: valores absolutos misturam escalas (leads 0-15 vs ligações 0-80)
  // e plotar dias futuros como zero passa a ilusão de "caindo pra morte".
  const data = useMemo(() => {
    if (!overview || visibleKpis.length === 0) return [];
    const firstSeries = visibleKpis[0].series;

    return firstSeries
      .filter((p) => p.date <= today)
      .map((p) => {
        const row: Record<string, number | string> = {
          day: dayLabelFromYmd(p.date),
          date: p.date,
        };
        for (const k of visibleKpis) {
          const kpi = kpis.find((x) => x.key === k.key);
          // Meta do KPI: o backend entrega target semanal agregado (teamSize * days),
          // então derivamos a meta diária individual por assessor via kpi.target.
          const dailyTarget = kpi?.target ?? 1;
          const dayEntry = k.series.find((s) => s.date === p.date);
          const dayValue = dayEntry?.value ?? 0;
          // Dividimos por (teamSize) aproximado: overview.byKpi.series soma time inteiro
          // num dia, então o % faz sentido se dividirmos pelo time. Sem teamSize disponível
          // aqui, usamos percentual do total sobre a meta diária da equipe inteira.
          const pct = dailyTarget > 0 ? Math.min(150, (dayValue / dailyTarget) * 100) : 0;
          row[k.key] = Math.round(pct);
        }
        return row;
      });
  }, [overview, visibleKpis, kpis, today]);

  const colorForKey = (key: string, idx: number): string =>
    KPI_COLORS[key] ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length];

  const isEmpty = data.length === 0 || visibleKpis.length === 0;
  const todayLabel = dayLabelFromYmd(today);

  return (
    <div className="card-glass rounded-xl p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-sm font-display font-bold text-foreground">Tendência Semanal</h2>
        <span className="text-[10px] text-muted-foreground font-mono">% da meta diária</span>
      </div>

      {isEmpty ? (
        <div className="h-[180px] flex items-center justify-center text-xs text-muted-foreground">
          Sem dados na semana ainda.
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data}>
              <defs>
                {visibleKpis.map((k, i) => {
                  const color = colorForKey(k.key, i);
                  return (
                    <linearGradient
                      key={k.key}
                      id={`grad-${k.key}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                width={34}
                tickFormatter={(v) => `${v}%`}
                domain={[0, 150]}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  color: "hsl(var(--foreground))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number, name: string) => {
                  const kpi = visibleKpis.find((k) => k.key === name);
                  return [`${value}%`, kpi?.label ?? name];
                }}
              />
              <ReferenceLine
                x={todayLabel}
                stroke="hsl(var(--primary))"
                strokeDasharray="2 4"
                strokeOpacity={0.6}
              />
              {visibleKpis.map((k, i) => {
                const color = colorForKey(k.key, i);
                return (
                  <Area
                    key={k.key}
                    type="monotone"
                    dataKey={k.key}
                    stroke={color}
                    fill={`url(#grad-${k.key})`}
                    strokeWidth={2}
                  />
                );
              })}
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 justify-center">
            {visibleKpis.map((k, i) => {
              const color = colorForKey(k.key, i);
              return (
                <span
                  key={k.key}
                  className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: color }}
                  />
                  {k.label}
                </span>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default PerformanceChart;
