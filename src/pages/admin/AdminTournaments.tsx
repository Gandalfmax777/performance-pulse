import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Sword as Swords,
  Plus,
  Flag,
  XCircle,
  Lightning,
} from "@phosphor-icons/react";
import { format, parseISO, addDays, startOfWeek, endOfWeek, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  useTournaments,
  useCreateTournament,
  useFinishTournament,
  useCancelTournament,
  type TournamentScope,
  type CreateTournamentInput,
} from "@/hooks/useTournaments";
import { useKpis } from "@/hooks/useKpis";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TournamentCard from "@/components/dashboard/TournamentCard";

// Payout presets reusáveis
const PAYOUT_PRESETS: Array<{ label: string; payout: Record<string, number> }> = [
  { label: "Top 1 · R$ 500",           payout: { "1": 500 } },
  { label: "Top 3 · R$ 300/150/100",   payout: { "1": 300, "2": 150, "3": 100 } },
  { label: "Top 3 · R$ 500/300/200",   payout: { "1": 500, "2": 300, "3": 200 } },
  { label: "Top 5 · R$ 400/200/100/50/50", payout: { "1": 400, "2": 200, "3": 100, "4": 50, "5": 50 } },
];

// Templates quick-create — 1 clique popula o form com datas/KPI/payout típicos.
// Felipe pode ajustar nome e clicar "Criar" ou editar qualquer campo antes.
interface TournamentTemplate {
  id: string;
  label: string;
  emoji: string;
  defaultLabel: (now: Date) => string;
  scope: TournamentScope;
  goalKpiKey: string;
  getDates: (now: Date) => { startDate: string; endDate: string };
  payoutPresetIdx: number;
  description: string;
}

const TEMPLATES: TournamentTemplate[] = [
  {
    id: "ativacoes_semanal",
    label: "Corrida Semanal · Ativações",
    emoji: "🎯",
    defaultLabel: (now) => `Corrida de Ativações · Semana ${format(now, "'S'ww/yyyy")}`,
    scope: "INDIVIDUAL",
    goalKpiKey: "ativacao_conta",
    getDates: (now) => ({
      startDate: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
      endDate: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    }),
    payoutPresetIdx: 1, // Top 3 300/150/100
    description: "Seg → dom, KPI ativação, top 3 ganham",
  },
  {
    id: "ligacoes_sprint",
    label: "Sprint de Ligações · 3 dias",
    emoji: "📞",
    defaultLabel: (now) => `Sprint de Ligações · ${format(now, "dd/MM")}`,
    scope: "INDIVIDUAL",
    goalKpiKey: "ligacoes",
    getDates: (now) => ({
      startDate: format(now, "yyyy-MM-dd"),
      endDate: format(addDays(now, 2), "yyyy-MM-dd"),
    }),
    payoutPresetIdx: 3, // Top 5
    description: "3 dias, KPI ligações, top 5 ganham",
  },
  {
    id: "reunioes_semanal",
    label: "Corrida de Reuniões",
    emoji: "🤝",
    defaultLabel: (now) => `Corrida de Reuniões · Semana ${format(now, "'S'ww/yyyy")}`,
    scope: "INDIVIDUAL",
    goalKpiKey: "reunioes",
    getDates: (now) => ({
      startDate: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
      endDate: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    }),
    payoutPresetIdx: 2, // Top 3 500/300/200
    description: "Seg → dom, KPI reuniões, top 3 pagam alto",
  },
  {
    id: "fechamento_mensal",
    label: "Race de Fechamento Mensal",
    emoji: "🏆",
    defaultLabel: (now) => `Race Mensal · ${format(now, "MMMM", { locale: ptBR })}`,
    scope: "INDIVIDUAL",
    goalKpiKey: "ativacao_conta",
    getDates: (now) => ({
      startDate: format(now, "yyyy-MM-dd"),
      endDate: format(endOfMonth(now), "yyyy-MM-dd"),
    }),
    payoutPresetIdx: 0, // Top 1 · R$ 500
    description: "Até fim do mês, KPI ativação, winner-takes-all",
  },
];

function defaultStart(): string {
  return format(new Date(), "yyyy-MM-dd");
}
function defaultEnd(): string {
  return format(addDays(new Date(), 6), "yyyy-MM-dd");
}

const AdminTournaments = () => {
  const { data: tournaments, isLoading } = useTournaments();
  const { kpis } = useKpis();
  const create = useCreateTournament();
  const finish = useFinishTournament();
  const cancel = useCancelTournament();

  const [form, setForm] = useState({
    roundLabel: "",
    scope: "INDIVIDUAL" as TournamentScope,
    goalKpiKey: "ativacao_conta",
    startDate: defaultStart(),
    endDate: defaultEnd(),
    payoutPresetIdx: 1, // default: Top 3 300/150/100
  });

  const active = (tournaments ?? []).filter((t) => t.status === "ACTIVE");
  const finished = (tournaments ?? []).filter((t) => t.status === "FINISHED");

  const handleCreate = async () => {
    if (!form.roundLabel.trim()) {
      toast.error("Informe um nome pro torneio");
      return;
    }
    const preset = PAYOUT_PRESETS[form.payoutPresetIdx];
    const input: CreateTournamentInput = {
      roundLabel: form.roundLabel,
      scope: form.scope,
      goalKpiKey: form.goalKpiKey,
      startDate: form.startDate,
      endDate: form.endDate,
      maxWinners: Object.keys(preset.payout).length,
      progressivePayoutJson: preset.payout,
    };
    try {
      await create.mutateAsync(input);
      toast.success("Torneio criado e participantes auto-enrollados");
      setForm((s) => ({ ...s, roundLabel: "" }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar torneio");
    }
  };

  const handleFinish = async (id: string) => {
    if (!confirm("Finalizar este torneio agora? Isso computa o ranking, grava os winners e cria os payouts no cofre.")) return;
    try {
      await finish.mutateAsync(id);
      toast.success("Torneio finalizado · payouts registrados");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao finalizar");
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Cancelar torneio? Nenhum payout será criado.")) return;
    try {
      await cancel.mutateAsync(id);
      toast.success("Torneio cancelado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao cancelar");
    }
  };

  const applyTemplate = (tpl: TournamentTemplate) => {
    const now = new Date();
    const dates = tpl.getDates(now);
    setForm({
      roundLabel: tpl.defaultLabel(now),
      scope: tpl.scope,
      goalKpiKey: tpl.goalKpiKey,
      startDate: dates.startDate,
      endDate: dates.endDate,
      payoutPresetIdx: tpl.payoutPresetIdx,
    });
    toast(`Template aplicado: ${tpl.label}`, { description: "Ajuste o que quiser e clique em Criar" });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-ink-3 mb-1">
          ADMINISTRAÇÃO
        </p>
        <h1 className="text-[22px] font-extrabold tracking-tight text-ink leading-none flex items-center gap-2">
          <Swords size={20} weight="bold" className="text-primary" />
          Torneios
        </h1>
        <p className="text-[12px] text-ink-3 mt-1.5">
          Corridas time-boxed com prêmio progressivo · top N ganham do cofre
        </p>
      </div>

      {/* Templates quick-create — 1 clique preenche o form abaixo */}
      <div className="rounded-[14px] border border-line bg-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Lightning size={14} weight="fill" className="text-gold-deep" />
          <h2 className="text-[14px] font-extrabold tracking-tight text-ink">Templates rápidos</h2>
          <span className="text-[10px] text-ink-3">Clique pra preencher o formulário</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => applyTemplate(tpl)}
              className="text-left p-3 rounded-xl border border-border/30 bg-muted/20 hover:border-secondary/50 hover:bg-secondary/5 transition-all"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{tpl.emoji}</span>
                <span className="text-sm font-semibold text-foreground truncate">{tpl.label}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight">{tpl.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Criar novo */}
      <div className="rounded-[14px] border border-line bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Plus size={14} weight="bold" className="text-primary" />
          <h2 className="text-[14px] font-extrabold tracking-tight text-ink">Novo torneio</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label className="text-xs">Nome</Label>
            <Input
              placeholder="Corrida de Ativações · Abril Semana 4"
              value={form.roundLabel}
              onChange={(e) => setForm((s) => ({ ...s, roundLabel: e.target.value }))}
            />
          </div>

          <div>
            <Label className="text-xs">Escopo</Label>
            <Select
              value={form.scope}
              onValueChange={(v) => setForm((s) => ({ ...s, scope: v as TournamentScope }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="INDIVIDUAL">Individual (cada assessor)</SelectItem>
                <SelectItem value="SQUAD">Squad (times competem)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">KPI da corrida</Label>
            <Select
              value={form.goalKpiKey}
              onValueChange={(v) => setForm((s) => ({ ...s, goalKpiKey: v }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {kpis.map((k) => (
                  <SelectItem key={k.key} value={k.key}>{k.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Início</Label>
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((s) => ({ ...s, startDate: e.target.value }))}
            />
          </div>
          <div>
            <Label className="text-xs">Fim</Label>
            <Input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm((s) => ({ ...s, endDate: e.target.value }))}
            />
          </div>

          <div className="md:col-span-2">
            <Label className="text-xs">Estrutura de prêmio</Label>
            <Select
              value={String(form.payoutPresetIdx)}
              onValueChange={(v) => setForm((s) => ({ ...s, payoutPresetIdx: Number(v) }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYOUT_PRESETS.map((p, i) => (
                  <SelectItem key={i} value={String(i)}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground mt-1">
              Total do pote: R$ {Object.values(PAYOUT_PRESETS[form.payoutPresetIdx].payout).reduce((a, b) => a + b, 0).toLocaleString("pt-BR")}
            </p>
          </div>
        </div>

        <Button onClick={handleCreate} disabled={create.isPending} className="w-full md:w-auto">
          {create.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus size={16} className="mr-2" weight="bold" />}
          Criar torneio e anunciar
        </Button>
      </div>

      {/* Ativos */}
      <div>
        <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Flag size={16} weight="fill" className="text-success" />
          Ativos ({active.length})
        </h2>
        {isLoading && <p className="text-xs text-muted-foreground">Carregando…</p>}
        {!isLoading && active.length === 0 && (
          <p className="text-xs text-muted-foreground italic">Nenhum torneio ativo. Crie um acima.</p>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {active.map((t) => (
            <div key={t.id} className="space-y-2">
              <TournamentCard tournament={t} />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleFinish(t.id)}
                  disabled={finish.isPending}
                  className="flex-1"
                >
                  <Flag size={12} weight="bold" className="mr-2" />
                  Finalizar agora
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleCancel(t.id)}
                  disabled={cancel.isPending}
                >
                  <XCircle size={12} weight="bold" className="mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Finalizados */}
      {finished.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-foreground mb-3">
            Histórico ({finished.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {finished.slice(0, 6).map((t) => (
              <div key={t.id} className="space-y-1">
                <TournamentCard tournament={t} />
                <p className="text-[10px] text-muted-foreground font-mono text-center">
                  Finalizado em {t.finishedAt ? format(parseISO(t.finishedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "—"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTournaments;
