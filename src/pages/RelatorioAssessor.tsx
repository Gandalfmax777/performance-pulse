/**
 * Relatório PDF individual por assessor (rota /relatorio/assessor/:id).
 *
 * Mesmo padrão da rota /relatorio (do time) — página standalone, sem
 * AdminLayout/Index, layout vertical otimizado pra A4. CSS local.
 *
 * Uso: /relatorio/assessor/:id?period=weekly|monthly[&autoprint=1]
 */

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Printer, Loader2, Award, Flame, TrendingUp } from "lucide-react";
import Markdown from "react-markdown";
import { useAssessorReport } from "@/hooks/useReports";
import { useInsight, useGenerateInsight } from "@/hooks/useInsight";
import { BadgeIcon } from "@/components/ui/BadgeIcon";
import {
  isMeetingNote,
  isMeetingAreaNote,
  stripMeetingPrefix,
  MEETING_BONUS_POINTS,
  MEETING_AREA_POINTS,
} from "@/lib/meetingBonus";

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

const LEVEL_LABEL: Record<string, string> = {
  BRONZE: "Bronze",
  SILVER: "Silver",
  GOLD: "Gold",
};

const RelatorioAssessor = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const period: Period =
    searchParams.get("period") === "monthly" ? "monthly" : "weekly";
  const autoprint = searchParams.get("autoprint") === "1";
  const range = rangeFor(period);

  const { data: report, isLoading } = useAssessorReport(id, {
    from: range.from,
    to: range.to,
  });
  const { data: cachedInsight } = useInsight(id, range.insightPeriod);
  const generateInsight = useGenerateInsight();
  const [insight, setInsight] = useState(cachedInsight);

  // Sincroniza com cache
  useEffect(() => {
    if (cachedInsight) setInsight(cachedInsight);
  }, [cachedInsight]);

  // Gera insight on-mount se não houver cache
  useEffect(() => {
    if (!id || cachedInsight || generateInsight.isPending) return;
    generateInsight.mutate(
      { assessorId: id, period: range.insightPeriod },
      { onSuccess: (data) => setInsight(data) },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, cachedInsight, period]);

  // Auto-print quando tudo carregou
  const ready = !isLoading && (insight || generateInsight.isError);
  useEffect(() => {
    if (autoprint && ready) {
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
  }, [autoprint, ready]);

  if (isLoading || !report) {
    return (
      <div className="ra-loading">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Carregando relatório...</span>
      </div>
    );
  }

  const a = report.assessor;

  return (
    <div className="relatorio-container">
      {/* Toolbar (escondida em print) */}
      <div className="relatorio-toolbar no-print">
        <button onClick={() => navigate(-1)} className="rt-btn">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <span className="rt-title">
          {a.name} • {range.label}
        </span>
        <button onClick={() => window.print()} className="rt-btn rt-btn-primary">
          <Printer className="w-4 h-4" /> Imprimir / Salvar PDF
        </button>
      </div>

      <div className="relatorio-content">
        {/* Capa */}
        <header className="ra-header">
          <div className="ra-avatar">
            {a.photoUrl ? (
              <img src={a.photoUrl} alt={a.name} />
            ) : (
              <span>{a.initials}</span>
            )}
          </div>
          <div className="ra-header-text">
            <h1>{a.name}</h1>
            <p className="ra-subtitle">
              <span className={`ra-level ra-level-${a.level.toLowerCase()}`}>
                {LEVEL_LABEL[a.level] ?? a.level}
              </span>
              • {range.label}
            </p>
          </div>
        </header>

        {/* Sumário */}
        <section className="ra-summary">
          <div className="ra-summary-item">
            <TrendingUp className="ra-summary-icon" />
            <div>
              <span className="r-label">Pontos</span>
              <span className="r-value">{report.rollup.points}</span>
            </div>
          </div>
          <div className="ra-summary-item">
            <Award className="ra-summary-icon" />
            <div>
              <span className="r-label">% Meta</span>
              <span className="r-value">{report.rollup.weeklyGoalPercent}%</span>
            </div>
          </div>
          <div className="ra-summary-item">
            <Flame className="ra-summary-icon" />
            <div>
              <span className="r-label">Streak</span>
              <span className="r-value">{report.rollup.streak} dias</span>
            </div>
          </div>
          <div className="ra-summary-item">
            <Award className="ra-summary-icon" />
            <div>
              <span className="r-label">Badges</span>
              <span className="r-value">{report.badgeUnlocks.length}</span>
            </div>
          </div>
        </section>

        {/* KPIs detalhados */}
        <section className="r-section r-page-break">
          <h2>KPIs no Período</h2>
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
              {report.kpis.map((k) => {
                const pct = Math.round(k.percentOfTarget);
                const status =
                  pct >= 100 ? "Bateu" : pct >= 70 ? "Próximo" : "Abaixo";
                return (
                  <tr key={k.key}>
                    <td>{k.label}</td>
                    <td className="r-right r-mono">{k.total}</td>
                    <td className="r-right r-mono">{k.target}</td>
                    <td className="r-right r-mono r-bold">{pct}%</td>
                    <td>{status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {/* Histórico diário compacto */}
        {report.kpis.some((k) => k.history.length > 0) && (
          <section className="r-section r-page-break">
            <h2>Atividade Diária</h2>
            <table className="r-table r-table-history">
              <thead>
                <tr>
                  <th>Data</th>
                  {report.kpis.map((k) => (
                    <th key={k.key} className="r-right">
                      {k.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Coleta todas as datas únicas de qualquer KPI
                  const allDates = new Set<string>();
                  for (const k of report.kpis) {
                    for (const h of k.history) {
                      if (h.value > 0) allDates.add(h.date);
                    }
                  }
                  const sortedDates = Array.from(allDates).sort();
                  return sortedDates.map((date) => (
                    <tr key={date}>
                      <td className="r-mono">
                        {format(parseISO(date), "dd/MM (EEE)", { locale: ptBR })}
                      </td>
                      {report.kpis.map((k) => {
                        const v = k.history.find((h) => h.date === date)?.value ?? 0;
                        return (
                          <td key={k.key} className="r-right r-mono">
                            {v || "—"}
                          </td>
                        );
                      })}
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </section>
        )}

        {/* Observações */}
        {report.observations.length > 0 && (
          <section className="r-section r-page-break">
            <h2>Observações Registradas</h2>
            <ul className="ra-obs-list">
              {report.observations.map((o, i) => {
                const meeting = isMeetingNote(o.notes);
                const meetingArea = isMeetingAreaNote(o.notes);
                const text = meeting || meetingArea ? stripMeetingPrefix(o.notes) : o.notes;
                const tag = meeting
                  ? `Reunião venda +${MEETING_BONUS_POINTS}pts`
                  : meetingArea
                    ? `Reunião áreas +${MEETING_AREA_POINTS}pts`
                    : null;
                return (
                  <li key={i} className="ra-obs-item">
                    <span className="ra-obs-date r-mono">
                      {format(parseISO(o.date), "dd/MM", { locale: ptBR })}
                    </span>
                    <div className="ra-obs-content">
                      {tag && <span className="ra-obs-tag">{tag}</span>}
                      <span className="ra-obs-text">{text}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Badges */}
        {report.badgeUnlocks.length > 0 && (
          <section className="r-section">
            <h2>Conquistas</h2>
            <div className="ra-badges">
              {report.badgeUnlocks.map((b) => (
                <span key={b.id} className="ra-badge inline-flex items-center gap-1">
                  <BadgeIcon slug={b.icon} size={14} />
                  {b.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Análise IA */}
        <section className="r-section r-page-break">
          <h2>Análise Individual (IA)</h2>
          {generateInsight.isPending && !insight ? (
            <p className="r-loading">
              <Loader2 className="w-4 h-4 inline animate-spin" /> Analisando…
            </p>
          ) : insight ? (
            <div className="r-markdown">
              <Markdown>{insight.textMarkdown}</Markdown>
              <p className="r-meta">
                Gerada em{" "}
                {format(parseISO(insight.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
                {insight.cached && " (cache)"}
              </p>
            </div>
          ) : (
            <p className="r-loading">
              {generateInsight.isError
                ? `Não foi possível gerar análise: ${generateInsight.error instanceof Error ? generateInsight.error.message : "erro"}`
                : "Aguardando…"}
            </p>
          )}
        </section>

        {/* Footer */}
        <footer className="r-footer">
          <p>
            Performance Pulse • {a.name} • Gerado em{" "}
            {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </footer>
      </div>

      <style>{`
        .ra-loading {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: #888;
          font-size: 14px;
        }
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

        .ra-header {
          display: flex;
          align-items: center;
          gap: 24px;
          padding-bottom: 20px;
          border-bottom: 2px solid #16a34a;
          margin-bottom: 24px;
        }
        .ra-avatar {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          overflow: hidden;
          border: 3px solid #16a34a;
          flex-shrink: 0;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: 700;
          color: #16a34a;
        }
        .ra-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .ra-header-text h1 {
          font-size: 28px;
          font-weight: 800;
          margin: 0 0 8px;
          color: #111;
        }
        .ra-subtitle {
          font-size: 14px;
          color: #666;
          margin: 0;
        }
        .ra-level {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-right: 6px;
        }
        .ra-level-bronze { background: #fef3c7; color: #92400e; }
        .ra-level-silver { background: #e5e7eb; color: #374151; }
        .ra-level-gold { background: #fef9c3; color: #a16207; }

        .ra-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }
        .ra-summary-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          background: #fafafa;
        }
        .ra-summary-icon {
          width: 24px;
          height: 24px;
          color: #16a34a;
          flex-shrink: 0;
        }
        .ra-summary-item .r-label {
          display: block;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          color: #888;
        }
        .ra-summary-item .r-value {
          display: block;
          font-size: 20px;
          font-weight: 700;
          color: #111;
          line-height: 1.1;
          margin-top: 2px;
        }

        .r-section { margin-bottom: 28px; }
        .r-section h2 {
          font-size: 17px;
          font-weight: 700;
          margin: 0 0 12px;
          color: #111;
          border-bottom: 1px solid #ddd;
          padding-bottom: 4px;
        }
        .r-loading { color: #888; font-style: italic; padding: 12px 0; }

        .r-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        .r-table th, .r-table td {
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

        .r-table-history th, .r-table-history td {
          font-size: 11px;
          padding: 4px 6px;
        }

        .ra-obs-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .ra-obs-item {
          display: flex;
          gap: 12px;
          padding: 8px 0;
          border-bottom: 1px solid #f0f0f0;
        }
        .ra-obs-item:last-child { border-bottom: none; }
        .ra-obs-date {
          flex-shrink: 0;
          width: 50px;
          font-size: 11px;
          color: #888;
          padding-top: 2px;
        }
        .ra-obs-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .ra-obs-tag {
          display: inline-block;
          font-size: 10px;
          font-weight: 700;
          color: #16a34a;
          background: #dcfce7;
          padding: 1px 6px;
          border-radius: 3px;
          align-self: flex-start;
        }
        .ra-obs-text { font-size: 12px; color: #333; }

        .ra-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .ra-badge {
          font-size: 11px;
          padding: 4px 10px;
          background: #fef3c7;
          color: #92400e;
          border-radius: 4px;
          font-weight: 600;
        }

        .r-markdown { font-size: 13px; line-height: 1.6; }
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
          margin-top: 40px;
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
          .ra-header, .r-footer { page-break-inside: avoid; }
          .r-page-break { page-break-inside: auto; }
          .ra-summary { grid-template-columns: repeat(4, 1fr) !important; }
        }
      `}</style>
    </div>
  );
};

export default RelatorioAssessor;
