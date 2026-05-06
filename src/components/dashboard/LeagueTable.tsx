import { Crown, Fire, DownloadSimple, Funnel } from "@phosphor-icons/react";
import { type Assessor } from "@/types/assessor";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";

interface LeagueTableProps {
  /** Lista enriquecida (já ordenada). */
  rows: Array<{
    id: string;
    name: string;
    avatar: string;
    photoUrl: string | null;
    level: Assessor["level"];
    points: number;
    weeklyGoalPercent: number;
    streak: number;
    isInactive?: boolean;
  }>;
}

/**
 * Tabela completa da liga (artboard RankingScreen). Header dark, linhas
 * com avatar 28px, nome bold + sub mono, %, forma 5J (W/D/L), variação.
 *
 * Forma 5J é simulada localmente: gera 5 marcadores baseados no
 * weeklyGoalPercent do assessor (≥100 = W, 70-100 = D, <70 = L) +
 * pequena variação randômica determinística pelo id pra evitar repetir
 * o mesmo padrão em todas as linhas. Quando tivermos histórico real
 * via useReports.assessor.history, isso vira input real.
 */
const LeagueTable = ({ rows }: LeagueTableProps) => {
  return (
    <div className="rounded-[14px] border border-line bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-line">
        <h3 className="text-[14px] font-extrabold tracking-tight text-ink">
          Tabela da Liga
        </h3>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[11px] font-semibold text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors">
            <Funnel size={12} /> Mesa
          </button>
          <button className="inline-flex items-center gap-1 px-2 py-1 rounded-[6px] text-[11px] font-semibold text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors">
            <DownloadSimple size={12} />
          </button>
        </div>
      </div>

      <div
        className="grid items-center px-5 py-2.5 bg-surface-2 border-b border-line gap-2"
        style={{ gridTemplateColumns: "36px 32px 1fr 80px 80px 100px" }}
      >
        <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-ink-3">#</p>
        <span />
        <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-ink-3">
          ASSESSOR
        </p>
        <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-ink-3 text-right">
          PTS
        </p>
        <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-ink-3 text-right">
          %META
        </p>
        <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-ink-3 text-center">
          FORMA · 5J
        </p>
      </div>

      {rows.map((p, i) => {
        const last = i === rows.length - 1;
        const pctColor =
          p.weeklyGoalPercent >= 100
            ? "hsl(var(--success))"
            : p.weeklyGoalPercent >= 70
            ? "hsl(var(--ink))"
            : "hsl(var(--destructive))";
        const form = generateForm5J(p.id, p.weeklyGoalPercent);
        return (
          <div
            key={p.id}
            className={`grid items-center gap-2 px-5 py-3 ${
              last ? "" : "border-b border-line"
            }`}
            style={{
              gridTemplateColumns: "36px 32px 1fr 80px 80px 100px",
              background: i === 0 ? "oklch(0.99 0.02 80)" : "transparent",
            }}
          >
            <span
              className="font-mono text-[14px] font-extrabold"
              style={{ color: i < 3 ? "hsl(var(--ink))" : "hsl(var(--ink-3))" }}
            >
              {i === 0 ? (
                <Crown size={16} weight="fill" className="text-gold-deep" />
              ) : (
                String(i + 1).padStart(2, "0")
              )}
            </span>
            <AssessorAvatar
              initials={p.avatar}
              photoUrl={p.photoUrl}
              level={p.level}
              size={28}
            />
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-ink truncate inline-flex items-center gap-1.5">
                {p.name}
                {p.streak >= 5 && (
                  <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-gold-deep">
                    <Fire size={10} weight="fill" /> {p.streak}
                  </span>
                )}
              </p>
              <p className="font-mono text-[10px] text-ink-3 mt-0.5 capitalize">
                NV {p.level}
                {p.isInactive && " · inativo"}
              </p>
            </div>
            <span className="font-mono text-[13px] font-bold text-right text-ink">
              {p.points.toLocaleString("pt-BR")}
            </span>
            <span
              className="font-mono text-[14px] font-extrabold text-right"
              style={{ color: pctColor }}
            >
              {p.weeklyGoalPercent}%
            </span>
            <div className="flex gap-[3px] justify-center">
              {form.map((r, j) => (
                <div
                  key={j}
                  title={r === "W" ? "Vitória" : r === "L" ? "Derrota" : "Empate"}
                  className="rounded-[3px] flex items-center justify-center font-extrabold text-white text-[9px]"
                  style={{
                    width: 16,
                    height: 16,
                    background:
                      r === "W"
                        ? "hsl(var(--success))"
                        : r === "L"
                        ? "hsl(var(--destructive))"
                        : "hsl(var(--ink-3))",
                  }}
                >
                  {r === "D" ? "–" : r}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Gera 5 marcadores W/D/L determinísticos com base no id + pct.
 * Determinístico pra não embaralhar a cada render. Quando tivermos
 * histórico real (ApiAssessorReport.kpis[].history), substitua por
 * lookup do dia útil correspondente.
 */
function generateForm5J(id: string, pct: number): Array<"W" | "D" | "L"> {
  const seed = hash(id);
  return Array.from({ length: 5 }).map((_, i) => {
    const r = ((seed + i * 31) % 100) / 100;
    // Bias pelo % atual: quem tem alta % tende a ter mais W
    const winThreshold = 0.65 - (pct - 70) / 200;
    const drawThreshold = winThreshold + 0.2;
    if (r < winThreshold) return "W";
    if (r < drawThreshold) return "D";
    return "L";
  });
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export default LeagueTable;
