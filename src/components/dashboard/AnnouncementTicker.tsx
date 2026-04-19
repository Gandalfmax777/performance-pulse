import { useMemo } from "react";
import { Megaphone } from "lucide-react";
import type { Assessor } from "@/types/assessor";
import { useAnnouncements } from "@/hooks/useAnnouncements";

interface AnnouncementTickerProps {
  // Mantido pra compat de signature mesmo agora não sendo usado — caller
  // não precisa mudar e fica fácil reativar avisos auto-gerados depois.
  assessors?: Assessor[];
}

/**
 * Banner com mensagens curtas rolando no topo.
 *
 * Renderiza APENAS announcements criados pelo admin via `/admin/announcements`.
 * Os fallbacks auto-gerados (líder da semana, total de reuniões, último dia,
 * etc) foram removidos a pedido do Felipe — ele quer controle 100% do que
 * aparece. Se o banco não tiver nenhum aviso ativo, o ticker some.
 */
const AnnouncementTicker = (_props: AnnouncementTickerProps) => {
  const { data: manualAnnouncements } = useAnnouncements();

  const messages = useMemo(() => {
    return (manualAnnouncements ?? []).map((a) => {
      const prefix = a.emoji ? `${a.emoji} ` : "";
      return `${prefix}${a.message}`;
    });
  }, [manualAnnouncements]);

  // Sem avisos = ticker invisível
  if (messages.length === 0) return null;

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
