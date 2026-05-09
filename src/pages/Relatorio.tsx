/**
 * Relatório PDF dedicado (rota /relatorio).
 *
 * Por que página separada? O `window.print()` chamado de dentro do dashboard
 * estava produzindo PDF vazio porque o layout principal usa overflow-y-auto +
 * múltiplos containers fixed/sticky que o print quebrava.
 *
 * Aqui é uma página standalone, sem AdminLayout/Index, com layout vertical
 * simples otimizado pra A4. CSS local (não depende do print global).
 *
 * Uso: /relatorio?period=weekly|monthly[&autoprint=1]
 *  - period: range pra agregar (default weekly)
 *  - autoprint=1: chama window.print() automaticamente quando dados carregam
 */

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Printer, CircleNotch } from "@phosphor-icons/react";
import Markdown from "react-markdown";
import { useOverviewReport } from "@/hooks/useReports";
import { useAssessors } from "@/hooks/useAssessors";
import { useGenerateTeamInsight, type ApiInsight } from "@/hooks/useInsight";

type Period = "weekly" | "monthly";

function rangeFor(period: Period) {
  const now = new Date();
  const fmt = (d: Date) => format(d, "yyyy-MM-dd");
  if (period === "weekly") {
    const s = startOfWeek(now, { weekStartsOn: 1 });
    const e = endOfWeek(now, { weekStartsOn: 1 });
    return {
      from: fmt(s),
      to: fmt(e),
      label: `Semana de ${format(s, "dd/MM", { locale: ptBR })} a ${format(e, "dd/MM/yyyy", { locale: ptBR })}`,
      insightPeriod: "WEEK" as const,
    };
  }
  return {
    from: fmt(startOfMonth(now)),
    to: fmt(endOfMonth(now)),
    label: format(now, "MMMM 'de' yyyy", { locale: ptBR }).replace(/^\w/, (c) =>
      c.toUpperCase(),
    ),
    insightPeriod: "MONTH" as const,
  };
}

const Relatorio = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const period: Period =
    searchParams.get("period") === "monthly" ? "monthly" : "weekly";
  const autoprint = searchParams.get("autoprint") === "1";
  const range = rangeFor(period);

  const { assessors } = useAssessors();
  const { data: overview, isLoading: overviewLoading } = useOverviewReport({
    from: range.from,
    to: range.to,
  });
  const generateTeam = useGenerateTeamInsight();
  const [teamInsight, setTeamInsight] = useState<ApiInsight | null>(null);

  // Carrega insight de IA on-mount (cached se já existir)
  useEffect(() => {
    generateTeam.mutate(
      { period: range.insightPeriod },
      { onSuccess: (data) => setTeamInsight(data) },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  // Auto-print quando tudo carregou
  const ready = !overviewLoading && (teamInsight || generateTeam.isError);
  useEffect(() => {
    if (autoprint && ready) {
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
  }, [autoprint, ready]);

  // Ranking ordenado por overview.allPerformers
  const ranked = useMemo(() => {
    if (!overview?.allPerformers) {
      return [...assessors].sort((a, b) => b.points - a.points);
    }
    return [...assessors]
      .map((a) => {
        const p = overview.allPerformers.find((x) => x.assessorId === a.id);
        return {
          ...a,
          points: p?.points ?? 0,
          weeklyGoalPercent: p?.weeklyGoalPercent ?? 0,
        };
      })
      .sort((a, b) => b.points - a.points);
  }, [assessors, overview]);

  const totalPoints = ranked.reduce((s, a) => s + a.points, 0);

  return (
    <div className="relatorio-container">
      {/* Toolbar (escondida em print) */}
      <div className="relatorio-toolbar no-print">
        <button onClick={() => navigate(-1)} className="rt-btn">
          <ArrowLeft size={16} weight="bold" /> Voltar
        </button>
        <span className="rt-title">Relatório • {range.label}</span>
        <button onClick={() => window.print()} className="rt-btn rt-btn-primary">
          <Printer size={16} weight="bold" /> Imprimir / Salvar PDF
        </button>
      </div>

      {/* Conteúdo do PDF */}
      <div className="relatorio-content">
        {/* Capa */}
        <header className="r-header">
          <h1>Performance Pulse</h1>
          <p className="r-period">{range.label}</p>
          <div className="r-summary">
            <div className="r-summary-item">
              <span className="r-label">Total Pontos</span>
              <span className="r-value">{totalPoints}</span>
            </div>
            <div className="r-summary-item">
              <span className="r-label">Assessores</span>
              <span className="r-value">{ranked.length}</span>
            </div>
            <div className="r-summary-item">
              <span className="r-label">Total Registros</span>
              <span className="r-value">{overview?.totalMetricEntries ?? 0}</span>
            </div>
          </div>
        </header>

        {/* KPIs do time */}
        <section className="r-section r-page-break">
          <h2>KPIs do Time</h2>
          {overviewLoading ? (
            <p className="r-loading">Carregando...</p>
          ) : (
            <table className="r-table">
              <thead>
                <tr>
                  <th>KPI</th>
                  <th className="r-right">Realizado</th>
                  <th className="r-right">Meta</th>
                  <th className="r-right">%</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(overview?.byKpi ?? []).map((k) => {
                  const pct = Math.round(k.percent);
                  const status =
                    pct >= 100 ? "Bateu" : pct >= 70 ? "Próximo" : "Abaixo";
                  return (
                    <tr key={k.kpiId}>
                      <td>{k.label}</td>
                      <td className="r-right r-mono">{Math.round(k.actual)}</td>
                      <td className="r-right r-mono">{k.target}</td>
                      <td className="r-right r-mono r-bold">{pct}%</td>
                      <td>{status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        {/* Ranking */}
        <section className="r-section r-page-break">
          <h2>Ranking Completo</h2>
          <table className="r-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Assessor</th>
                <th className="r-right">Pontos</th>
                <th className="r-right">% Meta</th>
                <th className="r-right">Streak</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((a, i) => (
                <tr key={a.id} className={i < 3 ? "r-podium" : ""}>
                  <td className="r-bold">
                    {`${i + 1}º`}
                  </td>
                  <td>{a.name}</td>
                  <td className="r-right r-mono r-bold">{a.points}</td>
                  <td className="r-right r-mono">{a.weeklyGoalPercent}%</td>
                  <td className="r-right r-mono">{a.streak > 0 ? `${a.streak}d` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Análise IA */}
        <section className="r-section r-page-break">
          <h2>Análise do Time (IA)</h2>
          {generateTeam.isPending && !teamInsight ? (
            <p className="r-loading">
              <CircleNotch size={16} className="inline animate-spin" /> Gemini Flash analisando…
            </p>
          ) : teamInsight ? (
            <div className="r-markdown">
              <Markdown>{teamInsight.textMarkdown}</Markdown>
              <p className="r-meta">
                Gerada em{" "}
                {format(parseISO(teamInsight.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
                {teamInsight.cached && " (cache)"}
              </p>
            </div>
          ) : (
            <p className="r-loading">
              {generateTeam.isError
                ? `Não foi possível gerar análise: ${generateTeam.error instanceof Error ? generateTeam.error.message : "erro"}`
                : "Aguardando..."}
            </p>
          )}
        </section>

        {/* Footer */}
        <footer className="r-footer">
          <p>
            Performance Pulse • Gerado em{" "}
            {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </footer>
      </div>

      {/* CSS local — não depende do print global */}
      <style>{`
        .relatorio-container {
          background: #f5f5f5;
          min-height: 100vh;
          padding: 0;
        }
        .relatorio-toolbar {
          position: sticky;
          top: 0;
          z-index: 10;
          background: white;
          border-bottom: 1px solid #e5e5e5;
          padding: 12px 24px;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .rt-title {
          font-weight: 600;
          font-size: 14px;
          color: #333;
          flex: 1;
          text-align: center;
        }
        .rt-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 13px;
          background: white;
          color: #333;
          cursor: pointer;
        }
        .rt-btn:hover { background: #f5f5f5; }
        .rt-btn-primary {
          background: #16a34a;
          color: white;
          border-color: #16a34a;
        }
        .rt-btn-primary:hover { background: #15803d; }

        .relatorio-content {
          max-width: 800px;
          margin: 24px auto;
          background: white;
          padding: 48px;
          color: #111;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
          font-size: 13px;
          line-height: 1.5;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .r-header {
          text-align: center;
          padding-bottom: 24px;
          border-bottom: 2px solid #16a34a;
          margin-bottom: 32px;
        }
        .r-header h1 {
          font-size: 32px;
          font-weight: 800;
          margin: 0 0 8px;
          color: #16a34a;
        }
        .r-period {
          font-size: 16px;
          color: #666;
          margin: 0 0 24px;
        }
        .r-summary {
          display: flex;
          justify-content: center;
          gap: 48px;
          margin-top: 24px;
        }
        .r-summary-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .r-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #888;
        }
        .r-value {
          font-size: 28px;
          font-weight: 800;
          color: #111;
          margin-top: 4px;
        }

        .r-section {
          margin-bottom: 32px;
        }
        .r-section h2 {
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 12px;
          color: #111;
          border-bottom: 1px solid #ddd;
          padding-bottom: 4px;
        }
        .r-loading {
          color: #888;
          font-style: italic;
          padding: 16px 0;
        }

        .r-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        .r-table th,
        .r-table td {
          padding: 6px 8px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        .r-table th {
          background: #f9f9f9;
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          color: #555;
        }
        .r-right { text-align: right !important; }
        .r-mono { font-family: "SF Mono", Menlo, Consolas, monospace; }
        .r-bold { font-weight: 700; }
        .r-podium { background: #fffbeb; }

        .r-markdown {
          font-size: 13px;
          line-height: 1.6;
        }
        .r-markdown h1, .r-markdown h2, .r-markdown h3 {
          margin: 16px 0 8px;
          font-weight: 700;
        }
        .r-markdown h1 { font-size: 18px; }
        .r-markdown h2 { font-size: 15px; }
        .r-markdown h3 { font-size: 13px; }
        .r-markdown p { margin: 6px 0; }
        .r-markdown ul, .r-markdown ol { margin: 6px 0; padding-left: 20px; }
        .r-markdown li { margin: 2px 0; }
        .r-markdown strong { font-weight: 700; color: #111; }
        .r-meta {
          font-size: 10px;
          color: #999;
          margin-top: 12px;
          padding-top: 8px;
          border-top: 1px dashed #ddd;
        }

        .r-footer {
          text-align: center;
          color: #888;
          font-size: 10px;
          margin-top: 48px;
          padding-top: 16px;
          border-top: 1px solid #eee;
        }

        @media print {
          body { background: white !important; }
          .relatorio-container { background: white !important; padding: 0 !important; }
          .relatorio-content {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 16px 24px !important;
            box-shadow: none !important;
          }
          .r-page-break {
            page-break-inside: auto;
          }
          /* Não quebra header/footer */
          .r-header, .r-footer { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
};

export default Relatorio;
