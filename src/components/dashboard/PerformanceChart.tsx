import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { useOverviewReport } from "@/hooks/useReports";

function dayLabelFromYmd(s: string): string {
  const [y, m, d] = s.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const labels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  return labels[date.getUTCDay()];
}

const PerformanceChart = () => {
  const now = new Date();
  const from = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const to = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");

  const { data: overview } = useOverviewReport({ from, to });

  // Combina séries diárias de leads + reuniões + ligações numa estrutura única.
  const data = useMemo(() => {
    if (!overview) return [];
    const leadsSeries = overview.byKpi.find((k) => k.key === "leads")?.series ?? [];
    const reunioesSeries = overview.byKpi.find((k) => k.key === "reunioes")?.series ?? [];
    const ligacoesSeries = overview.byKpi.find((k) => k.key === "ligacoes")?.series ?? [];

    return leadsSeries.map((entry, i) => ({
      day: dayLabelFromYmd(entry.date),
      leads: entry.value,
      reunioes: reunioesSeries[i]?.value ?? 0,
      ligacoes: ligacoesSeries[i]?.value ?? 0,
    }));
  }, [overview]);

  return (
    <div className="card-glass rounded-xl p-5">
      <h2 className="text-sm font-display font-bold text-foreground mb-4">Tendência Semanal</h2>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ED8E53" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#ED8E53" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradReunioes" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(270, 60%, 62%)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="hsl(270, 60%, 62%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(30, 10%, 50%)", fontSize: 11 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(30, 10%, 50%)", fontSize: 11 }}
            width={30}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(200, 14%, 10%)",
              border: "1px solid hsl(200, 8%, 18%)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Area
            type="monotone"
            dataKey="leads"
            stroke="#ED8E53"
            fill="url(#gradLeads)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="reunioes"
            stroke="hsl(270, 60%, 62%)"
            fill="url(#gradReunioes)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-2 justify-center">
        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Leads
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-full bg-chart-purple" /> Reuniões
        </span>
      </div>
    </div>
  );
};

export default PerformanceChart;
