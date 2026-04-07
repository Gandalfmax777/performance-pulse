import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Coffee, Pencil, Check } from "lucide-react";

const PomodoroTimer = () => {
  const [workMin, setWorkMin] = useState(45);
  const [seconds, setSeconds] = useState(45 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [cycles, setCycles] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("45");

  // Fixed 15-min break
  const breakMin = 15;
  const [breakSeconds, setBreakSeconds] = useState(15 * 60);
  const [breakRunning, setBreakRunning] = useState(false);

  const totalSeconds = workMin * 60;
  const progress = ((totalSeconds - seconds) / totalSeconds) * 100;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  const breakTotal = breakMin * 60;
  const breakProgress = ((breakTotal - breakSeconds) / breakTotal) * 100;
  const breakMins = Math.floor(breakSeconds / 60);
  const breakSecs = breakSeconds % 60;

  const resetWork = useCallback(() => {
    setIsRunning(false);
    setSeconds(workMin * 60);
  }, [workMin]);

  const resetBreak = useCallback(() => {
    setBreakRunning(false);
    setBreakSeconds(breakMin * 60);
  }, []);

  // Work timer
  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          setIsRunning(false);
          setCycles(c => c + 1);
          // Auto-start break
          setBreakSeconds(breakMin * 60);
          setBreakRunning(true);
          return workMin * 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning, workMin]);

  // Break timer
  useEffect(() => {
    if (!breakRunning) return;
    const timer = setInterval(() => {
      setBreakSeconds(s => {
        if (s <= 1) {
          setBreakRunning(false);
          return breakMin * 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [breakRunning]);

  const confirmEdit = () => {
    const val = Math.max(1, Math.min(120, parseInt(editValue) || 45));
    setWorkMin(val);
    setSeconds(val * 60);
    setIsRunning(false);
    setEditing(false);
  };

  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const breakCirc = 2 * Math.PI * 28;
  const breakStrokeDash = breakCirc - (breakProgress / 100) * breakCirc;

  return (
    <div className="card-glass rounded-xl p-5 flex flex-col items-center">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 self-start w-full">
        <Play className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-bold text-foreground">Pomodoro</h2>
        <span className="ml-auto text-xs text-muted-foreground font-mono">{cycles} ciclos</span>
      </div>

      {/* Editable work time */}
      <div className="flex items-center gap-2 mb-2">
        {editing ? (
          <>
            <input
              type="number"
              min={1}
              max={120}
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              className="w-14 h-7 rounded-md bg-muted/30 border border-primary/50 text-center text-sm font-mono font-semibold text-foreground focus:outline-none"
              autoFocus
              onKeyDown={e => e.key === "Enter" && confirmEdit()}
            />
            <span className="text-xs text-muted-foreground">min</span>
            <button onClick={confirmEdit} className="w-6 h-6 rounded-full bg-success/20 text-success flex items-center justify-center">
              <Check className="w-3 h-3" />
            </button>
          </>
        ) : (
          <button
            onClick={() => { setEditValue(String(workMin)); setEditing(true); }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-all"
          >
            <Pencil className="w-3 h-3" />
            <span className="font-mono">{workMin}min trabalho</span>
          </button>
        )}
      </div>

      {/* Work Ring */}
      <div className="relative w-32 h-32 mb-2">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" stroke="hsl(var(--muted))" strokeWidth="6" fill="none" />
          <motion.circle
            cx="60" cy="60" r="54"
            stroke="hsl(var(--primary))"
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
          <span className="text-[10px] text-muted-foreground mt-1">FOCO</span>
        </div>
      </div>

      {/* Work Controls */}
      <div className="flex gap-2 mb-4">
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
          onClick={resetWork}
          className="w-10 h-10 rounded-full bg-muted/50 text-muted-foreground hover:bg-muted flex items-center justify-center transition-all"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Separator */}
      <div className="w-full h-px bg-border/30 mb-4" />

      {/* Break Timer (fixed 15 min) */}
      <div className="flex items-center gap-2 mb-2">
        <Coffee className="w-3.5 h-3.5 text-chart-orange" />
        <span className="text-xs font-semibold text-muted-foreground">Pausa – 15min</span>
      </div>

      <div className="relative w-20 h-20 mb-2">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" stroke="hsl(var(--muted))" strokeWidth="4" fill="none" />
          <motion.circle
            cx="32" cy="32" r="28"
            stroke="hsl(var(--chart-orange))"
            strokeWidth="4" fill="none"
            strokeLinecap="round"
            strokeDasharray={breakCirc}
            animate={{ strokeDashoffset: breakStrokeDash }}
            transition={{ duration: 0.5 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-lg font-bold text-foreground">
            {String(breakMins).padStart(2, "0")}:{String(breakSecs).padStart(2, "0")}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setBreakRunning(!breakRunning)}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            breakRunning
              ? "bg-chart-orange/20 text-chart-orange hover:bg-chart-orange/30"
              : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
          }`}
        >
          {breakRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
        </button>
        <button
          onClick={resetBreak}
          className="w-8 h-8 rounded-full bg-muted/40 text-muted-foreground hover:bg-muted/50 flex items-center justify-center transition-all"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;
