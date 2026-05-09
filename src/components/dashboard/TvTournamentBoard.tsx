import { useEffect, useMemo, useState } from "react";
import { Trophy, Fire, Clock } from "@phosphor-icons/react";
import { parseISO, format } from "date-fns";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";
import { useActiveTournaments } from "@/hooks/useTournaments";
import { useKpis } from "@/hooks/useKpis";

/**
 * TV Tournament — trophy poster + Boletômetro (artboard "TvTournament").
 * Layout dedicado pro Modo TV: à esquerda um pôster com gradient warm
 * dourado e troféu gigante; à direita o ranking dinâmico da disputa
 * (top 5 por finalScore) com barras gold pros 3 primeiros.
 *
 * Renderiza a partir de useActiveTournaments() — pega o primeiro torneio
 * ativo. Se não houver, mostra um estado vazio sóbrio.
 */
const TvTournamentBoard = () => {
  const { data: tournaments = [] } = useActiveTournaments();
  const { kpis } = useKpis();
  const tournament = tournaments[0];
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  const sorted = useMemo(() => {
    if (!tournament) return [];
    return [...tournament.participants].sort(
      (x, y) => (y.finalScore ?? 0) - (x.finalScore ?? 0),
    );
  }, [tournament]);

  if (!tournament) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[480px] rounded-[14px] border border-line bg-card">
        <p className="text-ink-3">Sem torneio ativo no momento.</p>
      </div>
    );
  }

  const kpiLabel =
    kpis.find((k) => k.key === tournament.goalKpiKey)?.label ?? tournament.goalKpiKey;

  const top = sorted.slice(0, 5);
  const maxScore = top[0]?.finalScore ?? 0;

  // Countdown
  const end = parseISO(tournament.endDate).getTime();
  const endOfDay = end + 24 * 60 * 60 * 1000 - 1;
  const diff = Math.max(0, Math.floor((endOfDay - now) / 1000));
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const countdownLabel = `${days > 0 ? `${days}D ` : ""}${String(hours).padStart(2, "0")}H`;
  const countdownDetail = `${String(minutes).padStart(2, "0")}m até encerrar`;

  return (
    <div className="grid gap-5 grid-cols-1 lg:grid-cols-[1fr_1.4fr] min-h-[600px]">
      {/* Trophy poster */}
      <div
        className="rounded-[14px] p-8 relative overflow-hidden flex flex-col justify-between"
        style={{
          background:
            "linear-gradient(160deg, oklch(0.96 0.08 90) 0%, oklch(0.93 0.12 80) 100%)",
        }}
      >
        <div
          className="absolute pointer-events-none"
          style={{
            top: -60,
            right: -60,
            width: 240,
            height: 240,
            borderRadius: "50%",
            background: "oklch(0.55 0.2 50 / 0.2)",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: -100,
            left: -50,
            width: 280,
            height: 280,
            borderRadius: "50%",
            background: "oklch(0.85 0.15 80 / 0.4)",
          }}
        />

        <div className="relative">
          <p
            className="text-[11px] uppercase tracking-[0.18em] font-semibold"
            style={{ color: "hsl(var(--gold-deep))" }}
          >
            TORNEIO ATIVO · {format(parseISO(tournament.startDate), "MMM yyyy").toUpperCase()}
          </p>
          <h2
            className="font-display italic font-bold leading-none tracking-[-0.03em] mt-3 text-ink"
            style={{ fontSize: 56 }}
          >
            {tournament.roundLabel}
          </h2>
          <p
            className="font-display italic mt-2 text-ink-2 font-normal"
            style={{ fontSize: 18 }}
          >
            Quem fechar mais {kpiLabel.toLowerCase()} até{" "}
            {format(parseISO(tournament.endDate), "dd/MM")} leva.
          </p>
        </div>

        <div className="relative flex justify-center items-center flex-1 py-5">
          <Trophy
            size={220}
            weight="fill"
            style={{
              color: "hsl(var(--gold-deep))",
              filter: "drop-shadow(0 12px 24px oklch(0.4 0.1 70 / 0.3))",
            }}
          />
        </div>

        <div className="relative grid grid-cols-2 gap-3">
          <div
            className="rounded-[14px] p-4"
            style={{ background: "oklch(1 0 0 / 0.6)", backdropFilter: "blur(10px)" }}
          >
            <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-ink-3">
              PRÊMIO
            </p>
            <p
              className="font-display italic font-bold leading-tight mt-1 text-ink"
              style={{ fontSize: 22 }}
            >
              R$ {tournament.totalPrizePool.toLocaleString("pt-BR")}
            </p>
          </div>
          <div
            className="rounded-[14px] p-4 text-white"
            style={{ background: "hsl(var(--ink))" }}
          >
            <p
              className="text-[9px] uppercase tracking-[0.12em] font-semibold"
              style={{ color: "hsl(var(--gold))" }}
            >
              TERMINA EM
            </p>
            <p
              className="font-mono font-extrabold tracking-[-0.03em] leading-none mt-1.5 inline-flex items-center gap-1.5"
              style={{ fontSize: 28 }}
            >
              <Clock size={20} weight="bold" className="text-white/60" />
              {countdownLabel}
            </p>
            <p className="font-mono text-[10px] text-white/60 mt-1">{countdownDetail}</p>
          </div>
        </div>
      </div>

      {/* Boletômetro */}
      <div className="rounded-[14px] bg-card border border-line p-6 flex flex-col">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h3
              className="font-display italic font-bold tracking-[-0.02em]"
              style={{ fontSize: 28 }}
            >
              Boletômetro
            </h3>
            <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-ink-3 mt-1">
              RANKING POR {kpiLabel.toUpperCase()}
            </p>
          </div>
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-extrabold tracking-[0.1em]"
            style={{
              background: "hsl(var(--gold-soft))",
              borderColor: "hsl(var(--gold))",
              color: "hsl(var(--gold-deep))",
            }}
          >
            <Fire size={12} weight="fill" />
            {countdownLabel} PARA FECHAR
          </span>
        </div>

        <div className="flex-1 flex flex-col gap-4">
          {top.length === 0 ? (
            <p className="text-ink-3 text-center py-12">Sem participantes ainda.</p>
          ) : (
            top.map((p, i) => {
              const score = p.finalScore ?? 0;
              const w = maxScore > 0 ? (score / maxScore) * 100 : 0;
              const accent =
                i === 0
                  ? "hsl(var(--gold-deep))"
                  : i === 1
                  ? "hsl(var(--silver))"
                  : i === 2
                  ? "hsl(var(--bronze))"
                  : "hsl(var(--ink))";
              const barBg =
                i < 3
                  ? "linear-gradient(90deg, hsl(var(--gold)), hsl(var(--gold-deep)))"
                  : "hsl(var(--ink-2))";
              return (
                <div
                  key={p.id}
                  className="grid items-center gap-3.5"
                  style={{ gridTemplateColumns: "50px 44px 1fr 120px" }}
                >
                  <p
                    className="font-display italic font-bold leading-none tracking-[-0.04em]"
                    style={{
                      fontSize: 44,
                      color: accent,
                    }}
                  >
                    {i + 1}
                  </p>
                  {p.assessorId ? (
                    <AssessorAvatar
                      initials={p.initials ?? "??"}
                      photoUrl={p.photoUrl}
                      level="bronze"
                      size={40}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-surface-2" />
                  )}
                  <div className="min-w-0">
                    <p className="text-[16px] font-bold text-ink truncate leading-tight">
                      {p.displayName}
                    </p>
                    <div className="h-2.5 mt-2 rounded-full bg-surface-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${w}%`, background: barBg }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className="font-mono font-extrabold leading-none tracking-[-0.03em]"
                      style={{
                        fontSize: 40,
                        color: i < 3 ? "hsl(var(--gold-deep))" : "hsl(var(--ink))",
                      }}
                    >
                      {score.toLocaleString("pt-BR")}
                    </p>
                    <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-ink-3 mt-1">
                      {kpiLabel.toUpperCase()}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default TvTournamentBoard;
