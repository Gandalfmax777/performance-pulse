import { useMemo } from "react";
import { Crown } from "@phosphor-icons/react";
import { type Assessor } from "@/types/assessor";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";
import { useSquads, type ApiSquad } from "@/hooks/useSquads";
import { useBets } from "@/hooks/useBets";
import { useWeeklyRanking } from "@/hooks/useRankings";

interface TvSquadBoardProps {
  assessors: Assessor[];
}

interface SquadStanding {
  squad: ApiSquad;
  pct: number;
  points: number;
  boletas: number;
  ativacoes: number;
}

/**
 * TV Squad — versus board dedicado pro Modo TV (artboard "TvSquad").
 * Diferente do SquadMainEventCard de dashboard: ocupa a tela inteira,
 * cards quadrados gigantes com nome do squad em Instrument Serif
 * italic, gauge gigante de %, stats grid (BOLETAS/ATIVAÇÕES/PONTOS),
 * undercard com mini-cards no rodapé.
 */
const TvSquadBoard = ({ assessors }: TvSquadBoardProps) => {
  const { data: squadsData } = useSquads();
  const { data: betsData } = useBets();
  const { data: weeklyRanking } = useWeeklyRanking();

  const activeBet = useMemo(
    () => (betsData ?? []).find((b) => b.status === "ACTIVE"),
    [betsData],
  );

  const standings = useMemo<SquadStanding[]>(() => {
    const squads = squadsData ?? [];
    if (squads.length === 0) return [];
    const ranking = weeklyRanking?.rankings ?? [];
    const perfById = new Map(ranking.map((r) => [r.assessor.id, r.rollup]));
    const assessorById = new Map(assessors.map((a) => [a.id, a]));
    return squads
      .map((s) => {
        let pctSum = 0;
        let pctCount = 0;
        let points = 0;
        let boletas = 0;
        let ativacoes = 0;
        for (const m of s.members) {
          const r = perfById.get(m.assessorId);
          const a = assessorById.get(m.assessorId);
          if (r) {
            pctSum += r.weeklyGoalPercent;
            pctCount += 1;
            points += r.points;
          }
          if (a) {
            boletas += a.kpis.boletos ?? 0;
          }
          ativacoes += Math.round((r?.kpiTotals?.ativacao_conta ?? 0) as number);
        }
        return {
          squad: s,
          pct: pctCount > 0 ? Math.round(pctSum / pctCount) : 0,
          points,
          boletas,
          ativacoes,
        };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [squadsData, weeklyRanking, assessors]);

  const main = standings.slice(0, 2);
  const undercard = standings.slice(2);

  if (main.length < 2) {
    return (
      <div className="flex-1 flex items-center justify-center text-ink-3 min-h-[400px]">
        Sem squads o suficiente para a disputa.
      </div>
    );
  }

  const [a, b] = main;
  const gap = Math.max(0, a.pct - b.pct);

  return (
    <div className="flex flex-col gap-5">
      {/* Marquee */}
      <div
        className="rounded-2xl text-white p-6 flex items-center justify-between gap-4 relative overflow-hidden flex-wrap"
        style={{ background: "hsl(var(--ink))" }}
      >
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, white 0 12px, transparent 12px 24px)",
          }}
        />
        <div className="relative">
          <p
            className="text-[10px] uppercase tracking-[0.2em] font-semibold"
            style={{ color: "hsl(var(--gold))" }}
          >
            EVENTO PRINCIPAL{activeBet ? ` · ${activeBet.roundLabel.toUpperCase()}` : ""}
          </p>
          <h2
            className="font-serif italic font-bold mt-1 leading-tight tracking-[-0.02em]"
            style={{ fontFamily: "'Instrument Serif', serif", fontSize: 40 }}
          >
            {a.squad.name}{" "}
            <span style={{ color: "hsl(var(--gold))" }}>vs</span> {b.squad.name}
          </h2>
        </div>
        <div className="relative flex items-center gap-5">
          <p
            className="text-[10px] uppercase tracking-[0.12em] font-semibold"
            style={{ color: "oklch(1 0 0 / 0.5)" }}
          >
            POTE
          </p>
          <p
            className="font-mono font-extrabold tracking-[-0.03em] leading-none"
            style={{ fontSize: 36, color: "hsl(var(--gold))" }}
          >
            R$ {(activeBet?.value ?? 0).toLocaleString("pt-BR")}
          </p>
        </div>
      </div>

      {/* Two squad cards facing off */}
      <div className="relative grid items-stretch gap-4 sm:grid-cols-2">
        <SquadVersusCard standing={a} leading />
        <SquadVersusCard standing={b} leading={false} />

        {/* Centro VS — overlay absoluto */}
        <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex-col items-center pointer-events-none">
          <p
            className="font-serif italic font-bold leading-none tracking-[-0.04em] text-ink-3"
            style={{ fontFamily: "'Instrument Serif', serif", fontSize: 64 }}
          >
            vs
          </p>
          <div className="w-8 h-px bg-line my-2" />
          <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-ink-3 text-center">
            VANTAGEM
          </p>
          <p
            className="font-mono font-extrabold leading-none tracking-[-0.02em] mt-1"
            style={{ fontSize: 22, color: "hsl(var(--eqi-green))" }}
          >
            +{gap}
            <span className="text-xs text-ink-3">p.p.</span>
          </p>
        </div>
      </div>

      {/* Undercard */}
      {undercard.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {undercard.slice(0, 4).map((s) => (
            <div
              key={s.squad.id}
              className="rounded-xl bg-card border border-line p-4 flex items-center gap-4"
            >
              <div className="text-[36px] leading-none">{s.squad.emoji || "★"}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-ink-3">
                  UNDERCARD
                </p>
                <p
                  className="font-serif italic font-bold tracking-[-0.02em] truncate"
                  style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22 }}
                >
                  {s.squad.name}
                </p>
              </div>
              <div className="w-[200px] hidden lg:block">
                <div className="h-2.5 rounded-full bg-line overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(100, s.pct)}%`,
                      background: "hsl(var(--ink-2))",
                    }}
                  />
                </div>
              </div>
              <p
                className="font-mono font-extrabold leading-none tracking-[-0.03em] min-w-[88px] text-right"
                style={{ fontSize: 28, color: "hsl(var(--ink))" }}
              >
                {s.pct}
                <span className="text-sm text-ink-3">%</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function SquadVersusCard({
  standing,
  leading,
}: {
  standing: SquadStanding;
  leading: boolean;
}) {
  const { squad, pct, points, boletas, ativacoes } = standing;
  return (
    <div
      className="rounded-2xl p-8 flex flex-col gap-5 relative overflow-hidden"
      style={{
        background: leading
          ? "linear-gradient(180deg, oklch(0.96 0.06 152) 0%, white 60%)"
          : "white",
        border: leading ? "1px solid hsl(var(--eqi-green))" : "1px solid hsl(var(--line))",
      }}
    >
      {leading && (
        <span
          className="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-full text-white text-[10px] font-extrabold tracking-[0.1em]"
          style={{ background: "hsl(var(--eqi-green))" }}
        >
          LIDERANDO
        </span>
      )}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[56px] leading-none">{squad.emoji || "★"}</div>
          <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-ink-3 mt-3">
            SQUAD
          </p>
          <p
            className="font-serif italic font-bold leading-none tracking-[-0.03em]"
            style={{ fontFamily: "'Instrument Serif', serif", fontSize: 56 }}
          >
            {squad.name}
          </p>
          <p className="font-mono text-[12px] text-ink-3 mt-2 font-bold">
            {squad.members.length} membros
          </p>
        </div>
        <div className="text-right">
          <p
            className="font-mono font-extrabold leading-none tracking-[-0.04em]"
            style={{
              fontSize: 96,
              color: leading ? "hsl(var(--eqi-green))" : "hsl(var(--ink-2))",
            }}
          >
            {pct}
          </p>
          <p className="text-2xl text-ink-3 font-bold leading-none -mt-2">%</p>
          <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-ink-3 mt-1">
            DA META COMBINADA
          </p>
          {leading && (
            <span
              className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold"
              style={{ background: "hsl(var(--gold-soft))", color: "hsl(var(--gold-deep))" }}
            >
              <Crown size={10} weight="fill" /> CAMPEÃO
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center">
        {squad.members.slice(0, 6).map((m, idx) => (
          <div
            key={m.assessorId}
            className="rounded-full border-[3px] border-white"
            style={{ marginLeft: idx > 0 ? -8 : 0 }}
          >
            <AssessorAvatar
              initials={m.initials}
              photoUrl={m.photoUrl}
              level={m.level.toLowerCase() as "bronze" | "silver" | "gold"}
              size={44}
            />
          </div>
        ))}
        <p className="ml-4 text-[12px] font-bold text-ink-2">
          {squad.members.length} assessores
        </p>
      </div>

      <div className="grid grid-cols-3 border-t border-line pt-3.5">
        {[
          { l: "BOLETAS", v: String(boletas) },
          { l: "ATIVAÇÕES", v: String(ativacoes) },
          { l: "PONTOS", v: points.toLocaleString("pt-BR") },
        ].map((stat, i) => (
          <div
            key={stat.l}
            className={i < 2 ? "border-r border-line pr-3" : "pl-3"}
          >
            <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-ink-3">
              {stat.l}
            </p>
            <p
              className="font-mono font-extrabold leading-none tracking-[-0.02em] mt-1"
              style={{ fontSize: 26 }}
            >
              {stat.v}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TvSquadBoard;
