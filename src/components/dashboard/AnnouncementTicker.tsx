import { useMemo } from "react";
import { Megaphone } from "lucide-react";
import type { Assessor } from "@/types/assessor";
import { useKpis } from "@/hooks/useKpis";
import { useWeeklyRanking } from "@/hooks/useRankings";
import { differenceInCalendarDays, endOfWeek } from "date-fns";

interface AnnouncementTickerProps {
  assessors: Assessor[];
}

/**
 * Banner com mensagens curtas rolando no topo. Mensagens são geradas
 * automaticamente a partir do estado atual:
 * - Líder do dia/semana
 * - Quem cumpriu reuniões realizadas
 * - Quem está prestes a bater meta
 * - Lembretes (último dia da semana, etc.)
 *
 * Futuro: configurável via admin com mensagens customizadas.
 */
const AnnouncementTicker = ({ assessors }: AnnouncementTickerProps) => {
  const { kpis } = useKpis();
  const { data: weekly } = useWeeklyRanking();

  const messages = useMemo(() => {
    const out: string[] = [];

    // Líder da semana
    const sorted = [...assessors].sort((a, b) => b.points - a.points);
    if (sorted[0] && sorted[0].points > 0) {
      out.push(`👑 ${sorted[0].name} lidera com ${sorted[0].points} pts`);
    }

    // Reuniões realizadas
    const reunioesRealizadas = weekly?.rankings.reduce(
      (sum, r) => sum + (r.rollup.kpiTotals.reunioes_realizadas ?? 0),
      0,
    );
    if (reunioesRealizadas && reunioesRealizadas > 0) {
      out.push(`🤝 ${reunioesRealizadas} reuniões realizadas essa semana`);
    }

    // Ativações de conta
    const ativacoes = weekly?.rankings.reduce(
      (sum, r) => sum + (r.rollup.kpiTotals.ativacao_conta ?? 0),
      0,
    );
    if (ativacoes && ativacoes > 0) {
      out.push(`🎉 ${ativacoes} conta${ativacoes > 1 ? "s" : ""} ativada${ativacoes > 1 ? "s" : ""} essa semana`);
    }

    // Streak alto
    const topStreak = sorted.find((a) => a.streak >= 5);
    if (topStreak) {
      out.push(`🔥 ${topStreak.name} está em streak de ${topStreak.streak} dias`);
    }

    // Último dia da semana
    const today = new Date();
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const daysToEnd = differenceInCalendarDays(weekEnd, today);
    if (daysToEnd === 0) {
      out.push(`⏰ Hoje é o último dia da semana — finalizem as metas`);
    } else if (daysToEnd === 1) {
      out.push(`⏰ Amanhã é o último dia da semana`);
    }

    if (out.length === 0) {
      out.push(`📊 Comece o dia registrando suas atividades`);
    }
    return out;
  }, [assessors, weekly, kpis]);

  // Duplica mensagens pra criar efeito infinite scroll
  const doubled = [...messages, ...messages];
  // Velocidade proporcional ao número de mensagens (mantém leitura confortável)
  const durationSec = Math.max(20, messages.length * 8);

  return (
    <div className="card-glass rounded-lg border border-primary/20 overflow-hidden">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 px-3 py-2 bg-primary/10 border-r border-primary/20 flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-primary">Avisos</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <div
            className="flex gap-8 whitespace-nowrap"
            style={{
              animation: `ticker ${durationSec}s linear infinite`,
            }}
          >
            {doubled.map((m, i) => (
              <span key={i} className="text-xs text-foreground py-2">
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

export default AnnouncementTicker;
