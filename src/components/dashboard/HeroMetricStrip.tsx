import { useMemo } from "react";
import { TrendUp, TrendDown } from "@phosphor-icons/react";
import { useOverviewReport } from "@/hooks/useReports";
import { useWeeklyRanking } from "@/hooks/useRankings";

interface HeroMetricStripProps {
  from: string;
  to: string;
}

/**
 * Faixa de 4 métricas grandes no topo da Visão Geral — segue o
 * artboard "Hero metric strip" do design Editorial V1: card único
 * dividido em 4 colunas com label uppercase + número grande mono +
 * delta + subtitle.
 *
 * Alimentado por overview report + weekly ranking. Se algum dado
 * ainda está carregando, mostra um placeholder discreto no lugar
 * do número (mantém o layout estável).
 */
const HeroMetricStrip = ({ from, to }: HeroMetricStripProps) => {
  const { data: overview, isLoading: overviewLoading } = useOverviewReport({ from, to });
  const { data: weekly, isLoading: weeklyLoading } = useWeeklyRanking();

  const metrics = useMemo(() => {
    // META AGREGADA: média ponderada de % das KPIs (ou só média simples)
    const aggPct = overview?.byKpi?.length
      ? Math.round(
          overview.byKpi.reduce((s, k) => s + (k.percent || 0), 0) / overview.byKpi.length,
        )
      : null;

    // PONTOS DA SEMANA: soma de pontos do weekly ranking
    const totalPoints = weekly?.rankings?.reduce((s, r) => s + (r.rollup.points || 0), 0) ?? null;

    const boletas = overview?.byKpi?.find((k) => k.key === "boletas");
    const ativacao = overview?.byKpi?.find(
      (k) => k.key === "ativacao" || k.key === "ativacoes" || k.key === "ativacao_conta",
    );

    return [
      {
        label: "META AGREGADA",
        value: aggPct != null ? `${aggPct}%` : "—",
        sub: "time inteiro",
        accent: aggPct != null && aggPct >= 100 ? "eqi" : "ink",
      },
      {
        label: "PONTOS DA SEMANA",
        value: totalPoints != null ? formatCompact(totalPoints) : "—",
        sub: "soma do time",
        accent: "ink",
      },
      {
        label: boletas?.label?.toUpperCase() ?? "BOLETAS FECHADAS",
        value: boletas ? String(Math.round(boletas.actual)) : "—",
        sub: boletas ? `meta ${boletas.target}` : "",
        accent: boletas && boletas.percent >= 100 ? "eqi" : "ink",
      },
      {
        label: ativacao?.label?.toUpperCase() ?? "CONTAS ATIVADAS",
        value: ativacao ? String(Math.round(ativacao.actual)) : "—",
        sub: ativacao
          ? `meta ${ativacao.target}${ativacao.percent >= 100 ? " · acima" : ""}`
          : "",
        accent: ativacao && ativacao.percent >= 100 ? "pos" : "ink",
      },
    ] as const;
  }, [overview, weekly]);

  const loading = overviewLoading || weeklyLoading;

  return (
    <div className="rounded-[14px] border border-line bg-card overflow-hidden">
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {metrics.map((m, i) => (
          <div
            key={m.label}
            className={`px-7 py-6 ${
              i < 3 ? "lg:border-r border-line" : ""
            } ${i % 2 === 0 ? "border-r lg:border-r border-line" : ""} ${
              i < 2 ? "border-b lg:border-b-0 border-line" : ""
            }`}
          >
            <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-ink-3 mb-3">
              {m.label}
            </p>
            <p
              className={`font-mono font-extrabold tracking-[-0.03em] leading-none ${
                loading ? "text-ink-4 animate-pulse" : ""
              }`}
              style={{
                fontSize: 44,
                color: accentColor(m.accent),
              }}
            >
              {m.value}
            </p>
            {m.sub && (
              <div className="flex items-center gap-2 mt-2.5">
                <DeltaPlaceholder accent={m.accent} />
                <span className="text-[11px] text-ink-3">{m.sub}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

function accentColor(accent: string): string {
  switch (accent) {
    case "eqi":
      return "hsl(var(--eqi-green))";
    case "pos":
      return "hsl(var(--success))";
    case "ink":
    default:
      return "hsl(var(--ink))";
  }
}

/**
 * Placeholder de delta — não temos comparação histórica direta no
 * overview report (would need useOverviewReport com previousRange);
 * fica como um traço discreto no Editorial.
 */
function DeltaPlaceholder({ accent }: { accent: string }) {
  if (accent === "eqi" || accent === "pos") {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-[12px] font-bold text-success">
        <TrendUp size={11} weight="bold" />
        no ritmo
      </span>
    );
  }
  return <span className="font-mono text-[12px] text-ink-3 font-semibold">—</span>;
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default HeroMetricStrip;
