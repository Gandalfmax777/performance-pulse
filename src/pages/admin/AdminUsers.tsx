import { useState } from "react";
import { toast } from "sonner";
import { CircleNotch, Users, Plus, PencilSimple, Trash } from "@phosphor-icons/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, type ApiUser } from "@/hooks/useUsers";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const AdminUsers = () => {
  const { data: users, isLoading } = useUsers();
  const { user: currentUser } = useCurrentUser();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<ApiUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiUser | null>(null);

  // Create form
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPassword, setCPassword] = useState("");
  const [cRole, setCRole] = useState<"ADMIN" | "MANAGER">("ADMIN");

  // Edit form
  const [eName, setEName] = useState("");
  const [eEmail, setEEmail] = useState("");
  const [ePassword, setEPassword] = useState("");
  const [eRole, setERole] = useState<"ADMIN" | "MANAGER">("ADMIN");

  function openCreate() {
    setCName(""); setCEmail(""); setCPassword(""); setCRole("ADMIN");
    setCreateOpen(true);
  }

  function openEdit(u: ApiUser) {
    setEName(u.name); setEEmail(u.email); setEPassword(""); setERole(u.role);
    setEditUser(u);
  }

  async function handleCreate() {
    try {
      await createUser.mutateAsync({ name: cName.trim(), email: cEmail.trim(), password: cPassword, role: cRole });
      toast.success("Usuário criado");
      setCreateOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar");
    }
  }

  async function handleEdit() {
    if (!editUser) return;
    const input: Record<string, string> = {};
    if (eName.trim() !== editUser.name) input.name = eName.trim();
    if (eEmail.trim() !== editUser.email) input.email = eEmail.trim();
    if (ePassword) input.password = ePassword;
    if (eRole !== editUser.role) input.role = eRole;
    if (Object.keys(input).length === 0) { setEditUser(null); return; }
    try {
      await updateUser.mutateAsync({ id: editUser.id, input });
      toast.success("Usuário atualizado");
      setEditUser(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteUser.mutateAsync(deleteTarget.id);
      toast.success("Usuário removido");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-ink-3 mb-1">
            ADMINISTRAÇÃO
          </p>
          <h1 className="text-[22px] font-extrabold tracking-tight text-ink leading-none flex items-center gap-2">
            <Users size={20} weight="bold" className="text-eqi" />
            Usuários
          </h1>
          <p className="text-[12px] text-ink-3 mt-1.5">
            Gerencie os gestores que têm acesso ao sistema.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-1.5 bg-ink hover:bg-ink/90 text-white">
          <Plus size={14} weight="bold" /> Novo usuário
        </Button>
      </div>

      <div className="rounded-[14px] overflow-hidden border border-line bg-card">
        {isLoading ? (
          <div className="p-10 flex items-center justify-center">
            <CircleNotch size={24} className="text-eqi animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-line/30 hover:bg-transparent">
                <TableHead className="text-xs">Nome</TableHead>
                <TableHead className="text-xs">E-mail</TableHead>
                <TableHead className="text-xs">Role</TableHead>
                <TableHead className="text-xs">Desde</TableHead>
                <TableHead className="text-xs text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(users ?? []).map((u) => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <TableRow key={u.id} className="border-line/20">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-eqi/20 flex items-center justify-center text-xs font-bold text-eqi">
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-ink">
                          {u.name}
                          {isSelf && <span className="text-[10px] text-ink-3 ml-1.5">(você)</span>}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-ink-3">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === "ADMIN" ? "default" : "secondary"} className="text-[10px]">
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-ink-3">
                      {format(new Date(u.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(u)} title="Editar">
                          <PencilSimple size={14} />
                        </Button>
                        {isSelf ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button size="sm" variant="ghost" disabled className="text-destructive opacity-30">
                                  <Trash size={14} />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Você não pode deletar a si mesmo</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteTarget(u)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash size={14} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={(v) => !v && setCreateOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">Nome</Label>
              <Input value={cName} onChange={(e) => setCName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">E-mail</Label>
              <Input type="email" value={cEmail} onChange={(e) => setCEmail(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Senha (mínimo 8 caracteres)</Label>
              <Input type="password" value={cPassword} onChange={(e) => setCPassword(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Role</Label>
              <Select value={cRole} onValueChange={(v) => setCRole(v as "ADMIN" | "MANAGER")}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!cName.trim() || !cEmail.trim() || cPassword.length < 8 || createUser.isPending}>
              {createUser.isPending && <CircleNotch size={16} className="animate-spin mr-2" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={(v) => !v && setEditUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar — {editUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">Nome</Label>
              <Input value={eName} onChange={(e) => setEName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">E-mail</Label>
              <Input type="email" value={eEmail} onChange={(e) => setEEmail(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Nova senha (deixe vazio pra não mudar)</Label>
              <Input type="password" value={ePassword} onChange={(e) => setEPassword(e.target.value)} placeholder="••••••••" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Role</Label>
              <Select value={eRole} onValueChange={(v) => setERole(v as "ADMIN" | "MANAGER")}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancelar</Button>
            <Button onClick={handleEdit} disabled={updateUser.isPending}>
              {updateUser.isPending && <CircleNotch size={16} className="animate-spin mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete AlertDialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              O usuário perderá acesso ao sistema imediatamente. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsers;
