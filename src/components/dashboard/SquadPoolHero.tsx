import { useMemo } from "react";
import { Trophy, CurrencyDollar, Vault, Calendar } from "@phosphor-icons/react";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { useBets } from "@/hooks/useBets";
import { useCofreBalance } from "@/hooks/useCofre";

/**
 * Hero "Pool" do `/squad-bet` — alinha com `Squad-Bet.html`.
 *
 * Card editorial com gradient dark mostrando:
 *   • LIVE badge + Round label
 *   • Pote total da rodada ativa (R$ valor mono ~52px gold)
 *   • Dias restantes (subtitle)
 *   • Criterio + tipo (sub bottom)
 *   • À direita: Cofre acumulado total (todos squads)
 *
 * Quando não há bet ATIVA, mostra estado "Sem rodada ativa" + cofre
 * acumulado (não retorna null pra preservar contexto visual).
 */
const SquadPoolHero = () => {
  const { data: betsData } = useBets();
  const { data: cofreData } = useCofreBalance();

  const activeBet = useMemo(
    () => (betsData ?? []).find((b) => b.status === "ACTIVE"),
    [betsData],
  );

  const totalCofre = useMemo(
    () => (cofreData?.bySquad ?? []).reduce((s, c) => s + c.totalWon, 0),
    [cofreData],
  );

  const daysRemaining = useMemo(() => {
    if (!activeBet) return null;
    const end = parseISO(activeBet.endDate);
    const today = new Date();
    return Math.max(0, differenceInCalendarDays(end, today));
  }, [activeBet]);

  const finishedBets = (betsData ?? []).filter((b) => b.status === "FINISHED").length;

  return (
    <div
      className="rounded-[var(--radius)] overflow-hidden border text-white relative"
      style={{
        // Design: linear-gradient(135deg, accent-3 → ink). Mantemos a
        // direção 135° que cria uma diagonal mais dramática.
        background:
          "linear-gradient(135deg, hsl(var(--brand-deep)) 0%, hsl(var(--ink)) 100%)",
        borderColor: "hsl(var(--brand-deep))",
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 px-6 py-7 md:py-8 items-center">
        {/* Pote ativo — value 72px conforme design */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            {activeBet ? (
              <span
                className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-[0.16em] px-2 py-0.5 rounded-full"
                style={{
                  background: "hsl(var(--gold))",
                  color: "hsl(var(--ink))",
                }}
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                Ao vivo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-[0.16em] px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                Sem rodada ativa
              </span>
            )}
            <Trophy size={16} weight="fill" style={{ color: "hsl(var(--gold))" }} />
            <span className="text-[10px] uppercase tracking-[0.16em] font-mono font-semibold text-white/70">
              {activeBet?.roundLabel ?? `Round ${finishedBets + 1}`}
            </span>
          </div>

          <p
            className="text-[10px] uppercase tracking-[0.16em] font-mono font-semibold mb-2"
            style={{ color: "hsl(var(--gold))" }}
          >
            Premiação total
          </p>
          <p
            className="num font-display font-extrabold leading-[1] tracking-[-0.04em] text-white"
            style={{ fontSize: 72 }}
          >
            R${" "}
            {(activeBet?.value ?? 0).toLocaleString("pt-BR", {
              minimumFractionDigits: 0,
            })}
          </p>

          <div className="mt-3 flex items-center gap-4 text-[13px] text-white/70 flex-wrap">
            {daysRemaining !== null && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={13} weight="bold" />
                <span>
                  <span className="num font-mono font-bold text-white">
                    {daysRemaining}
                  </span>{" "}
                  {daysRemaining === 1 ? "dia restante" : "dias restantes"}
                </span>
              </span>
            )}
            {activeBet && (
              <span className="inline-flex items-center gap-1.5">
                <CurrencyDollar size={13} weight="bold" />
                <span>
                  Tipo:{" "}
                  <span className="font-semibold text-white">
                    {activeBet.type === "MONTHLY"
                      ? "Mensal"
                      : activeBet.type === "WEEKLY"
                      ? "Semanal"
                      : "Customizada"}
                  </span>
                </span>
              </span>
            )}
            {activeBet && (
              <span className="text-white/60">
                {format(parseISO(activeBet.startDate), "dd/MM")} →{" "}
                {format(parseISO(activeBet.endDate), "dd/MM")}
              </span>
            )}
          </div>
        </div>

        {/* Cofre acumulado — coluna direita compacta com 24px font-display
            por linha (alinhado com design 1º/2º/3º distribution). */}
        <div className="md:border-l md:border-white/10 md:pl-8 flex flex-col gap-3 md:text-right">
          <div className="flex md:flex-col items-center md:items-end gap-2">
            <Vault
              size={14}
              weight="fill"
              style={{ color: "hsl(var(--gold))" }}
            />
            <p className="text-[10px] uppercase tracking-[0.16em] font-mono font-semibold text-white/50">
              Cofre acumulado
            </p>
          </div>
          <p
            className="num font-display font-extrabold leading-none tracking-[-0.03em] text-white"
            style={{ fontSize: 28 }}
          >
            R$ {totalCofre.toLocaleString("pt-BR")}
          </p>
          <p className="text-[11px] text-white/60">
            <span className="num font-mono font-bold text-white">
              {finishedBets}
            </span>{" "}
            {finishedBets === 1 ? "rodada finalizada" : "rodadas finalizadas"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SquadPoolHero;
