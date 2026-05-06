import { useMemo } from "react";
import { Crown, Fire, Rocket } from "@phosphor-icons/react";
import { type Assessor } from "@/types/assessor";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";

interface RankingHighlightsProps {
  assessors: Assessor[];
  /** Movimento prev → curr (mapa assessorId → posições subidas/descidas).
   *  Quando não disponível, "Maior salto" usa a métrica de ponts como
   *  fallback. */
  rankDeltas?: Map<string, number>;
}

/**
 * Side panel da página Ranking (artboard RankingScreen).
 * 3 cards empilhados:
 *   1. "Em chamas" — assessores com streak ≥ 4, mostra grid de 14 barras
 *   2. "Maior salto da semana" — assessor que mais subiu posições
 *   3. "Hall da Fama" — destaque do mês com melhor sem./boletas/streak
 */
const RankingHighlights = ({ assessors, rankDeltas }: RankingHighlightsProps) => {
  const sorted = useMemo(
    () => [...assessors].sort((a, b) => b.points - a.points),
    [assessors],
  );

  const onFire = useMemo(
    () => sorted.filter((p) => p.streak >= 4).slice(0, 4),
    [sorted],
  );

  const biggestJump = useMemo(() => {
    if (rankDeltas && rankDeltas.size > 0) {
      const arr = [...rankDeltas.entries()]
        .filter(([, v]) => v > 0)
        .sort(([, a], [, b]) => b - a);
      const top = arr[0];
      if (top) {
        const a = assessors.find((x) => x.id === top[0]);
        if (a) return { assessor: a, jump: top[1] };
      }
    }
    // Fallback: assessor com maior streak entre os top 5
    const fallback = sorted
      .slice(0, 5)
      .sort((a, b) => b.streak - a.streak)[0];
    return fallback ? { assessor: fallback, jump: fallback.streak } : null;
  }, [assessors, rankDeltas, sorted]);

  // Hall da Fama: top-1 do ranking atual
  const hallOfFame = sorted[0];

  return (
    <div className="flex flex-col gap-4">
      {/* Em chamas */}
      <div className="rounded-[14px] border border-line bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Fire size={14} weight="fill" className="text-gold-deep" />
          <h3 className="text-[14px] font-extrabold tracking-tight text-ink">
            Em chamas
          </h3>
          <span className="text-[9px] uppercase tracking-[0.12em] font-semibold text-ink-3 ml-auto">
            STREAKS ATIVAS
          </span>
        </div>
        {onFire.length === 0 ? (
          <p className="text-[12px] text-ink-3 py-4 text-center">
            Sem streaks ≥ 4 dias agora.
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {onFire.map((p) => (
              <div key={p.id} className="flex items-center gap-2.5">
                <AssessorAvatar
                  initials={p.avatar}
                  photoUrl={p.photoUrl}
                  level={p.level}
                  size={28}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-ink truncate">{p.name}</p>
                  <div className="flex gap-[2px] mt-1">
                    {Array.from({ length: 14 }).map((_, i) => (
                      <div
                        key={i}
                        className="rounded-sm"
                        style={{
                          width: 5,
                          height: 12,
                          background:
                            i < p.streak ? "hsl(var(--gold))" : "hsl(var(--line))",
                        }}
                      />
                    ))}
                  </div>
                </div>
                <p
                  className="font-mono font-extrabold tracking-[-0.02em] leading-none"
                  style={{ fontSize: 18, color: "hsl(var(--gold-deep))" }}
                >
                  {p.streak}
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: "hsl(var(--ink-3))" }}
                  >
                    d
                  </span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Maior salto da semana */}
      <div className="rounded-[14px] border border-line bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Rocket size={14} weight="bold" className="text-primary" />
          <h3 className="text-[14px] font-extrabold tracking-tight text-ink">
            Maior salto da semana
          </h3>
        </div>
        {biggestJump ? (
          <div className="flex items-center gap-3.5">
            <AssessorAvatar
              initials={biggestJump.assessor.avatar}
              photoUrl={biggestJump.assessor.photoUrl}
              level={biggestJump.assessor.level}
              size={48}
            />
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-extrabold text-ink truncate">
                {biggestJump.assessor.name}
              </p>
              <p className="text-[11px] text-ink-3 mt-0.5">
                {rankDeltas && rankDeltas.get(biggestJump.assessor.id)
                  ? `subiu ${biggestJump.jump} posições`
                  : `${biggestJump.jump} dias de streak`}
              </p>
            </div>
            <p
              className="font-mono font-extrabold leading-none tracking-[-0.04em]"
              style={{ fontSize: 36, color: "hsl(var(--eqi-green))" }}
            >
              +{biggestJump.jump}
            </p>
          </div>
        ) : (
          <p className="text-[12px] text-ink-3 py-4 text-center">
            Sem variação significativa.
          </p>
        )}
      </div>

      {/* Hall da Fama (dark com glow dourado) */}
      {hallOfFame && (
        <div
          className="rounded-[14px] p-5 text-white relative overflow-hidden"
          style={{ background: "hsl(var(--ink))" }}
        >
          <div
            className="absolute pointer-events-none"
            style={{
              top: -40,
              right: -40,
              width: 180,
              height: 180,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, hsl(var(--gold) / 0.18) 0%, transparent 70%)",
            }}
          />
          <div className="flex items-center gap-2 mb-3.5 relative">
            <Crown size={14} weight="fill" style={{ color: "hsl(var(--gold))" }} />
            <p
              className="text-[9px] uppercase tracking-[0.12em] font-semibold"
              style={{ color: "hsl(var(--gold))" }}
            >
              HALL DA FAMA · DESTAQUE
            </p>
          </div>
          <div className="relative">
            <p
              className="font-extrabold tracking-tight"
              style={{ fontSize: 18, letterSpacing: "-0.01em" }}
            >
              {hallOfFame.name}
            </p>
            <p
              className="text-[12px] mt-1 mb-3.5"
              style={{ color: "oklch(1 0 0 / 0.6)" }}
            >
              {sorted.indexOf(hallOfFame) === 0 ? "líder do ranking esta semana" : ""}
            </p>
            <div className="flex gap-4">
              <div>
                <p
                  className="font-mono font-extrabold leading-none"
                  style={{ fontSize: 24, color: "hsl(var(--gold))" }}
                >
                  {hallOfFame.weeklyGoalPercent}%
                </p>
                <p
                  className="text-[8px] uppercase tracking-[0.12em] font-semibold mt-1"
                  style={{ color: "oklch(1 0 0 / 0.5)" }}
                >
                  MELHOR SEM.
                </p>
              </div>
              <div>
                <p
                  className="font-mono font-extrabold leading-none text-white"
                  style={{ fontSize: 24 }}
                >
                  {hallOfFame.kpis.boletos ?? 0}
                </p>
                <p
                  className="text-[8px] uppercase tracking-[0.12em] font-semibold mt-1"
                  style={{ color: "oklch(1 0 0 / 0.5)" }}
                >
                  BOLETAS
                </p>
              </div>
              <div>
                <p
                  className="font-mono font-extrabold leading-none text-white"
                  style={{ fontSize: 24 }}
                >
                  {hallOfFame.streak}
                </p>
                <p
                  className="text-[8px] uppercase tracking-[0.12em] font-semibold mt-1"
                  style={{ color: "oklch(1 0 0 / 0.5)" }}
                >
                  STREAK
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RankingHighlights;
