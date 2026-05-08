import { useMemo, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import {
  Warning,
  Check,
  X,
  Clock,
  ShieldCheck,
  Robot,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";
import {
  usePenaltyProposals,
  useReviewPenaltyProposal,
  useBulkReviewPenaltyProposals,
  type PenaltyProposal,
  type PenaltyStatus,
} from "@/hooks/usePenaltyProposals";

const STATUS_LABELS: Record<PenaltyStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Clock }> = {
  PENDING:        { label: "Pendente",        variant: "outline",     icon: Clock },
  APPROVED:       { label: "Aprovada",        variant: "default",     icon: Check },
  REJECTED:       { label: "Rejeitada",       variant: "secondary",   icon: X },
  AUTO_APPROVED:  { label: "Auto-aprovada",   variant: "default",     icon: Robot },
};

const FILTERS: Array<{ value: PenaltyStatus | "all"; label: string }> = [
  { value: "PENDING",       label: "Pendentes" },
  { value: "APPROVED",      label: "Aprovadas" },
  { value: "REJECTED",      label: "Rejeitadas" },
  { value: "AUTO_APPROVED", label: "Auto-aprovadas" },
  { value: "all",           label: "Todas" },
];

const AUTO_APPROVE_DAYS = 7;

const AdminPenalties = () => {
  const [filter, setFilter] = useState<PenaltyStatus | "all">("PENDING");
  const status = filter === "all" ? undefined : filter;
  const { data: proposals, isLoading } = usePenaltyProposals(status);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean;
    action: "APPROVED" | "REJECTED" | null;
    proposals: PenaltyProposal[];
  }>({ open: false, action: null, proposals: [] });

  const list = proposals ?? [];

  const allSelected = list.length > 0 && list.every((p) => selected.has(p.id));
  const someSelected = list.some((p) => selected.has(p.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(list.map((p) => p.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const openReview = (action: "APPROVED" | "REJECTED", target?: PenaltyProposal) => {
    if (target) {
      setReviewDialog({ open: true, action, proposals: [target] });
    } else {
      const targets = list.filter((p) => selected.has(p.id) && p.status === "PENDING");
      if (targets.length === 0) {
        toast.error("Selecione propostas pendentes pra revisar");
        return;
      }
      setReviewDialog({ open: true, action, proposals: targets });
    }
  };

  const closeReview = () => setReviewDialog({ open: false, action: null, proposals: [] });

  const totalPendingPoints = useMemo(
    () =>
      list
        .filter((p) => p.status === "PENDING")
        .reduce((sum, p) => sum + p.pointsProposed, 0),
    [list],
  );

  return (
    <div className="space-y-6 p-6 max-w-6xl">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink flex items-center gap-2">
          <ShieldCheck size={22} weight="bold" className="text-primary" />
          Penalidades a Revisar
        </h1>
        <p className="text-sm text-ink-3 mt-1">
          Cron noturno detecta dias úteis sem registro e cria propostas pra você revisar.
          Aprovar reduz pontos do assessor no ranking. Rejeitar ignora. Sem revisão em
          {" "}
          <strong>{AUTO_APPROVE_DAYS} dias</strong>, auto-aprova.
        </p>
      </header>

      {/* Filtros + bulk actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setFilter(f.value);
                setSelected(new Set());
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition ${
                filter === f.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-surface border-line text-ink-3 hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {filter === "PENDING" && list.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-ink-3 font-mono">
              {selected.size} selecionada{selected.size !== 1 ? "s" : ""}
              {totalPendingPoints > 0 && (
                <> · {totalPendingPoints} pts em jogo</>
              )}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={!someSelected}
              onClick={() => openReview("REJECTED")}
            >
              <X size={14} className="mr-1" /> Rejeitar selecionadas
            </Button>
            <Button
              size="sm"
              disabled={!someSelected}
              onClick={() => openReview("APPROVED")}
            >
              <Check size={14} className="mr-1" /> Aprovar selecionadas
            </Button>
          </div>
        )}
      </div>

      {/* Tabela */}
      {isLoading ? (
        <div className="p-8 flex items-center justify-center text-ink-3">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando…
        </div>
      ) : list.length === 0 ? (
        <div className="p-12 rounded-[14px] border border-dashed border-line text-center text-ink-3">
          <Warning size={32} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm font-semibold">Nenhuma proposta com este filtro.</p>
          {filter === "PENDING" && (
            <p className="text-xs mt-1">Bom sinal — time tá registrando regularmente.</p>
          )}
        </div>
      ) : (
        <div className="rounded-[14px] border border-line bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {filter === "PENDING" && (
                  <TableHead className="w-10">
                    <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                  </TableHead>
                )}
                <TableHead>Assessor</TableHead>
                <TableHead>Dia inativo</TableHead>
                <TableHead className="text-right">Pontos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Idade</TableHead>
                <TableHead>Revisado por</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((p) => {
                const meta = STATUS_LABELS[p.status];
                const StatusIcon = meta.icon;
                const isPending = p.status === "PENDING";
                const daysUntilAutoApprove = AUTO_APPROVE_DAYS - p.ageDays;
                return (
                  <TableRow key={p.id} className={selected.has(p.id) ? "bg-muted/30" : ""}>
                    {filter === "PENDING" && (
                      <TableCell>
                        <Checkbox
                          checked={selected.has(p.id)}
                          onCheckedChange={() => toggleOne(p.id)}
                          disabled={!isPending}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <AssessorAvatar
                          initials={p.assessorInitials}
                          photoUrl={null}
                          size={28}
                        />
                        <span className="text-sm font-semibold">{p.assessorName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {format(new Date(p.date), "dd/MM/yyyy (EEEEE)", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-destructive">
                      −{p.pointsProposed}
                    </TableCell>
                    <TableCell>
                      <Badge variant={meta.variant} className="text-[10px] inline-flex items-center gap-1">
                        <StatusIcon size={10} weight="bold" />
                        {meta.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-ink-3">
                      {isPending ? (
                        daysUntilAutoApprove > 0 ? (
                          <span title={`Auto-aprova em ${daysUntilAutoApprove} dia(s)`}>
                            {p.ageDays}d <span className="text-ink-3/60">/ {AUTO_APPROVE_DAYS}d</span>
                          </span>
                        ) : (
                          <span className="text-destructive font-semibold">Vai auto-aprovar</span>
                        )
                      ) : (
                        <span>{p.ageDays}d atrás</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-ink-3">
                      {p.reviewedByName ?? (p.status === "AUTO_APPROVED" ? "Sistema" : "—")}
                      {p.justification && (
                        <p
                          className="text-[10px] text-ink-3/70 mt-0.5 truncate max-w-[180px]"
                          title={p.justification}
                        >
                          “{p.justification}”
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isPending && (
                        <div className="inline-flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Aprovar"
                            onClick={() => openReview("APPROVED", p)}
                          >
                            <Check size={14} className="text-eqi" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Rejeitar"
                            onClick={() => openReview("REJECTED", p)}
                          >
                            <X size={14} className="text-destructive" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <ReviewDialog
        state={reviewDialog}
        onClose={closeReview}
        onConfirmed={() => setSelected(new Set())}
      />
    </div>
  );
};

export default AdminPenalties;

interface ReviewDialogState {
  open: boolean;
  action: "APPROVED" | "REJECTED" | null;
  proposals: PenaltyProposal[];
}

function ReviewDialog({
  state,
  onClose,
  onConfirmed,
}: {
  state: ReviewDialogState;
  onClose: () => void;
  onConfirmed: () => void;
}) {
  const [justification, setJustification] = useState("");
  const reviewMut = useReviewPenaltyProposal();
  const bulkMut = useBulkReviewPenaltyProposals();

  const isBulk = state.proposals.length > 1;
  const isApprove = state.action === "APPROVED";
  const totalPoints = state.proposals.reduce((s, p) => s + p.pointsProposed, 0);

  const handleConfirm = async () => {
    if (!state.action) return;
    try {
      if (isBulk) {
        const res = await bulkMut.mutateAsync({
          ids: state.proposals.map((p) => p.id),
          status: state.action,
          justification: justification.trim() || undefined,
        });
        toast.success(`${res.updated} proposta${res.updated !== 1 ? "s" : ""} ${isApprove ? "aprovada" : "rejeitada"}${res.updated !== 1 ? "s" : ""}`);
      } else {
        await reviewMut.mutateAsync({
          id: state.proposals[0].id,
          status: state.action,
          justification: justification.trim() || undefined,
        });
        toast.success(`Proposta ${isApprove ? "aprovada" : "rejeitada"}`);
      }
      onConfirmed();
      onClose();
      setJustification("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao revisar");
    }
  };

  const saving = reviewMut.isPending || bulkMut.isPending;

  return (
    <Dialog
      open={state.open}
      onOpenChange={(v) => {
        if (!v) {
          onClose();
          setJustification("");
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isApprove ? "Aprovar" : "Rejeitar"} {isBulk ? `${state.proposals.length} propostas` : "proposta"}
          </DialogTitle>
          <DialogDescription>
            {isApprove ? (
              <>
                {isBulk ? `Total de` : "Vai deduzir"} <strong>{totalPoints} pts</strong>{" "}
                {isBulk ? "em deduções" : "do assessor"}. Afeta o ranking imediatamente.
              </>
            ) : (
              <>
                Sem dedução. Justificativa fica registrada como referência (opcional).
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {!isBulk && (
          <div className="text-xs bg-surface rounded p-3 border border-line">
            <p className="font-semibold">{state.proposals[0].assessorName}</p>
            <p className="text-ink-3 mt-0.5 font-mono">
              {state.proposals[0].date} · −{state.proposals[0].pointsProposed} pts
            </p>
          </div>
        )}

        <div>
          <Label className="text-xs">Justificativa {isApprove ? "(opcional)" : "(opcional, recomendado)"}</Label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder={
              isApprove
                ? "ex: assessor confirmou ausência sem aviso"
                : "ex: estava em treinamento externo (Felipe autorizou)"
            }
            className="mt-1"
            maxLength={500}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={saving}
            variant={isApprove ? "default" : "destructive"}
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Confirmar {isApprove ? "aprovação" : "rejeição"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
