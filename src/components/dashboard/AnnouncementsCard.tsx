import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SectionCard, Eyebrow } from "@/components/shared";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { useCurrentUser } from "@/hooks/useCurrentUser";

/**
 * Card "Avisos da mesa" — versão estática editorial (design/Dashboard.html).
 * Diferente do `AnnouncementTicker` (marquee animado no topo da página),
 * este lista os ativos em formato leitura focada.
 *
 * - Empty state: mensagem discreta sem botão pra criar (fluxo de criar
 *   passa por /admin/announcements).
 * - Admin tem link "Gerenciar" no header da SectionCard que navega pra
 *   /admin/announcements.
 */
export const AnnouncementsCard = () => {
  const navigate = useNavigate();
  const { isAdmin } = useCurrentUser();
  const { data: announcements = [], isLoading } = useAnnouncements();

  const headerActions = isAdmin ? (
    <button
      type="button"
      onClick={() => navigate("/admin/announcements")}
      className="text-[12px] font-semibold text-ink-3 hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-[6px] px-2 py-1"
    >
      Gerenciar
    </button>
  ) : undefined;

  return (
    <SectionCard
      title="Avisos da mesa"
      subtitle={
        announcements.length > 0
          ? `${announcements.length} ativo${announcements.length > 1 ? "s" : ""} · semana atual`
          : undefined
      }
      headerActions={headerActions}
      bodyless
    >
      {isLoading ? (
        <div className="px-5 py-6">
          <p className="text-[12px] text-ink-3">Carregando…</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="px-5 py-6">
          <p className="text-[12px] text-ink-3">
            Nenhum aviso ativo no momento.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {announcements.map((a) => {
            const dateLabel = format(new Date(a.createdAt), "dd/MM", {
              locale: ptBR,
            });
            return (
              <li key={a.id} className="px-5 py-3">
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <span className="text-[14px] font-bold text-ink leading-tight flex-1 min-w-0 truncate">
                    {a.message.length > 60
                      ? a.message.slice(0, 57) + "…"
                      : a.message}
                  </span>
                  <Eyebrow className="shrink-0 mb-0">{dateLabel}</Eyebrow>
                </div>
                {a.message.length > 60 && (
                  <p className="text-[12px] text-ink-3 leading-relaxed">
                    {a.message}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
};
