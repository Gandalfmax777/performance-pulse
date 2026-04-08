import { useState } from "react";
import { type Assessor } from "@/data/mockData";
import {
  type Squad,
  type Bet,
  DEFAULT_SQUADS,
  DEFAULT_BETS,
  SQUAD_BADGES,
  getSquadStats,
} from "@/data/squadData";
import {
  Trophy,
  Users,
  Plus,
  Trash2,
  Crown,
  TrendingUp,
  Target,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Flame,
  Shield,
  Vault,
  Settings2,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface Props {
  assessors: Assessor[];
}

const SquadBet = ({ assessors }: Props) => {
  const [squads, setSquads] = useState<Squad[]>(DEFAULT_SQUADS);
  const [bets, setBets] = useState<Bet[]>(DEFAULT_BETS);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("🔥");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [newBetValue, setNewBetValue] = useState(50);
  const [expandedSquad, setExpandedSquad] = useState<string | null>(null);
  const [betPrize, setBetPrize] = useState("Vale-refeição R$50");
  const [betGoal, setBetGoal] = useState("Maior média de meta semanal (%)");
  const [showBetConfig, setShowBetConfig] = useState(false);

  // Compute rankings
  const rankedSquads = squads
    .map(sq => ({ ...sq, stats: getSquadStats(sq, assessors) }))
    .sort((a, b) => b.stats.avgGoal - a.stats.avgGoal);

  const assignedIds = squads.flatMap(s => s.memberIds);
  const unassigned = assessors.filter(a => !assignedIds.includes(a.id));

  const createSquad = () => {
    if (!newName.trim() || selectedMembers.length === 0) return;
    const squad: Squad = {
      id: `s${Date.now()}`,
      name: newName.trim(),
      emoji: newEmoji,
      color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
      leaderId: selectedMembers[0],
      memberIds: selectedMembers,
    };
    setSquads(prev => [...prev, squad]);
    setNewName("");
    setNewEmoji("🔥");
    setSelectedMembers([]);
    setShowCreate(false);
  };

  const removeSquad = (id: string) => setSquads(prev => prev.filter(s => s.id !== id));

  const finishBet = (betId: string) => {
    if (rankedSquads.length === 0) return;
    setBets(prev =>
      prev.map(b =>
        b.id === betId ? { ...b, status: "finished" as const, winnerId: rankedSquads[0].id } : b
      )
    );
  };

  const activeBet = bets.find(b => b.status === "active");
  const finishedBets = bets.filter(b => b.status === "finished");

  // Radar data
  const radarData = [
    { metric: "Leads", ...Object.fromEntries(rankedSquads.map(s => [s.id, s.stats.leads])) },
    { metric: "Cadência", ...Object.fromEntries(rankedSquads.map(s => [s.id, s.stats.cadencia])) },
    { metric: "Ligações", ...Object.fromEntries(rankedSquads.map(s => [s.id, s.stats.ligacoes])) },
    { metric: "Reuniões", ...Object.fromEntries(rankedSquads.map(s => [s.id, s.stats.reunioes])) },
    { metric: "Indicações", ...Object.fromEntries(rankedSquads.map(s => [s.id, s.stats.indicacoes])) },
    { metric: "Boletos", ...Object.fromEntries(rankedSquads.map(s => [s.id, s.stats.boletos])) },
  ];

  // Bar comparison data
  const barData = rankedSquads.map(s => ({
    name: `${s.emoji} ${s.name}`,
    "Meta %": s.stats.avgGoal,
    Pontos: s.stats.totalPoints,
  }));

  // Win count per squad
  const winCount = (squadId: string) => finishedBets.filter(b => b.winnerId === squadId).length;
  const totalBetValue = (squadId: string) =>
    finishedBets.filter(b => b.winnerId === squadId).reduce((s, b) => s + b.value, 0);

  const RADAR_COLORS = [
    "hsl(152, 70%, 45%)",
    "hsl(200, 70%, 50%)",
    "hsl(45, 90%, 55%)",
    "hsl(270, 60%, 60%)",
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Squad Bet</h2>
            <p className="text-xs text-muted-foreground">Competição por equipes com apostas</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Criar Squad
        </button>
      </div>

      {/* Create Squad Panel */}
      {showCreate && (
        <div className="card-glass rounded-xl p-5 animate-fade-in space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Nova Squad
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Emoji</label>
              <select
                value={newEmoji}
                onChange={e => setNewEmoji(e.target.value)}
                className="w-full bg-muted/30 border border-border/30 rounded-lg px-3 py-2 text-foreground text-lg"
              >
                {["🔥", "🐺", "🦅", "🦁", "🐉", "⚡", "🎯", "🚀", "💎", "🏆"].map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">Nome da Squad</label>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Ex: Alfa Traders"
                className="w-full bg-muted/30 border border-border/30 rounded-lg px-3 py-2 text-foreground text-sm placeholder:text-muted-foreground/50"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">
              Membros ({selectedMembers.length} selecionados)
            </label>
            <div className="flex flex-wrap gap-2">
              {assessors.map(a => {
                const assigned = assignedIds.includes(a.id) && !selectedMembers.includes(a.id);
                const selected = selectedMembers.includes(a.id);
                return (
                  <button
                    key={a.id}
                    disabled={assigned}
                    onClick={() =>
                      setSelectedMembers(prev =>
                        selected ? prev.filter(id => id !== a.id) : [...prev, a.id]
                      )
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      assigned
                        ? "bg-muted/20 text-muted-foreground/40 cursor-not-allowed"
                        : selected
                        ? "gradient-primary text-primary-foreground"
                        : "bg-muted/30 text-foreground border border-border/30 hover:bg-muted/50"
                    }`}
                  >
                    {a.avatar} {a.name.split(" ")[0]}
                  </button>
                );
              })}
            </div>
          </div>
          <button
            onClick={createSquad}
            disabled={!newName.trim() || selectedMembers.length === 0}
            className="px-5 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold disabled:opacity-40"
          >
            Criar Squad
          </button>
        </div>
      )}

      {/* Active Bet Banner */}
      {activeBet && (
        <div className="card-glass rounded-xl p-4 border border-primary/30 glow-primary animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Flame className="w-6 h-6 text-primary animate-pulse" />
              <div>
                <p className="text-sm font-bold text-foreground">Aposta Ativa: {activeBet.round}</p>
                <p className="text-xs text-muted-foreground">
                  Valor: R$ {activeBet.value} • {activeBet.type === "weekly" ? "Semanal" : "Mensal"}
                </p>
              </div>
            </div>
            <button
              onClick={() => finishBet(activeBet.id)}
              className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-xs font-bold hover:opacity-90 transition-opacity"
            >
              Encerrar Rodada
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-4">
        {/* Squad Ranking - Left */}
        <div className="col-span-5 space-y-4">
          <div className="card-glass rounded-xl p-5">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-accent" /> Ranking de Squads
            </h3>
            <div className="space-y-3">
              {rankedSquads.map((sq, i) => {
                const isFirst = i === 0;
                const expanded = expandedSquad === sq.id;
                const members = assessors.filter(a => sq.memberIds.includes(a.id));
                const badges = SQUAD_BADGES.filter(b => b.check(sq, assessors));
                const wins = winCount(sq.id);

                return (
                  <div key={sq.id} className="space-y-0">
                    <div
                      onClick={() => setExpandedSquad(expanded ? null : sq.id)}
                      className={`rounded-xl p-4 cursor-pointer transition-all ${
                        isFirst
                          ? "border-2 border-accent/40 bg-accent/5 glow-gold"
                          : "bg-muted/20 border border-border/20 hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                              isFirst ? "bg-accent/20" : "bg-muted/30"
                            }`}
                          >
                            {isFirst ? <Crown className="w-5 h-5 text-accent" /> : <span className="text-lg">{sq.emoji}</span>}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground flex items-center gap-2">
                              {sq.emoji} {sq.name}
                              {isFirst && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent font-bold">
                                  LÍDER
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {members.length} membros • {wins} vitória{wins !== 1 ? "s" : ""} • R$ {totalBetValue(sq.id)} ganhos
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-lg font-bold font-mono text-foreground">{sq.stats.avgGoal}%</p>
                            <p className="text-[10px] text-muted-foreground">Meta Média</p>
                          </div>
                          {expanded ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expanded && (
                      <div className="bg-muted/10 rounded-b-xl p-4 border border-t-0 border-border/20 space-y-3 animate-fade-in">
                        {/* Members */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-2 font-semibold">Membros</p>
                          <div className="space-y-1.5">
                            {members.map(m => (
                              <div key={m.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                    {m.avatar}
                                  </div>
                                  <span className="text-xs text-foreground">{m.name}</span>
                                  {m.id === sq.leaderId && (
                                    <Crown className="w-3 h-3 text-accent" />
                                  )}
                                </div>
                                <span className="text-xs font-mono text-muted-foreground">{m.weeklyGoalPercent}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* KPI Summary */}
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: "Leads", value: sq.stats.leads },
                            { label: "Cadência", value: `${sq.stats.cadencia}%` },
                            { label: "Ligações", value: sq.stats.ligacoes },
                            { label: "Reuniões", value: sq.stats.reunioes },
                            { label: "Indicações", value: sq.stats.indicacoes },
                            { label: "Boletos", value: sq.stats.boletos },
                          ].map(k => (
                            <div key={k.label} className="bg-muted/20 rounded-lg p-2 text-center">
                              <p className="text-[10px] text-muted-foreground">{k.label}</p>
                              <p className="text-sm font-bold font-mono text-foreground">{k.value}</p>
                            </div>
                          ))}
                        </div>
                        {/* Badges */}
                        {badges.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {badges.map(b => (
                              <span key={b.id} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-lg">
                                {b.icon} {b.name}
                              </span>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={() => removeSquad(sq.id)}
                          className="text-xs text-destructive/60 hover:text-destructive flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" /> Remover Squad
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Radar + Bar Charts - Right */}
        <div className="col-span-7 space-y-4">
          {/* Radar Comparison */}
          <div className="card-glass rounded-xl p-5">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" /> Comparativo de Squads
            </h3>
            {rankedSquads.length >= 2 ? (
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(160,10%,16%)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: "hsl(155,12%,52%)", fontSize: 11 }} />
                  <PolarRadiusAxis tick={{ fill: "hsl(155,12%,52%)", fontSize: 9 }} />
                  {rankedSquads.map((sq, i) => (
                    <Radar
                      key={sq.id}
                      name={sq.name}
                      dataKey={sq.id}
                      stroke={RADAR_COLORS[i % RADAR_COLORS.length]}
                      fill={RADAR_COLORS[i % RADAR_COLORS.length]}
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  ))}
                  <Legend
                    formatter={(value) => {
                      const sq = rankedSquads.find(s => s.name === value);
                      return `${sq?.emoji || ""} ${value}`;
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(160,12%,9%)",
                      border: "1px solid hsl(160,10%,16%)",
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">
                Crie pelo menos 2 squads para ver o comparativo
              </p>
            )}
          </div>

          {/* Bar Chart */}
          <div className="card-glass rounded-xl p-5">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Performance vs Meta
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(160,10%,16%)" />
                <XAxis dataKey="name" tick={{ fill: "hsl(155,12%,52%)", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(155,12%,52%)", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(160,12%,9%)",
                    border: "1px solid hsl(160,10%,16%)",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                />
                <Bar dataKey="Meta %" fill="hsl(152,70%,45%)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Pontos" fill="hsl(200,70%,50%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Bet History & New Bet */}
          <div className="card-glass rounded-xl p-5">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-accent" /> Histórico de Apostas
            </h3>

            {/* Create new bet */}
            {!activeBet && (
              <div className="flex items-center gap-3 mb-4 p-3 bg-muted/20 rounded-lg">
                <span className="text-xs text-muted-foreground">Nova aposta:</span>
                <span className="text-xs text-muted-foreground">R$</span>
                <input
                  type="number"
                  value={newBetValue}
                  onChange={e => setNewBetValue(Number(e.target.value))}
                  className="w-20 bg-muted/30 border border-border/30 rounded-lg px-2 py-1 text-foreground text-sm font-mono text-center"
                />
                <button
                  onClick={() => {
                    const newBet: Bet = {
                      id: `b${Date.now()}`,
                      round: `Semana ${finishedBets.length + 1}`,
                      type: "weekly",
                      value: newBetValue,
                      winnerId: null,
                      date: new Date().toISOString().slice(0, 10),
                      status: "active",
                    };
                    setBets(prev => [...prev, newBet]);
                  }}
                  className="px-3 py-1 rounded-lg gradient-primary text-primary-foreground text-xs font-bold"
                >
                  Iniciar Rodada
                </button>
              </div>
            )}

            {/* History table */}
            <div className="space-y-2">
              {finishedBets.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Nenhuma rodada finalizada ainda
                </p>
              )}
              {finishedBets.map(bet => {
                const winner = squads.find(s => s.id === bet.winnerId);
                return (
                  <div key={bet.id} className="flex items-center justify-between bg-muted/15 rounded-lg px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <Trophy className="w-4 h-4 text-accent" />
                      <div>
                        <p className="text-xs font-semibold text-foreground">{bet.round}</p>
                        <p className="text-[10px] text-muted-foreground">{bet.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-foreground">
                        {winner ? `${winner.emoji} ${winner.name}` : "—"}
                      </span>
                      <span className="text-xs font-bold font-mono text-accent">R$ {bet.value}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Heatmap / Squad Badges */}
          <div className="card-glass rounded-xl p-5">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              🏅 Conquistas de Squad
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {SQUAD_BADGES.map(badge => {
                const earned = rankedSquads.filter(sq => badge.check(sq, assessors));
                return (
                  <div
                    key={badge.id}
                    className={`rounded-lg p-3 border ${
                      earned.length > 0
                        ? "border-primary/30 bg-primary/5"
                        : "border-border/20 bg-muted/10 opacity-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{badge.icon}</span>
                      <span className="text-xs font-bold text-foreground">{badge.name}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{badge.desc}</p>
                    {earned.length > 0 && (
                      <div className="flex gap-1 mt-1.5">
                        {earned.map(sq => (
                          <span key={sq.id} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            {sq.emoji} {sq.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SquadBet;
