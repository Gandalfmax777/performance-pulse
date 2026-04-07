import { useState } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import Leaderboard from "@/components/dashboard/Leaderboard";
import KpiCards from "@/components/dashboard/KpiCards";
import WeeklyHeatmap from "@/components/dashboard/WeeklyHeatmap";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import PerformanceChart from "@/components/dashboard/PerformanceChart";
import BadgesPanel from "@/components/dashboard/BadgesPanel";
import DayView from "@/components/dashboard/DayView";

const Index = () => {
  const [view, setView] = useState<"overview" | "daily">("overview");

  return (
    <div className="min-h-screen bg-background p-5">
      <DashboardHeader />

      {/* View Toggle */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setView("overview")}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            view === "overview"
              ? "gradient-primary text-primary-foreground glow-primary"
              : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-border/30"
          }`}
        >
          Visão Geral
        </button>
        <button
          onClick={() => setView("daily")}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            view === "daily"
              ? "gradient-primary text-primary-foreground glow-primary"
              : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-border/30"
          }`}
        >
          Por Dia
        </button>
      </div>

      {view === "overview" ? (
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
      ) : (
        <DayView />
      )}
    </div>
  );
};

export default Index;
