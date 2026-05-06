import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Trophy, Plus, XCircle } from "@phosphor-icons/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useBets, useCreateBet, useCancelBet, type BetWinnerCriteria } from "@/hooks/useBets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CRITERIA_PRESETS: Array<{ label: string; value: BetWinnerCriteria }> = [
  { label: "Maior média de cadência",    value: { kind: "avgKpi", kpiKey: "cadencia" } },
  { label: "Mais pontos totais",          value: { kind: "totalPoints" } },
  { label: "Mais leads gerados",          value: { kind: "sumKpi", kpiKey: "leads" } },
  { label: "Mais reuniões agendadas",     value: { kind: "sumKpi", kpiKey: "reunioes" } },
  { label: "Mais ligações",               value: { kind: "sumKpi", kpiKey: "ligacoes" } },
];

function criteriaLabel(c: BetWinnerCriteria): string {
  if (c.kind === "avgKpi") return `Maior média de ${c.kpiKey}`;
  if (c.kind === "totalPoints") return "Mais pontos totais";
  if (c.kind === "sumKpi") return `Mais ${c.kpiKey}`;
  return "Personalizado";
}

const AdminBetsConfig = () => {
  const { data: bets, isLoading } = useBets();
  const createBet = useCreateBet();
  const cancelBet = useCancelBet();

  const [type, setType] = useState<"WEEKLY" | "MONTHLY">("WEEKLY");
  const [value, setValue] = useState(50);
  const [label, setLabel] = useState("");
  const [criteriaIdx, setCriteriaIdx] = useState(0);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  const activeBets = (bets ?? []).filter((b) => b.status === "ACTIVE");
  const finishedBets = (bets ?? []).filter((b) => b.status !== "ACTIVE");

  async function handleCreate() {
    const criteria = CRITERIA_PRESETS[criteriaIdx]?.value;
    if (!criteria) return;
    const month = format(new Date(), "MMMM", { locale: ptBR }).replace(/^\w/, (c) => c.toUpperCase());
    const count = (bets ?? []).filter((b) => b.type === type).length;
    const roundLabel = label.trim() || (type === "WEEKLY" ? `Semana ${count + 1} — ${month}` : `Mês ${count + 1} — ${month}`);
    try {
      await createBet.mutateAsync({
        roundLabel,
        type,
        value,
        winnerCriteriaJson: criteria,
      });
      toast.success("Aposta criada");
      setLabel("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar");
    }
  }

  async function handleCancel() {
    if (!cancelTarget) return;
    try {
      await cancelBet.mutateAsync(cancelTarget);
      toast.success("Aposta cancelada");
      setCancelTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao cancelar");
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-ink-3 mb-1">
          ADMINISTRAÇÃO
        </p>
        <h1 className="text-[22px] font-extrabold tracking-tight text-ink leading-none flex items-center gap-2">
          <Trophy size={20} weight="bold" className="text-primary" />
          Configurar Apostas
        </h1>
        <p className="text-[12px] text-ink-3 mt-1.5 max-w-2xl">
          Crie apostas entre squads, escolha o critério de vitória e acompanhe o histórico.
        </p>
      </div>

      {/* Create form */}
      <div className="rounded-[14px] p-5 border border-line bg-card space-y-4">
        <h2 className="text-[14px] font-extrabold tracking-tight text-ink flex items-center gap-2">
          <Plus size={14} weight="bold" className="text-primary" />
          Nova aposta
        </h2>
        <div className="grid grid-cols-4 gap-3">
          <div>
            <Label className="text-xs">Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as "WEEKLY" | "MONTHLY")}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="WEEKLY">Semanal</SelectItem>
                <SelectItem value="MONTHLY">Mensal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Valor (R$)</Label>
            <Input type="number" min={0} value={value} onChange={(e) => setValue(Number(e.target.value))} className="mt-1 font-mono" />
          </div>
          <div>
            <Label className="text-xs">Critério de vitória</Label>
            <Select value={String(criteriaIdx)} onValueChange={(v) => setCriteriaIdx(Number(v))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CRITERIA_PRESETS.map((c, i) => (
                  <SelectItem key={i} value={String(i)}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Label (opcional)</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Auto-gerado..." className="mt-1" />
          </div>
        </div>
        <Button onClick={handleCreate} disabled={createBet.isPending} className="gap-1.5">
          {createBet.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Iniciar aposta
        </Button>
      </div>

      {/* Tabs ativas / finalizadas */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="bg-muted/30 border border-border/30">
          <TabsTrigger value="active" className="text-xs font-semibold">
            Ativas ({activeBets.length})
          </TabsTrigger>
          <TabsTrigger value="finished" className="text-xs font-semibold">
            Finalizadas ({finishedBets.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <div className="rounded-[14px] overflow-hidden border border-line bg-card">
            {isLoading ? (
              <div className="p-10 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : activeBets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">Nenhuma aposta ativa.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30 hover:bg-transparent">
                    <TableHead className="text-xs">Rodada</TableHead>
                    <TableHead className="text-xs">Tipo</TableHead>
                    <TableHead className="text-xs">Valor</TableHead>
                    <TableHead className="text-xs">Critério</TableHead>
                    <TableHead className="text-xs">Participantes</TableHead>
                    <TableHead className="text-xs text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeBets.map((bet) => (
                    <TableRow key={bet.id} className="border-border/20">
                      <TableCell className="font-semibold text-sm">{bet.roundLabel}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{bet.type}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-primary">R$ {bet.value}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {criteriaLabel(bet.winnerCriteriaJson)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {bet.participants.map((p) => (
                            <Badge key={p.squadId} variant="secondary" className="text-[10px]">
                              {p.squadEmoji} {p.squadName}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCancelTarget(bet.id)}
                          className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                        >
                          <XCircle size={12} weight="bold" />
                          Cancelar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="finished">
          <div className="rounded-[14px] overflow-hidden border border-line bg-card">
            {finishedBets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">Nenhuma rodada finalizada.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30 hover:bg-transparent">
                    <TableHead className="text-xs">Rodada</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Valor</TableHead>
                    <TableHead className="text-xs">Vencedor</TableHead>
                    <TableHead className="text-xs">Critério</TableHead>
                    <TableHead className="text-xs">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {finishedBets.map((bet) => (
                    <TableRow key={bet.id} className="border-border/20">
                      <TableCell className="font-semibold text-sm">{bet.roundLabel}</TableCell>
                      <TableCell>
                        <Badge variant={bet.status === "FINISHED" ? "default" : "destructive"} className="text-[10px]">
                          {bet.status === "FINISHED" ? "Finalizada" : "Cancelada"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">R$ {bet.value}</TableCell>
                      <TableCell className="text-sm">
                        {bet.winnerSquad ? `${bet.winnerSquad.emoji} ${bet.winnerSquad.name}` : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{criteriaLabel(bet.winnerCriteriaJson)}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{bet.endDate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Cancel AlertDialog */}
      <AlertDialog open={!!cancelTarget} onOpenChange={(v) => !v && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar aposta?</AlertDialogTitle>
            <AlertDialogDescription>
              A aposta será cancelada sem pagar o cofre. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Cancelar aposta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminBetsConfig;
