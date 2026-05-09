import { useState } from "react";
import { toast } from "sonner";
import {
  CircleNotch,
  Plus,
  Flag,
  XCircle,
  Lightning,
  Trash,
  Trophy,
} from "@phosphor-icons/react";
import { format, parseISO, addDays, startOfWeek, endOfWeek, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  useTournaments,
  useCreateTournament,
  useFinishTournament,
  useCancelTournament,
  useDeleteTournament,
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
  const remove = useDeleteTournament();

  const [form, setForm] = useState({
    roundLabel: "",
    scope: "INDIVIDUAL" as TournamentScope,
    goalKpiKey: "ativacao_conta",
    startDate: defaultStart(),
    endDate: defaultEnd(),
    payoutPresetIdx: 1, // default: Top 3 300/150/100
  });

  const active = (tournaments ?? []).filter((t) => t.status === "ACTIVE");
  const canceled = (tournaments ?? []).filter((t) => t.status === "CANCELED");
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

  const handleDelete = async (id: string, label: string) => {
    if (
      !confirm(
        `Excluir "${label}" permanentemente? Essa ação não pode ser desfeita.`,
      )
    )
      return;
    try {
      await remove.mutateAsync(id);
      toast.success("Torneio excluído");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir");
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
      {/* Page header (eyebrow + title + subtitle) vem do AdminLayout topbar. */}

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
              className="text-left p-3 rounded-[14px] border border-line bg-surface-2/50 hover:border-eqi/40 hover:bg-eqi/5 transition-all"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-ink truncate">{tpl.label}</span>
              </div>
              <p className="text-[11px] text-ink-3 leading-tight">{tpl.description}</p>
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
            <p className="text-[10px] text-ink-3 mt-1">
              Total do pote: R$ {Object.values(PAYOUT_PRESETS[form.payoutPresetIdx].payout).reduce((a, b) => a + b, 0).toLocaleString("pt-BR")}
            </p>
          </div>
        </div>

        <Button onClick={handleCreate} disabled={create.isPending} className="w-full md:w-auto">
          {create.isPending ? <CircleNotch size={16} className="mr-2 animate-spin" /> : <Plus size={16} className="mr-2" weight="bold" />}
          Criar torneio e anunciar
        </Button>
      </div>

      {/* Ativos */}
      <div>
        <h2 className="text-sm font-bold text-ink mb-3 flex items-center gap-2">
          <Flag size={16} weight="fill" className="text-success" />
          Ativos ({active.length})
        </h2>
        {isLoading && <p className="text-xs text-ink-3">Carregando…</p>}
        {!isLoading && active.length === 0 && (
          <p className="text-xs text-ink-3 italic">Nenhum torneio ativo. Crie um acima.</p>
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
                  variant="outline"
                  onClick={() => handleCancel(t.id)}
                  disabled={cancel.isPending}
                >
                  <XCircle size={12} weight="bold" className="mr-2" />
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(t.id, t.roundLabel)}
                  disabled={remove.isPending}
                  title="Excluir permanentemente"
                >
                  <Trash size={12} weight="bold" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cancelados — admin pode excluir permanentemente pra limpar a lista */}
      {canceled.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-ink mb-3 flex items-center gap-2">
            <XCircle size={16} weight="fill" className="text-ink-3" />
            Cancelados ({canceled.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {canceled.slice(0, 6).map((t) => (
              <div key={t.id} className="space-y-2 opacity-70">
                <TournamentCard tournament={t} />
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(t.id, t.roundLabel)}
                  disabled={remove.isPending}
                  className="w-full"
                >
                  <Trash size={12} weight="bold" className="mr-2" />
                  Excluir permanentemente
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Finalizados — tabela compacta últimos 60 dias (alinha com design) */}
      {finished.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-ink mb-3 flex items-center gap-2">
            <Trophy size={16} weight="fill" className="text-gold-deep" />
            Histórico ({finished.length})
          </h2>
          <div className="rounded-[14px] overflow-hidden border border-line bg-card">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-surface-2">
                  <th className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-ink-3 text-left px-3 py-2.5">
                    Torneio
                  </th>
                  <th className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-ink-3 text-left px-3 py-2.5">
                    Escopo
                  </th>
                  <th className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-ink-3 text-left px-3 py-2.5">
                    Período
                  </th>
                  <th className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-ink-3 text-left px-3 py-2.5">
                    Campeão
                  </th>
                  <th className="num text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-ink-3 text-right px-3 py-2.5">
                    Pool
                  </th>
                  <th className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-ink-3 text-left px-3 py-2.5">
                    Encerrado
                  </th>
                </tr>
              </thead>
              <tbody>
                {finished.slice(0, 60).map((t) => {
                  const champion = [...t.participants].sort(
                    (a, b) => (a.rank ?? 999) - (b.rank ?? 999),
                  )[0];
                  return (
                    <tr key={t.id} className="border-t border-line hover:bg-surface-2/60 transition-colors">
                      <td className="px-3 py-2.5">
                        <span className="font-medium text-ink">{t.roundLabel}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-line bg-surface text-[10px] font-mono font-semibold uppercase tracking-[0.08em] text-ink-2">
                          {t.scope === "INDIVIDUAL" ? "Individual" : "Squad"}
                        </span>
                      </td>
                      <td className="num text-[12px] text-ink-3 px-3 py-2.5">
                        {format(parseISO(t.startDate), "dd/MM")} →{" "}
                        {format(parseISO(t.endDate), "dd/MM")}
                      </td>
                      <td className="px-3 py-2.5">
                        {champion ? (
                          <span className="text-ink">{champion.displayName}</span>
                        ) : (
                          <span className="text-[11px] text-ink-4">—</span>
                        )}
                      </td>
                      <td className="num text-right px-3 py-2.5">
                        <span className="font-display font-bold text-[14px] text-primary">
                          R$ {Number(t.totalPrizePool ?? 0).toLocaleString("pt-BR")}
                        </span>
                      </td>
                      <td className="num text-[11px] text-ink-3 px-3 py-2.5">
                        {t.finishedAt
                          ? format(parseISO(t.finishedAt), "dd/MM/yyyy", { locale: ptBR })
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTournaments;
