import { motion } from "framer-motion";
import {
  CheckCircle,
  Trophy,
  Clock,
  FileText,
  CalendarBlank,
  Hand,
  Sparkle,
  Gift,
  ArrowUp,
  Phone,
  Lightning,
  Users,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useActivityFeed, type ApiActivityFeedItem } from "@/hooks/useReports";

function firstName(full: string): string {
  return full.split(" ")[0];
}

function relativeTime(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: false, locale: ptBR });
  } catch {
    return "";
  }
}

function iconFor(item: ApiActivityFeedItem): PhosphorIcon {
  // Heurística pelo description / icon string vindo do backend
  const d = (item.description || "").toLowerCase();
  if (item.type === "badge_unlock") return Trophy;
  if (item.type === "meeting" || item.type === "meeting_area") return CalendarBlank;
  if (d.includes("boleta")) return FileText;
  if (d.includes("ativ")) return Sparkle;
  if (d.includes("indica")) return Gift;
  if (d.includes("touch")) return Hand;
  if (d.includes("ligaç") || d.includes("ligações") || d.includes("call")) return Phone;
  if (d.includes("cadência")) return Lightning;
  if (d.includes("subiu") || d.includes("rank")) return ArrowUp;
  if (d.includes("squad") || d.includes("equipe")) return Users;
  return CheckCircle;
}

function colorFor(item: ApiActivityFeedItem): string {
  if (item.type === "badge_unlock") return "hsl(var(--gold-deep))";
  if (item.type === "meeting" || item.type === "meeting_area") return "hsl(var(--ink-2))";
  return "hsl(var(--eqi-green))";
}

/**
 * Feed de atividade Editorial V1 — timeline minimalista com chip
 * de ícone (border-line, surface-2 bg) + texto inline + tempo
 * relativo em mono. Substitui o card-glass do estilo anterior.
 */
const ActivityFeed = () => {
  const { data: items } = useActivityFeed({ limit: 10 });

  return (
    <div className="rounded-[14px] border border-line bg-card p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-extrabold tracking-tight text-ink">
          Atividade ao vivo
        </h3>
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-extrabold tracking-[0.1em]"
          style={{
            background: "oklch(0.55 0.22 25 / 0.1)",
            borderColor: "oklch(0.55 0.22 25 / 0.4)",
            color: "oklch(0.55 0.22 25)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: "oklch(0.65 0.24 25)" }}
          />
          AO VIVO
        </span>
      </div>

      <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[320px] pr-1">
        {(!items || items.length === 0) && (
          <p className="text-[12px] text-ink-3 text-center py-6">Sem atividade recente.</p>
        )}
        {items?.map((f, i) => {
          const Icon = iconFor(f);
          return (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-2.5"
            >
              <div
                className="w-7 h-7 rounded-[7px] border border-line bg-surface-2 flex items-center justify-center shrink-0"
                style={{ color: colorFor(f) }}
              >
                <Icon size={13} weight="regular" />
              </div>
              <div className="flex-1 min-w-0 text-[12px] leading-tight">
                <span className="font-bold text-ink">{firstName(f.assessorName)}</span>{" "}
                <span className="text-ink-3">{f.description}</span>
                {f.backfilled && f.metricDate && (
                  <span
                    className="ml-1.5 inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-bold"
                    style={{
                      background: "hsl(var(--gold-soft))",
                      color: "hsl(var(--gold-deep))",
                    }}
                    title={`Lançamento retroativo — métrica datada ${f.metricDate}`}
                  >
                    <Clock size={9} weight="bold" />
                    retroativo {format(parseISO(f.metricDate), "dd/MM")}
                  </span>
                )}
              </div>
              <span className="font-mono text-[10px] text-ink-4 font-semibold shrink-0">
                {relativeTime(f.timestamp)}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityFeed;
