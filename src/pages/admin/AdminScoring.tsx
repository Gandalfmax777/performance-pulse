import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CircleNotch,
  Sliders,
  Plus,
  Trash,
  PencilSimple,
  ArrowsDownUp,
  Lightning,
  Trophy,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  useScoringConfig,
  useUpdateScoringConfig,
  type BusinessDay,
  type TieBreakKey,
  type LevelThreshold,
  type LevelSlug,
} from "@/hooks/useScoringConfig";
import {
  useBonusTypes,
  useCreateBonusType,
  useUpdateBonusType,
  useDeleteBonusType,
  type BonusType,
} from "@/hooks/useBonusTypes";

const DAY_LABELS: Record<BusinessDay, string> = {
  MON: "Seg",
  TUE: "Ter",
  WED: "Qua",
  THU: "Qui",
  FRI: "Sex",
  SAT: "Sáb",
  SUN: "Dom",
};

const DAY_ORDER: BusinessDay[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const TIE_BREAK_LABELS: Record<TieBreakKey, string> = {
  points: "Pontos",
  weeklyGoalPercent: "% Meta",
  streak: "Streak",
  name: "Nome (alfabético)",
};

const LEVEL_LABELS: Record<LevelSlug, { label: string; type: "positive" | "negative" }> = {
  EM_FORMACAO:           { label: "Em Formação",          type: "positive" },
  EM_TRACAO:             { label: "Em Tração",            type: "positive" },
  ALTA_PERFORMANCE:      { label: "Alta Performance",     type: "positive" },
  PROFETA_DO_FORCASH:    { label: "Profeta do Forcash",   type: "positive" },
  MONSTRO_SAGRADO:       { label: "Monstro Sagrado",      type: "positive" },
  PONTO_DE_ATENCAO:      { label: "Ponto de Atenção",     type: "negative" },
  RITMO_ABAIXO:          { label: "Ritmo Abaixo",         type: "negative" },
  PIPELINE_EM_RISCO:     { label: "Pipeline em Risco",    type: "negative" },
  INIMIGO_DA_META:       { label: "Inimigo da Meta",      type: "negative" },
  PROCURADOR_DE_EMPREGO: { label: "Procurador de Emprego", type: "negative" },
};

const AdminScoring = () => {
  const { data: config, isLoading: cfgLoading } = useScoringConfig();
  const { data: bonusTypes, isLoading: bonusLoading } = useBonusTypes();

  if (cfgLoading || bonusLoading || !config) {
    return (
      <div className="p-8 flex items-center justify-center text-ink-3">
        <CircleNotch size={20} className="animate-spin mr-2" /> Carregando…
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-5xl">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink flex items-center gap-2">
          <Sliders size={22} weight="bold" className="text-primary" />
          Regras de Pontuação
        </h1>
        <p className="text-sm text-ink-3 mt-1">
          Edite os parâmetros que regem o ranking. Mudanças disparam recálculo retroativo
          automático em background — o ranking atualiza nos próximos minutos.
        </p>
      </header>

      <BonusTypesSection bonusTypes={bonusTypes ?? []} />
      <PenaltySection config={config} />
      <TieBreakSection config={config} />
      <LevelThresholdsSection config={config} />
    </div>
  );
};

export default AdminScoring;

// ─── Bônus Types ─────────────────────────────────────────────────────────────

interface BonusDialogState {
  open: boolean;
  editing: BonusType | null;
}

function BonusTypesSection({ bonusTypes }: { bonusTypes: BonusType[] }) {
  const [dialog, setDialog] = useState<BonusDialogState>({ open: false, editing: null });
  const deleteMut = useDeleteBonusType();

  const handleDelete = async (b: BonusType) => {
    if (!confirm(`Remover "${b.label}"? Observações antigas mantêm os pontos já gravados.`)) return;
    try {
      await deleteMut.mutateAsync(b.id);
      toast.success("Bônus removido");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover");
    }
  };

  return (
    <section className="rounded-[14px] border border-line bg-card">
      <div className="flex items-center justify-between p-5 border-b border-line">
        <div>
          <h2 className="text-base font-extrabold tracking-tight text-ink flex items-center gap-2">
            <Lightning size={16} weight="fill" className="text-gold-deep" />
            Bônus por Observação
          </h2>
          <p className="text-xs text-ink-3 mt-1">
            Markers que admin digita no campo de observação pra ganhar pontos extras
            (ex: <code className="font-mono bg-surface-2 px-1 rounded">[REUNIAO]</code>).
          </p>
        </div>
        <Button onClick={() => setDialog({ open: true, editing: null })} size="sm">
          <Plus size={14} weight="bold" /> Novo tipo
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Label</TableHead>
            <TableHead className="font-mono">Marker</TableHead>
            <TableHead className="text-right">Pontos</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bonusTypes.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-ink-3 py-8">
                Nenhum tipo cadastrado.
              </TableCell>
            </TableRow>
          )}
          {bonusTypes.map((b) => (
            <TableRow key={b.id}>
              <TableCell className="font-semibold">{b.label}</TableCell>
              <TableCell className="font-mono text-xs text-ink-2">{b.notePrefix}</TableCell>
              <TableCell className="text-right font-mono font-bold text-eqi">
                {b.points > 0 ? `+${b.points}` : b.points}
              </TableCell>
              <TableCell>
                <Badge variant={b.active ? "default" : "outline"} className="text-[10px]">
                  {b.active ? "ATIVO" : "INATIVO"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="inline-flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDialog({ open: true, editing: b })}
                  >
                    <PencilSimple size={14} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(b)}>
                    <Trash size={14} className="text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <BonusDialog state={dialog} onClose={() => setDialog({ open: false, editing: null })} />
    </section>
  );
}

function BonusDialog({ state, onClose }: { state: BonusDialogState; onClose: () => void }) {
  const editing = state.editing;
  const createMut = useCreateBonusType();
  const updateMut = useUpdateBonusType();
  const [slug, setSlug] = useState("");
  const [label, setLabel] = useState("");
  const [notePrefix, setNotePrefix] = useState("");
  const [points, setPoints] = useState(5);
  const [active, setActive] = useState(true);

  useEffect(() => {
    setSlug(editing?.slug ?? "");
    setLabel(editing?.label ?? "");
    setNotePrefix(editing?.notePrefix ?? "");
    setPoints(editing?.points ?? 5);
    setActive(editing?.active ?? true);
  }, [editing, state.open]);

  const handleSave = async () => {
    try {
      if (editing) {
        await updateMut.mutateAsync({
          id: editing.id,
          input: { label, notePrefix, points, active },
        });
        toast.success("Bônus atualizado");
      } else {
        await createMut.mutateAsync({ slug, label, notePrefix, points, active });
        toast.success("Bônus criado");
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    }
  };

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <Dialog open={state.open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar bônus" : "Novo bônus"}</DialogTitle>
          <DialogDescription>
            Configure um marker de observação que vale pontos extras.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-3">
          {!editing && (
            <div>
              <Label className="text-xs">Slug (kebab-case)</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                placeholder="ex: cliente-premium"
                className="mt-1 font-mono"
              />
              <p className="text-[10px] text-ink-3 mt-1">Identificador único, não pode mudar depois.</p>
            </div>
          )}
          <div>
            <Label className="text-xs">Label (exibido pro admin)</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="ex: Cliente Premium"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Marker (digitado na observação)</Label>
            <Input
              value={notePrefix}
              onChange={(e) => setNotePrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9_[\]]/g, ""))}
              placeholder="ex: [PREMIUM]"
              className="mt-1 font-mono"
            />
            <p className="text-[10px] text-ink-3 mt-1">Formato <code>[MAIUSCULAS]</code>. Único.</p>
          </div>
          <div>
            <Label className="text-xs">Pontos (pode ser negativo)</Label>
            <Input
              type="number"
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="mt-1 font-mono"
              min={-100}
              max={100}
            />
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-line/30">
            <Checkbox id="bonus-active" checked={active} onCheckedChange={(v) => setActive(v === true)} />
            <Label htmlFor="bonus-active" className="text-xs cursor-pointer">
              Ativo (admin pode usar o marker)
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !label || !notePrefix || (!editing && !slug)}>
            {saving && <CircleNotch size={16} className="animate-spin mr-2" />}
            {editing ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Penalty ─────────────────────────────────────────────────────────────────

function PenaltySection({ config }: { config: ReturnType<typeof useScoringConfig>["data"] }) {
  const updateMut = useUpdateScoringConfig();
  const [points, setPoints] = useState(config?.penaltyPointsPerIdleDay ?? 5);
  const [consecutive, setConsecutive] = useState(config?.penaltyConsecutiveIdleDays ?? 1);
  const [days, setDays] = useState<BusinessDay[]>(config?.penaltyBusinessDays ?? []);

  useEffect(() => {
    setPoints(config?.penaltyPointsPerIdleDay ?? 5);
    setConsecutive(config?.penaltyConsecutiveIdleDays ?? 1);
    setDays(config?.penaltyBusinessDays ?? []);
  }, [config]);

  const toggleDay = (d: BusinessDay) => {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const handleSave = async () => {
    if (days.length === 0) {
      toast.error("Selecione pelo menos um dia útil");
      return;
    }
    try {
      await updateMut.mutateAsync({
        penaltyPointsPerIdleDay: points,
        penaltyConsecutiveIdleDays: consecutive,
        penaltyBusinessDays: days,
      });
      toast.success("Penalidade atualizada · recálculo em background");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  };

  return (
    <section className="rounded-[14px] border border-line bg-card p-5 space-y-4">
      <header>
        <h2 className="text-base font-extrabold tracking-tight text-ink">Penalidade por Inatividade</h2>
        <p className="text-xs text-ink-3 mt-1">
          Pontos deduzidos quando o assessor fica dias úteis sem registrar nenhuma atividade.
        </p>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label className="text-xs">Pontos por dia inativo</Label>
          <Input
            type="number"
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            className="mt-1 font-mono"
            min={0}
          />
        </div>
        <div>
          <Label className="text-xs">Dias úteis consecutivos pra disparar</Label>
          <Input
            type="number"
            value={consecutive}
            onChange={(e) => setConsecutive(Math.max(1, Number(e.target.value)))}
            className="mt-1 font-mono"
            min={1}
          />
          <p className="text-[10px] text-ink-3 mt-1">
            1 = cada dia útil sem registro penaliza. 3 = só penaliza após 3 seguidos.
          </p>
        </div>
      </div>
      <div>
        <Label className="text-xs">Dias que contam como úteis</Label>
        <div className="flex gap-2 mt-2">
          {DAY_ORDER.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleDay(d)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition ${
                days.includes(d)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-surface border-line text-ink-3 hover:text-ink"
              }`}
            >
              {DAY_LABELS[d]}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-end pt-2 border-t border-line/30">
        <Button onClick={handleSave} disabled={updateMut.isPending}>
          {updateMut.isPending && <CircleNotch size={16} className="animate-spin mr-2" />}
          Salvar
        </Button>
      </div>
    </section>
  );
}

// ─── Tie-break ───────────────────────────────────────────────────────────────

function TieBreakSection({ config }: { config: ReturnType<typeof useScoringConfig>["data"] }) {
  const updateMut = useUpdateScoringConfig();
  const [order, setOrder] = useState<TieBreakKey[]>(config?.tieBreakOrder ?? []);

  useEffect(() => {
    setOrder(config?.tieBreakOrder ?? []);
  }, [config]);

  const move = (i: number, dir: -1 | 1) => {
    const next = [...order];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
  };

  const handleSave = async () => {
    try {
      await updateMut.mutateAsync({ tieBreakOrder: order });
      toast.success("Critérios de desempate atualizados");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  };

  return (
    <section className="rounded-[14px] border border-line bg-card p-5 space-y-4">
      <header>
        <h2 className="text-base font-extrabold tracking-tight text-ink flex items-center gap-2">
          <ArrowsDownUp size={16} weight="bold" />
          Critérios de Desempate
        </h2>
        <p className="text-xs text-ink-3 mt-1">
          Ordem usada quando 2 assessores empatam em pontos. Topo da lista = primeiro critério.
        </p>
      </header>
      <ul className="space-y-2">
        {order.map((key, i) => (
          <li
            key={key}
            className="flex items-center justify-between p-3 rounded-md bg-surface border border-line"
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-ink-3 w-6">{i + 1}.</span>
              <span className="text-sm font-semibold text-ink">{TIE_BREAK_LABELS[key]}</span>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                disabled={i === 0}
                onClick={() => move(i, -1)}
              >
                ↑
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={i === order.length - 1}
                onClick={() => move(i, 1)}
              >
                ↓
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex justify-end pt-2 border-t border-line/30">
        <Button onClick={handleSave} disabled={updateMut.isPending}>
          {updateMut.isPending && <CircleNotch size={16} className="animate-spin mr-2" />}
          Salvar
        </Button>
      </div>
    </section>
  );
}

// ─── Level Thresholds ───────────────────────────────────────────────────────

function LevelThresholdsSection({ config }: { config: ReturnType<typeof useScoringConfig>["data"] }) {
  const updateMut = useUpdateScoringConfig();
  const [thresholds, setThresholds] = useState<LevelThreshold[]>(config?.levelThresholds ?? []);

  useEffect(() => {
    setThresholds(config?.levelThresholds ?? []);
  }, [config]);

  const updatePoints = (level: LevelSlug, value: number) => {
    setThresholds((prev) => prev.map((t) => (t.level === level ? { ...t, minPoints: value } : t)));
  };

  const handleSave = async () => {
    try {
      await updateMut.mutateAsync({ levelThresholds: thresholds });
      toast.success("Thresholds de nível atualizados");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  };

  // Ordena pra exibição: positivos do maior pro menor, depois negativos do menos
  // negativo pro mais negativo.
  const positives = thresholds
    .filter((t) => LEVEL_LABELS[t.level].type === "positive")
    .sort((a, b) => b.minPoints - a.minPoints);
  const negatives = thresholds
    .filter((t) => LEVEL_LABELS[t.level].type === "negative")
    .sort((a, b) => b.minPoints - a.minPoints);

  return (
    <section className="rounded-[14px] border border-line bg-card p-5 space-y-4">
      <header>
        <h2 className="text-base font-extrabold tracking-tight text-ink flex items-center gap-2">
          <Trophy size={16} weight="fill" className="text-gold-deep" />
          Thresholds de Nível (rolling 4 semanas)
        </h2>
        <p className="text-xs text-ink-3 mt-1">
          Pontos mínimos pra cada nível, calculados com base nos pontos das últimas 4
          semanas de cada assessor. Negativos exigem performance ruim sustentada. Estes
          valores serão consumidos quando o level engine (P3) entrar em produção.
        </p>
      </header>

      <div className="space-y-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-eqi font-bold mb-2">Positivos</p>
          <div className="space-y-2">
            {positives.map((t) => (
              <ThresholdRow key={t.level} threshold={t} onChange={(v) => updatePoints(t.level, v)} />
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-destructive font-bold mb-2 mt-4">Negativos</p>
          <div className="space-y-2">
            {negatives.map((t) => (
              <ThresholdRow key={t.level} threshold={t} onChange={(v) => updatePoints(t.level, v)} />
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2 border-t border-line/30">
        <Button onClick={handleSave} disabled={updateMut.isPending}>
          {updateMut.isPending && <CircleNotch size={16} className="animate-spin mr-2" />}
          Salvar
        </Button>
      </div>
    </section>
  );
}

function ThresholdRow({
  threshold,
  onChange,
}: {
  threshold: LevelThreshold;
  onChange: (value: number) => void;
}) {
  const meta = LEVEL_LABELS[threshold.level];
  const isMin = !Number.isFinite(threshold.minPoints);
  return (
    <div className="flex items-center justify-between gap-3 p-2 rounded bg-surface border border-line">
      <div className="flex-1">
        <span className="text-sm font-semibold text-ink">{meta.label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-ink-3">≥</span>
        {isMin ? (
          <span className="font-mono text-xs text-ink-3 w-24 text-right italic">
            (sempre — fundo do poço)
          </span>
        ) : (
          <Input
            type="number"
            value={threshold.minPoints}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-24 font-mono text-right"
          />
        )}
        <span className="text-xs text-ink-3">pts</span>
      </div>
    </div>
  );
}
