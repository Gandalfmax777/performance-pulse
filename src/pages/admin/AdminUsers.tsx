import { useState } from "react";
import { toast } from "sonner";
import { Users, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
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
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Usuários
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie os gestores que têm acesso ao sistema.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="w-4 h-4" /> Novo usuário
        </Button>
      </div>

      <div className="card-glass rounded-xl overflow-hidden border border-border/30">
        {isLoading ? (
          <div className="p-10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/30 hover:bg-transparent">
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
                  <TableRow key={u.id} className="border-border/20">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-foreground">
                          {u.name}
                          {isSelf && <span className="text-[10px] text-muted-foreground ml-1.5">(você)</span>}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === "ADMIN" ? "default" : "secondary"} className="text-[10px]">
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {format(new Date(u.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(u)} title="Editar">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        {isSelf ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button size="sm" variant="ghost" disabled className="text-destructive opacity-30">
                                  <Trash2 className="w-3.5 h-3.5" />
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
                            <Trash2 className="w-3.5 h-3.5" />
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
              {createUser.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
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
              {updateUser.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
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
