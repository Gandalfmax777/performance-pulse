import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Coffee } from "lucide-react";

const PomodoroTimer = () => {
  const [workMin, setWorkMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [seconds, setSeconds] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [cycles, setCycles] = useState(0);

  const totalSeconds = isBreak ? breakMin * 60 : workMin * 60;
  const progress = ((totalSeconds - seconds) / totalSeconds) * 100;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  const reset = useCallback(() => {
    setIsRunning(false);
    setIsBreak(false);
    setSeconds(workMin * 60);
  }, [workMin]);

  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          if (!isBreak) {
            setIsBreak(true);
            setCycles(c => c + 1);
            return breakMin * 60;
          } else {
            setIsBreak(false);
            return workMin * 60;
          }
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning, isBreak, workMin, breakMin]);

  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="card-glass rounded-xl p-5 flex flex-col items-center">
      <div className="flex items-center gap-2 mb-4 self-start">
        {isBreak ? <Coffee className="w-4 h-4 text-chart-orange" /> : <Play className="w-4 h-4 text-primary" />}
        <h2 className="text-sm font-bold text-foreground">
          {isBreak ? "Pausa" : "Pomodoro"}
        </h2>
        <span className="ml-auto text-xs text-muted-foreground font-mono">{cycles} ciclos</span>
      </div>

      <div className="relative w-32 h-32 mb-4">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" stroke="hsl(var(--muted))" strokeWidth="6" fill="none" />
          <motion.circle
            cx="60" cy="60" r="54"
            stroke={isBreak ? "hsl(var(--chart-orange))" : "hsl(var(--primary))"}
            strokeWidth="6" fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-3xl font-bold text-foreground">
            {String(minutes).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </span>
          <span className="text-[10px] text-muted-foreground mt-1">
            {isBreak ? "PAUSA" : "FOCO"}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            isRunning
              ? "bg-chart-orange/20 text-chart-orange hover:bg-chart-orange/30"
              : "bg-primary/20 text-primary hover:bg-primary/30"
          }`}
        >
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>
        <button
          onClick={reset}
          className="w-10 h-10 rounded-full bg-muted/50 text-muted-foreground hover:bg-muted flex items-center justify-center transition-all"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;
