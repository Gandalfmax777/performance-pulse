import { useState } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import Leaderboard from "@/components/dashboard/Leaderboard";
import KpiCards from "@/components/dashboard/KpiCards";
import WeeklyHeatmap from "@/components/dashboard/WeeklyHeatmap";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import PerformanceChart from "@/components/dashboard/PerformanceChart";
import BadgesPanel from "@/components/dashboard/BadgesPanel";
import DayView from "@/components/dashboard/DayView";
import DailyResults from "@/components/dashboard/DailyResults";
import KpiAnalytics from "@/components/dashboard/KpiAnalytics";
import AssessorManager from "@/components/dashboard/AssessorManager";
import SquadBet from "@/components/dashboard/SquadBet";
import { DEFAULT_ASSESSORS, type Assessor } from "@/data/mockData";
import { Settings } from "lucide-react";

type View = "overview" | "daily" | "results" | "kpis" | "squad";

const TABS: { key: View; label: string }[] = [
  { key: "overview", label: "Visão Geral" },
  { key: "daily", label: "Por Dia" },
  { key: "results", label: "Resultado do Dia" },
  { key: "kpis", label: "KPIs & Insights" },
  { key: "squad", label: "⚔️ Squad Bet" },
];

const Index = () => {
  const [view, setView] = useState<View>("overview");
  const [assessors, setAssessors] = useState<Assessor[]>(DEFAULT_ASSESSORS);
  const [showManager, setShowManager] = useState(false);

  const addAssessor = (a: Assessor) => setAssessors(prev => [...prev, a]);
  const removeAssessor = (id: string) => setAssessors(prev => prev.filter(a => a.id !== id));

  return (
    <div className="min-h-screen bg-background p-5">
      <DashboardHeader />

      {/* View Toggle */}
      <div className="flex items-center gap-2 mb-5">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              view === tab.key
                ? "gradient-primary text-primary-foreground glow-primary"
                : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-border/30"
            }`}
          >
            {tab.label}
          </button>
        ))}

        <button
          onClick={() => setShowManager(true)}
          className="ml-auto px-4 py-2 rounded-lg bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-border/30 text-sm font-semibold flex items-center gap-2 transition-all hover:text-foreground"
        >
          <Settings className="w-4 h-4" /> Assessores
        </button>
      </div>

      {view === "overview" && (
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-5 space-y-4">
            <KpiCards />
            <PerformanceChart />
            <BadgesPanel assessors={assessors} />
          </div>
          <div className="col-span-4">
            <Leaderboard assessors={assessors} />
          </div>
          <div className="col-span-3 space-y-4">
            <WeeklyHeatmap />
            <ActivityFeed />
          </div>
        </div>
      )}

      {view === "daily" && <DayView assessors={assessors} />}
      {view === "results" && <DailyResults assessors={assessors} />}
      {view === "kpis" && <KpiAnalytics assessors={assessors} />}

      {showManager && (
        <AssessorManager
          assessors={assessors}
          onAdd={addAssessor}
          onRemove={removeAssessor}
          onClose={() => setShowManager(false)}
        />
      )}
    </div>
  );
};

export default Index;
