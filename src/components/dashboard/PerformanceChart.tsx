import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const DATA = [
  { day: "Seg", leads: 12, reunioes: 3, ligacoes: 28 },
  { day: "Ter", leads: 8, reunioes: 5, ligacoes: 35 },
  { day: "Qua", leads: 15, reunioes: 2, ligacoes: 20 },
  { day: "Qui", leads: 10, reunioes: 4, ligacoes: 30 },
  { day: "Sex", leads: 7, reunioes: 2, ligacoes: 11 },
];

const PerformanceChart = () => (
  <div className="card-glass rounded-xl p-5">
    <h2 className="text-sm font-bold text-foreground mb-4">Tendência Semanal</h2>
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={DATA}>
        <defs>
          <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(200, 80%, 55%)" stopOpacity={0.4} />
            <stop offset="95%" stopColor="hsl(200, 80%, 55%)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradReunioes" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(270, 60%, 60%)" stopOpacity={0.4} />
            <stop offset="95%" stopColor="hsl(270, 60%, 60%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }} width={30} />
        <Tooltip
          contentStyle={{
            background: "hsl(220, 18%, 10%)",
            border: "1px solid hsl(220, 15%, 18%)",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Area type="monotone" dataKey="leads" stroke="hsl(200, 80%, 55%)" fill="url(#gradLeads)" strokeWidth={2} />
        <Area type="monotone" dataKey="reunioes" stroke="hsl(270, 60%, 60%)" fill="url(#gradReunioes)" strokeWidth={2} />
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

export default PerformanceChart;
