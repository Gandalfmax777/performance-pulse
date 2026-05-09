import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import DailyResults from "@/components/dashboard/DailyResults";
import { AppShellLayout } from "@/components/layouts/AppShellLayout";
import { useAssessors } from "@/hooks/useAssessors";

type Period = "daily" | "weekly" | "monthly" | "semester";

const PERIODS: { value: Period; label: string }[] = [
  { value: "daily", label: "Diário" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "semester", label: "Semestral" },
];

const VALID_PERIODS = new Set<Period>(["daily", "weekly", "monthly", "semester"]);

function parsePeriod(raw: string | null): Period {
  return raw && VALID_PERIODS.has(raw as Period) ? (raw as Period) : "weekly";
}

/**
 * /ranking — pódio + tabela da liga + highlights laterais.
 *
 * Substitui o redirect placeholder /ranking → /?view=results criado na
 * PR #3. Adota AppShellLayout (PR #4); period tabs movem para o slot
 * `actions` da topbar (segue o padrão do design Ranking.html).
 *
 * O componente de domínio é o DailyResults (pódio + LeagueTable +
 * RankingHighlights). Lógica/dados via useDailyRanking/useWeekly/etc.
 * permanecem intactos.
 */
const Ranking = () => {
  const { assessors } = useAssessors();
  const [searchParams, setSearchParams] = useSearchParams();
  const period = parsePeriod(searchParams.get("period"));

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

  const openTv = useCallback(() => {
    window.open("/tv", "_blank", "noopener,noreferrer");
  }, []);

  const openPresentation = useCallback(() => {
    window.open("/presentation", "_blank", "noopener,noreferrer");
  }, []);

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

  return (
    <AppShellLayout
      sidebarView="results"
      onEnterTv={openTv}
      onEnterPresentation={openPresentation}
      renderTopbar={({ openMobileNav }) => (
        <DashboardTopbar
          title="Ranking"
          subtitle="Atualizado em tempo real"
          actions={periodTabs}
          onMenuClick={openMobileNav}
        />
      )}
    >
      <DailyResults assessors={assessors} period={period} />
    </AppShellLayout>
  );
};

export default Ranking;
