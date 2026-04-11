import { useMemo, useState } from "react";
import { type Assessor } from "@/types/assessor";
import { useSquads, useCreateSquad, useDeleteSquad, type ApiSquad } from "@/hooks/useSquads";
import { useBets, useCreateBet, useFinishBet, type BetWinnerCriteria } from "@/hooks/useBets";
import { useCofreBalance } from "@/hooks/useCofre";
import { useBadges, useBadgeUnlocks } from "@/hooks/useBadges";
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
  Loader2,
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

const RADAR_COLORS = [
  "#ED8E53",
  "#EDD69B",
  "#CB5B15",
  "hsl(270, 60%, 62%)",
];

const EMOJI_OPTIONS = ["🔥", "🐺", "🦅", "🦁", "🐉", "⚡", "🎯", "🚀", "💎", "🏆"];

/**
 * Critérios de vitória suportados pelo backend (Fase 6: 3 kinds).
 */
const CRITERIA_PRESETS: Array<{ label: string; value: BetWinnerCriteria }> = [
  { label: "Maior média de cadência",    value: { kind: "avgKpi", kpiKey: "cadencia" } },
  { label: "Mais pontos totais",          value: { kind: "totalPoints" } },
  { label: "Mais leads gerados",          value: { kind: "sumKpi", kpiKey: "leads" } },
  { label: "Mais reuniões agendadas",     value: { kind: "sumKpi", kpiKey: "reunioes" } },
];

function criteriaLabel(c: BetWinnerCriteria): string {
  if (c.kind === "avgKpi") return `Maior média de ${c.kpiKey}`;
  if (c.kind === "totalPoints") return "Mais pontos totais";
  if (c.kind === "sumKpi") return `Mais ${c.kpiKey}`;
  return "Critério customizado";
}

const SquadBet = ({ assessors }: Props) => {
  const { data: squadsData, isLoading: squadsLoading } = useSquads();
  const { data: betsData } = useBets();
  const { data: cofreData } = useCofreBalance();
  const { data: badgesData } = useBadges();
  const { data: squadUnlocksData } = useBadgeUnlocks({ periodKey: undefined });

  const createSquadMut = useCreateSquad();
  const deleteSquadMut = useDeleteSquad();
  const createBetMut = useCreateBet();
  const finishBetMut = useFinishBet();

  const squads = squadsData ?? [];
  const bets = betsData ?? [];

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("🔥");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [expandedSquad, setExpandedSquad] = useState<string | null>(null);

  // Nova bet form
  const [newBetValue, setNewBetValue] = useState(50);
  const [newBetType, setNewBetType] = useState<"WEEKLY" | "MONTHLY">("WEEKLY");
  const [newBetCriteriaIdx, setNewBetCriteriaIdx] = useState(0);

  // ─── Ranking de squads com estatísticas ──────────────────────────────────
  // Usa os kpis legados que vêm do useAssessors (populados pelo weekly rollup em API mode).
  const rankedSquads = useMemo(() => {
    return squads
      .map((sq) => {
        const members = assessors.filter((a) => sq.members.some((m) => m.assessorId === a.id));
        const n = Math.max(members.length, 1);
        const stats = {
          leads: +(members.reduce((s, m) => s + m.kpis.leads, 0) / n).toFixed(1),
          cadencia: +(members.reduce((s, m) => s + m.kpis.cadencia, 0) / n).toFixed(1),
          ligacoes: +(members.reduce((s, m) => s + m.kpis.ligacoes, 0) / n).toFixed(1),
          reunioes: +(members.reduce((s, m) => s + m.kpis.reunioes, 0) / n).toFixed(1),
          indicacoes: +(members.reduce((s, m) => s + m.kpis.indicacoes, 0) / n).toFixed(1),
          boletos: +(members.reduce((s, m) => s + m.kpis.boletos, 0) / n).toFixed(1),
          totalPoints: members.reduce((s, m) => s + m.points, 0),
          avgGoal: +(members.reduce((s, m) => s + m.weeklyGoalPercent, 0) / n).toFixed(1),
        };
        return { sq, members, stats };
      })
      .sort((a, b) => b.stats.avgGoal - a.stats.avgGoal);
  }, [squads, assessors]);

  const assignedIds = useMemo(
    () => squads.flatMap((s) => s.members.map((m) => m.assessorId)),
    [squads],
  );

  const createSquad = () => {
    if (!newName.trim() || selectedMembers.length === 0) return;
    const randomHsl = `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`;
    createSquadMut.mutate(
      {
        name: newName.trim(),
        emoji: newEmoji,
        color: randomHsl,
        leaderId: selectedMembers[0],
        memberIds: selectedMembers,
      },
      {
        onSuccess: () => {
          setNewName("");
          setNewEmoji("🔥");
          setSelectedMembers([]);
          setShowCreate(false);
        },
      },
    );
  };

  const removeSquad = (id: string) => {
    if (!confirm("Remover squad?")) return;
    deleteSquadMut.mutate(id);
  };

  const startBet = () => {
    const criteria = CRITERIA_PRESETS[newBetCriteriaIdx]?.value;
    if (!criteria) return;
    const month = new Date().toLocaleString("pt-BR", { month: "long" }).replace(/^\w/, (c) => c.toUpperCase());
    const count = bets.filter((b) => b.type === newBetType).length;
    const roundLabel =
      newBetType === "WEEKLY" ? `Semana ${count + 1} - ${month}` : `Mês ${count + 1} - ${month}`;
    createBetMut.mutate({
      roundLabel,
      type: newBetType,
      value: newBetValue,
      winnerCriteriaJson: criteria,
    });
  };

  const activeBet = bets.find((b) => b.status === "ACTIVE");
  const finishedBets = bets.filter((b) => b.status === "FINISHED");

  // Radar + bar comparativo
  const radarData = [
    { metric: "Leads", ...Object.fromEntries(rankedSquads.map((s) => [s.sq.id, s.stats.leads])) },
    { metric: "Cadência", ...Object.fromEntries(rankedSquads.map((s) => [s.sq.id, s.stats.cadencia])) },
    { metric: "Ligações", ...Object.fromEntries(rankedSquads.map((s) => [s.sq.id, s.stats.ligacoes])) },
    { metric: "Reuniões", ...Object.fromEntries(rankedSquads.map((s) => [s.sq.id, s.stats.reunioes])) },
    { metric: "Indicações", ...Object.fromEntries(rankedSquads.map((s) => [s.sq.id, s.stats.indicacoes])) },
    { metric: "Boletos", ...Object.fromEntries(rankedSquads.map((s) => [s.sq.id, s.stats.boletos])) },
  ];

  const barData = rankedSquads.map((s) => ({
    name: `${s.sq.emoji} ${s.sq.name}`,
    "Meta %": s.stats.avgGoal,
    Pontos: s.stats.totalPoints,
  }));

  // Helpers pro cofre (derivado do backend)
  const winCount = (squadId: string) =>
    cofreData?.bySquad.find((s) => s.squadId === squadId)?.winCount ?? 0;
  const totalBetValue = (squadId: string) =>
    cofreData?.bySquad.find((s) => s.squadId === squadId)?.totalWon ?? 0;

  // Badges de squad + unlocks por squad
  const squadBadges = (badgesData ?? []).filter((b) => b.scope === "SQUAD");
  const squadUnlocksBySquad = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const u of squadUnlocksData ?? []) {
      if (!u.squadId) continue;
      map[u.squadId] ??= new Set();
      map[u.squadId].add(u.badgeSlug);
    }
    return map;
  }, [squadUnlocksData]);

  if (squadsLoading) {
    return (
      <div className="card-glass rounded-xl p-8 text-center">
        <Loader2 className="w-8 h-8 text-primary mx-auto animate-spin" />
      </div>
    );
  }

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
                onChange={(e) => setNewEmoji(e.target.value)}
                className="w-full bg-muted/30 border border-border/30 rounded-lg px-3 py-2 text-foreground text-lg"
              >
                {EMOJI_OPTIONS.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">Nome da Squad</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
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
              {assessors.map((a) => {
                const assigned = assignedIds.includes(a.id) && !selectedMembers.includes(a.id);
                const selected = selectedMembers.includes(a.id);
                return (
                  <button
                    key={a.id}
                    disabled={assigned}
                    onClick={() =>
                      setSelectedMembers((prev) =>
                        selected ? prev.filter((id) => id !== a.id) : [...prev, a.id],
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
            disabled={!newName.trim() || selectedMembers.length === 0 || createSquadMut.isPending}
            className="px-5 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 flex items-center gap-2"
          >
            {createSquadMut.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
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
                <p className="text-sm font-bold text-foreground">
                  Aposta Ativa: {activeBet.roundLabel}
                  <span
                    className={`ml-2 text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      activeBet.type === "MONTHLY"
                        ? "bg-accent/20 text-accent"
                        : "bg-primary/20 text-primary"
                    }`}
                  >
                    {activeBet.type === "MONTHLY" ? "MENSAL" : "SEMANAL"}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  R$ {activeBet.value} • {criteriaLabel(activeBet.winnerCriteriaJson)}
                </p>
              </div>
            </div>
            <button
              onClick={() => finishBetMut.mutate(activeBet.id)}
              disabled={finishBetMut.isPending}
              className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
            >
              {finishBetMut.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
              Encerrar Rodada
            </button>
          </div>
        </div>
      )}

      {/* Row 1: Ranking + Radar */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-5">
          <div className="card-glass rounded-xl p-5 h-full">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-accent" /> Ranking de Squads
            </h3>
            <div className="space-y-3">
              {rankedSquads.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">
                  Nenhuma squad criada. Clique em "Criar Squad" pra começar.
                </p>
              )}
              {rankedSquads.map((row, i) => {
                const sq = row.sq;
                const isFirst = i === 0;
                const expanded = expandedSquad === sq.id;
                const wins = winCount(sq.id);
                const unlockedSlugs = squadUnlocksBySquad[sq.id] ?? new Set();
                const earnedBadges = squadBadges.filter((b) => unlockedSlugs.has(b.slug));

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
                              {row.members.length} membros • {wins} vitória{wins !== 1 ? "s" : ""} • R$ {totalBetValue(sq.id)} ganhos
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-lg font-bold font-mono text-foreground">{row.stats.avgGoal}%</p>
                            <p className="text-[10px] text-muted-foreground">Meta Média</p>
                          </div>
                          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </div>
                    </div>
                    {expanded && (
                      <div className="bg-muted/10 rounded-b-xl p-4 border border-t-0 border-border/20 space-y-3 animate-fade-in">
                        <div>
                          <p className="text-xs text-muted-foreground mb-2 font-semibold">Membros</p>
                          <div className="space-y-1.5">
                            {row.members.map((m) => (
                              <div key={m.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                    {m.avatar}
                                  </div>
                                  <span className="text-xs text-foreground">{m.name}</span>
                                  {m.id === sq.leaderId && <Crown className="w-3 h-3 text-accent" />}
                                </div>
                                <span className="text-xs font-mono text-muted-foreground">{m.weeklyGoalPercent}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: "Leads", value: row.stats.leads },
                            { label: "Cadência", value: `${row.stats.cadencia}%` },
                            { label: "Ligações", value: row.stats.ligacoes },
                            { label: "Reuniões", value: row.stats.reunioes },
                            { label: "Indicações", value: row.stats.indicacoes },
                            { label: "Boletos", value: row.stats.boletos },
                          ].map((k) => (
                            <div key={k.label} className="bg-muted/20 rounded-lg p-2 text-center">
                              <p className="text-[10px] text-muted-foreground">{k.label}</p>
                              <p className="text-sm font-bold font-mono text-foreground">{k.value}</p>
                            </div>
                          ))}
                        </div>
                        {earnedBadges.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {earnedBadges.map((b) => (
                              <span
                                key={b.id}
                                className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-lg"
                                title={b.description}
                              >
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

        <div className="col-span-7">
          <div className="card-glass rounded-xl p-5 h-full">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" /> Comparativo de Squads
            </h3>
            {rankedSquads.length >= 2 ? (
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(160,10%,16%)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: "hsl(155,12%,52%)", fontSize: 11 }} />
                  <PolarRadiusAxis tick={{ fill: "hsl(155,12%,52%)", fontSize: 9 }} />
                  {rankedSquads.map((row, i) => (
                    <Radar
                      key={row.sq.id}
                      name={row.sq.name}
                      dataKey={row.sq.id}
                      stroke={RADAR_COLORS[i % RADAR_COLORS.length]}
                      fill={RADAR_COLORS[i % RADAR_COLORS.length]}
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  ))}
                  <Legend
                    formatter={(value) => {
                      const sq = rankedSquads.find((s) => s.sq.name === value);
                      return `${sq?.sq.emoji || ""} ${value}`;
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
        </div>
      </div>

      {/* Row 2: Performance Bar + Cofre */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-7">
          <div className="card-glass rounded-xl p-5 h-full">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Performance vs Meta
            </h3>
            {barData.length > 0 ? (
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
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">Sem squads</p>
            )}
          </div>
        </div>

        <div className="col-span-5">
          <div className="card-glass rounded-xl p-5 h-full">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Vault className="w-4 h-4 text-accent" /> Cofre de Apostas
            </h3>
            <div className="space-y-3">
              {squads.map((sq: ApiSquad) => {
                const total = totalBetValue(sq.id);
                const wins = winCount(sq.id);
                const maxVal = Math.max(...squads.map((s) => totalBetValue(s.id)), 1);
                const fillPercent = Math.min((total / maxVal) * 100, 100);
                return (
                  <div
                    key={sq.id}
                    className="rounded-xl border border-border/20 bg-muted/10 p-4 relative overflow-hidden"
                  >
                    <div
                      className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out opacity-15"
                      style={{ height: `${fillPercent}%`, background: sq.color }}
                    />
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{sq.emoji}</span>
                        <div>
                          <span className="text-xs font-bold text-foreground">{sq.name}</span>
                          <p className="text-[10px] text-muted-foreground">
                            {wins} vitória{wins !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <p className="text-xl font-bold font-mono text-accent">R$ {total}</p>
                    </div>
                    <div className="relative z-10 mt-2 w-full bg-muted/30 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${fillPercent}%`, background: sq.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Create Bet + History + Squad Badges */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4">
          <div className="card-glass rounded-xl p-5 h-full">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Flame className="w-4 h-4 text-primary" /> Nova Aposta
            </h3>
            {activeBet ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                Há uma aposta ativa. Encerre-a antes de iniciar outra.
              </p>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Tipo</label>
                  <div className="flex rounded-lg overflow-hidden border border-border/30">
                    <button
                      onClick={() => setNewBetType("WEEKLY")}
                      className={`flex-1 px-3 py-1.5 text-xs font-semibold transition-all ${
                        newBetType === "WEEKLY"
                          ? "gradient-primary text-primary-foreground"
                          : "bg-muted/30 text-muted-foreground"
                      }`}
                    >
                      Semanal
                    </button>
                    <button
                      onClick={() => setNewBetType("MONTHLY")}
                      className={`flex-1 px-3 py-1.5 text-xs font-semibold transition-all ${
                        newBetType === "MONTHLY"
                          ? "gradient-primary text-primary-foreground"
                          : "bg-muted/30 text-muted-foreground"
                      }`}
                    >
                      Mensal
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Valor (R$)</label>
                  <input
                    type="number"
                    value={newBetValue}
                    onChange={(e) => setNewBetValue(Number(e.target.value))}
                    className="w-full bg-muted/30 border border-border/30 rounded-lg px-3 py-2 text-foreground text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Critério de vitória</label>
                  <select
                    value={newBetCriteriaIdx}
                    onChange={(e) => setNewBetCriteriaIdx(Number(e.target.value))}
                    className="w-full bg-muted/30 border border-border/30 rounded-lg px-3 py-2 text-foreground text-sm"
                  >
                    {CRITERIA_PRESETS.map((c, i) => (
                      <option key={i} value={i}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={startBet}
                  disabled={createBetMut.isPending || squads.length === 0}
                  className="w-full px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {createBetMut.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Iniciar Aposta
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-4">
          <div className="card-glass rounded-xl p-5 h-full">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-accent" /> Histórico de Apostas
            </h3>
            <div className="space-y-2">
              {finishedBets.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Nenhuma rodada finalizada
                </p>
              )}
              {finishedBets.slice(0, 6).map((bet) => (
                <div key={bet.id} className="flex items-center justify-between bg-muted/15 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-3.5 h-3.5 text-accent" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {bet.roundLabel}
                        <span
                          className={`ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                            bet.type === "MONTHLY"
                              ? "bg-accent/20 text-accent"
                              : "bg-primary/20 text-primary"
                          }`}
                        >
                          {bet.type === "MONTHLY" ? "MÊS" : "SEM"}
                        </span>
                      </p>
                      <p className="text-[10px] text-muted-foreground">{bet.endDate}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-foreground">
                      {bet.winnerSquad ? `${bet.winnerSquad.emoji} ${bet.winnerSquad.name}` : "—"}
                    </span>
                    <p className="text-xs font-bold font-mono text-accent">R$ {bet.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-4">
          <div className="card-glass rounded-xl p-5 h-full">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              🏅 Conquistas de Squad
            </h3>
            <div className="space-y-3">
              {squadBadges.map((badge) => {
                const earnedSquadIds = Object.entries(squadUnlocksBySquad)
                  .filter(([, slugs]) => slugs.has(badge.slug))
                  .map(([sid]) => sid);
                const earnedSquads = squads.filter((s) => earnedSquadIds.includes(s.id));
                const unlocked = earnedSquads.length > 0;
                return (
                  <div
                    key={badge.id}
                    className={`rounded-lg p-3 border ${
                      unlocked
                        ? "border-primary/30 bg-primary/5"
                        : "border-border/20 bg-muted/10 opacity-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{badge.icon}</span>
                      <span className="text-xs font-bold text-foreground">{badge.name}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{badge.description}</p>
                    {earnedSquads.length > 0 && (
                      <div className="flex gap-1 mt-1.5">
                        {earnedSquads.map((sq) => (
                          <span
                            key={sq.id}
                            className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded"
                          >
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
