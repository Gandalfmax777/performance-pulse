import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Users, User } from "@phosphor-icons/react";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import DailyResults from "@/components/dashboard/DailyResults";
import { AppShellLayout } from "@/components/layouts/AppShellLayout";
import { useAssessors } from "@/hooks/useAssessors";
import { useOpenTv } from "@/hooks/useOpenTv";

type Period = "daily" | "weekly" | "monthly" | "semester";
type RankType = "individuals" | "squads";

const PERIODS: { value: Period; label: string }[] = [
  { value: "daily", label: "Diário" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "semester", label: "Semestral" },
];

const VALID_PERIODS = new Set<Period>(["daily", "weekly", "monthly", "semester"]);
const VALID_TYPES = new Set<RankType>(["individuals", "squads"]);

function parsePeriod(raw: string | null): Period {
  return raw && VALID_PERIODS.has(raw as Period) ? (raw as Period) : "weekly";
}
function parseType(raw: string | null): RankType {
  return raw && VALID_TYPES.has(raw as RankType) ? (raw as RankType) : "individuals";
}

/**
 * /ranking — alinha com `design/Ranking.html`.
 *
 * Topbar:
 *   • Toggle "Indivíduos / Squads" (rankType)
 *   • Period tabs (Diário/Semanal/Mensal/Semestral)
 *
 * Body:
 *   DailyResults renderiza condicionalmente:
 *   - "individuals": 3 podium cards + filters bar + LeagueTable + RankingHighlights aside
 *   - "squads": SquadStandingsGrid agregando por squad
 */
const Ranking = () => {
  const { assessors } = useAssessors();
  const [searchParams, setSearchParams] = useSearchParams();
  const period = parsePeriod(searchParams.get("period"));
  const rankType = parseType(searchParams.get("type"));

  const setPeriod = useCallback(
    (p: Period) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("period", p);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setRankType = useCallback(
    (t: RankType) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("type", t);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const openTv = useOpenTv();

  const openPresentation = useCallback(() => {
    window.open("/presentation", "_blank", "noopener,noreferrer");
  }, []);

  const typeToggle = (
    <div className="flex gap-1 p-[3px] bg-surface-2 rounded-[8px] border border-line">
      <button
        onClick={() => setRankType("individuals")}
        aria-pressed={rankType === "individuals"}
        className={`px-3 py-[5px] rounded-[5px] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
          rankType === "individuals" ? "bg-ink text-white" : "text-ink-2 hover:text-ink"
        }`}
      >
        <User size={12} weight="bold" /> Indivíduos
      </button>
      <button
        onClick={() => setRankType("squads")}
        aria-pressed={rankType === "squads"}
        className={`px-3 py-[5px] rounded-[5px] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
          rankType === "squads" ? "bg-ink text-white" : "text-ink-2 hover:text-ink"
        }`}
      >
        <Users size={12} weight="bold" /> Squads
      </button>
    </div>
  );

  const periodTabs = (
    <div className="flex gap-1 p-[3px] bg-surface-2 rounded-[8px] border border-line">
      {PERIODS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setPeriod(opt.value)}
          aria-pressed={period === opt.value}
          className={`px-3 py-[5px] rounded-[5px] text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            period === opt.value
              ? "bg-ink text-white"
              : "text-ink-2 hover:text-ink"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  const subtitle =
    rankType === "squads"
      ? "Ranking por squad · agregado por meta % média"
      : "Ranking individual · atualizado em tempo real";

  return (
    <AppShellLayout
      sidebarView="results"
      onEnterTv={openTv}
      onEnterPresentation={openPresentation}
      renderTopbar={({ openMobileNav }) => (
        <DashboardTopbar
          title="Ranking"
          subtitle={subtitle}
          actions={
            <>
              {typeToggle}
              {periodTabs}
            </>
          }
          onMenuClick={openMobileNav}
        />
      )}
    >
      <DailyResults assessors={assessors} period={period} rankType={rankType} />
    </AppShellLayout>
  );
};

export default Ranking;
