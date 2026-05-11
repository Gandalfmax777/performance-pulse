import { useMemo } from "react";
import { motion } from "framer-motion";
import { Bell } from "@phosphor-icons/react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { useOverviewReport, useActivityFeed } from "@/hooks/useReports";
import { useAssessors } from "@/hooks/useAssessors";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";
import { Eyebrow } from "@/components/shared";
import { cn } from "@/lib/utils";

interface ActivationHighlightProps {
  /** Range opcional (YYYY-MM-DD). Default: semana corrente. */
  from?: string;
  to?: string;
}

/**
 * Destaque dedicado pro KPI "Ativação de Conta" — evento principal de celebração
 * (sino). Pedido do Felipe em 21/04/2026.
 *
 * Achievement-Not-Casino Rule: UM elemento Achievement Amber só (dot no avatar
 * do último a ativar). Zero gradient, zero sparkle decorativo, sino estático.
 * Calor vem do texto editorial + display number, não de cor abundante.
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
  const onTrack = pct >= 80;

  // Última ativação: primeiro item do feed cuja description menciona "ativa"
  // (feed é type=metric com desc tipo "registrou 1 ativação conta").
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
      className="relative overflow-hidden rounded-[var(--radius)] border border-line bg-card p-5 shadow-[0_1px_2px_hsl(240_12%_16%/0.05),0_4px_16px_hsl(240_12%_16%/0.04)]"
    >
      <Eyebrow className="mb-3">Destaque da semana · Ativação de Conta</Eyebrow>

      <div className="flex items-end justify-between gap-3 mb-3">
        <div className="font-display font-extrabold text-[36px] leading-none tracking-[-0.03em] tabular-nums text-ink">
          {actual}
          <span className="ml-1.5 text-[18px] font-medium text-ink-3">
            / {target}
          </span>
        </div>
        <span className="font-mono text-[12px] font-medium text-ink-3 tabular-nums">
          {pct}%
        </span>
      </div>

      <div className="h-1 rounded-[2px] bg-surface-2 overflow-hidden mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${barWidth}%` }}
          transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
          className={cn(
            "h-full rounded-[2px]",
            onTrack ? "bg-[hsl(var(--success))]" : "bg-primary",
          )}
        />
      </div>

      {lastActivation ? (
        <div className="flex items-center gap-3 pt-3 border-t border-line">
          <div className="relative shrink-0">
            <AssessorAvatar
              initials={lastActivation.avatar}
              photoUrl={lastActivation.photoUrl}
              level={lastActivation.level}
              size={32}
            />
            {/* Único Achievement Amber do card — sinaliza a conquista fresca.
                Sólido (não gradient), 3px sobre o avatar, com border do card
                pra recortar limpo. */}
            <span
              aria-label="Conquista de ativação"
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-gold border-2 border-card"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-ink leading-snug">
              <span className="font-semibold">{lastActivation.name}</span>
              <span className="text-ink-3"> tocou o sino</span>
            </p>
            <p className="text-[10px] text-ink-3 font-mono tabular-nums mt-0.5">
              {format(new Date(lastActivation.timestamp), "dd/MM 'às' HH:mm")}
            </p>
          </div>
          <Bell size={16} weight="regular" className="text-ink-3 shrink-0" />
        </div>
      ) : (
        <div className="flex items-center gap-2 pt-3 border-t border-line">
          <Bell size={16} weight="regular" className="text-ink-4 shrink-0" />
          <p className="text-[13px] text-ink-3 italic">
            Nenhuma ativação ainda. Quem vai tocar o sino primeiro?
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default ActivationHighlight;
