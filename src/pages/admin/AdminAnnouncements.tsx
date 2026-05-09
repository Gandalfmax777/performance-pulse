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

  // Preview live: sample message digitada na composer (sample só pra não
  // ficar vazio no init). Quando o usuário abre o dialog, preview reflete
  // o que ele tá digitando lá.
  const [previewMsg, setPreviewMsg] = useState(
    "🏆 Liga das Ativações termina sexta — top 3 leva R$ 1.400 em prêmios.",
  );

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
          (alinha com design/Admin-Announcements.html) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-[var(--radius)] border border-line bg-card p-5 space-y-4">
          <div>
            <h3 className="text-[13px] font-bold text-ink mb-1">
              Compor aviso
            </h3>
            <p className="text-[11px] text-ink-3">
              Digite a mensagem e veja como vai ficar no ticker da TV ao lado.
              Pra publicar, clique em "Novo Aviso" no topo.
            </p>
          </div>
          <div>
            <Label className="text-xs">Mensagem</Label>
            <textarea
              value={previewMsg}
              onChange={(e) => setPreviewMsg(e.target.value)}
              rows={4}
              className="mt-1.5 w-full text-[13px] rounded-[8px] border border-line bg-card px-3 py-2 focus:outline-none focus:border-primary/50"
              placeholder="🏆 Liga das Ativações termina sexta — top 3 leva R$ 1.400…"
            />
            <p className="text-[10px] text-ink-3 mt-1.5">
              {previewMsg.length} caracteres · use emojis pra dar peso visual
              (🏆 📞 🔥 ⚡ 💰)
            </p>
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
            className="flex-1 flex items-center overflow-hidden border border-white/10 min-h-[80px]"
            style={{ background: "hsl(var(--ink))" }}
          >
            <div className="flex items-center whitespace-nowrap animate-marquee text-white px-6">
              <span className="inline-flex items-center gap-2.5 text-[13px] font-mono font-semibold tracking-[0.04em]">
                {previewMsg || "Sua mensagem aparece aqui…"}
                <span className="text-white/25 ml-3">·</span>
              </span>
            </div>
          </div>
          <p className="text-[10px] text-ink-3 mt-3 font-mono uppercase tracking-[0.12em]">
            Visualização aproximada · TV usa fonte 13px mono
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
          <div className="divide-y divide-border/20">
            {announcements!.map((a) => {
              const expired = a.expiresAt && new Date(a.expiresAt) < new Date();
              return (
                <div key={a.id} className="p-4 flex items-start gap-3">
                  <button
                    onClick={() => handleToggleActive(a)}
                    className="mt-0.5 text-ink-3 hover:text-eqi transition-all"
                    title={a.active ? "Desativar" : "Ativar"}
                  >
                    {a.active ? <Eye size={16} /> : <EyeSlash size={16} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className={`text-sm ${a.active && !expired ? "text-ink" : "text-ink-3 line-through"}`}>
                        {a.message}
                      </p>
                      {!a.active && <Badge variant="outline" className="text-[9px]">INATIVO</Badge>}
                      {expired && <Badge variant="destructive" className="text-[9px]">EXPIRADO</Badge>}
                    </div>
                    <p className="text-[10px] text-ink-3">
                      por {a.createdByName} em{" "}
                      {format(new Date(a.createdAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      {a.expiresAt && (
                        <>
                          {" • expira "}
                          {format(new Date(a.expiresAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
                        </>
                      )}
                      {a.sortOrder !== 0 && <> • ordem {a.sortOrder}</>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setDialog({ open: true, editing: a })}
                      className="w-8 h-8 rounded-md text-ink-3 hover:text-eqi hover:bg-eqi/10 flex items-center justify-center transition-all"
                      title="Editar"
                    >
                      <PencilSimple size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(a)}
                      className="w-8 h-8 rounded-md text-ink-3 hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-all"
                      title="Remover"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
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
