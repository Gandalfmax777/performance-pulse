import { ArrowClockwise, CircleNotch, Sparkle } from "@phosphor-icons/react";
import Markdown from "react-markdown";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SectionCard } from "@/components/shared";
import { cn } from "@/lib/utils";
import {
  useTeamInsightHistory,
  useGenerateTeamInsight,
} from "@/hooks/useInsight";

/**
 * Card "Análise IA · Gemini" — alinha com design/Dashboard.html.
 *
 * Mostra o último insight do TIME (period=WEEK) renderizado em Markdown,
 * com timestamp do gerado-em e botão "↻ Re-gerar" (mutation force).
 * Empty state convida o admin a gerar o primeiro.
 */
export const InsightFeaturedCard = () => {
  const { data: history, isLoading } = useTeamInsightHistory("WEEK", 1);
  const generate = useGenerateTeamInsight();

  const latest = history?.items?.[0];

  const headerActions = (
    <button
      type="button"
      onClick={() => generate.mutate({ period: "WEEK", force: true })}
      disabled={generate.isPending}
      className={cn(
        "inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-3 hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-[6px] px-2 py-1",
        generate.isPending && "opacity-50 cursor-not-allowed",
      )}
    >
      {generate.isPending ? (
        <CircleNotch size={12} className="animate-spin" weight="bold" />
      ) : (
        <ArrowClockwise size={12} weight="bold" />
      )}
      Re-gerar
    </button>
  );

  return (
    <SectionCard
      title="Análise IA · Gemini"
      subtitle={
        latest
          ? `Atualizado ${format(new Date(latest.createdAt), "dd/MM 'às' HH:mm", {
              locale: ptBR,
            })}`
          : undefined
      }
      headerActions={headerActions}
    >
      {isLoading ? (
        <p className="text-[12px] text-ink-3">Carregando…</p>
      ) : !latest ? (
        <div className="py-3 flex items-start gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-[hsl(var(--primary)/0.08)] flex items-center justify-center shrink-0">
            <Sparkle size={16} weight="fill" className="text-primary" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-ink mb-1">
              Nenhum insight gerado ainda.
            </p>
            <p className="text-[12px] text-ink-3 leading-relaxed">
              Use o botão "Re-gerar" para criar a primeira análise da
              semana.
            </p>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "text-[13px] leading-relaxed text-ink-2",
            // typography reset pra Markdown — paragraphs com mt/mb e
            // strong/em do tom editorial
            "[&>p]:m-0 [&>p+p]:mt-3 [&_strong]:text-ink [&_strong]:font-semibold [&_em]:text-ink-3",
          )}
        >
          <Markdown>{latest.summary || latest.textMarkdown}</Markdown>
        </div>
      )}
    </SectionCard>
  );
};
