import { useMemo } from "react";
import { Megaphone, PushPin } from "@phosphor-icons/react";
import type { Assessor } from "@/types/assessor";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { useWeekDirections } from "@/hooks/useDailyDirection";

interface AnnouncementTickerProps {
  // Mantido pra compat de signature mesmo agora não sendo usado — caller
  // não precisa mudar e fica fácil reativar avisos auto-gerados depois.
  assessors?: Assessor[];
}

/**
 * Banner com mensagens curtas rolando no topo da Visão Geral.
 *
 * Duas fontes de mensagens:
 * 1. Announcements criados pelo admin via `/admin/announcements` (prioridade)
 * 2. DailyDirections da semana corrente — um por dia útil que tem texto
 *    (Felipe pediu pra voltar a "circular" os focos dos dias)
 *
 * Se ambas vazias, ticker some (retorna null).
 */
const AnnouncementTicker = (_props: AnnouncementTickerProps) => {
  const { data: manualAnnouncements } = useAnnouncements();
  const weekDirections = useWeekDirections();

  const messages = useMemo(() => {
    const out: string[] = [];

    // 1. Avisos manuais (banco)
    for (const a of manualAnnouncements ?? []) {
      out.push(a.message);
    }

    // 2. Direcionamentos dos dias úteis da semana atual (só os com texto)
    for (const wd of weekDirections) {
      if (!wd.direction) continue;
      const text = wd.direction.text.trim();
      if (!text) continue;
      // Trunca em ~120 chars pra ticker não ficar lento — texto completo
      // continua no card DailyDirection do DayView.
      const short = text.length > 120 ? `${text.slice(0, 117)}…` : text;
      out.push(`◆ ${wd.dayLabel} · ${short}`);
    }

    return out;
  }, [manualAnnouncements, weekDirections]);

  // Sem avisos nem direcionamentos = ticker invisível
  if (messages.length === 0) return null;

  // Duplica mensagens pra criar efeito infinite scroll
  const doubled = [...messages, ...messages];
  // Velocidade proporcional ao número de mensagens (mantém leitura confortável)
  const durationSec = Math.max(20, messages.length * 8);

  return (
    <div className="rounded-[10px] overflow-hidden text-white" style={{ background: 'hsl(var(--ink))' }}>
      <div className="flex items-center gap-0">
        <div
          className="flex-shrink-0 px-3 py-2.5 flex items-center gap-2 font-extrabold text-[11px] tracking-[0.15em]"
          style={{ background: 'hsl(var(--gold))', color: 'hsl(var(--ink))', borderRadius: 4, marginLeft: 8 }}
        >
          <Megaphone size={13} weight="bold" />
          <span>AVISOS</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <div
            className="flex gap-8 whitespace-nowrap"
            style={{
              animation: `ticker ${durationSec}s linear infinite`,
            }}
          >
            {doubled.map((m, i) => (
              <span key={i} className="text-[13px] py-2 font-medium text-white/90">
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
