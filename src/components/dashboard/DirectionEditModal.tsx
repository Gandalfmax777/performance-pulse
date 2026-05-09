import { useEffect, useMemo, useState } from "react";
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import {
  CircleNotch,
  Target,
  CalendarBlank as CalendarDays,
  FloppyDisk as Save,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useKpis } from "@/hooks/useKpis";
import {
  useDailyDirection,
  useUpsertDailyDirection,
  type DirectionPeriod,
} from "@/hooks/useDailyDirection";

interface Props {
  /** Data anchor (DAILY: o dia; WEEKLY: segunda; MONTHLY: dia 1) */
  date: string;
  open: boolean;
  onClose: () => void;
}

/**
 * Modal pra criar/editar Direcionamento (Foco) com período + KPIs alvo.
 *
 * Substitui o textarea inline simples — agora Felipe escolhe se é foco
 * de dia/semana/mês e quais KPIs vai medir o cumprimento depois.
 */
const DirectionEditModal = ({ date, open, onClose }: Props) => {
  const { data: existing } = useDailyDirection(date);
  const upsert = useUpsertDailyDirection(date);
  const { kpis } = useKpis();

  const [text, setText] = useState("");
  const [period, setPeriod] = useState<DirectionPeriod>("DAILY");
  const [periodStart, setPeriodStart] = useState(date);
  const [periodEnd, setPeriodEnd] = useState(date);
  const [targetKpiKeys, setTargetKpiKeys] = useState<string[]>([]);

  // Quando o modal abre / direction existente carrega → preenche form
  useEffect(() => {
    if (!open) return;
    if (existing) {
      setText(existing.text);
      setPeriod(existing.period);
      setPeriodStart(existing.periodStart ?? existing.date);
      setPeriodEnd(existing.periodEnd ?? existing.date);
      setTargetKpiKeys(existing.targetKpiKeys);
    } else {
      // Defaults novos baseados no period DAILY
      setText("");
      setPeriod("DAILY");
      setPeriodStart(date);
      setPeriodEnd(date);
      setTargetKpiKeys([]);
    }
  }, [open, existing, date]);

  // Quando muda o período, recalcula start/end automaticamente
  const recalcRange = (p: DirectionPeriod) => {
    const ref = new Date(`${date}T00:00:00.000Z`);
    if (p === "DAILY") {
      setPeriodStart(date);
      setPeriodEnd(date);
    } else if (p === "WEEKLY") {
      setPeriodStart(format(startOfWeek(ref, { weekStartsOn: 1 }), "yyyy-MM-dd"));
      setPeriodEnd(format(endOfWeek(ref, { weekStartsOn: 1 }), "yyyy-MM-dd"));
    } else {
      setPeriodStart(format(startOfMonth(ref), "yyyy-MM-dd"));
      setPeriodEnd(format(endOfMonth(ref), "yyyy-MM-dd"));
    }
  };

  const handleChangePeriod = (p: DirectionPeriod) => {
    setPeriod(p);
    recalcRange(p);
  };

  const toggleKpi = (key: string) => {
    setTargetKpiKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleSave = async () => {
    if (!text.trim()) {
      toast.error("Escreva o foco antes de salvar");
      return;
    }
    try {
      await upsert.mutateAsync({
        text,
        period,
        periodStart: period === "DAILY" ? undefined : periodStart,
        periodEnd: period === "DAILY" ? undefined : periodEnd,
        targetKpiKeys,
      });
      toast.success("Foco salvo");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    }
  };

  const periodLabel = useMemo(() => {
    const ref = new Date(`${date}T00:00:00.000Z`);
    if (period === "DAILY") return `Foco de ${format(ref, "dd/MM")}`;
    if (period === "WEEKLY") return `Foco da semana (${periodStart} → ${periodEnd})`;
    return `Foco do mês (${format(ref, "MM/yyyy")})`;
  }, [period, date, periodStart, periodEnd]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target size={20} className="text-primary" />
            Definir Foco
          </DialogTitle>
          <DialogDescription>{periodLabel}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Período */}
          <div>
            <Label className="text-xs">Período</Label>
            <RadioGroup
              value={period}
              onValueChange={(v) => handleChangePeriod(v as DirectionPeriod)}
              className="flex gap-4 mt-1"
            >
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <RadioGroupItem value="DAILY" /> Dia
              </label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <RadioGroupItem value="WEEKLY" /> Semana
              </label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <RadioGroupItem value="MONTHLY" /> Mês
              </label>
            </RadioGroup>
          </div>

          {/* Range customizado (só pra WEEKLY/MONTHLY) */}
          {period !== "DAILY" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs flex items-center gap-1">
                  <CalendarDays size={12} /> Início
                </Label>
                <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs flex items-center gap-1">
                  <CalendarDays size={12} /> Fim
                </Label>
                <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
              </div>
            </div>
          )}

          {/* KPIs alvo */}
          <div>
            <Label className="text-xs">KPIs alvo (opcional)</Label>
            <p className="text-[11px] text-muted-foreground mb-2">
              Sistema vai medir aumento desses KPIs no período vs período anterior
            </p>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 rounded-md border border-border/30">
              {kpis.map((kpi) => (
                <label key={kpi.key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={targetKpiKeys.includes(kpi.key)}
                    onCheckedChange={() => toggleKpi(kpi.key)}
                  />
                  {kpi.label}
                </label>
              ))}
            </div>
          </div>

          {/* Texto */}
          <div>
            <Label className="text-xs">Texto do foco</Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ex: Foco em ativação de conta + reuniões realizadas. Prioritário: João, Maria, Pedro."
              rows={4}
              maxLength={2000}
            />
            <p className="text-[10px] text-muted-foreground text-right mt-1">{text.length}/2000</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={upsert.isPending || !text.trim()}>
            {upsert.isPending ? <CircleNotch size={16} className="mr-2 animate-spin" /> : <Save size={16} weight="bold" className="mr-2" />}
            Salvar foco
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DirectionEditModal;
