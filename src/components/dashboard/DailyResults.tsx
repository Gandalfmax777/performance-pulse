import { useMemo, useState } from "react";
import { Trophy } from "@phosphor-icons/react";
import { type Assessor } from "@/types/assessor";
import {
  useDailyRanking,
  useWeeklyRanking,
  useMonthlyRanking,
  useSemesterRanking,
  type ApiRankingEntry,
} from "@/hooks/useRankings";
import { useSquads } from "@/hooks/useSquads";
import { useOverviewReport } from "@/hooks/useReports";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import LeagueTable, { type LeagueTableRow } from "./LeagueTable";
import { RankingPodiumCard } from "./RankingPodiumCard";
import { RankingFiltersBar, type SortKey } from "./RankingFiltersBar";
import RankingHighlights from "./RankingHighlights";
import { SectionCard } from "@/components/shared";

type Period = "daily" | "weekly" | "monthly" | "semester";

interface DailyResultsProps {
  assessors: Assessor[];
  period: Period;
}

/** Range YYYY-MM-DD do period — para casar com useOverviewReport (KPIs por assessor). */
function rangeFor(period: Period): { from: string; to: string } {
  const now = new Date();
  const fmt = (d: Date) => format(d, "yyyy-MM-dd");
  if (period === "daily") return { from: fmt(now), to: fmt(now) };
  if (period === "weekly")
    return {
      from: fmt(startOfWeek(now, { weekStartsOn: 1 })),
      to: fmt(endOfWeek(now, { weekStartsOn: 1 })),
    };
  if (period === "monthly")
    return { from: fmt(startOfMonth(now)), to: fmt(endOfMonth(now)) };
  // semester
  const m = now.getMonth();
  const semStart = m < 6 ? new Date(now.getFullYear(), 0, 1) : new Date(now.getFullYear(), 6, 1);
  const semEnd = m < 6 ? new Date(now.getFullYear(), 5, 30) : new Date(now.getFullYear(), 11, 31);
  return { from: fmt(semStart), to: fmt(semEnd) };
}

/**
 * /ranking — pódio editorial 3-col + filters bar + tabela completa.
 * Refeito seguindo `Ranking.html`. Lógica de ranking preservada
 * (useDailyRanking/Weekly/Monthly/Semester).
 *
 * - Pódio renderizado em ordem natural (1º, 2º, 3º) — sem swap de
 *   center hero. Card #1 com border accent + medal emoji.
 * - Filtros em SectionCard (squad/sort/buscar) operam só no client.
 * - Tabela mostra colunas KPI extras (Ligações/Reuniões/Real./Ind.)
 *   vindo de useOverviewReport.byAssessor.kpis.
 * - RankingHighlights mantido como widget secundário (aside) abaixo
 *   da tabela quando há dados.
 */
const DailyResults = ({ assessors, period }: DailyResultsProps) => {
  const dailyQ = useDailyRanking();
  const weeklyQ = useWeeklyRanking();
  const monthlyQ = useMonthlyRanking();
  const semesterQ = useSemesterRanking();

  const activeQuery =
    period === "daily" ? dailyQ
    : period === "weekly" ? weeklyQ
    : period === "monthly" ? monthlyQ
    : semesterQ;

  const range = useMemo(() => rangeFor(period), [period]);
  const { data: overview } = useOverviewReport(range);
  const { data: squads = [] } = useSquads();

  const apiRankings: ApiRankingEntry[] = activeQuery.data?.rankings ?? [];

  const squadByAssessor = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    for (const sq of squads) {
      for (const m of sq.members ?? []) {
        map.set(m.assessorId, { id: sq.id, name: sq.name });
      }
    }
    return map;
  }, [squads]);

  const kpisByAssessor = useMemo(() => {
    const map = new Map<string, Record<string, number>>();
    for (const a of overview?.byAssessor ?? []) {
      map.set(a.assessorId, a.kpis);
    }
    return map;
  }, [overview]);

  const ranked = useMemo<LeagueTableRow[]>(() => {
    const assessorById = new Map(assessors.map((a) => [a.id, a]));
    return apiRankings.map((r) => {
      const a = assessorById.get(r.assessor.id);
      const sq = squadByAssessor.get(r.assessor.id);
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
        squadName: sq?.name ?? null,
        kpis: kpisByAssessor.get(r.assessor.id) ?? undefined,
      };
    });
  }, [apiRankings, assessors, squadByAssessor, kpisByAssessor]);

  // ── Filters ────────────────────────────────────────────────────────────
  const [squadFilter, setSquadFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("points");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let rows = ranked;
    if (squadFilter !== "all") {
      rows = rows.filter((r) => {
        const sq = squadByAssessor.get(r.id);
        return sq?.id === squadFilter;
      });
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((r) => r.name.toLowerCase().includes(q));
    }
    if (sort === "goal") {
      rows = [...rows].sort(
        (a, b) => b.weeklyGoalPercent - a.weeklyGoalPercent,
      );
    } else if (sort === "streak") {
      rows = [...rows].sort((a, b) => b.streak - a.streak);
    }
    // sort=points → mantém ordem do backend (já vem ordenado por pontos
    // com zero-guard pra inativos)
    return rows;
  }, [ranked, squadFilter, sort, search, squadByAssessor]);

  // Pódio: top 3 do ranking ordenado por pontos. Só renderiza se o líder
  // pontuou (regra do Felipe: evita "1º com 0 pts e 43%" que confunde).
  const leaderHasPoints = (ranked[0]?.points ?? 0) > 0;
  const top3 = leaderHasPoints ? ranked.slice(0, 3) : [];

  const counterText = `${filtered.length} ${
    filtered.length === 1 ? "AAI" : "AAIs"
  } · ${squads.length} squad${squads.length === 1 ? "" : "s"}`;

  return (
    <div className="space-y-5">
      {/* Pódio 3-col editorial — ou empty state quando ninguém pontuou */}
      {top3.length === 0 ? (
        <SectionCard className="text-center">
          <div className="py-10 flex flex-col items-center gap-2">
            <Trophy size={48} className="text-ink-4" />
            <p className="text-[15px] font-semibold text-ink">
              Ninguém pontuou ainda neste período
            </p>
            <p className="text-[13px] text-ink-3 max-w-md">
              Pode haver atividade registrada (cadência, ligações) mas as
              regras de pontuação ainda não premiaram nenhum assessor. Veja
              as % e KPIs na tabela abaixo.
            </p>
          </div>
        </SectionCard>
      ) : (
        <div
          className={`grid items-stretch gap-4 ${
            top3.length === 3
              ? "grid-cols-1 md:grid-cols-3"
              : top3.length === 2
              ? "grid-cols-1 md:grid-cols-2"
              : "grid-cols-1"
          }`}
        >
          {top3.map((a, i) => {
            const sq = squadByAssessor.get(a.id);
            const rank = (i + 1) as 1 | 2 | 3;
            return (
              <RankingPodiumCard
                key={a.id}
                rank={rank}
                index={i}
                name={a.name}
                avatar={a.avatar}
                photoUrl={a.photoUrl}
                level={a.level}
                points={a.points}
                weeklyGoalPercent={a.weeklyGoalPercent}
                streak={a.streak}
                squadName={sq?.name ?? null}
              />
            );
          })}
        </div>
      )}

      {/* Filters bar */}
      <RankingFiltersBar
        squads={squads.map((s) => ({ id: s.id, name: s.name }))}
        squadFilter={squadFilter}
        onSquadChange={setSquadFilter}
        sort={sort}
        onSortChange={setSort}
        search={search}
        onSearchChange={setSearch}
        counterText={counterText}
      />

      {/* Tabela full + Highlights aside (quando há dados) */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-[1.7fr_1fr]">
        <LeagueTable rows={filtered} />
        <RankingHighlights assessors={assessors} />
      </div>
    </div>
  );
};

export default DailyResults;
