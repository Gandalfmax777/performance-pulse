import { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkle, Bell } from "@phosphor-icons/react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { useOverviewReport, useActivityFeed } from "@/hooks/useReports";
import { useAssessors } from "@/hooks/useAssessors";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";

interface ActivationHighlightProps {
  /** Range opcional (YYYY-MM-DD). Default: semana corrente. */
  from?: string;
  to?: string;
}

/**
 * Destaque dedicado pro KPI "Ativação de Conta" — evento principal de celebração
 * (sino + confete). Pedido do Felipe em 21/04/2026: "essa merece um destaque a
 * mais, talvez colocar em um espaço menor no visão geral, a cima da tendência
 * semanal".
 *
 * Mostra: ativações do time no período, target, barra, e quem foi o último a
 * ativar (com avatar). Quando zero, copy motivacional.
 */
const ActivationHighlight = ({ from, to }: ActivationHighlightProps) => {
  const now = new Date();
  const defaultFrom = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const defaultTo = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const fromDate = from ?? defaultFrom;
  const toDate = to ?? defaultTo;

  const { data: overview } = useOverviewReport({ from: fromDate, to: toDate });
  const { data: feed } = useActivityFeed({ limit: 50 });
  const { assessors } = useAssessors();

  const ativacao = overview?.byKpi.find((k) => k.key === "ativacao_conta");
  const actual = Math.round(ativacao?.actual ?? 0);
  const target = ativacao?.target ?? 0;
  const pct = target > 0 ? Math.min(150, Math.round((actual / target) * 100)) : 0;
  const barWidth = Math.min(100, pct);

  // Última ativação: primeiro item do feed cuja description menciona "ativação"
  // (feed é type=metric com desc tipo "registrou 1 ativação conta"). Simples
  // mas efetivo — não vale criar endpoint dedicado pra isso.
  const lastActivation = useMemo(() => {
    if (!feed) return null;
    const item = feed.find(
      (f) => f.type === "metric" && f.description.toLowerCase().includes("ativa"),
    );
    if (!item) return null;
    const a = assessors.find((x) => x.id === item.assessorId);
    return {
      name: item.assessorName,
      timestamp: item.timestamp,
      avatar: a?.avatar ?? item.assessorName.slice(0, 2).toUpperCase(),
      photoUrl: a?.photoUrl ?? null,
      level: a?.level ?? ("bronze" as const),
    };
  }, [feed, assessors]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-glass card-noise rounded-xl p-5 relative overflow-hidden border border-gold/30 bg-gradient-to-br from-gold/5 via-transparent to-gold/10"
    >
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gold/15 flex items-center justify-center">
            <Sparkle size={20} weight="fill" className="text-gold" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground leading-none mb-1">Destaque da semana</p>
            <h3 className="text-sm font-bold text-foreground leading-none">Ativação de Conta</h3>
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl font-black text-gold leading-none">{actual}</p>
          <p className="text-[10px] font-mono text-muted-foreground mt-1 inline-flex items-center gap-1 justify-end">
            de {target}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3 relative z-10">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${barWidth}%` }}
            transition={{ duration: 1.2 }}
            className="h-full rounded-full bg-gradient-to-r from-gold/70 to-gold"
          />
        </div>
        <span className="text-xs font-mono font-bold text-gold w-10 text-right">{pct}%</span>
      </div>

      {lastActivation ? (
        <div className="flex items-center gap-2 relative z-10 pt-2 border-t border-border/30">
          <AssessorAvatar
            initials={lastActivation.avatar}
            photoUrl={lastActivation.photoUrl}
            level={lastActivation.level}
            size={28}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-foreground">
              <span className="font-semibold">{lastActivation.name}</span>{" "}
              <span className="text-muted-foreground">tocou o sino há pouco</span>
            </p>
            <p className="text-[10px] text-muted-foreground font-mono">
              {format(new Date(lastActivation.timestamp), "dd/MM HH:mm")}
            </p>
          </div>
          <Bell size={16} weight="fill" className="text-gold animate-pulse" />
        </div>
      ) : (
        <div className="flex items-center gap-2 relative z-10 pt-2 border-t border-border/30">
          <Bell size={16} className="text-muted-foreground/60" />
          <p className="text-xs text-muted-foreground italic">
            Nenhuma ativação ainda — vamos tocar o sino!
          </p>
        </div>
      )}

      {/* Decorative sparkle bg */}
      <div className="absolute -right-6 -top-6 opacity-10 pointer-events-none">
        <Sparkle size={128} weight="fill" className="text-gold" />
      </div>
    </motion.div>
  );
};

export default ActivationHighlight;
