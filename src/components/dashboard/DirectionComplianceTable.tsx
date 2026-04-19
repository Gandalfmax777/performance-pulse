import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Target,
  Loader2,
  ArrowUp,
  ArrowDown,
  Minus,
  Check,
  Clock,
  X as XIcon,
  AlertTriangle,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  useDirectionCompliance,
  useReviewDirection,
  type DirectionStatus,
} from "@/hooks/useDailyDirection";
import { useKpis } from "@/hooks/useKpis";
import { Button } from "@/components/ui/button";

const STATUS_META: Record<DirectionStatus, { label: string; icon: typeof Check; cls: string }> = {
  PENDING:  { label: "Pendente",  icon: Clock,          cls: "bg-muted/30 text-muted-foreground" },
  ACHIEVED: { label: "Cumprido",  icon: Check,          cls: "bg-success/15 text-success" },
  PARTIAL:  { label: "Parcial",   icon: AlertTriangle,  cls: "bg-chart-orange/15 text-chart-orange" },
  MISSED:   { label: "Falhou",    icon: XIcon,          cls: "bg-destructive/15 text-destructive" },
};

interface Props {
  /** Filtro opcional por período (DAILY/WEEKLY/MONTHLY) */
  period?: "DAILY" | "WEEKLY" | "MONTHLY";
  limit?: number;
}

/**
 * Lista directions ordenadas por data desc com cumprimento medido.
 * Pra cada direction com targetKpiKeys, mostra delta % vs período anterior.
 * Admin pode marcar status de cumprimento direto na linha.
 */
const DirectionComplianceTable = ({ period, limit = 10 }: Props) => {
  const { data: directions = [], isLoading } = useDirectionCompliance({ period, limit });
  const { kpis } = useKpis();
  const review = useReviewDirection();

  const kpiLabel = useMemo(() => {
    const map = new Map(kpis.map((k) => [k.key, k.label]));
    return (key: string) => map.get(key) ?? key;
  }, [kpis]);

  const handleReview = async (id: string, status: DirectionStatus) => {
    try {
      await review.mutateAsync({ id, status });
      toast.success(`Status: ${STATUS_META[status].label}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar");
    }
  };

  return (
    <div className="card-glass rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Cumprimento de Foco</h3>
        <span className="text-[10px] text-muted-foreground">
          Compara KPIs alvo com mesmo intervalo anterior
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Carregando…
        </div>
      ) : directions.length === 0 ? (
        <p className="text-xs text-muted-foreground py-6 text-center">
          Nenhum foco cadastrado{period ? ` no período ${period.toLowerCase()}` : ""}.
          Crie um na tela "Por Dia" ou no Modo Apresentação.
        </p>
      ) : (
        <div className="space-y-3">
          {directions.map((d, i) => {
            const StatusIcon = STATUS_META[d.status].icon;
            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="border border-border/30 rounded-lg p-3 bg-muted/10 space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <span className="font-mono">
                        {format(parseISO(d.date), "dd/MM/yyyy")}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                        {d.period === "DAILY" ? "Dia" : d.period === "WEEKLY" ? "Semana" : "Mês"}
                      </span>
                      {d.periodStart && d.periodEnd && d.period !== "DAILY" && (
                        <span>
                          ({format(parseISO(d.periodStart), "dd/MM")} → {format(parseISO(d.periodEnd), "dd/MM")})
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">{d.text}</p>
                  </div>
                  <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${STATUS_META[d.status].cls}`}>
                    <StatusIcon className="w-3 h-3" />
                    {STATUS_META[d.status].label}
                  </span>
                </div>

                {/* Tabela de cumprimento por KPI */}
                {d.compliance.length > 0 ? (
                  <div className="overflow-hidden rounded-md border border-border/20">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/20">
                        <tr>
                          <th className="text-left px-2 py-1.5 font-semibold">KPI</th>
                          <th className="text-right px-2 py-1.5 font-semibold">Realizado</th>
                          <th className="text-right px-2 py-1.5 font-semibold">Período anterior</th>
                          <th className="text-right px-2 py-1.5 font-semibold">Delta</th>
                        </tr>
                      </thead>
                      <tbody>
                        {d.compliance.map((c) => {
                          const pct = c.deltaPct;
                          const isUp = pct !== null && pct > 1;
                          const isDown = pct !== null && pct < -1;
                          const Icon = pct === null ? Minus : isUp ? ArrowUp : isDown ? ArrowDown : Minus;
                          const color = pct === null
                            ? "text-muted-foreground"
                            : isUp
                            ? "text-success"
                            : isDown
                            ? "text-destructive"
                            : "text-muted-foreground";
                          return (
                            <tr key={c.kpiKey} className="border-t border-border/20">
                              <td className="px-2 py-1.5 text-foreground">{kpiLabel(c.kpiKey)}</td>
                              <td className="px-2 py-1.5 text-right font-mono">
                                {c.realized.toLocaleString("pt-BR")}
                              </td>
                              <td className="px-2 py-1.5 text-right font-mono text-muted-foreground">
                                {c.baseline.toLocaleString("pt-BR")}
                              </td>
                              <td className={`px-2 py-1.5 text-right font-mono font-bold ${color}`}>
                                <span className="inline-flex items-center gap-1">
                                  <Icon className="w-3 h-3" />
                                  {pct === null
                                    ? c.realized > 0 ? "novo!" : "—"
                                    : `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground italic">
                    Sem KPIs alvo definidos — não há cumprimento medível.
                  </p>
                )}

                {/* Ações de review */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-muted-foreground mr-1">Marcar como:</span>
                  {(["ACHIEVED", "PARTIAL", "MISSED", "PENDING"] as DirectionStatus[]).map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={d.status === s ? "default" : "outline"}
                      onClick={() => handleReview(d.id, s)}
                      disabled={review.isPending}
                      className="h-6 px-2 text-[10px]"
                    >
                      {STATUS_META[s].label}
                    </Button>
                  ))}
                </div>
                {d.reviewNote && (
                  <p className="text-[11px] text-muted-foreground italic">"{d.reviewNote}"</p>
                )}
                {d.reviewedAt && d.reviewedByName && (
                  <p className="text-[10px] text-muted-foreground">
                    Revisado por {d.reviewedByName} em{" "}
                    {format(parseISO(d.reviewedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DirectionComplianceTable;
