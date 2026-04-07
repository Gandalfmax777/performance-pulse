import DashboardHeader from "@/components/dashboard/DashboardHeader";
import Leaderboard from "@/components/dashboard/Leaderboard";
import KpiCards from "@/components/dashboard/KpiCards";
import PomodoroTimer from "@/components/dashboard/PomodoroTimer";
import WeeklyHeatmap from "@/components/dashboard/WeeklyHeatmap";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import PerformanceChart from "@/components/dashboard/PerformanceChart";
import BadgesPanel from "@/components/dashboard/BadgesPanel";

const Index = () => {
  return (
    <div className="min-h-screen bg-background p-5">
      <DashboardHeader />

      <div className="grid grid-cols-12 gap-4">
        {/* Left: KPIs + Chart + Badges */}
        <div className="col-span-5 space-y-4">
          <KpiCards />
          <PerformanceChart />
          <BadgesPanel />
        </div>

        {/* Center: Leaderboard */}
        <div className="col-span-4">
          <Leaderboard />
        </div>

        {/* Right: Pomodoro + Heatmap + Feed */}
        <div className="col-span-3 space-y-4">
          <PomodoroTimer />
          <WeeklyHeatmap />
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
};

export default Index;
