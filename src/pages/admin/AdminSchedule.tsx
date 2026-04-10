import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Calendar, Plus, Pencil, Trash2, Link2, Unlink, Loader2 } from "lucide-react";
import {
  useAllActivities,
  useCreateActivity,
  useUpdateActivity,
  useDeleteActivity,
  useAttachActivityKpi,
  useDetachActivityKpi,
  useUpdateActivityKpiOverride,
} from "@/hooks/useAdminActivities";
import { useKpis } from "@/hooks/useKpis";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ApiActivity } from "@/hooks/useActivities";

const DAY_LABELS: Record<number, string> = {
  1: "Segunda", 2: "Terça", 3: "Quarta", 4: "Quinta", 5: "Sexta",
};

const AdminSchedule = () => {
  const { data: activities, isLoading } = useAllActivities();
  const { kpis: allKpis } = useKpis();
  const createAct = useCreateActivity();
  const updateAct = useUpdateActivity();
  const deleteAct = useDeleteActivity();
  const attachKpi = useAttachActivityKpi();
  const detachKpi = useDetachActivityKpi();
  const updateOverride = useUpdateActivityKpiOverride();

  const [editDialog, setEditDialog] = useState<ApiActivity | null>(null);
  const [createDialog, setCreateDialog] = useState<number | null>(null); // dayOfWeek
  const [kpiSheet, setKpiSheet] = useState<ApiActivity | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ApiActivity | null>(null);

  // Form state pro create/edit
  const [formName, setFormName] = useState("");
  const [formStart, setFormStart] = useState("09:00");
  const [formEnd, setFormEnd] = useState("09:45");
  const [formCadence, setFormCadence] = useState<"WEEKLY" | "BIWEEKLY">("WEEKLY");
  const [formAnchor, setFormAnchor] = useState("");
  const [formDesc, setFormDesc] = useState("");

  // Group by dayOfWeek
  const byDay = useMemo(() => {
    const map: Record<number, ApiActivity[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    for (const a of activities ?? []) {
      if (a.dayOfWeek >= 1 && a.dayOfWeek <= 5) {
        map[a.dayOfWeek].push(a);
      }
    }
    return map;
  }, [activities]);

  function openCreate(day: number) {
    setFormName(""); setFormStart("09:00"); setFormEnd("09:45");
    setFormCadence("WEEKLY"); setFormAnchor(""); setFormDesc("");
    setCreateDialog(day);
  }

  function openEdit(act: ApiActivity) {
    setFormName(act.name); setFormStart(act.startTime); setFormEnd(act.endTime);
    setFormCadence(act.cadenceType); setFormAnchor(act.biweeklyAnchorDate ?? "");
    setFormDesc(act.description ?? "");
    setEditDialog(act);
  }

  async function handleCreate() {
    if (!createDialog || !formName.trim()) return;
    try {
      await createAct.mutateAsync({
        name: formName.trim(),
        dayOfWeek: createDialog,
        startTime: formStart,
        endTime: formEnd,
        cadenceType: formCadence,
        biweeklyAnchorDate: formCadence === "BIWEEKLY" && formAnchor ? formAnchor : null,
        description: formDesc || null,
      });
      toast.success("Atividade criada");
      setCreateDialog(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar");
    }
  }

  async function handleEdit() {
    if (!editDialog) return;
    try {
      await updateAct.mutateAsync({
        id: editDialog.id,
        input: {
          name: formName.trim(),
          startTime: formStart,
          endTime: formEnd,
          cadenceType: formCadence,
          biweeklyAnchorDate: formCadence === "BIWEEKLY" && formAnchor ? formAnchor : null,
          description: formDesc || null,
        },
      });
      toast.success("Atividade atualizada");
      setEditDialog(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar");
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    try {
      await deleteAct.mutateAsync(deleteConfirm.id);
      toast.success("Atividade desativada");
      setDeleteConfirm(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  }

  async function handleToggleActive(act: ApiActivity) {
    try {
      await updateAct.mutateAsync({ id: act.id, input: { active: !act.active } });
      toast.success(act.active ? "Desativada" : "Ativada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  const formDialog = createDialog !== null || editDialog !== null;
  const formTitle = editDialog ? `Editar — ${editDialog.name}` : `Nova atividade — ${DAY_LABELS[createDialog ?? 1]}`;
  const formAction = editDialog ? handleEdit : handleCreate;
  const formSaving = createAct.isPending || updateAct.isPending;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Calendar className="w-6 h-6 text-primary" />
          Cronograma Semanal
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Edite atividades, horários e KPIs vinculados. Activities desativadas não aparecem no
          cronograma do dashboard.
        </p>
      </div>

      {isLoading ? (
        <div className="card-glass rounded-xl p-10 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : (
        <Tabs defaultValue="1" className="w-full">
          <TabsList className="bg-muted/30 border border-border/30">
            {[1, 2, 3, 4, 5].map((d) => (
              <TabsTrigger key={d} value={String(d)} className="text-xs font-semibold">
                {DAY_LABELS[d]}
              </TabsTrigger>
            ))}
          </TabsList>

          {[1, 2, 3, 4, 5].map((dow) => (
            <TabsContent key={dow} value={String(dow)}>
              <div className="card-glass rounded-xl overflow-hidden border border-border/30">
                <div className="flex items-center justify-between px-5 py-3 border-b border-border/30">
                  <span className="text-sm font-bold text-foreground">{DAY_LABELS[dow]}</span>
                  <Button size="sm" onClick={() => openCreate(dow)} className="gap-1.5">
                    <Plus className="w-3 h-3" /> Nova atividade
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/30 hover:bg-transparent">
                      <TableHead className="text-xs">Nome</TableHead>
                      <TableHead className="text-xs">Horário</TableHead>
                      <TableHead className="text-xs">Cadência</TableHead>
                      <TableHead className="text-xs">KPIs</TableHead>
                      <TableHead className="text-xs w-20">Ativa</TableHead>
                      <TableHead className="text-xs text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {byDay[dow].length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-xs text-muted-foreground text-center py-6">
                          Nenhuma atividade
                        </TableCell>
                      </TableRow>
                    )}
                    {byDay[dow].map((act) => (
                      <TableRow key={act.id} className={`border-border/20 ${!act.active ? "opacity-50" : ""}`}>
                        <TableCell className="text-sm font-semibold text-foreground">{act.name}</TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {act.startTime}–{act.endTime}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-mono border-border/40">
                            {act.cadenceType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {act.kpis.map((k) => (
                              <Badge key={k.kpiId} variant="secondary" className="text-[10px]">
                                {k.label}
                                {k.targetOverride !== null && (
                                  <span className="ml-1 text-primary font-mono">({k.targetOverride})</span>
                                )}
                              </Badge>
                            ))}
                            {act.kpis.length === 0 && (
                              <span className="text-[10px] text-muted-foreground italic">nenhum</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={act.active}
                            onCheckedChange={() => handleToggleActive(act)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => setKpiSheet(act)} title="KPIs">
                              <Link2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => openEdit(act)} title="Editar">
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(act)} title="Desativar" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={formDialog} onOpenChange={(v) => { if (!v) { setCreateDialog(null); setEditDialog(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{formTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">Nome</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Início</Label>
                <Input value={formStart} onChange={(e) => setFormStart(e.target.value)} placeholder="HH:mm" className="mt-1 font-mono" />
              </div>
              <div>
                <Label className="text-xs">Fim</Label>
                <Input value={formEnd} onChange={(e) => setFormEnd(e.target.value)} placeholder="HH:mm" className="mt-1 font-mono" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Cadência</Label>
              <Select value={formCadence} onValueChange={(v) => setFormCadence(v as "WEEKLY" | "BIWEEKLY")}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">Semanal</SelectItem>
                  <SelectItem value="BIWEEKLY">Quinzenal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formCadence === "BIWEEKLY" && (
              <div>
                <Label className="text-xs">Âncora (YYYY-MM-DD)</Label>
                <Input value={formAnchor} onChange={(e) => setFormAnchor(e.target.value)} placeholder="2026-04-08" className="mt-1 font-mono" />
              </div>
            )}
            <div>
              <Label className="text-xs">Descrição (opcional)</Label>
              <Input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateDialog(null); setEditDialog(null); }}>Cancelar</Button>
            <Button onClick={formAction} disabled={!formName.trim() || formSaving}>
              {formSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editDialog ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete AlertDialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(v) => !v && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar "{deleteConfirm?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              A atividade será marcada como inativa e não aparecerá mais no cronograma.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* KPI Sheet */}
      <Sheet open={!!kpiSheet} onOpenChange={(v) => !v && setKpiSheet(null)}>
        <SheetContent className="w-[400px]">
          <SheetHeader>
            <SheetTitle>KPIs — {kpiSheet?.name}</SheetTitle>
            <SheetDescription>Vincule KPIs e defina meta override por atividade.</SheetDescription>
          </SheetHeader>
          {kpiSheet && (
            <KpiManager
              activity={kpiSheet}
              allKpis={allKpis.map((k) => ({ id: k.id, key: k.key, label: k.label }))}
              onAttach={(kpiId, override) =>
                attachKpi.mutateAsync({ activityId: kpiSheet.id, kpiId, targetOverride: override }).then(() => toast.success("KPI vinculado"))
              }
              onUpdateOverride={(kpiId, override) =>
                updateOverride.mutateAsync({ activityId: kpiSheet.id, kpiId, targetOverride: override }).then(() => toast.success("Override atualizado"))
              }
              onDetach={(kpiId) =>
                detachKpi.mutateAsync({ activityId: kpiSheet.id, kpiId }).then(() => toast.success("KPI desvinculado"))
              }
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

// ─── KPI Manager (dentro do Sheet) ──────────────────────────────────────────

function KpiManager({
  activity,
  allKpis,
  onAttach,
  onUpdateOverride,
  onDetach,
}: {
  activity: ApiActivity;
  allKpis: Array<{ id: string; key: string; label: string }>;
  onAttach: (kpiId: string, override: number | null) => Promise<void>;
  onUpdateOverride: (kpiId: string, override: number | null) => Promise<void>;
  onDetach: (kpiId: string) => Promise<void>;
}) {
  const [addKpiId, setAddKpiId] = useState("");
  const [addOverride, setAddOverride] = useState("");
  const attachedIds = new Set(activity.kpis.map((k) => k.kpiId));
  const available = allKpis.filter((k) => !attachedIds.has(k.id));

  return (
    <div className="space-y-4 mt-4">
      {/* Attached */}
      <div className="space-y-2">
        {activity.kpis.map((k) => (
          <div key={k.kpiId} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/20">
            <div>
              <span className="text-sm font-semibold text-foreground">{k.label}</span>
              <div className="flex items-center gap-2 mt-1">
                <Label className="text-[10px] text-muted-foreground">Override:</Label>
                <Input
                  type="number"
                  value={k.targetOverride ?? ""}
                  placeholder="—"
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    onUpdateOverride(k.kpiId, val);
                  }}
                  className="w-20 h-7 text-xs font-mono"
                />
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => onDetach(k.kpiId)} className="text-destructive">
              <Unlink className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
        {activity.kpis.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">Nenhum KPI vinculado.</p>
        )}
      </div>

      {/* Add new */}
      {available.length > 0 && (
        <div className="flex items-end gap-2 pt-3 border-t border-border/30">
          <div className="flex-1">
            <Label className="text-xs">Vincular KPI</Label>
            <Select value={addKpiId} onValueChange={setAddKpiId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {available.map((k) => (
                  <SelectItem key={k.id} value={k.id}>{k.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-24">
            <Label className="text-xs">Override</Label>
            <Input
              type="number"
              value={addOverride}
              placeholder="—"
              onChange={(e) => setAddOverride(e.target.value)}
              className="mt-1 font-mono"
            />
          </div>
          <Button
            size="sm"
            disabled={!addKpiId}
            onClick={async () => {
              await onAttach(addKpiId, addOverride ? Number(addOverride) : null);
              setAddKpiId(""); setAddOverride("");
            }}
          >
            <Link2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default AdminSchedule;
