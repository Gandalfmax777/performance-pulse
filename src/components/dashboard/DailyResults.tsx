import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import {
  Trophy,
  Fire,
  Crown,
} from "@phosphor-icons/react";
import { type Assessor } from "@/types/assessor";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";
import {
  useDailyRanking,
  useWeeklyRanking,
  useMonthlyRanking,
  useSemesterRanking,
  type ApiRankingEntry,
} from "@/hooks/useRankings";
import LeagueTable from "./LeagueTable";
import RankingHighlights from "./RankingHighlights";

type Period = "daily" | "weekly" | "monthly" | "semester";

const PERIOD_OPTIONS: Array<{ value: Period; label: string }> = [
  { value: "daily", label: "Diário" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "semester", label: "Semestral" },
];

interface DailyResultsProps {
  assessors: Assessor[];
}

/** Item enriquecido com dados visuais do assessor (avatar/level). */
interface RankedRow {
  id: string;
  name: string;
  avatar: string;
  photoUrl: string | null;
  level: Assessor["level"];
  points: number;
  weeklyGoalPercent: number;
  streak: number;
  isInactive: boolean;
}

const DailyResults = ({ assessors }: DailyResultsProps) => {
  const [period, setPeriod] = useState<Period>("weekly");

  // Endpoints dedicados por período (antes era fallback degradado em
  // useOverviewReport). Ranking já vem ordenado pelo backend com zero-guard
  // — assessores inativos (0 pts E 0 dias ativos) caem pro fim.
  const dailyQ = useDailyRanking();
  const weeklyQ = useWeeklyRanking();
  const monthlyQ = useMonthlyRanking();
  const semesterQ = useSemesterRanking();

  const activeQuery =
    period === "daily" ? dailyQ
    : period === "weekly" ? weeklyQ
    : period === "monthly" ? monthlyQ
    : semesterQ;

  const apiRankings: ApiRankingEntry[] = activeQuery.data?.rankings ?? [];

  // Mapeia rankings do backend pra rows enriquecidas com avatar/level/streak
  // (que vêm do estado local de assessors). Mantém a ORDEM do backend pra
  // preservar o tie-break com zero-guard.
  const ranked = useMemo<RankedRow[]>(() => {
    const assessorById = new Map(assessors.map((a) => [a.id, a]));
    return apiRankings.map((r) => {
      const a = assessorById.get(r.assessor.id);
      return {
        id: r.assessor.id,
        name: r.assessor.name,
        avatar: a?.avatar ?? r.assessor.initials,
        photoUrl: r.assessor.photoUrl,
        level: a?.level ?? (r.assessor.level.toLowerCase() as Assessor["level"]),
        points: r.rollup.points,
        weeklyGoalPercent: r.rollup.weeklyGoalPercent,
        streak: r.rollup.streak,
        isInactive: r.rollup.points === 0 && r.rollup.activeDays.length === 0,
      };
    });
  }, [apiRankings, assessors]);

  // Pódio só aparece quando o LÍDER pontuou (regra do Felipe: evita "Diego 1º
  // com 0 pts + 43%" que confunde). Quando há líder, mostramos top 3 do
  // ranking direto (mesmo se 2º/3º têm 0 pts) — preserva consistência com a
  // Tabela da Liga abaixo e evita slot vazio no grid.
  const leaderHasPoints = (ranked[0]?.points ?? 0) > 0;
  const top3 = leaderHasPoints ? ranked.slice(0, 3) : [];
  const hasAnyPoints = top3.length > 0;
  const hasFullPodium = top3.length === 3;
  // Ordem: 2º na esquerda, 1º no centro (hero), 3º na direita. Quando o
  // ranking tem < 3 elementos, exibimos só o que existe sem reservar slots.
  const podiumOrder = hasFullPodium ? [top3[1], top3[0], top3[2]] : top3;

  return (
    <div className="space-y-6">
      {/* Period selector — Editorial V1 (eyebrow + segmented preto) */}
      <div className="rounded-[14px] border border-line bg-card p-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Trophy size={18} weight="fill" className="text-gold-deep" />
          <div className="leading-tight">
            <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-ink-3">
              LIGA EQI
            </p>
            <p className="text-[14px] font-extrabold text-ink">Ranking Geral</p>
          </div>
        </div>
        <div className="flex gap-1 p-[3px] bg-surface-2 rounded-[8px] border border-line ml-auto">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-3 py-[5px] rounded-[5px] text-xs font-semibold transition-all ${
                period === opt.value
                  ? "bg-ink text-white"
                  : "text-ink-2 hover:text-ink"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {activeQuery.isLoading && <Loader2 className="w-4 h-4 animate-spin text-ink-3" />}
      </div>

      {/* Podium — Editorial V1 (header dark + 3-column cards com serif italic gigante) */}
      <div className="rounded-[14px] border border-line bg-card overflow-hidden">
        <div
          className="px-6 py-3 flex justify-between items-center text-white"
          style={{ background: "hsl(var(--ink))" }}
        >
          <div className="flex items-center gap-3">
            <Trophy size={16} weight="fill" style={{ color: "hsl(var(--gold))" }} />
            <div className="leading-tight">
              <p
                className="text-[9px] uppercase tracking-[0.12em] font-semibold"
                style={{ color: "hsl(var(--gold))" }}
              >
                PÓDIO DA SEMANA
              </p>
              <p className="text-[14px] font-bold mt-0.5">
                Os três que estão fazendo a mesa girar
              </p>
            </div>
          </div>
          <span
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-extrabold tracking-[0.1em]"
            style={{
              background: "oklch(0.55 0.22 25 / 0.18)",
              borderColor: "oklch(0.55 0.22 25 / 0.4)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: "oklch(0.65 0.24 25)" }}
            />
            AO VIVO
          </span>
        </div>
        {!hasAnyPoints ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Trophy size={48} className="text-ink-4 mb-3" />
            <p className="text-sm font-semibold text-ink mb-1">
              Ninguém pontuou ainda neste período
            </p>
            <p className="text-xs text-ink-3 max-w-md">
              Pode haver atividade registrada (cadência, ligações) mas as regras de
              pontuação ainda não premiaram nenhum assessor. Veja as % nos cards abaixo.
            </p>
          </div>
        ) : (
          <div
            className={`grid items-stretch ${
              hasFullPodium
                ? "grid-cols-3"
                : top3.length === 2
                ? "grid-cols-2"
                : "grid-cols-1"
            }`}
          >
            {podiumOrder.map((a, i) => {
              if (!a) return null;
              // Em pódio cheio (3 cards) usamos a ordem [2º, 1º, 3º] pra
              // posicionar o líder no centro (hero). Sem pódio cheio (1 ou 2),
              // mantemos a ordem natural (1º à esquerda).
              const place = hasFullPodium ? (i === 1 ? 1 : i === 0 ? 2 : 3) : i + 1;
              const hero = place === 1;
              const accent =
                place === 1
                  ? "hsl(var(--gold-deep))"
                  : place === 2
                  ? "hsl(var(--silver))"
                  : "hsl(var(--bronze))";
              const isLastInRow = i === podiumOrder.length - 1;
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className={`p-7 ${!isLastInRow ? "border-r border-line" : ""}`}
                  style={{
                    background:
                      place === 1
                        ? "linear-gradient(180deg, oklch(0.96 0.06 75) 0%, white 100%)"
                        : "white",
                    minHeight: hero ? 200 : 160,
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <Crown
                      size={hero ? 40 : 28}
                      weight="fill"
                      style={{ color: accent }}
                    />
                    <p
                      className="font-mono font-extrabold leading-none tracking-[-0.04em]"
                      style={{ fontSize: hero ? 60 : 44, color: accent }}
                    >
                      {place}º
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <AssessorAvatar
                      initials={a.avatar}
                      photoUrl={a.photoUrl}
                      level={a.level}
                      size={hero ? 56 : 42}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className="font-extrabold tracking-tight leading-tight text-ink truncate"
                        style={{ fontSize: hero ? 18 : 14 }}
                      >
                        {a.name}
                      </p>
                      <p className="font-mono text-[11px] text-ink-3 mt-1">
                        {a.points.toLocaleString("pt-BR")} pts
                      </p>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p
                      className="font-mono font-extrabold leading-none tracking-[-0.04em]"
                      style={{
                        fontSize: hero ? 44 : 32,
                        color:
                          a.weeklyGoalPercent >= 100
                            ? "hsl(var(--eqi-green))"
                            : "hsl(var(--ink))",
                      }}
                    >
                      {a.weeklyGoalPercent}
                      <span className="text-base text-ink-3">%</span>
                    </p>
                    <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-ink-3">
                      DA META
                    </p>
                  </div>
                  {a.streak > 0 && (
                    <span
                      className="inline-flex items-center gap-1 mt-3 px-2 py-0.5 rounded-full text-[10px] font-extrabold"
                      style={{ background: "hsl(var(--gold-soft))", color: "hsl(var(--gold-deep))" }}
                    >
                      <Fire size={10} weight="fill" /> {a.streak}d
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tabela da Liga + Highlights side panel (artboard RankingScreen) */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-[1.7fr_1fr]">
        <LeagueTable rows={ranked} />
        <RankingHighlights assessors={assessors} />
      </div>
    </div>
  );
};

export default DailyResults;
