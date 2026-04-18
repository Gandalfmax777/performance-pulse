import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Target, Pencil, ChevronDown, ChevronUp, History, Loader2, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import { useCreateGoal, useGoals, type ApiGoal } from "@/hooks/useGoals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { ApiKpi } from "@/hooks/useKpis";

interface KpiDialogState {
  open: boolean;
  kpi: ApiKpi | null;
}

const PERIOD_OPTIONS: Array<{ value: "DAILY" | "WEEKLY" | "MONTHLY"; label: string }> = [
  { value: "DAILY", label: "Diária" },
  { value: "WEEKLY", label: "Semanal" },
  { value: "MONTHLY", label: "Mensal" },
];

function formatYmdBr(ymd: string): string {
  try {
    return format(new Date(ymd), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return ymd;
  }
}

const AdminGoals = () => {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<KpiDialogState>({ open: false, kpi: null });
  const [historyOpen, setHistoryOpen] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Busca KPIs completos (incluindo derivados) pra admin
  const { data: allKpisRaw, isLoading } = useQuery({
    queryKey: ["kpis", "admin-all"],
    queryFn: () => apiFetch<ApiKpi[]>("/kpis"),
    staleTime: 30_000,
  });

  const kpis = useMemo(() => (allKpisRaw ?? []).filter((k) => !k.isDerived), [allKpisRaw]);

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            Metas & KPIs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Edite as definições dos KPIs e suas metas ativas. Mudança retroativa recalcula os
            históricos.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Novo KPI
        </Button>
      </div>

      {/* KPI list */}
      <div className="card-glass rounded-xl overflow-hidden border border-border/30">
        {isLoading ? (
          <div className="p-10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/30 hover:bg-transparent">
                <TableHead className="text-xs">KPI</TableHead>
                <TableHead className="text-xs">Chave</TableHead>
                <TableHead className="text-xs">Modo</TableHead>
                <TableHead className="text-xs text-right">Meta atual</TableHead>
                <TableHead className="text-xs">Válida desde</TableHead>
                <TableHead className="text-xs text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kpis.map((kpi) => {
                const goalValue = kpi.activeGoal?.value ?? kpi.defaultTarget;
                const validFrom = kpi.activeGoal?.validFrom
                  ? formatYmdBr(kpi.activeGoal.validFrom.slice(0, 10))
                  : "—";
                const period = kpi.activeGoal?.period ?? "—";
                const expanded = historyOpen === kpi.id;
                return (
                  <>
                    <TableRow key={kpi.id} className="border-border/20">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setHistoryOpen(expanded ? null : kpi.id)}
                            className="text-muted-foreground hover:text-foreground"
                            title="Ver histórico"
                          >
                            {expanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <span className="font-semibold text-sm text-foreground">{kpi.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-[11px] font-mono text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">
                          {kpi.key}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-mono border-border/40">
                          {kpi.inputMode}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono font-bold text-sm text-primary">
                          {goalValue}
                          {kpi.unit}
                        </span>
                        {period !== "—" && (
                          <span className="text-[10px] text-muted-foreground ml-1.5">/ {period.toLowerCase()}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{validFrom}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDialog({ open: true, kpi })}
                          className="h-8 gap-1.5"
                        >
                          <Pencil className="w-3 h-3" />
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expanded && <GoalHistoryRow kpiId={kpi.id} />}
                  </>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {dialog.kpi && (
        <EditKpiDialog
          kpi={dialog.kpi}
          open={dialog.open}
          onClose={() => setDialog({ open: false, kpi: null })}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["kpis"] });
            queryClient.invalidateQueries({ queryKey: ["goals"] });
            toast.success("Metas atualizadas com sucesso");
          }}
        />
      )}

      <CreateKpiDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["kpis"] });
          queryClient.invalidateQueries({ queryKey: ["goals"] });
          toast.success("KPI criado");
          setCreateOpen(false);
        }}
      />
    </div>
  );
};

// ─── Dialog de edição ────────────────────────────────────────────────────────

interface EditKpiDialogProps {
  kpi: ApiKpi;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function EditKpiDialog({ kpi, open, onClose, onSuccess }: EditKpiDialogProps) {
  const [label, setLabel] = useState(kpi.label);
  const [unit, setUnit] = useState(kpi.unit);
  const [defaultTarget, setDefaultTarget] = useState(kpi.defaultTarget);
  const [goalValue, setGoalValue] = useState(kpi.activeGoal?.value ?? kpi.defaultTarget);
  const [period, setPeriod] = useState<"DAILY" | "WEEKLY" | "MONTHLY">(
    kpi.activeGoal?.period ?? "WEEKLY",
  );
  const [appliesRetroactively, setAppliesRetroactively] = useState(false);
  const [saving, setSaving] = useState(false);

  const createGoal = useCreateGoal();

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1) PATCH KPI definition se mudou
      if (label !== kpi.label || unit !== kpi.unit || defaultTarget !== kpi.defaultTarget) {
        await apiFetch(`/kpis/${kpi.id}`, {
          method: "PATCH",
          body: { label, unit, defaultTarget },
        });
      }

      // 2) POST nova Goal se valor ou período mudaram
      const goalChanged =
        goalValue !== (kpi.activeGoal?.value ?? kpi.defaultTarget) ||
        period !== (kpi.activeGoal?.period ?? "WEEKLY");

      if (goalChanged) {
        await createGoal.mutateAsync({
          kpiId: kpi.id,
          value: goalValue,
          period,
          appliesRetroactively,
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar {kpi.label}</DialogTitle>
          <DialogDescription>
            Edite a definição do KPI e sua meta ativa. Marcar "aplicar retroativamente" recalcula
            pontos e % históricos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-3">
          {/* KPI definition */}
          <div>
            <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">
              Definição do KPI
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="label" className="text-xs">Nome</Label>
                  <Input
                    id="label"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="unit" className="text-xs">Unidade</Label>
                  <Input
                    id="unit"
                    value={unit}
                    placeholder="% ou vazio"
                    onChange={(e) => setUnit(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="defaultTarget" className="text-xs">Meta padrão (fallback)</Label>
                <Input
                  id="defaultTarget"
                  type="number"
                  min={0}
                  value={defaultTarget}
                  onChange={(e) => setDefaultTarget(Number(e.target.value))}
                  className="mt-1 font-mono"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Usado quando não há goal ativa cadastrada.
                </p>
              </div>
            </div>
          </div>

          {/* Goal */}
          <div>
            <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">
              Meta ativa
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="goalValue" className="text-xs">Valor</Label>
                  <Input
                    id="goalValue"
                    type="number"
                    min={0}
                    value={goalValue}
                    onChange={(e) => setGoalValue(Number(e.target.value))}
                    className="mt-1 font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="period" className="text-xs">Período</Label>
                  <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERIOD_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/20 border border-border/20">
                <Checkbox
                  id="retroactive"
                  checked={appliesRetroactively}
                  onCheckedChange={(v) => setAppliesRetroactively(v === true)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <Label htmlFor="retroactive" className="text-xs font-semibold cursor-pointer">
                    Aplicar retroativamente
                  </Label>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Recalcula os pontos e % de todas as métricas já registradas com a nova meta.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Salvar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Linha de histórico ──────────────────────────────────────────────────────

function GoalHistoryRow({ kpiId }: { kpiId: string }) {
  const { data, isLoading } = useGoals({ kpiId });

  return (
    <TableRow className="border-border/20 hover:bg-transparent">
      <TableCell colSpan={6} className="bg-muted/10 py-3">
        <div className="flex items-center gap-2 mb-2">
          <History className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground">Histórico de metas</span>
        </div>
        {isLoading ? (
          <p className="text-xs text-muted-foreground pl-5">Carregando…</p>
        ) : (data ?? []).length === 0 ? (
          <p className="text-xs text-muted-foreground pl-5">Nenhum histórico.</p>
        ) : (
          <div className="space-y-1 pl-5">
            {(data ?? []).map((g: ApiGoal) => (
              <div key={g.id} className="flex items-center gap-4 text-xs font-mono">
                <span className="text-primary font-bold w-12 text-right">
                  {g.value}
                </span>
                <span className="text-muted-foreground">{g.period}</span>
                <span className="text-muted-foreground">
                  {formatYmdBr(g.validFrom.slice(0, 10))} →{" "}
                  {g.validTo ? formatYmdBr(g.validTo.slice(0, 10)) : "atual"}
                </span>
                {!g.validTo && (
                  <Badge variant="outline" className="text-[9px] border-primary/30 text-primary">
                    ATIVA
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

// ─── Dialog de criação ───────────────────────────────────────────────────────

interface CreateKpiDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function CreateKpiDialog({ open, onClose, onSuccess }: CreateKpiDialogProps) {
  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");
  const [unit, setUnit] = useState("");
  const [inputMode, setInputMode] = useState<"ABSOLUTE" | "PERCENT" | "QUANTITY_OVER_BASE">(
    "ABSOLUTE",
  );
  const [defaultTarget, setDefaultTarget] = useState(1);
  const [period, setPeriod] = useState<"DAILY" | "WEEKLY" | "MONTHLY">("DAILY");
  const [createGoal, setCreateGoal] = useState(true);
  const [saving, setSaving] = useState(false);

  // Reset ao fechar
  const reset = () => {
    setKey("");
    setLabel("");
    setUnit("");
    setInputMode("ABSOLUTE");
    setDefaultTarget(1);
    setPeriod("DAILY");
    setCreateGoal(true);
  };

  const handleSave = async () => {
    if (!key.trim() || !label.trim()) {
      toast.error("Preencha key e label");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/kpis", {
        method: "POST",
        body: {
          key: key.trim().toLowerCase(),
          label: label.trim(),
          unit,
          inputMode,
          defaultTarget,
          ...(createGoal ? { goal: { value: defaultTarget, period } } : {}),
        },
      });
      reset();
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar KPI");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo KPI</DialogTitle>
          <DialogDescription>
            Cria um KPI novo. Pra remover ou editar pontuação avançada, edite
            <code className="text-[10px] mx-1 px-1 bg-muted/30 rounded">scoring.ts</code>
            no backend.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 space-y-3">
          <div>
            <Label className="text-xs">Key (interna, snake_case)</Label>
            <Input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="ex: agendamento_extra"
              className="mt-1 font-mono text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Label (visível)</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="ex: Agendamento Extra"
              className="mt-1"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="text-xs">Unidade</Label>
              <Input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="(vazio) ou %"
                className="mt-1"
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs">Meta default</Label>
              <Input
                type="number"
                min={0}
                value={defaultTarget}
                onChange={(e) => setDefaultTarget(parseFloat(e.target.value) || 0)}
                className="mt-1 font-mono"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Modo de entrada</Label>
            <Select value={inputMode} onValueChange={(v) => setInputMode(v as typeof inputMode)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ABSOLUTE">Absoluto (qtd)</SelectItem>
                <SelectItem value="PERCENT">Percentual (já é %)</SelectItem>
                <SelectItem value="QUANTITY_OVER_BASE">Qtd sobre Base (cadência, TP)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-start gap-2 pt-2 border-t border-border/30">
            <Checkbox
              id="createGoal"
              checked={createGoal}
              onCheckedChange={(v) => setCreateGoal(v === true)}
            />
            <div className="flex-1">
              <Label htmlFor="createGoal" className="text-xs font-medium cursor-pointer">
                Criar goal ativa agora
              </Label>
              {createGoal && (
                <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIOD_OPTIONS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !key.trim() || !label.trim()}>
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Criar KPI
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AdminGoals;
