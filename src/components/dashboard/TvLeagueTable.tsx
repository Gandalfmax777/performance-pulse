import { useMemo } from "react";
import {
  Crown,
  Fire,
  ArrowUp,
  ArrowDown,
} from "@phosphor-icons/react";
import { type Assessor } from "@/types/assessor";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";

interface TvLeagueTableProps {
  assessors: Assessor[];
}

/**
 * TV Ranking — versão "tabela da liga" do design Editorial V1.
 * Layout dedicado pra Modo TV: headline grande em serif italic,
 * mini-cards SOBE/DESCE no canto, tabela full-width com gradient
 * gold/silver/bronze nos primeiros 3, fontes maiores.
 */
const TvLeagueTable = ({ assessors }: TvLeagueTableProps) => {
  const sorted = useMemo(
    () => [...assessors].sort((a, b) => b.points - a.points),
    [assessors],
  );

  const upCount = 0; // sem deltaRank no shape atual; placeholder pra UI
  const downCount = 0;

  return (
    <div className="grid gap-5 grid-rows-[auto_1fr]">
      {/* Headline */}
      <div className="flex justify-between items-end gap-4 flex-wrap">
        <div>
          <p
            className="text-[11px] uppercase tracking-[0.18em] font-semibold text-ink-3"
            style={{ letterSpacing: "0.18em" }}
          >
            RODADA SEMANAL
          </p>
          <h2
            className="font-serif italic font-bold leading-none tracking-[-0.03em]"
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "min(8vw, 64px)",
            }}
          >
            A tabela <span style={{ color: "hsl(var(--gold-deep))" }}>mexeu</span>.
          </h2>
          <p
            className="font-serif italic text-ink-2 mt-2 font-normal"
            style={{ fontFamily: "'Instrument Serif', serif", fontSize: 18 }}
          >
            {assessors.length} assessores. Uma única coluna que importa.
          </p>
        </div>
        <div className="flex gap-3">
          <div
            className="rounded-xl text-white p-4"
            style={{ background: "hsl(var(--ink))", minWidth: 130 }}
          >
            <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-white/50">
              SOBE
            </p>
            <p
              className="font-mono font-extrabold leading-none mt-1"
              style={{ fontSize: 32, color: "hsl(var(--success))" }}
            >
              <ArrowUp size={22} weight="bold" className="inline align-middle mr-1" />
              {upCount}
            </p>
            <p className="font-mono text-[10px] text-white/55 mt-1">posições</p>
          </div>
          <div
            className="rounded-xl text-white p-4"
            style={{ background: "hsl(var(--ink))", minWidth: 130 }}
          >
            <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-white/50">
              DESCE
            </p>
            <p
              className="font-mono font-extrabold leading-none mt-1"
              style={{ fontSize: 32, color: "hsl(var(--destructive))" }}
            >
              <ArrowDown size={22} weight="bold" className="inline align-middle mr-1" />
              {downCount}
            </p>
            <p className="font-mono text-[10px] text-white/55 mt-1">posições</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-line overflow-hidden flex flex-col">
        {/* Header */}
        <div
          className="grid items-center gap-3 px-6 py-3 text-white"
          style={{
            background: "hsl(var(--ink))",
            gridTemplateColumns: "60px 60px 1.4fr 90px 130px 100px 90px",
          }}
        >
          <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-white/55">#</p>
          <span />
          <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-white/55">
            ASSESSOR
          </p>
          <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-white/55 text-right">
            NV
          </p>
          <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-white/55 text-right">
            PTS
          </p>
          <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-white/55 text-right">
            SEMANA
          </p>
          <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-white/55 text-right">
            STREAK
          </p>
        </div>

        <div className="flex-1 flex flex-col">
          {sorted.map((a, i) => {
            const top3 = i < 3;
            const bg =
              i === 0
                ? "oklch(0.97 0.06 90)"
                : i === 1
                ? "oklch(0.97 0.005 240)"
                : i === 2
                ? "oklch(0.96 0.025 60)"
                : "transparent";
            const pctColor =
              a.weeklyGoalPercent >= 100
                ? "hsl(var(--success))"
                : a.weeklyGoalPercent >= 70
                ? "hsl(var(--ink))"
                : "hsl(var(--destructive))";

            return (
              <div
                key={a.id}
                className={`grid items-center gap-3 px-6 ${
                  i < sorted.length - 1 ? "border-b border-line" : ""
                }`}
                style={{
                  gridTemplateColumns: "60px 60px 1.4fr 90px 130px 100px 90px",
                  background: bg,
                  flex: 1,
                }}
              >
                <span
                  className="font-serif italic font-bold leading-none tracking-[-0.03em]"
                  style={{
                    fontFamily: "'Instrument Serif', serif",
                    fontSize: 36,
                    color: top3 ? "hsl(var(--ink))" : "hsl(var(--ink-3))",
                  }}
                >
                  {i === 0 ? (
                    <Crown size={32} weight="fill" className="text-gold-deep" />
                  ) : (
                    i + 1
                  )}
                </span>
                <AssessorAvatar
                  initials={a.avatar}
                  photoUrl={a.photoUrl}
                  level={a.level}
                  size={42}
                />
                <div className="min-w-0">
                  <p className="font-bold text-ink truncate" style={{ fontSize: 17 }}>
                    {a.name}
                  </p>
                  <p className="font-mono text-[11px] text-ink-3 mt-0.5">
                    {a.points.toLocaleString("pt-BR")} pts
                  </p>
                </div>
                <p className="font-mono font-bold text-right capitalize text-ink-2" style={{ fontSize: 18 }}>
                  {a.level}
                </p>
                <p
                  className="font-mono font-extrabold text-right tracking-[-0.02em]"
                  style={{ fontSize: 22 }}
                >
                  {a.points.toLocaleString("pt-BR")}
                </p>
                <p
                  className="font-mono font-extrabold text-right tracking-[-0.03em]"
                  style={{ fontSize: 26, color: pctColor }}
                >
                  {a.weeklyGoalPercent}
                  <span className="text-[13px] text-ink-3">%</span>
                </p>
                <div className="flex items-center justify-end gap-1">
                  {a.streak > 0 ? (
                    <>
                      <Fire size={13} weight="fill" className="text-gold-deep" />
                      <span className="font-mono font-extrabold text-gold-deep" style={{ fontSize: 16 }}>
                        {a.streak}
                      </span>
                    </>
                  ) : (
                    <span className="font-mono text-ink-4" style={{ fontSize: 14 }}>
                      —
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TvLeagueTable;
