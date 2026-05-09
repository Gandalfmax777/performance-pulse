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
      {/* Headline editorial — sem italic, display gigante alinhado com brief
          "120-156px display gigante, lots of negative space" do Modo-TV.html. */}
      <div className="flex justify-between items-end gap-4 flex-wrap">
        <div>
          <p
            className="text-[11px] uppercase tracking-[0.22em] font-mono font-semibold text-ink-3 mb-3"
          >
            RODADA SEMANAL
          </p>
          <h2
            className="font-display font-extrabold leading-[0.92] tracking-[-0.04em]"
            style={{ fontSize: "min(10vw, 96px)" }}
          >
            A tabela mexeu.
          </h2>
          <p
            className="text-ink-3 mt-3 font-medium"
            style={{ fontSize: 16 }}
          >
            {assessors.length} assessores · uma coluna que importa
          </p>
        </div>
        <div className="flex gap-px bg-line">
          <div
            className="text-white p-5 min-w-[140px] border-l border-t border-b border-line"
            style={{ background: "hsl(var(--ink))" }}
          >
            <p className="text-[9px] uppercase tracking-[0.16em] font-mono font-semibold text-white/50">
              SOBE
            </p>
            <p
              className="font-mono font-extrabold leading-none mt-2 num"
              style={{ fontSize: 36, color: "hsl(var(--success))" }}
            >
              <ArrowUp size={24} weight="bold" className="inline align-middle mr-1" />
              {upCount}
            </p>
            <p className="font-mono text-[10px] text-white/50 mt-2 uppercase tracking-[0.12em]">
              posições
            </p>
          </div>
          <div
            className="text-white p-5 min-w-[140px] border-r border-t border-b border-line"
            style={{ background: "hsl(var(--ink))" }}
          >
            <p className="text-[9px] uppercase tracking-[0.16em] font-mono font-semibold text-white/50">
              DESCE
            </p>
            <p
              className="font-mono font-extrabold leading-none mt-2 num"
              style={{ fontSize: 36, color: "hsl(var(--destructive))" }}
            >
              <ArrowDown size={24} weight="bold" className="inline align-middle mr-1" />
              {downCount}
            </p>
            <p className="font-mono text-[10px] text-white/50 mt-2 uppercase tracking-[0.12em]">
              posições
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-line overflow-hidden">
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

        <div>
          {sorted.map((a, i) => {
            const top3 = i < 3;
            // Top 3 ganha gradient com tint da medalha — gold/silver/bronze
            // visualmente distintos. Silver antigo (oklch 0.97 0.005 240)
            // estava praticamente branco; agora usa prata mais saturado.
            const bg =
              i === 0
                ? "oklch(0.97 0.06 90)"
                : i === 1
                ? "oklch(0.93 0.012 250)"
                : i === 2
                ? "oklch(0.93 0.04 60)"
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
                className={`grid items-center gap-3 px-6 py-3 ${
                  i < sorted.length - 1 ? "border-b border-line" : ""
                }`}
                style={{
                  gridTemplateColumns: "60px 60px 1.4fr 90px 130px 100px 90px",
                  background: bg,
                }}
              >
                <span
                  className="font-display font-extrabold leading-none tracking-[-0.03em] flex items-center num"
                  style={{
                    fontSize: 32,
                    color: top3 ? "hsl(var(--ink))" : "hsl(var(--ink-3))",
                    height: 42,
                  }}
                >
                  {i === 0 ? (
                    <Crown size={28} weight="fill" className="text-gold-deep" />
                  ) : (
                    String(i + 1).padStart(2, "0")
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
