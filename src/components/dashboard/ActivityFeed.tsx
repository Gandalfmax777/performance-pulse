import { motion } from "framer-motion";
import { CheckCircle2, Award, Clock } from "lucide-react";
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

function iconFor(item: ApiActivityFeedItem) {
  if (item.type === "badge_unlock") return Award;
  return CheckCircle2;
}

function colorFor(item: ApiActivityFeedItem): string {
  return item.type === "badge_unlock" ? "text-gold" : "text-success";
}

const ActivityFeed = () => {
  const { data: items } = useActivityFeed({ limit: 10 });

  return (
    <div className="card-glass rounded-xl p-5 h-full">
      <h2 className="text-sm font-bold text-foreground mb-3">Atividade Recente</h2>
      <div className="space-y-2.5 overflow-y-auto max-h-[300px]">
        {(!items || items.length === 0) && (
          <p className="text-xs text-muted-foreground text-center py-6">
            Sem atividade recente.
          </p>
        )}
        {items?.map((f, i) => {
          const Icon = iconFor(f);
          return (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-2.5"
            >
              <div className={`mt-0.5 ${colorFor(f)}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground">
                  <span className="font-semibold">{firstName(f.assessorName)}</span>{" "}
                  <span className="text-muted-foreground">{f.description}</span>
                  {f.backfilled && f.metricDate && (
                    <span
                      className="ml-1.5 inline-flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded bg-chart-orange/15 text-chart-orange font-semibold"
                      title={`Lançamento retroativo — métrica datada ${f.metricDate}`}
                    >
                      <Clock className="w-2.5 h-2.5" />
                      retroativo {format(parseISO(f.metricDate), "dd/MM")}
                    </span>
                  )}
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono shrink-0">
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
