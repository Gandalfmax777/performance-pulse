import { useMemo } from "react";
import { differenceInDays, format, parseISO, subDays } from "date-fns";
import { useOverviewReport } from "@/hooks/useReports";
import { useWeeklyRanking } from "@/hooks/useRankings";

interface HeroMetricStripProps {
  from: string;
  to: string;
}

interface Metric {
  label: string;
  value: string;
  sub: string;
  delta: number | null;
  accent: "eqi" | "ink" | "pos";
}

/**
 * Faixa de 4 métricas grandes Editorial V1 (artboard DashEditorial):
 * card único dividido em 4 colunas com label uppercase, valor mono
 * 44px e bloco delta + subtitle.
 *
 * Delta calculado comparando com o range imediatamente anterior
 * (mesmo length de dias deslocado pra trás).
 */
const HeroMetricStrip = ({ from, to }: HeroMetricStripProps) => {
  const previousRange = useMemo(() => {
    const days = differenceInDays(parseISO(to), parseISO(from)) + 1;
    return {
      from: format(subDays(parseISO(from), days), "yyyy-MM-dd"),
      to: format(subDays(parseISO(to), days), "yyyy-MM-dd"),
    };
  }, [from, to]);

  const { data: overview, isLoading } = useOverviewReport({ from, to });
  const { data: previousOverview } = useOverviewReport(previousRange);
  const { data: weekly } = useWeeklyRanking();

  const metrics = useMemo<Metric[]>(() => {
    const aggPct = overview?.byKpi?.length
      ? Math.round(overview.byKpi.reduce((s, k) => s + (k.percent || 0), 0) / overview.byKpi.length)
      : null;
    const aggPrev = previousOverview?.byKpi?.length
      ? Math.round(
          previousOverview.byKpi.reduce((s, k) => s + (k.percent || 0), 0) /
            previousOverview.byKpi.length,
        )
      : null;
    const aggDelta = aggPct != null && aggPrev != null && aggPrev > 0
      ? Math.round(((aggPct - aggPrev) / aggPrev) * 100)
      : null;

    const totalPoints = weekly?.rankings?.reduce((s, r) => s + (r.rollup.points || 0), 0) ?? null;

    const boletas = overview?.byKpi?.find((k) => k.key === "boletas");
    const boletasPrev = previousOverview?.byKpi?.find((k) => k.key === "boletas");
    const boletasDelta =
      boletas && boletasPrev && boletasPrev.actual > 0
        ? Math.round(((boletas.actual - boletasPrev.actual) / boletasPrev.actual) * 100)
        : null;

    const ativacao = overview?.byKpi?.find(
      (k) => k.key === "ativacao" || k.key === "ativacoes" || k.key === "ativacao_conta",
    );
    const ativacaoPrev = previousOverview?.byKpi?.find(
      (k) => k.key === "ativacao" || k.key === "ativacoes" || k.key === "ativacao_conta",
    );
    const ativacaoDelta =
      ativacao && ativacaoPrev && ativacaoPrev.actual > 0
        ? Math.round(((ativacao.actual - ativacaoPrev.actual) / ativacaoPrev.actual) * 100)
        : null;

    return [
      {
        label: "META AGREGADA",
        value: aggPct != null ? `${aggPct}%` : "—",
        sub: "time inteiro",
        delta: aggDelta,
        accent: aggPct != null && aggPct >= 100 ? "eqi" : "ink",
      },
      {
        label: "PONTOS DA SEMANA",
        value: totalPoints != null ? formatCompact(totalPoints) : "—",
        sub: "soma do time",
        delta: null,
        accent: "ink",
      },
      {
        label: boletas?.label?.toUpperCase() ?? "BOLETAS",
        value: boletas ? String(Math.round(boletas.actual)) : "—",
        sub: boletas ? `meta ${boletas.target}` : "",
        delta: boletasDelta,
        accent: boletas && boletas.percent >= 100 ? "eqi" : "ink",
      },
      {
        label: ativacao?.label?.toUpperCase() ?? "ATIVAÇÕES",
        value: ativacao ? String(Math.round(ativacao.actual)) : "—",
        sub: ativacao
          ? `meta ${ativacao.target}${ativacao.percent >= 100 ? " · acima" : ""}`
          : "",
        delta: ativacaoDelta,
        accent: ativacao && ativacao.percent >= 100 ? "pos" : "ink",
      },
    ];
  }, [overview, previousOverview, weekly]);

  return (
    <div className="rounded-[14px] border border-line bg-card overflow-hidden">
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {metrics.map((m, i) => (
          <div
            key={m.label}
            className={`px-7 py-6 ${i < 3 ? "lg:border-r border-line" : ""} ${
              i % 2 === 0 ? "border-r lg:border-r border-line" : ""
            } ${i < 2 ? "border-b lg:border-b-0 border-line" : ""}`}
          >
            <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-ink-3 mb-3">
              {m.label}
            </p>
            <p
              className={`font-mono font-extrabold tracking-[-0.03em] leading-none ${
                isLoading ? "text-ink-4 animate-pulse" : ""
              }`}
              style={{ fontSize: 44, color: accentColor(m.accent) }}
            >
              {m.value}
            </p>
            <div className="flex items-center gap-2.5 mt-2.5">
              <Delta value={m.delta} />
              {m.sub && <span className="text-[11px] text-ink-3">{m.sub}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

function accentColor(accent: Metric["accent"]): string {
  switch (accent) {
    case "eqi":
      return "hsl(var(--eqi-green))";
    case "pos":
      return "hsl(var(--success))";
    default:
      return "hsl(var(--ink))";
  }
}

/**
 * Delta indicator — segue o componente `Delta` do primitives.jsx do
 * design: ▲ verde se positivo, ▼ vermelho se negativo, "—" cinza se
 * neutro/null.
 */
function Delta({ value }: { value: number | null }) {
  if (value === null || value === 0) {
    return (
      <span className="font-mono text-[12px] font-bold text-ink-3">—</span>
    );
  }
  const pos = value > 0;
  return (
    <span
      className="font-mono inline-flex items-center gap-0.5 text-[12px] font-bold"
      style={{ color: pos ? "hsl(var(--success))" : "hsl(var(--destructive))" }}
    >
      <span style={{ fontSize: 9 }}>{pos ? "▲" : "▼"}</span>
      {Math.abs(value)}%
    </span>
  );
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default HeroMetricStrip;
