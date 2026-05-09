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
      <div className="flex-1 flex items-center justify-center min-h-[480px] border border-line bg-card">
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
      {/* Trophy poster — editorial: branco sólido, sem decorações stadium */}
      <div
        className="p-8 relative overflow-hidden flex flex-col justify-between bg-white border border-line"
        style={{
          borderTop: "3px solid hsl(var(--gold))",
        }}
      >
        <div className="relative">
          <p
            className="text-[11px] uppercase tracking-[0.22em] font-mono font-semibold mb-3"
            style={{ color: "hsl(var(--gold-deep))" }}
          >
            TORNEIO ATIVO · {format(parseISO(tournament.startDate), "MMM yyyy").toUpperCase()}
          </p>
          <h2
            className="font-display font-extrabold leading-[0.92] tracking-[-0.04em] text-ink"
            style={{ fontSize: 64 }}
          >
            {tournament.roundLabel}
          </h2>
          <p
            className="mt-3 text-ink-2 font-medium"
            style={{ fontSize: 16 }}
          >
            Quem fechar mais {kpiLabel.toLowerCase()} até{" "}
            {format(parseISO(tournament.endDate), "dd/MM")} leva.
          </p>
        </div>

        <div className="relative flex justify-center items-center flex-1 py-5">
          <Trophy
            size={200}
            weight="fill"
            style={{ color: "hsl(var(--gold))" }}
          />
        </div>

        <div className="relative grid grid-cols-2 gap-px bg-line">
          <div
            className="p-4 bg-white"
          >
            <p className="text-[10px] uppercase tracking-[0.16em] font-mono font-semibold text-ink-3">
              PRÊMIO
            </p>
            <p
              className="font-display font-extrabold leading-tight mt-2 text-ink num"
              style={{ fontSize: 24 }}
            >
              R$ {tournament.totalPrizePool.toLocaleString("pt-BR")}
            </p>
          </div>
          <div
            className="p-4 text-white"
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
      <div className="bg-card border border-line p-6 flex flex-col">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h3
              className="font-display font-extrabold tracking-[-0.03em]"
              style={{ fontSize: 32 }}
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
                    className="font-display font-extrabold leading-none tracking-[-0.05em] num"
                    style={{
                      fontSize: 48,
                      color: accent,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
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
