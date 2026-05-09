import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  ArrowCounterClockwise as RotateCcw,
  Coffee,
  Pencil,
  Check,
} from "@phosphor-icons/react";

const STORAGE_KEY = "pomodoro-state-v1";
const DEFAULT_WORK_MIN = 45;
const BREAK_MIN = 15;

type PersistedState = {
  workMin: number;
  seconds: number;
  isRunning: boolean;
  cycles: number;
  breakSeconds: number;
  breakRunning: boolean;
  lastTick: number;
};

type InitialState = {
  workMin: number;
  seconds: number;
  isRunning: boolean;
  cycles: number;
  breakSeconds: number;
  breakRunning: boolean;
};

function loadInitialState(): InitialState {
  if (typeof window === "undefined") {
    return {
      workMin: DEFAULT_WORK_MIN,
      seconds: DEFAULT_WORK_MIN * 60,
      isRunning: false,
      cycles: 0,
      breakSeconds: BREAK_MIN * 60,
      breakRunning: false,
    };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error("no state");
    const parsed = JSON.parse(raw) as PersistedState;
    const elapsed = Math.max(0, Math.floor((Date.now() - parsed.lastTick) / 1000));

    let { seconds, breakSeconds, cycles, isRunning, breakRunning } = parsed;

    if (isRunning) {
      if (elapsed >= seconds) {
        // Ciclo terminou durante o reload → auto-start break (mesma lógica do tick).
        cycles += 1;
        seconds = parsed.workMin * 60;
        isRunning = false;
        const overflow = elapsed - parsed.seconds;
        const freshBreak = BREAK_MIN * 60;
        if (overflow >= freshBreak) {
          breakSeconds = freshBreak;
          breakRunning = false;
        } else {
          breakSeconds = freshBreak - overflow;
          breakRunning = true;
        }
      } else {
        seconds -= elapsed;
      }
    } else if (breakRunning) {
      if (elapsed >= breakSeconds) {
        breakSeconds = BREAK_MIN * 60;
        breakRunning = false;
      } else {
        breakSeconds -= elapsed;
      }
    }

    return {
      workMin: parsed.workMin,
      seconds,
      isRunning,
      cycles,
      breakSeconds,
      breakRunning,
    };
  } catch {
    return {
      workMin: DEFAULT_WORK_MIN,
      seconds: DEFAULT_WORK_MIN * 60,
      isRunning: false,
      cycles: 0,
      breakSeconds: BREAK_MIN * 60,
      breakRunning: false,
    };
  }
}

const PomodoroTimer = () => {
  const initialRef = useRef<InitialState>();
  if (!initialRef.current) initialRef.current = loadInitialState();
  const initial = initialRef.current;

  const [workMin, setWorkMin] = useState(initial.workMin);
  const [seconds, setSeconds] = useState(initial.seconds);
  const [isRunning, setIsRunning] = useState(initial.isRunning);
  const [cycles, setCycles] = useState(initial.cycles);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(initial.workMin));

  const breakMin = BREAK_MIN;
  const [breakSeconds, setBreakSeconds] = useState(initial.breakSeconds);
  const [breakRunning, setBreakRunning] = useState(initial.breakRunning);

  // Persiste cada mudança (escritas em localStorage são cheap).
  useEffect(() => {
    const snapshot: PersistedState = {
      workMin,
      seconds,
      isRunning,
      cycles,
      breakSeconds,
      breakRunning,
      lastTick: Date.now(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // quota exceeded ou storage desabilitado — ignorar
    }
  }, [workMin, seconds, isRunning, cycles, breakSeconds, breakRunning]);

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
        <Play size={16} weight="fill" className="text-primary" />
        <h2 className="text-sm font-display font-bold text-foreground">Pomodoro</h2>
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
              <Check size={12} weight="bold" />
            </button>
          </>
        ) : (
          <button
            onClick={() => { setEditValue(String(workMin)); setEditing(true); }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-all"
          >
            <Pencil size={12} />
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
          <span className="font-display text-3xl font-bold text-foreground">
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
          {isRunning ? <Pause size={16} weight="fill" /> : <Play size={16} weight="fill" className="ml-0.5" />}
        </button>
        <button
          onClick={resetWork}
          className="w-10 h-10 rounded-full bg-muted/50 text-muted-foreground hover:bg-muted flex items-center justify-center transition-all"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Separator */}
      <div className="w-full h-px bg-border/30 mb-4" />

      {/* Break Timer (fixed 15 min) */}
      <div className="flex items-center gap-2 mb-2">
        <Coffee size={14} className="text-chart-orange" />
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
          {breakRunning ? <Pause size={12} weight="fill" /> : <Play size={12} weight="fill" className="ml-0.5" />}
        </button>
        <button
          onClick={resetBreak}
          className="w-8 h-8 rounded-full bg-muted/40 text-muted-foreground hover:bg-muted/50 flex items-center justify-center transition-all"
        >
          <RotateCcw size={12} />
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;
