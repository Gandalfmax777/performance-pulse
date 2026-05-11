import { useMemo, useState } from "react";
import { toast } from "sonner";
import { format, addDays, startOfWeek, nextWednesday, isWednesday } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CircleNotch,
  Repeat,
  CalendarBlank as CalendarIcon,
  PencilSimple as Pencil,
  Target,
} from "@phosphor-icons/react";
import { useAllActivities, useUpdateActivity } from "@/hooks/useAdminActivities";
import { isActivityActiveOn, type ActivityCadenceFields } from "@/lib/biweekly";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { ApiActivity } from "@/hooks/useActivities";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Próximas N quartas-feiras a partir de hoje (inclusive). */
function nextNWednesdays(n: number): Date[] {
  const today = new Date();
  let cursor = isWednesday(today) ? today : nextWednesday(today);
  const list: Date[] = [];
  for (let i = 0; i < n; i++) {
    list.push(cursor);
    cursor = addDays(cursor, 7);
  }
  return list;
}

function formatYmd(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

// ─── Main component ─────────────────────────────────────────────────────────

const AdminBiweekly = () => {
  const { data: activities, isLoading } = useAllActivities();
  const [editDialog, setEditDialog] = useState<{ activity: ApiActivity; date: Date | undefined } | null>(null);

  // Filtra activities BIWEEKLY da quarta-feira (dayOfWeek 3)
  const biweeklyActivities = useMemo(
    () => (activities ?? []).filter((a) => a.dayOfWeek === 3 && a.cadenceType === "BIWEEKLY"),
    [activities],
  );

  const eightWeeks = useMemo(() => nextNWednesdays(8), []);

  // Calcula próximo Indique Day ativo: a primeira quarta nas próximas 8
  // semanas onde alguma activity BIWEEKLY estaria ativa (via âncora).
  const nextActiveDate = useMemo(() => {
    for (const date of eightWeeks) {
      for (const a of biweeklyActivities) {
        if (
          a.active &&
          isActivityActiveOn(
            { cadenceType: a.cadenceType, biweeklyAnchorDate: a.biweeklyAnchorDate },
            date,
          )
        ) {
          return date;
        }
      }
    }
    return null;
  }, [eightWeeks, biweeklyActivities]);

  return (
    <div className="space-y-5">
      {/* Page header (eyebrow + title + subtitle) vem do AdminLayout topbar. */}

      {/* 3 status cards (alinha com design/Admin-Biweekly.html) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-[var(--radius)] border border-line bg-card p-5">
          <p className="text-[10px] uppercase tracking-[0.16em] font-mono font-semibold text-ink-3 mb-2">
            Próximo Indique Day
          </p>
          <p className="font-display font-extrabold text-[22px] text-ink leading-none num">
            {nextActiveDate
              ? format(nextActiveDate, "dd 'de' MMM", { locale: ptBR })
              : "—"}
          </p>
          <p className="text-[11px] text-ink-3 mt-1.5">
            {nextActiveDate
              ? format(nextActiveDate, "EEEE", { locale: ptBR }).replace(/^\w/, (c) => c.toUpperCase())
              : "Sem activity ativa"}
          </p>
        </div>
        <div className="rounded-[var(--radius)] border border-line bg-card p-5">
          <p className="text-[10px] uppercase tracking-[0.16em] font-mono font-semibold text-ink-3 mb-2">
            Frequência
          </p>
          <p className="font-display font-extrabold text-[22px] text-ink leading-none">
            Quinzenal
          </p>
          <p className="text-[11px] text-ink-3 mt-1.5">
            Quartas-feiras alternadas (a cada 14 dias da âncora)
          </p>
        </div>
        <div className="rounded-[var(--radius)] border border-line bg-card p-5">
          <p className="text-[10px] uppercase tracking-[0.16em] font-mono font-semibold text-ink-3 mb-2">
            Activities ativas
          </p>
          <p className="font-display font-extrabold text-[22px] text-ink leading-none num">
            {biweeklyActivities.filter((a) => a.active).length}
          </p>
          <p className="text-[11px] text-ink-3 mt-1.5">
            De {biweeklyActivities.length} cadastradas · pontos por
            indicação configurados em /admin/goals
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-[14px] border border-line bg-card p-10 flex items-center justify-center">
          <CircleNotch size={24} className="text-primary animate-spin" />
        </div>
      ) : biweeklyActivities.length === 0 ? (
        <div className="rounded-[14px] border border-line bg-card p-10 text-center">
          <Repeat size={40} className="text-ink-4 mx-auto mb-3" />
          <p className="text-sm text-ink-3">
            Nenhuma activity BIWEEKLY cadastrada nas quartas.
          </p>
          <p className="text-xs text-ink-3 mt-1">
            Vá em <code className="text-primary">Cronograma</code> pra criar.
          </p>
        </div>
      ) : (
        <>
          {/* Activities atuais */}
          <div className="grid grid-cols-2 gap-4">
            {biweeklyActivities.map((act) => (
              <div
                key={act.id}
                className="rounded-[14px] border border-line bg-card p-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                      {act.name}
                      <Badge variant="outline" className="text-[9px] border-primary/30 text-primary">
                        QUINZENAL
                      </Badge>
                    </h3>
                    <p className="text-xs text-ink-3 mt-1">
                      {act.startTime}–{act.endTime} • {act.kpis.map((k) => k.label).join(", ")}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs">
                      <CalendarIcon size={14} className="text-ink-3" />
                      <span className="text-ink-3">Âncora:</span>
                      <span className="font-mono font-bold text-ink">
                        {act.biweeklyAnchorDate
                          ? format(new Date(act.biweeklyAnchorDate + "T00:00:00Z"), "dd/MM/yyyy", {
                              locale: ptBR,
                            })
                          : "—"}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setEditDialog({
                        activity: act,
                        date: act.biweeklyAnchorDate
                          ? new Date(act.biweeklyAnchorDate + "T00:00:00Z")
                          : undefined,
                      })
                    }
                    className="gap-1.5"
                  >
                    <Pencil size={12} />
                    Alterar
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Próximas 8 quartas */}
          <div className="rounded-[14px] border border-line bg-card p-6">
            <h2 className="text-sm font-bold text-ink mb-4">
              Próximas 8 quartas-feiras
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {eightWeeks.map((wed) => {
                const activeActivities = biweeklyActivities.filter((a) =>
                  isActivityActiveOn(
                    {
                      cadenceType: a.cadenceType,
                      biweeklyAnchorDate: a.biweeklyAnchorDate,
                    } as ActivityCadenceFields,
                    wed,
                  ),
                );
                return (
                  <div
                    key={formatYmd(wed)}
                    className={`p-4 rounded-lg border transition-all ${
                      activeActivities.length > 0
                        ? "border-primary/30 bg-primary/5"
                        : "border-line/20 bg-muted/10"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-ink-3">
                        {format(wed, "EEE", { locale: ptBR })}
                      </span>
                      <span className="text-sm font-bold text-ink font-mono">
                        {format(wed, "dd/MM/yyyy")}
                      </span>
                    </div>
                    {activeActivities.length > 0 ? (
                      <div className="space-y-1">
                        {activeActivities.map((a) => (
                          <div
                            key={a.id}
                            className="flex items-center gap-1.5 text-xs text-primary font-semibold"
                          >
                            <Target size={12} weight="bold" />
                            {a.name}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-ink-3 italic">Nenhuma quinzenal</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Dialog de alterar âncora */}
      {editDialog && (
        <AnchorDialog
          activity={editDialog.activity}
          initialDate={editDialog.date}
          onClose={() => setEditDialog(null)}
        />
      )}
    </div>
  );
};

// ─── Anchor edit dialog ──────────────────────────────────────────────────────

function AnchorDialog({
  activity,
  initialDate,
  onClose,
}: {
  activity: ApiActivity;
  initialDate: Date | undefined;
  onClose: () => void;
}) {
  const [date, setDate] = useState<Date | undefined>(initialDate);
  const [startTime, setStartTime] = useState(activity.startTime ?? "09:00");
  const [endTime, setEndTime] = useState(activity.endTime ?? "09:45");
  const updateActivity = useUpdateActivity();

  // Next valid Wednesday hint
  const suggestion = initialDate
    ? addDays(initialDate, 14)
    : startOfWeek(new Date(), { weekStartsOn: 3 });

  const handleSave = async () => {
    if (!date) return;
    try {
      await updateActivity.mutateAsync({
        id: activity.id,
        input: {
          biweeklyAnchorDate: formatYmd(date),
          startTime,
          endTime,
        },
      });
      toast.success("Atividade quinzenal atualizada");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar");
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar: {activity.name}</DialogTitle>
          <DialogDescription>
            Altere a data âncora e/ou o horário. A activity será ativada nessa data e a cada 14 dias.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 space-y-3">
          <Label className="text-xs">Data da âncora</Label>
          <div className="flex justify-center rounded-lg border border-line/30 p-2 bg-muted/10">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              weekStartsOn={1}
              locale={ptBR}
              initialFocus
            />
          </div>
          <p className="text-[11px] text-ink-3">
            Sugestão: próxima ocorrência seria{" "}
            <span className="font-mono text-ink">
              {format(suggestion, "dd/MM/yyyy")}
            </span>
          </p>

          <div className="flex gap-3">
            <div className="flex-1">
              <Label className="text-xs">Início</Label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-muted/30 border border-line/30 text-sm font-mono text-ink focus:outline-none focus:border-primary/50"
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs">Fim</Label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-muted/30 border border-line/30 text-sm font-mono text-ink focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={updateActivity.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!date || updateActivity.isPending}>
            {updateActivity.isPending && <CircleNotch size={16} className="animate-spin mr-2" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AdminBiweekly;
