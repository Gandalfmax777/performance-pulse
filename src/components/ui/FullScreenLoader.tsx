import { Activity } from "lucide-react";

const FullScreenLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 rounded-xl gradient-neon flex items-center justify-center glow-primary animate-pulse">
        <Activity className="w-5 h-5 text-primary-foreground" />
      </div>
      <p className="text-xs text-muted-foreground">Carregando…</p>
    </div>
  </div>
);

export default FullScreenLoader;
