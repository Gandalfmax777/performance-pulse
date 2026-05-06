import { useMemo } from "react";
import { Crown, Fire, TrendUp, TrendDown } from "@phosphor-icons/react";
import { type Assessor } from "@/types/assessor";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";
import { useOverviewReport } from "@/hooks/useReports";
import { KPI_ICON } from "@/components/icons";

interface TvOverviewProps {
  assessors: Assessor[];
  from: string;
  to: string;
}

/**
 * TV Overview — broadcast-style. Segue o artboard "TvOverview" do
 * design Editorial V1: hero leader gigantesco em serif italic à
 * esquerda, scoreboard com posições 2-6 à direita, KPI strip de 9
 * indicadores ocupando a faixa inferior.
 *
 * Mantém o feel "trading desk + transmissão esportiva" que o Felipe
 * pediu — números grandes em mono, paleta ink+gold, leader em letra
 * serif para puxar atenção à distância.
 */
const TvOverview = ({ assessors, from, to }: TvOverviewProps) => {
  const sorted = useMemo(() => [...assessors].sort((a, b) => b.points - a.points), [assessors]);
  const leader = sorted[0];
  const runners = sorted.slice(1, 6);
  const { data: overview } = useOverviewReport({ from, to });
  const kpis = overview?.byKpi ?? [];

  if (!leader) return null;

  const [firstName, ...lastNameParts] = leader.name.split(" ");
  const lastName = lastNameParts.join(" ");

  return (
    <div className="grid gap-5 grid-cols-1 lg:grid-cols-[1.55fr_1fr] grid-rows-[1fr_auto]">
      {/* HERO LEADER — stadium hero card */}
      <div
        className="relative overflow-hidden rounded-2xl text-white p-9 flex flex-col justify-between min-h-[420px]"
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--ink)) 0%, hsl(var(--eqi-forest)) 60%, hsl(var(--eqi-green)) 100%)",
        }}
      >
        {/* halftone overlay */}
        <div
          className="absolute inset-0 opacity-[0.15] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "14px 14px",
            maskImage: "radial-gradient(ellipse at top right, black, transparent 70%)",
            WebkitMaskImage: "radial-gradient(ellipse at top right, black, transparent 70%)",
          }}
        />
        {/* gold radial glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: -120,
            right: -120,
            width: 380,
            height: 380,
            borderRadius: "50%",
            background: "radial-gradient(circle, hsl(var(--gold)) 0%, transparent 65%)",
            opacity: 0.35,
          }}
        />

        <div className="relative flex justify-between items-start">
          <div>
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-extrabold tracking-[0.1em]"
              style={{ background: "hsl(var(--gold))", color: "hsl(var(--ink))" }}
            >
              <Crown size={13} weight="fill" /> LIDERANÇA
            </span>
            <p
              className="font-serif italic text-base text-white/55 mt-5 font-medium"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Hoje a mesa olha para…
            </p>
          </div>
          <p className="font-mono text-[11px] text-white/50 font-bold tracking-[0.1em]">
            UPDATE · 5s
          </p>
        </div>

        <div className="relative">
          <h2
            className="font-serif font-bold tracking-[-0.04em] leading-[0.95]"
            style={{ fontFamily: "'Instrument Serif', serif", fontSize: "min(11vw, 88px)" }}
          >
            {firstName}
          </h2>
          {lastName && (
            <p
              className="font-serif italic text-white/55 leading-none font-normal"
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: "min(7vw, 56px)",
                letterSpacing: "-0.03em",
              }}
            >
              {lastName}
            </p>
          )}
          <div className="flex items-center gap-3.5 mt-4 flex-wrap">
            <AssessorAvatar
              initials={leader.avatar}
              photoUrl={leader.photoUrl}
              level={leader.level}
              size={56}
            />
            <span
              className="px-3 py-1 rounded-full text-[12px] font-bold"
              style={{ background: "oklch(1 0 0 / 0.12)", color: "white" }}
            >
              NÍVEL {leader.level.toUpperCase()}
            </span>
            {leader.streak > 0 && (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-extrabold"
                style={{ background: "hsl(var(--gold))", color: "hsl(var(--ink))" }}
              >
                <Fire size={12} weight="fill" /> STREAK {leader.streak}
              </span>
            )}
            <span
              className="font-mono px-3 py-1 rounded-full text-[12px] font-bold"
              style={{ background: "oklch(1 0 0 / 0.12)", color: "white" }}
            >
              {leader.points.toLocaleString("pt-BR")} PTS
            </span>
          </div>
        </div>

        <div className="relative">
          <div className="flex justify-between items-baseline mb-2">
            <p className="text-[11px] uppercase tracking-[0.15em] font-semibold text-white/55">
              META SEMANAL
            </p>
            <p
              className="font-mono font-extrabold tracking-[-0.04em] leading-none"
              style={{ fontSize: 96, color: "hsl(var(--gold))" }}
            >
              {leader.weeklyGoalPercent}
              <span className="text-3xl text-white/55">%</span>
            </p>
          </div>
          <div className="h-2 rounded overflow-hidden" style={{ background: "oklch(1 0 0 / 0.1)" }}>
            <div
              className="h-full rounded transition-all duration-700"
              style={{
                width: `${Math.min(100, leader.weeklyGoalPercent)}%`,
                background: "linear-gradient(90deg, hsl(var(--gold)), oklch(0.85 0.18 80))",
              }}
            />
          </div>
        </div>
      </div>

      {/* SCOREBOARD — perseguidores */}
      <div className="rounded-2xl bg-white border border-line flex flex-col overflow-hidden">
        <div
          className="flex items-center justify-between px-5 py-4 text-white"
          style={{ background: "hsl(var(--ink))", borderBottom: "2px solid hsl(var(--ink))" }}
        >
          <p className="font-serif italic font-bold text-lg" style={{ fontFamily: "'Instrument Serif', serif" }}>
            O placar
          </p>
          <p className="font-mono text-[10px] font-bold tracking-[0.15em]" style={{ color: "hsl(var(--gold))" }}>
            PERSEGUIDORES
          </p>
        </div>
        <div className="flex-1 flex flex-col">
          {runners.map((a, i) => (
            <div
              key={a.id}
              className={`flex-1 grid gap-3.5 items-center px-4 ${
                i < runners.length - 1 ? "border-b border-line" : ""
              }`}
              style={{ gridTemplateColumns: "40px 36px 1fr 70px" }}
            >
              <span
                className="font-mono font-extrabold text-ink-3"
                style={{ fontSize: 22 }}
              >
                {String(i + 2).padStart(2, "0")}
              </span>
              <AssessorAvatar
                initials={a.avatar}
                photoUrl={a.photoUrl}
                level={a.level}
                size={32}
              />
              <div className="min-w-0">
                <p className="font-bold text-[14px] leading-tight truncate text-ink">{a.name}</p>
                <p className="font-mono text-[10px] text-ink-3 mt-0.5">
                  {a.points.toLocaleString("pt-BR")} pts
                </p>
              </div>
              <span
                className="font-mono font-extrabold text-right tracking-[-0.03em]"
                style={{
                  fontSize: 22,
                  color:
                    a.weeklyGoalPercent >= 100
                      ? "hsl(var(--success))"
                      : a.weeklyGoalPercent >= 70
                      ? "hsl(var(--ink))"
                      : "hsl(var(--destructive))",
                }}
              >
                {a.weeklyGoalPercent}
                <span className="text-xs text-ink-3">%</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* KPI STRIP — bottom full width */}
      <div
        className="rounded-2xl bg-white border border-line overflow-hidden grid"
        style={{
          gridColumn: "1 / -1",
          gridTemplateColumns: `repeat(${Math.max(1, Math.min(9, kpis.length || 1))}, minmax(0, 1fr))`,
        }}
      >
        {(kpis.length > 0 ? kpis : Array.from({ length: 4 }).map(() => null)).map(
          (k, i, arr) => {
            if (!k) {
              return (
                <div
                  key={`skel-${i}`}
                  className="px-4 py-3.5 flex flex-col gap-1.5 animate-pulse"
                  style={{ borderRight: i < arr.length - 1 ? "1px solid hsl(var(--line))" : "none" }}
                >
                  <div className="h-3 w-12 bg-line rounded" />
                  <div className="h-7 w-16 bg-line rounded" />
                </div>
              );
            }
            const Icon = KPI_ICON[k.key];
            const onTrack = k.percent >= 100;
            return (
              <div
                key={k.kpiId}
                className="px-4 py-3.5 flex flex-col gap-1.5"
                style={{
                  borderRight: i < arr.length - 1 ? "1px solid hsl(var(--line))" : "none",
                  background: onTrack ? "oklch(0.97 0.04 152)" : "transparent",
                }}
              >
                <div className="flex items-center gap-1.5">
                  {Icon && <Icon size={11} className="text-ink-3" />}
                  <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-ink-3">
                    {k.label}
                  </p>
                </div>
                <p
                  className="font-mono font-extrabold leading-none tracking-[-0.03em]"
                  style={{
                    fontSize: 26,
                    color: onTrack ? "hsl(var(--eqi-green))" : "hsl(var(--ink))",
                  }}
                >
                  {Math.round(k.actual).toLocaleString("pt-BR")}
                  {k.unit}
                </p>
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 h-[3px] rounded-full" style={{ background: "hsl(var(--line))" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(100, k.percent)}%`,
                        background: onTrack ? "hsl(var(--success))" : "hsl(var(--ink-3))",
                      }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-ink-3 font-bold inline-flex items-center gap-0.5">
                    {onTrack ? <TrendUp size={9} weight="bold" /> : <TrendDown size={9} weight="bold" />}
                    {Math.round(k.percent)}%
                  </span>
                </div>
              </div>
            );
          },
        )}
      </div>
    </div>
  );
};

export default TvOverview;
