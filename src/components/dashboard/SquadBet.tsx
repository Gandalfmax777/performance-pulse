import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { type Assessor } from "@/types/assessor";
import { useSquads, useCreateSquad, useDeleteSquad, useUploadSquadLogo, type ApiSquad } from "@/hooks/useSquads";
import { useBets, useCreateBet, useFinishBet, type BetWinnerCriteria } from "@/hooks/useBets";
import { useCofreBalance } from "@/hooks/useCofre";
import { useBadges, useBadgeUnlocks } from "@/hooks/useBadges";
import { SquadLogo } from "@/components/ui/SquadLogo";
import { BadgeIcon } from "@/components/ui/BadgeIcon";
import { resizeImageToBlob } from "@/lib/imageResize";
import {
  useDailyRanking,
  useWeeklyRanking,
  useMonthlyRanking,
  useSemesterRanking,
  type ApiRankingEntry,
} from "@/hooks/useRankings";
import { CircleNotch } from "@phosphor-icons/react";
import {
  Trophy,
  Users,
  Plus,
  Trash,
  Crown,
  TrendUp,
  Target,
  CurrencyDollar,
  CaretDown,
  CaretUp,
  Fire,
  Vault,
  Medal,
} from "@phosphor-icons/react";
import SquadMainEventCard from "./SquadMainEventCard";
import SquadUndercardStandings from "./SquadUndercardStandings";
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
  "hsl(152, 72%, 37%)",
  "hsl(152, 45%, 65%)",
  "hsl(210, 70%, 55%)",
  "hsl(270, 60%, 62%)",
];

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

  // Período dos rankings das squads — Felipe pediu pra ter di\u00e1rio/semanal/
  // mensal/semestral igual ao DailyResults
  type SquadPeriod = "daily" | "weekly" | "monthly" | "semester";
  const [period, setPeriod] = useState<SquadPeriod>("weekly");

  // Carrega todos os 4 rankings — react-query deduplica com caches existentes
  const dailyQ = useDailyRanking();
  const weeklyQ = useWeeklyRanking();
  const monthlyQ = useMonthlyRanking();
  const semesterQ = useSemesterRanking();

  const activeRankings: ApiRankingEntry[] =
    period === "daily" ? dailyQ.data?.rankings ?? []
    : period === "weekly" ? weeklyQ.data?.rankings ?? []
    : period === "monthly" ? monthlyQ.data?.rankings ?? []
    : semesterQ.data?.rankings ?? [];

  /**
   * Map assessorId → perf do per\u00edodo selecionado.
   * Antes, SquadBet usava `m.points`, `m.weeklyGoalPercent` e `m.kpis` direto
   * dos assessors (que s\u00e3o populados pelo weekly ranking). Agora pegamos
   * perf do ranking do per\u00edodo escolhido pra estat\u00edsticas reflitirem o
   * filtro (di\u00e1rio, mensal, semestral).
   */
  const perfByAssessorId = useMemo(() => {
    const map = new Map<string, { points: number; weeklyGoalPercent: number; kpiTotals: Record<string, number> }>();
    for (const r of activeRankings) {
      map.set(r.assessor.id, {
        points: r.rollup.points,
        weeklyGoalPercent: r.rollup.weeklyGoalPercent,
        kpiTotals: r.rollup.kpiTotals ?? {},
      });
    }
    return map;
  }, [activeRankings]);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [expandedSquad, setExpandedSquad] = useState<string | null>(null);
  const uploadLogoMut = useUploadSquadLogo();
  // Edit logo: input compartilhado, controlamos qual squad tá no fluxo
  // pelo state `editingLogoSquadId` (set ao clicar no botão, lido no onChange).
  const editLogoFileInputRef = useRef<HTMLInputElement>(null);
  const [editingLogoSquadId, setEditingLogoSquadId] = useState<string | null>(null);

  // Nova bet form
  const [newBetValue, setNewBetValue] = useState(50);
  const [newBetType, setNewBetType] = useState<"WEEKLY" | "MONTHLY">("WEEKLY");
  const [newBetCriteriaIdx, setNewBetCriteriaIdx] = useState(0);

  // ─── Ranking de squads com estatísticas ──────────────────────────────────
  // Usa perfByAssessorId do período selecionado (daily/weekly/monthly/semester)
  // pra refletir filtro do usuário. Antes era sempre weekly via assessors.kpis.
  const rankedSquads = useMemo(() => {
    const get = (assessorId: string, key: string): number =>
      perfByAssessorId.get(assessorId)?.kpiTotals[key] ?? 0;

    return squads
      .map((sq) => {
        const members = assessors.filter((a) => sq.members.some((m) => m.assessorId === a.id));
        const n = Math.max(members.length, 1);
        const stats = {
          leads: +(members.reduce((s, m) => s + get(m.id, "leads"), 0) / n).toFixed(1),
          cadencia: +(members.reduce((s, m) => s + get(m.id, "cadencia"), 0) / n).toFixed(1),
          ligacoes: +(members.reduce((s, m) => s + get(m.id, "ligacoes"), 0) / n).toFixed(1),
          reunioes: +(members.reduce((s, m) => s + get(m.id, "reunioes"), 0) / n).toFixed(1),
          reunioes_real: +(members.reduce((s, m) => s + get(m.id, "reunioes_realizadas"), 0) / n).toFixed(1),
          indicacoes: +(members.reduce((s, m) => s + get(m.id, "indicacoes"), 0) / n).toFixed(1),
          ativacao: +(members.reduce((s, m) => s + get(m.id, "ativacao_conta"), 0) / n).toFixed(1),
          totalPoints: members.reduce(
            (s, m) => s + (perfByAssessorId.get(m.id)?.points ?? 0),
            0,
          ),
          avgGoal: +(members.reduce(
            (s, m) => s + (perfByAssessorId.get(m.id)?.weeklyGoalPercent ?? 0),
            0,
          ) / n).toFixed(1),
        };
        return { sq, members, stats };
      })
      .sort((a, b) => b.stats.avgGoal - a.stats.avgGoal);
  }, [squads, assessors, perfByAssessorId]);

  const assignedIds = useMemo(
    () => squads.flatMap((s) => s.members.map((m) => m.assessorId)),
    [squads],
  );

  const resetCreateForm = () => {
    setNewName("");
    setLogoFile(null);
    setLogoPreview(null);
    setSelectedMembers([]);
    setShowCreate(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem (PNG/JPG/WebP)");
      return;
    }
    setLogoFile(file);
    const url = URL.createObjectURL(file);
    setLogoPreview(url);
  };

  const createSquad = () => {
    if (!newName.trim() || selectedMembers.length === 0) return;
    const randomHsl = `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`;
    createSquadMut.mutate(
      {
        name: newName.trim(),
        color: randomHsl,
        leaderId: selectedMembers[0],
        memberIds: selectedMembers,
      },
      {
        onSuccess: async (createdSquad) => {
          // Se admin escolheu logo, faz upload em sequência. Falha do upload
          // não bloqueia criação — squad existe, admin pode tentar de novo.
          if (logoFile) {
            try {
              const blob = await resizeImageToBlob(logoFile);
              await uploadLogoMut.mutateAsync({ squadId: createdSquad.id, blob });
            } catch (err) {
              toast.error(
                err instanceof Error ? err.message : "Falha ao subir logo",
              );
            }
          }
          resetCreateForm();
        },
      },
    );
  };

  const removeSquad = (id: string) => {
    if (!confirm("Remover squad?")) return;
    deleteSquadMut.mutate(id);
  };

  const triggerEditLogo = (squadId: string) => {
    setEditingLogoSquadId(squadId);
    editLogoFileInputRef.current?.click();
  };

  const handleEditLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const squadId = editingLogoSquadId;
    if (!file || !squadId) {
      setEditingLogoSquadId(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem (PNG/JPG/WebP)");
      setEditingLogoSquadId(null);
      if (editLogoFileInputRef.current) editLogoFileInputRef.current.value = "";
      return;
    }
    try {
      const blob = await resizeImageToBlob(file);
      await uploadLogoMut.mutateAsync({ squadId, blob });
      toast.success("Logo atualizado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao subir logo");
    } finally {
      setEditingLogoSquadId(null);
      if (editLogoFileInputRef.current) editLogoFileInputRef.current.value = "";
    }
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
    { metric: "Reuniões Ag.", ...Object.fromEntries(rankedSquads.map((s) => [s.sq.id, s.stats.reunioes])) },
    { metric: "Reuniões Real.", ...Object.fromEntries(rankedSquads.map((s) => [s.sq.id, s.stats.reunioes_real])) },
    { metric: "Ativações", ...Object.fromEntries(rankedSquads.map((s) => [s.sq.id, s.stats.ativacao])) },
    { metric: "Indicações", ...Object.fromEntries(rankedSquads.map((s) => [s.sq.id, s.stats.indicacoes])) },
  ];

  // Domain + ticks explícitos pro radar. Max real dos dados + ~40% de padding,
  // e ticks array PARA EM 3 valores abaixo do max — o eixo continua até o topo
  // mas não mostra número ali, deixando espaço visível entre o último label
  // ("8") e o label do KPI ("Leads").
  const radarMaxValue = useMemo(() => {
    const all = radarData.flatMap((d) =>
      Object.entries(d)
        .filter(([k]) => k !== "metric")
        .map(([, v]) => (typeof v === "number" ? v : 0)),
    );
    return Math.max(1, ...all);
  }, [radarData]);
  const radarDomainMax = Math.max(4, Math.ceil(radarMaxValue * 1.4));
  const radarStep = Math.max(1, Math.ceil(radarDomainMax / 4));
  const radarTicks = [radarStep, radarStep * 2, radarStep * 3].filter(
    (t) => t < radarDomainMax,
  );

  const barData = rankedSquads.map((s) => ({
    name: s.sq.name,
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
      <div className="rounded-[14px] border border-line bg-card p-8 text-center">
        <CircleNotch size={32} className="text-ink-3 mx-auto animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Input compartilhado pra "Trocar logo" de squads existentes — controlado
          via state `editingLogoSquadId`. Fica fora do map pra evitar duplicação. */}
      <input
        ref={editLogoFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleEditLogoChange}
      />

      {/* Editorial V1 — Main Event hero card no topo (só renderiza se tiver bet ATIVA) */}
      <SquadMainEventCard assessors={assessors} />

      {/* Undercard + Standings (artboard SquadBetV1) */}
      <SquadUndercardStandings />

      {/* Action bar — título já vem da DashboardTopbar do Index */}
      <div className="flex items-center justify-end">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 rounded-[7px] bg-ink text-white text-sm font-semibold flex items-center gap-2 hover:bg-ink/90 transition-colors"
        >
          <Plus size={14} weight="bold" /> Criar Squad
        </button>
      </div>

      {/* Create Squad Panel */}
      {showCreate && (
        <div className="rounded-[14px] border border-line bg-card p-5 animate-fade-in space-y-4">
          <h3 className="text-sm font-extrabold tracking-tight text-ink flex items-center gap-2">
            <Users size={14} weight="bold" className="text-ink-3" /> Nova Squad
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-ink-3 mb-1 block">Logo (opcional)</label>
              <div className="flex items-center gap-3">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="preview"
                    className="w-14 h-14 rounded-md object-cover border border-line/40"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-md bg-surface-2 border border-line/40 flex items-center justify-center text-ink-3 text-[10px] uppercase">
                    sem logo
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-[7px] bg-surface-2 border border-line text-ink text-xs font-semibold hover:bg-surface-2/70 transition-colors"
                >
                  {logoFile ? "Trocar" : "Escolher"}
                </button>
              </div>
              <p className="text-[10px] text-ink-3/70 mt-1.5">
                Mín 256×256, até 10 MB
              </p>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-ink-3 mb-1 block">Nome da Squad</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Alfa Traders"
                className="w-full bg-surface-2 border border-line rounded-[7px] px-3 py-2 text-ink text-sm placeholder:text-ink-3/60"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-ink-3 mb-2 block">
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
                    className={`px-3 py-1.5 rounded-[7px] text-xs font-medium transition-all ${
                      assigned
                        ? "bg-surface-2/50 text-ink-3/40 cursor-not-allowed"
                        : selected
                        ? "bg-ink text-white"
                        : "bg-surface-2 text-ink border border-line hover:bg-surface-2/70"
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
            className="px-5 py-2 rounded-[7px] bg-ink text-white text-sm font-semibold hover:bg-ink/90 disabled:bg-surface-2 disabled:text-ink-3 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {createSquadMut.isPending && <CircleNotch size={16} className="animate-spin" />}
            Criar Squad
          </button>
        </div>
      )}

      {/* Active Bet Banner */}
      {activeBet && (
        <div className="rounded-[14px] border border-line bg-card p-4 border-l-2 border-l-gold animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Fire size={22} weight="fill" className="text-gold-deep" />
              <div>
                <p className="text-sm font-extrabold tracking-tight text-ink">
                  Aposta Ativa: {activeBet.roundLabel}
                  <span
                    className={`ml-2 text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      activeBet.type === "MONTHLY"
                        ? "bg-gold/20 text-gold-deep"
                        : "bg-eqi/15 text-eqi"
                    }`}
                  >
                    {activeBet.type === "MONTHLY" ? "MENSAL" : "SEMANAL"}
                  </span>
                </p>
                <p className="text-xs text-ink-3">
                  R$ {activeBet.value} • {criteriaLabel(activeBet.winnerCriteriaJson)}
                </p>
              </div>
            </div>
            <button
              onClick={() => finishBetMut.mutate(activeBet.id)}
              disabled={finishBetMut.isPending}
              className="px-4 py-2 rounded-[7px] bg-ink text-white text-xs font-bold hover:bg-ink/90 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {finishBetMut.isPending && <CircleNotch size={12} className="animate-spin" />}
              Encerrar Rodada
            </button>
          </div>
        </div>
      )}

      {/* Filtro de período — afeta Ranking + Radar + Performance vs Meta */}
      <div className="rounded-[14px] border border-line bg-card p-3 flex items-center gap-3 flex-wrap">
        <span className="text-xs font-bold text-ink">Período:</span>
        <div className="flex gap-1 bg-surface-2 rounded-[7px] p-1">
          {([
            { key: "daily", label: "Diário" },
            { key: "weekly", label: "Semanal" },
            { key: "monthly", label: "Mensal" },
            { key: "semester", label: "Semestral" },
          ] as const).map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1 rounded-[5px] text-xs font-semibold transition-all ${
                period === p.key
                  ? "bg-ink text-white"
                  : "text-ink-3 hover:text-ink"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-ink-3 ml-auto">
          Estatísticas das squads refletem o período selecionado
        </span>
      </div>

      {/* Row 1: Ranking + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5">
          <div className="rounded-[14px] border border-line bg-card p-5 h-full">
            <h3 className="text-sm font-extrabold tracking-tight text-ink mb-4 flex items-center gap-2">
              <Trophy size={14} weight="fill" className="text-gold-deep" /> Ranking de Squads
            </h3>
            <div className="space-y-3">
              {rankedSquads.length === 0 && (
                <p className="text-xs text-ink-3 text-center py-6">
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
                      className={`rounded-[14px] p-4 cursor-pointer transition-all ${
                        isFirst
                          ? "border border-gold/40 bg-gold/5"
                          : "bg-surface-2/50 border border-line hover:bg-surface-2"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-[10px] flex items-center justify-center ${
                              isFirst ? "bg-gold/20" : "bg-surface-2"
                            }`}
                          >
                            {isFirst ? (
                              <Crown size={18} weight="fill" className="text-gold-deep" />
                            ) : (
                              <SquadLogo squad={sq} size={32} />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-extrabold tracking-tight text-ink flex items-center gap-2">
                              {sq.name}
                              {isFirst && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/20 text-gold-deep font-bold">
                                  LÍDER
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-ink-3">
                              {row.members.length} membros • {wins} vitória{wins !== 1 ? "s" : ""} • R$ {totalBetValue(sq.id)} ganhos
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-lg font-bold font-mono text-ink">{row.stats.avgGoal}%</p>
                            <p className="text-[10px] text-ink-3">Meta Média</p>
                          </div>
                          {expanded ? <CaretUp size={14} weight="bold" className="text-ink-3" /> : <CaretDown size={14} weight="bold" className="text-ink-3" />}
                        </div>
                      </div>
                    </div>
                    {expanded && (
                      <div className="bg-surface-2/30 rounded-b-[14px] p-4 border border-t-0 border-line space-y-3 animate-fade-in">
                        <div>
                          <p className="text-xs text-ink-3 mb-2 font-semibold">Membros</p>
                          <div className="space-y-1.5">
                            {row.members.map((m) => (
                              <div key={m.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-eqi/20 flex items-center justify-center text-[10px] font-bold text-eqi">
                                    {m.avatar}
                                  </div>
                                  <span className="text-xs text-ink">{m.name}</span>
                                  {m.id === sq.leaderId && <Crown size={11} weight="fill" className="text-gold-deep" />}
                                </div>
                                <span className="text-xs font-mono text-ink-3">{m.weeklyGoalPercent}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: "Leads", value: row.stats.leads },
                            { label: "Cadência", value: `${row.stats.cadencia}%` },
                            { label: "Ligações", value: row.stats.ligacoes },
                            { label: "Reuniões Ag.", value: row.stats.reunioes },
                            { label: "Reuniões Real.", value: row.stats.reunioes_real },
                            { label: "Ativações", value: row.stats.ativacao },
                            { label: "Indicações", value: row.stats.indicacoes },
                          ].map((k) => (
                            <div key={k.label} className="bg-surface-2 rounded-[7px] p-2 text-center">
                              <p className="text-[10px] text-ink-3">{k.label}</p>
                              <p className="text-sm font-bold font-mono text-ink">{k.value}</p>
                            </div>
                          ))}
                        </div>
                        {earnedBadges.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {earnedBadges.map((b) => (
                              <span
                                key={b.id}
                                className="text-xs bg-eqi/10 text-eqi px-2 py-1 rounded-[7px] inline-flex items-center gap-1"
                                title={b.description}
                              >
                                <BadgeIcon slug={b.icon} size={12} />
                                {b.name}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => triggerEditLogo(sq.id)}
                            disabled={uploadLogoMut.isPending && editingLogoSquadId === sq.id}
                            className="text-xs text-ink-3 hover:text-ink flex items-center gap-1 transition-colors disabled:opacity-50"
                          >
                            {uploadLogoMut.isPending && editingLogoSquadId === sq.id ? (
                              <CircleNotch size={12} className="animate-spin" />
                            ) : (
                              <Plus size={11} weight="bold" />
                            )}{" "}
                            {sq.logoUrl ? "Trocar logo" : "Subir logo"}
                          </button>
                          <button
                            onClick={() => removeSquad(sq.id)}
                            className="text-xs text-destructive/70 hover:text-destructive flex items-center gap-1 transition-colors"
                          >
                            <Trash size={11} weight="bold" /> Remover Squad
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="rounded-[14px] border border-line bg-card p-5 h-full">
            <h3 className="text-sm font-extrabold tracking-tight text-ink mb-3 flex items-center gap-2">
              <Target size={14} weight="bold" className="text-ink-3" /> Comparativo de Squads
            </h3>
            {rankedSquads.length >= 2 ? (
              <ResponsiveContainer width="100%" height={380}>
                <RadarChart
                  data={radarData}
                  margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
                  outerRadius="72%"
                >
                  <PolarGrid stroke="hsl(var(--border))" />
                  {/* Labels dos eixos (Leads, Cadência, etc) em fontWeight bold
                      + cor foreground pra ganhar contraste. Antes eram muted-sm
                      e ficavam quase invisíveis. */}
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fill: "hsl(var(--foreground))", fontSize: 14, fontWeight: 600 }}
                  />
                  {/* Valores radiais: eixo vertical (angle=90), números
                      horizontais. `ticks` é array EXPLÍCITO que PARA antes
                      do edge do domain (ex: domain=15, ticks=[0,4,8,12]) —
                      recharts não gera automaticamente uma tick no max,
                      garantindo que não grude no label "Leads" do topo. */}
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, radarDomainMax]}
                    ticks={radarTicks as never}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  />
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
                  <Legend formatter={(value) => `${value}`} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      color: "hsl(var(--foreground))",
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-ink-3 text-center py-10">
                Crie pelo menos 2 squads para ver o comparativo
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Performance Bar + Cofre */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7">
          <div className="rounded-[14px] border border-line bg-card p-5 h-full">
            <h3 className="text-sm font-extrabold tracking-tight text-ink mb-3 flex items-center gap-2">
              <TrendUp size={14} weight="bold" className="text-eqi" /> Performance vs Meta
            </h3>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      color: "hsl(var(--foreground))",
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                  />
                  <Bar dataKey="Meta %" fill="hsl(152,70%,45%)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Pontos" fill="hsl(200,70%,50%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-ink-3 text-center py-10">Sem squads</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-[14px] border border-line bg-card p-5 h-full">
            <h3 className="text-sm font-extrabold tracking-tight text-ink mb-4 flex items-center gap-2">
              <Vault size={14} weight="fill" className="text-gold-deep" /> Cofre de Apostas
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
                    className="rounded-[14px] border border-line bg-surface-2/50 p-4 relative overflow-hidden"
                  >
                    <div
                      className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out opacity-15"
                      style={{ height: `${fillPercent}%`, background: sq.color }}
                    />
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <SquadLogo squad={sq} size={28} />
                        <div>
                          <span className="text-xs font-extrabold tracking-tight text-ink">{sq.name}</span>
                          <p className="text-[10px] text-ink-3">
                            {wins} vitória{wins !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <p className="text-xl font-bold font-mono text-gold-deep">R$ {total}</p>
                    </div>
                    <div className="relative z-10 mt-2 w-full bg-surface-2 rounded-full h-1.5 overflow-hidden">
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4">
          <div className="rounded-[14px] border border-line bg-card p-5 h-full">
            <h3 className="text-sm font-extrabold tracking-tight text-ink mb-3 flex items-center gap-2">
              <Fire size={14} weight="fill" className="text-gold-deep" /> Nova Aposta
            </h3>
            {activeBet ? (
              <p className="text-xs text-ink-3 text-center py-6">
                Há uma aposta ativa. Encerre-a antes de iniciar outra.
              </p>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-ink-3 mb-1 block">Tipo</label>
                  <div className="flex rounded-[7px] overflow-hidden border border-line">
                    <button
                      onClick={() => setNewBetType("WEEKLY")}
                      className={`flex-1 px-3 py-1.5 text-xs font-semibold transition-all ${
                        newBetType === "WEEKLY"
                          ? "bg-ink text-white"
                          : "bg-surface-2 text-ink-3 hover:text-ink"
                      }`}
                    >
                      Semanal
                    </button>
                    <button
                      onClick={() => setNewBetType("MONTHLY")}
                      className={`flex-1 px-3 py-1.5 text-xs font-semibold transition-all ${
                        newBetType === "MONTHLY"
                          ? "bg-ink text-white"
                          : "bg-surface-2 text-ink-3 hover:text-ink"
                      }`}
                    >
                      Mensal
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-ink-3 mb-1 block">Valor (R$)</label>
                  <input
                    type="number"
                    value={newBetValue}
                    onChange={(e) => setNewBetValue(Number(e.target.value))}
                    className="w-full bg-surface-2 border border-line rounded-[7px] px-3 py-2 text-ink text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-ink-3 mb-1 block">Critério de vitória</label>
                  <select
                    value={newBetCriteriaIdx}
                    onChange={(e) => setNewBetCriteriaIdx(Number(e.target.value))}
                    className="w-full bg-surface-2 border border-line rounded-[7px] px-3 py-2 text-ink text-sm"
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
                  className="w-full px-4 py-2 rounded-[7px] bg-ink text-white text-sm font-bold hover:bg-ink/90 disabled:bg-surface-2 disabled:text-ink-3 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {createBetMut.isPending && <CircleNotch size={16} className="animate-spin" />}
                  Iniciar Aposta
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="rounded-[14px] border border-line bg-card p-5 h-full">
            <h3 className="text-sm font-extrabold tracking-tight text-ink mb-3 flex items-center gap-2">
              <CurrencyDollar size={14} weight="bold" className="text-gold-deep" /> Histórico de Apostas
            </h3>
            <div className="space-y-2">
              {finishedBets.length === 0 && (
                <p className="text-xs text-ink-3 text-center py-4">
                  Nenhuma rodada finalizada
                </p>
              )}
              {finishedBets.slice(0, 6).map((bet) => (
                <div key={bet.id} className="flex items-center justify-between bg-surface-2/50 rounded-[7px] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Trophy size={13} weight="fill" className="text-gold-deep" />
                    <div>
                      <p className="text-xs font-semibold text-ink">
                        {bet.roundLabel}
                        <span
                          className={`ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                            bet.type === "MONTHLY"
                              ? "bg-gold/20 text-gold-deep"
                              : "bg-eqi/15 text-eqi"
                          }`}
                        >
                          {bet.type === "MONTHLY" ? "MÊS" : "SEM"}
                        </span>
                      </p>
                      <p className="text-[10px] text-ink-3">{bet.endDate}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-ink inline-flex items-center gap-1.5 justify-end">
                      {bet.winnerSquad ? (
                        <>
                          <SquadLogo squad={bet.winnerSquad} size={14} />
                          {bet.winnerSquad.name}
                        </>
                      ) : "—"}
                    </span>
                    <p className="text-xs font-bold font-mono text-gold-deep">R$ {bet.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="rounded-[14px] border border-line bg-card p-5 h-full">
            <h3 className="text-sm font-extrabold tracking-tight text-ink mb-3 flex items-center gap-2">
              <Medal size={14} weight="fill" className="text-gold-deep" /> Conquistas de Squad
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
                    className={`rounded-[7px] p-3 border ${
                      unlocked
                        ? "border-eqi/30 bg-eqi/5"
                        : "border-line bg-surface-2/30 opacity-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <BadgeIcon slug={badge.icon} size={16} className="text-eqi" />
                      <span className="text-xs font-extrabold tracking-tight text-ink">{badge.name}</span>
                    </div>
                    <p className="text-[10px] text-ink-3">{badge.description}</p>
                    {earnedSquads.length > 0 && (
                      <div className="flex gap-1 mt-1.5">
                        {earnedSquads.map((sq) => (
                          <span
                            key={sq.id}
                            className="text-[10px] bg-eqi/10 text-eqi px-1.5 py-0.5 rounded inline-flex items-center gap-1"
                          >
                            <SquadLogo squad={sq} size={10} />
                            {sq.name}
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
