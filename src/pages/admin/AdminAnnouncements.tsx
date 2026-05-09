import { useState } from "react";
import { toast } from "sonner";
import {
  CircleNotch,
  Plus,
  PencilSimple,
  Trash,
  Eye,
  EyeSlash,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
import { Badge } from "@/components/ui/badge";
import {
  useAnnouncements,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
  type ApiAnnouncement,
} from "@/hooks/useAnnouncements";

interface DialogState {
  open: boolean;
  editing: ApiAnnouncement | null;
}

const AdminAnnouncements = () => {
  const { data: announcements, isLoading } = useAnnouncements(true); // includeInactive
  const createMut = useCreateAnnouncement();
  const updateMut = useUpdateAnnouncement();
  const deleteMut = useDeleteAnnouncement();

  const [dialog, setDialog] = useState<DialogState>({ open: false, editing: null });

  const handleToggleActive = async (a: ApiAnnouncement) => {
    try {
      await updateMut.mutateAsync({ id: a.id, input: { active: !a.active, message: a.message } });
      toast.success(a.active ? "Aviso desativado" : "Aviso ativado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar");
    }
  };

  const handleDelete = async (a: ApiAnnouncement) => {
    if (!confirm(`Remover aviso "${a.message.slice(0, 60)}..."?`)) return;
    try {
      await deleteMut.mutateAsync(a.id);
      toast.success("Aviso removido");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover");
    }
  };

  // Composer state — UI-only por ora; "Publicar" abre o dialog real
  // de createAnnouncement com a mensagem pre-filled. Quando backend
  // ganhar campos type/channels/start/end, vira persisted.
  type AnnouncementType = "info" | "success" | "warning" | "critical";
  const [composerType, setComposerType] = useState<AnnouncementType>("info");
  const [composerMsg, setComposerMsg] = useState(
    "🏆 Liga das Ativações termina sexta — top 3 leva R$ 1.400 em prêmios.",
  );
  const [composerStart, setComposerStart] = useState("");
  const [composerEnd, setComposerEnd] = useState("");
  const [chTicker, setChTicker] = useState(true);
  const [chBanner, setChBanner] = useState(true);
  const [chPush, setChPush] = useState(false);

  const TYPE_META: Record<AnnouncementType, { label: string; bg: string; color: string; emoji: string }> = {
    info: { label: "Info", bg: "hsl(var(--primary)/0.12)", color: "hsl(var(--primary))", emoji: "📢" },
    success: { label: "Sucesso", bg: "hsl(var(--success)/0.12)", color: "hsl(var(--success))", emoji: "🏆" },
    warning: { label: "Atenção", bg: "hsl(var(--warning)/0.12)", color: "hsl(var(--warning))", emoji: "⚠️" },
    critical: { label: "Crítico", bg: "hsl(var(--destructive)/0.12)", color: "hsl(var(--destructive))", emoji: "🚨" },
  };

  return (
    <div className="space-y-5">
      {/* Page header (eyebrow + title + subtitle) vem do AdminLayout topbar.
          Aqui só renderizamos a action bar com o CTA primário. */}
      <div className="flex justify-end">
        <Button
          onClick={() => setDialog({ open: true, editing: null })}
          className="gap-2 bg-ink hover:bg-ink/90 text-white"
        >
          <Plus size={14} weight="bold" /> Novo Aviso
        </Button>
      </div>

      {/* Composer 2-col: form esquerda + preview TV ticker direita
          (alinha com design/Admin-Announcements.html v3) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-[var(--radius)] border border-line bg-card p-5 space-y-4">
          <div>
            <h3 className="text-[13px] font-bold text-ink mb-1">
              Compor aviso
            </h3>
            <p className="text-[11px] text-ink-3">
              Aparece no ticker do Modo TV e no banner do dashboard.
            </p>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-[0.12em] font-mono text-ink-3">
              Tipo
            </Label>
            <div className="flex gap-2 mt-2 flex-wrap">
              {(["info", "success", "warning", "critical"] as AnnouncementType[]).map((t) => {
                const meta = TYPE_META[t];
                const active = composerType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setComposerType(t)}
                    className={`px-3 py-1.5 rounded-[6px] text-[12px] font-semibold border transition-all ${
                      active
                        ? "border-transparent text-white"
                        : "border-line text-ink-3 hover:text-ink hover:bg-surface-2"
                    }`}
                    style={
                      active
                        ? { background: meta.color, borderColor: meta.color }
                        : undefined
                    }
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-[0.12em] font-mono text-ink-3">
              Mensagem
            </Label>
            <textarea
              value={composerMsg}
              onChange={(e) => setComposerMsg(e.target.value)}
              rows={3}
              className="mt-1.5 w-full text-[13px] rounded-[8px] border border-line bg-card px-3 py-2 focus:outline-none focus:border-primary/50 resize-y"
              placeholder="🏆 Squad Bet rodada 18 abre amanhã às 9h…"
            />
            <p className="text-[10px] text-ink-3 mt-1.5">
              {composerMsg.length} caracteres · use emojis pra peso visual
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-[0.12em] font-mono text-ink-3">
                Início
              </Label>
              <Input
                type="datetime-local"
                value={composerStart}
                onChange={(e) => setComposerStart(e.target.value)}
                className="mt-1.5 text-[13px]"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-[0.12em] font-mono text-ink-3">
                Fim
              </Label>
              <Input
                type="datetime-local"
                value={composerEnd}
                onChange={(e) => setComposerEnd(e.target.value)}
                className="mt-1.5 text-[13px]"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-[0.12em] font-mono text-ink-3">
              Canais
            </Label>
            <div className="flex gap-4 mt-2 flex-wrap text-[13px]">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={chTicker}
                  onCheckedChange={(v) => setChTicker(!!v)}
                />
                Ticker TV
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={chBanner}
                  onCheckedChange={(v) => setChBanner(!!v)}
                />
                Banner dashboard
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer text-ink-3">
                <Checkbox
                  checked={chPush}
                  onCheckedChange={(v) => setChPush(!!v)}
                />
                Notificação push
                <span className="text-[10px] uppercase tracking-[0.12em] font-mono text-ink-4">
                  em breve
                </span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => {
                // Pre-fills o dialog real de createAnnouncement com a msg.
                // Backend ainda não tem campos type/channels/start/end —
                // só a `message` + `active` é persistido.
                setDialog({ open: true, editing: null });
              }}
              className="bg-ink hover:bg-ink/90 text-white"
            >
              Publicar
            </Button>
            <Button variant="outline" disabled title="Rascunho ainda não suportado pelo backend">
              Salvar rascunho
            </Button>
          </div>
        </div>

        <div className="rounded-[var(--radius)] border border-line bg-card p-5 flex flex-col">
          <div className="mb-4">
            <h3 className="text-[13px] font-bold text-ink mb-1">
              Preview · TV ticker
            </h3>
            <p className="text-[11px] text-ink-3">
              Ao vivo no Modo TV. Texto rola da direita pra esquerda em loop.
            </p>
          </div>
          <div
            className="flex-1 flex items-center overflow-hidden border-t-[2px] min-h-[80px]"
            style={{
              background: "hsl(var(--ink))",
              borderTopColor: TYPE_META[composerType].color,
            }}
          >
            <div className="flex items-center whitespace-nowrap animate-marquee text-white px-6">
              <span className="inline-flex items-center gap-2.5 text-[13px] font-mono font-semibold tracking-[0.04em]">
                <span style={{ color: TYPE_META[composerType].color }}>
                  {TYPE_META[composerType].emoji} {TYPE_META[composerType].label.toUpperCase()} ·
                </span>
                {composerMsg || "Sua mensagem aparece aqui…"}
                <span className="text-white/25 ml-3">·</span>
              </span>
            </div>
          </div>
          <p className="text-[10px] text-ink-3 mt-3 font-mono uppercase tracking-[0.12em]">
            Visualização aproximada · TV usa fonte 13px mono · cor do
            border-top reflete o tipo selecionado
          </p>
        </div>
      </div>

      <div className="rounded-[14px] overflow-hidden border border-line bg-card">
        {isLoading ? (
          <div className="p-10 flex items-center justify-center">
            <CircleNotch size={24} className="text-eqi animate-spin" />
          </div>
        ) : (announcements ?? []).length === 0 ? (
          <div className="p-10 text-center text-sm text-ink-3">
            Nenhum aviso cadastrado. O ticker mostra só mensagens auto-geradas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-surface-2">
                  <th className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-ink-3 text-left px-3 py-2.5 w-24">
                    Tipo
                  </th>
                  <th className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-ink-3 text-left px-3 py-2.5">
                    Mensagem
                  </th>
                  <th className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-ink-3 text-left px-3 py-2.5 w-40">
                    Janela
                  </th>
                  <th className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-ink-3 text-left px-3 py-2.5">
                    Canais
                  </th>
                  <th className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-ink-3 text-left px-3 py-2.5 w-28">
                    Status
                  </th>
                  <th className="text-right px-3 py-2.5 w-24" />
                </tr>
              </thead>
              <tbody>
                {announcements!.map((a) => {
                  const expired = a.expiresAt && new Date(a.expiresAt) < new Date();
                  // Tipo/canais ainda não persistidos no backend — display
                  // como "INFO" + "TV/Banner" como default. Quando backend
                  // expandir o schema (Announcement.type + .channels),
                  // estes campos viram dinâmicos.
                  const status = !a.active
                    ? { label: "INATIVO", color: "text-ink-3", bg: "bg-surface-2", border: "border-line" }
                    : expired
                    ? { label: "EXPIRADO", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30" }
                    : new Date(a.createdAt) > new Date()
                    ? { label: "AGENDADO", color: "text-[hsl(var(--warning))]", bg: "bg-[hsl(var(--warning)/0.1)]", border: "border-[hsl(var(--warning)/0.3)]" }
                    : { label: "ATIVO", color: "text-[hsl(var(--success))]", bg: "bg-[hsl(var(--success)/0.1)]", border: "border-[hsl(var(--success)/0.3)]" };
                  return (
                    <tr
                      key={a.id}
                      className={`border-t border-line transition-colors hover:bg-surface-2/60 ${
                        !a.active || expired ? "opacity-60" : ""
                      }`}
                    >
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-line bg-surface text-[10px] font-mono font-bold uppercase tracking-[0.08em] text-ink-2">
                          INFO
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="text-ink truncate max-w-[420px]" title={a.message}>
                          {a.message}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 text-[11px] num font-mono text-ink-3">
                        {format(new Date(a.createdAt), "dd/MM HH:mm")}
                        {a.expiresAt && (
                          <>
                            <br />
                            → {format(new Date(a.expiresAt), "dd/MM HH:mm")}
                          </>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1 flex-wrap">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded border border-line bg-surface text-[10px] font-mono font-semibold uppercase tracking-[0.08em] text-ink-3">
                            TV
                          </span>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded border border-line bg-surface text-[10px] font-mono font-semibold uppercase tracking-[0.08em] text-ink-3">
                            Banner
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold uppercase tracking-[0.08em] ${status.color} ${status.bg} ${status.border}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleToggleActive(a)}
                            className="w-7 h-7 rounded-md text-ink-3 hover:text-eqi hover:bg-eqi/10 flex items-center justify-center transition-all"
                            title={a.active ? "Desativar" : "Ativar"}
                          >
                            {a.active ? <Eye size={13} /> : <EyeSlash size={13} />}
                          </button>
                          <button
                            onClick={() => setDialog({ open: true, editing: a })}
                            className="w-7 h-7 rounded-md text-ink-3 hover:text-eqi hover:bg-eqi/10 flex items-center justify-center transition-all"
                            title="Editar"
                          >
                            <PencilSimple size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(a)}
                            className="w-7 h-7 rounded-md text-ink-3 hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-all"
                            title="Remover"
                          >
                            <Trash size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnnouncementDialog
        state={dialog}
        onClose={() => setDialog({ open: false, editing: null })}
        onSave={async (input) => {
          try {
            if (dialog.editing) {
              await updateMut.mutateAsync({ id: dialog.editing.id, input });
              toast.success("Aviso atualizado");
            } else {
              await createMut.mutateAsync(input);
              toast.success("Aviso criado");
            }
            setDialog({ open: false, editing: null });
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erro ao salvar");
          }
        }}
        saving={createMut.isPending || updateMut.isPending}
      />
    </div>
  );
};

interface AnnouncementDialogProps {
  state: DialogState;
  onClose: () => void;
  onSave: (input: {
    message: string;
    active: boolean;
    expiresAt?: string | null;
    sortOrder: number;
  }) => void;
  saving: boolean;
}

function AnnouncementDialog({ state, onClose, onSave, saving }: AnnouncementDialogProps) {
  const editing = state.editing;
  const [message, setMessage] = useState(editing?.message ?? "");
  const [active, setActive] = useState(editing?.active ?? true);
  const [hasExpiration, setHasExpiration] = useState(Boolean(editing?.expiresAt));
  const [expiresAt, setExpiresAt] = useState(
    editing?.expiresAt ? editing.expiresAt.slice(0, 16) : "",
  );
  const [sortOrder, setSortOrder] = useState(editing?.sortOrder ?? 0);

  // Reset on dialog open with new editing state
  const reset = () => {
    setMessage(editing?.message ?? "");
    setActive(editing?.active ?? true);
    setHasExpiration(Boolean(editing?.expiresAt));
    setExpiresAt(editing?.expiresAt ? editing.expiresAt.slice(0, 16) : "");
    setSortOrder(editing?.sortOrder ?? 0);
  };

  return (
    <Dialog
      open={state.open}
      onOpenChange={(v) => {
        if (!v) {
          onClose();
          reset();
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar aviso" : "Novo aviso"}</DialogTitle>
          <DialogDescription>
            Texto curto que rola no ticker.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 space-y-3">
          <div>
            <Label className="text-xs">Mensagem</Label>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              placeholder="Ex: Reunião amanhã 9h sobre fechamento de mês"
              className="mt-1"
              autoFocus
            />
            <p className="text-[10px] text-ink-3 mt-1">{message.length}/500</p>
          </div>
          <div>
            <Label className="text-xs">Ordem (menor = primeiro)</Label>
            <Input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="mt-1 font-mono"
            />
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-line/30">
            <Checkbox
              id="active"
              checked={active}
              onCheckedChange={(v) => setActive(v === true)}
            />
            <Label htmlFor="active" className="text-xs font-medium cursor-pointer">
              Ativo (aparece no ticker)
            </Label>
          </div>
          <div className="flex items-start gap-2">
            <Checkbox
              id="hasExpiration"
              checked={hasExpiration}
              onCheckedChange={(v) => setHasExpiration(v === true)}
              className="mt-0.5"
            />
            <div className="flex-1">
              <Label htmlFor="hasExpiration" className="text-xs font-medium cursor-pointer">
                Expirar automaticamente
              </Label>
              {hasExpiration && (
                <Input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="mt-1.5 font-mono"
                />
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={() =>
              onSave({
                message: message.trim(),
                active,
                expiresAt:
                  hasExpiration && expiresAt
                    ? new Date(expiresAt).toISOString()
                    : null,
                sortOrder,
              })
            }
            disabled={saving || !message.trim()}
          >
            {saving && <CircleNotch size={16} className="animate-spin mr-2" />}
            {editing ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AdminAnnouncements;
