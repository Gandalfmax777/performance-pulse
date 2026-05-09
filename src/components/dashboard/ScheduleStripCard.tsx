import { useNavigate } from "react-router-dom";
import { addDays, format, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SectionCard, Eyebrow } from "@/components/shared";
import { cn } from "@/lib/utils";
import { useAllActivities } from "@/hooks/useAdminActivities";
import { isActivityActiveOn } from "@/lib/biweekly";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const DAY_LABELS_SHORT: Record<number, string> = {
  1: "SEG",
  2: "TER",
  3: "QUA",
  4: "QUI",
  5: "SEX",
};

/**
 * Card "Cronograma · semana" — strip 5 dias (seg-sex) com eventos
 * (atividades) do cronograma. Dia atual destacado em accent.
 *
 * Cada coluna mostra: label SEG/TER/etc + data dd/MM + lista de
 * atividades (HH:mm + nome). Atividades BIWEEKLY são resolvidas
 * via `isActivityActiveOn` que checa o anchor.
 *
 * Admin tem botão "Editar" no header → /admin/schedule.
 */
export const ScheduleStripCard = () => {
  const navigate = useNavigate();
  const { isAdmin } = useCurrentUser();
  const { data: activities = [], isLoading } = useAllActivities();

  const today = new Date();
  const monday = startOfWeek(today, { weekStartsOn: 1 });
  const todayDow = today.getDay() === 0 ? 7 : today.getDay(); // 1-7 onde 7=domingo

  const days = [1, 2, 3, 4, 5].map((dow) => {
    const date = addDays(monday, dow - 1);
    const isToday = dow === todayDow;
    const items = activities
      .filter((a) => a.active && a.dayOfWeek === dow)
      .filter((a) =>
        isActivityActiveOn(
          {
            cadenceType: a.cadenceType,
            biweeklyAnchorDate: a.biweeklyAnchorDate,
          },
          date,
        ),
      )
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    return { dow, date, isToday, items };
  });

  const headerActions = isAdmin ? (
    <button
      type="button"
      onClick={() => navigate("/admin/schedule")}
      className="text-[12px] font-semibold text-ink-3 hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-[6px] px-2 py-1"
    >
      Editar
    </button>
  ) : undefined;

  return (
    <SectionCard
      title="Cronograma · semana"
      subtitle="Bloco de ligações 09h — não-negociável"
      headerActions={headerActions}
    >
      {isLoading ? (
        <p className="text-[12px] text-ink-3">Carregando…</p>
      ) : (
        <div className="grid grid-cols-5 gap-2">
          {days.map(({ dow, date, isToday, items }) => (
            <div
              key={dow}
              className={cn(
                "rounded-[7px] border p-[10px] flex flex-col gap-1.5 min-h-[130px]",
                isToday
                  ? "border-primary bg-[hsl(var(--primary)/0.08)]"
                  : "border-line bg-card",
              )}
            >
              <div className="flex items-baseline justify-between">
                <Eyebrow
                  className={cn("mb-0", isToday && "text-primary")}
                >
                  {DAY_LABELS_SHORT[dow]}
                </Eyebrow>
                <span className="num text-[10px] text-ink-4">
                  {format(date, "dd/MM", { locale: ptBR })}
                </span>
              </div>
              {items.length === 0 ? (
                <span className="text-[11px] text-ink-4 italic">—</span>
              ) : (
                <ul className="flex flex-col gap-1">
                  {items.slice(0, 3).map((act) => (
                    <li
                      key={act.id}
                      className="text-[11px] leading-tight"
                      title={act.name}
                    >
                      <span className="num text-ink-3 mr-1">
                        {act.startTime}
                      </span>
                      <span className="text-ink-2 line-clamp-1">
                        {act.name}
                      </span>
                    </li>
                  ))}
                  {items.length > 3 && (
                    <li className="text-[10px] text-ink-3 italic">
                      +{items.length - 3}
                    </li>
                  )}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
};
