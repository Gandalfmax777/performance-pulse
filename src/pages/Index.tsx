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

type View = "overview" | "daily" | "results" | "kpis";

const TABS: { key: View; label: string }[] = [
  { key: "overview", label: "Visão Geral" },
  { key: "daily", label: "Por Dia" },
  { key: "results", label: "Resultado do Dia" },
  { key: "kpis", label: "KPIs & Insights" },
];

const Index = () => {
  const [view, setView] = useState<View>("overview");

  return (
    <div className="min-h-screen bg-background p-5">
      <DashboardHeader />

      {/* View Toggle */}
      <div className="flex gap-2 mb-5">
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
      </div>

      {view === "overview" && (
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-5 space-y-4">
            <KpiCards />
            <PerformanceChart />
            <BadgesPanel />
          </div>
          <div className="col-span-4">
            <Leaderboard />
          </div>
          <div className="col-span-3 space-y-4">
            <WeeklyHeatmap />
            <ActivityFeed />
          </div>
        </div>
      )}

      {view === "daily" && <DayView />}
      {view === "results" && <DailyResults />}
      {view === "kpis" && <KpiAnalytics />}
    </div>
  );
};

export default Index;
