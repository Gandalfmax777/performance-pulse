import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Megaphone, Plus, PencilSimple, Trash, Eye, EyeSlash } from "@phosphor-icons/react";
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

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-ink-3 mb-1">
            ADMINISTRAÇÃO
          </p>
          <h1 className="text-[22px] font-extrabold tracking-tight text-ink leading-none flex items-center gap-2">
            <Megaphone size={20} weight="bold" className="text-eqi" />
            Avisos
          </h1>
          <p className="text-[12px] text-ink-3 mt-1.5 max-w-2xl">
            Mensagens manuais que aparecem no ticker do topo da Visão Geral. Aparecem
            ANTES das mensagens auto-geradas (líder, streaks, etc).
          </p>
        </div>
        <Button onClick={() => setDialog({ open: true, editing: null })} className="gap-2 bg-ink hover:bg-ink/90 text-white">
          <Plus size={14} weight="bold" /> Novo Aviso
        </Button>
      </div>

      <div className="rounded-[14px] overflow-hidden border border-line bg-card">
        {isLoading ? (
          <div className="p-10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-eqi animate-spin" />
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
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {editing ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AdminAnnouncements;
