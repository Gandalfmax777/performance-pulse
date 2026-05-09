import { useMemo } from "react";
import { Crown, Fire } from "@phosphor-icons/react";
import { type Assessor } from "@/types/assessor";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";

interface TvPodiumProps {
  assessors: Assessor[];
}

/**
 * TV Pódio — Hall da Fama cinematográfico (artboard "TvPodium").
 * Background dark com spotlight dourado, headline serif italic
 * gigante, 3 podestos retangulares em altura escalonada
 * (100% / 78% / 64%) com o 1º lugar em coluna central elevada e
 * gradient dourado.
 */
const TvPodium = ({ assessors }: TvPodiumProps) => {
  const sorted = useMemo(
    () => [...assessors].sort((a, b) => b.points - a.points),
    [assessors],
  );
  const [first, second, third] = sorted;

  if (!first || !second || !third) {
    return (
      <div
        className="flex-1 flex items-center justify-center text-white/70"
        style={{
          background: "linear-gradient(180deg, hsl(var(--ink)) 0%, hsl(var(--eqi-forest)) 100%)",
          minHeight: 480,
          borderRadius: 16,
        }}
      >
        Ainda sem pódio definido.
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden text-white p-10 flex flex-col min-h-[760px] border border-white/10"
      style={{
        background: "linear-gradient(180deg, hsl(var(--ink)) 0%, hsl(var(--eqi-forest)) 100%)",
      }}
    >
      {/* Sem spotlight stadium — design pede editorial financeiro sóbrio */}
      <div className="relative text-center mb-8">
        <p
          className="text-[11px] uppercase tracking-[0.22em] font-mono font-semibold mb-3"
          style={{ color: "hsl(var(--gold))" }}
        >
          HALL DA FAMA
        </p>
        <h1
          className="font-display font-extrabold leading-[0.92] tracking-[-0.04em]"
          style={{ fontSize: "min(11vw, 112px)" }}
        >
          Os três que mexeram a mesa.
        </h1>
      </div>

      <div
        className="relative flex-1 grid items-end gap-3 lg:gap-5"
        style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.2fr) minmax(0, 1fr)" }}
      >
        {[second, first, third].map((a, idx) => {
          const place = idx === 1 ? 1 : idx === 0 ? 2 : 3;
          const isFirst = place === 1;
          // Pódio escalonado mas suficiente pra todo conteúdo (badge pts +
          // streak) caber em viewports notebook (1366×768). Antes: 100/78/64,
          // que cortava o card 3º.
          const heights = { 1: "100%", 2: "86%", 3: "76%" } as const;
          const accent =
            place === 1
              ? "hsl(var(--gold))"
              : place === 2
              ? "hsl(var(--silver))"
              : "hsl(var(--bronze))";
          const accentText =
            place === 1
              ? "hsl(var(--gold-deep))"
              : place === 2
              ? "hsl(var(--silver))"
              : "hsl(var(--bronze))";
          return (
            <div
              key={a.id}
              className="relative flex flex-col justify-between p-4 lg:p-7 min-w-0"
              style={{
                minHeight: heights[place],
                color: "hsl(var(--ink))",
                // Editorial: branco sólido, sem gradient/box-shadow stadium.
                // Border-top accent na cor da medalha sinaliza posição
                // sem decoração extra.
                background: "white",
                borderTop: `3px solid ${accent}`,
              }}
            >
              {isFirst && (
                <Crown
                  size={48}
                  weight="fill"
                  className="absolute"
                  style={{
                    color: "hsl(var(--gold-deep))",
                    top: -24,
                    left: "50%",
                    transform: "translateX(-50%)",
                  }}
                />
              )}
              <p
                className="font-display font-extrabold leading-none tracking-[-0.05em] num"
                style={{
                  fontSize: isFirst ? "clamp(80px, 9vw, 132px)" : "clamp(56px, 6vw, 96px)",
                  color: accentText,
                }}
              >
                {String(place).padStart(2, "0")}
              </p>
              <div className="flex flex-col items-center text-center gap-3">
                <AssessorAvatar
                  initials={a.avatar}
                  photoUrl={a.photoUrl}
                  level={a.level}
                  size={isFirst ? 88 : 64}
                />
                <div>
                  <p
                    className="font-extrabold tracking-tight leading-tight truncate max-w-full"
                    style={{ fontSize: isFirst ? "clamp(18px, 1.8vw, 26px)" : "clamp(14px, 1.4vw, 20px)" }}
                  >
                    {a.name}
                  </p>
                  <p className="font-mono text-[11px] text-ink-3 mt-1 font-semibold tracking-[0.1em]">
                    NÍVEL {String(a.level).toUpperCase()}
                  </p>
                </div>
                <p
                  className="font-mono font-extrabold leading-none tracking-[-0.04em]"
                  style={{
                    fontSize: isFirst ? "clamp(48px, 5.5vw, 76px)" : "clamp(36px, 4vw, 56px)",
                    color: isFirst ? "hsl(var(--gold-deep))" : "hsl(var(--ink))",
                  }}
                >
                  {a.weeklyGoalPercent}
                  <span className="text-base text-ink-3">%</span>
                </p>
                <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-ink-3">
                  DA META
                </p>
                <div className="flex gap-2 mt-1">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold"
                    style={{ background: "hsl(var(--surface-2))", color: "hsl(var(--ink-2))" }}
                  >
                    {a.points.toLocaleString("pt-BR")} pts
                  </span>
                  {a.streak > 0 && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-extrabold"
                      style={{ background: "hsl(var(--gold-soft))", color: "hsl(var(--gold-deep))" }}
                    >
                      <Fire size={10} weight="fill" /> {a.streak}d
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TvPodium;
