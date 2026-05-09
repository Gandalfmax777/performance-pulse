import { useState } from "react";
import Markdown from "react-markdown";
import {
  CaretDown,
  CaretRight,
  ClockCounterClockwise as History,
  CircleNotch,
} from "@phosphor-icons/react";
import {
  useAssessorInsightHistory,
  useTeamInsightHistory,
  type ApiInsightHistoryItem,
  type InsightPeriod,
} from "@/hooks/useInsight";

interface BaseProps {
  periodKind?: InsightPeriod;
  limit?: number;
}

type Props =
  | ({ kind: "team" } & BaseProps)
  | ({ kind: "assessor"; assessorId: string } & BaseProps);

const PERIOD_LABEL: Record<InsightPeriod, string> = {
  DAY: "Dia",
  WEEK: "Semana",
  MONTH: "Mês",
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const InsightHistoryPanel = (props: Props) => {
  const [open, setOpen] = useState(false);

  // Hooks devem ser chamados incondicionalmente — chama os dois e usa o que vale.
  const teamQuery = useTeamInsightHistory(props.periodKind, props.limit);
  const assessorQuery = useAssessorInsightHistory(
    props.kind === "assessor" ? props.assessorId : undefined,
    props.periodKind,
    props.limit,
  );

  const query = props.kind === "team" ? teamQuery : assessorQuery;
  const items = query.data?.items ?? [];

  return (
    <div className="card-glass rounded-xl p-4 mt-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 text-left"
      >
        <div className="flex items-center gap-2">
          <History size={16} className="text-primary" />
          <span className="text-sm font-display font-bold text-foreground">
            Histórico de análises IA
          </span>
          {items.length > 0 && (
            <span className="text-xs text-muted-foreground">
              ({items.length} {items.length === 1 ? "entrada" : "entradas"})
            </span>
          )}
        </div>
        {open ? (
          <CaretDown size={16} className="text-muted-foreground" />
        ) : (
          <CaretRight size={16} className="text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {query.isLoading && (
            <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
              <CircleNotch size={16} className="animate-spin mr-2" />
              Carregando histórico…
            </div>
          )}

          {!query.isLoading && items.length === 0 && (
            <p className="text-xs text-muted-foreground py-3 text-center">
              Nenhuma análise anterior. Gere a primeira pra começar a timeline.
            </p>
          )}

          {items.map((item) => (
            <HistoryEntry key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};

const HistoryEntry = ({ item }: { item: ApiInsightHistoryItem }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-border/30 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-start justify-between gap-3 px-3 py-2.5 text-left hover:bg-muted/20 transition-all"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-muted-foreground">
              {formatDateTime(item.createdAt)}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">
              {PERIOD_LABEL[item.periodKind]} · {item.periodKey}
            </span>
          </div>
          <p className="text-xs text-foreground line-clamp-2">{item.summary}</p>
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {item.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
              {item.tags.length > 4 && (
                <span className="text-[9px] text-muted-foreground">
                  +{item.tags.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
        {expanded ? (
          <CaretDown size={14} className="text-muted-foreground shrink-0 mt-1" />
        ) : (
          <CaretRight size={14} className="text-muted-foreground shrink-0 mt-1" />
        )}
      </button>

      {expanded && (
        <div className="px-3 py-3 border-t border-border/30 bg-muted/10">
          <div className="prose prose-sm dark:prose-invert max-w-none text-xs">
            <Markdown>{item.textMarkdown}</Markdown>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 font-mono">
            modelo: {item.model}
          </p>
        </div>
      )}
    </div>
  );
};

export default InsightHistoryPanel;
