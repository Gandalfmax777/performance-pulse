import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CircleNotch, Plus, PencilSimple, Trash, UserCheck } from "@phosphor-icons/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useUserLookup,
  type ApiUser,
} from "@/hooks/useUsers";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAssessors } from "@/hooks/useAssessors";
import { useSquads } from "@/hooks/useSquads";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";
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
  const { assessors } = useAssessors();
  const { data: squads = [] } = useSquads();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  // Lookup squad por assessorId pra mostrar coluna Squad na tabela de AAIs
  const squadByAssessor = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    for (const sq of squads) {
      for (const m of sq.members ?? []) {
        map.set(m.assessorId, { name: sq.name, color: sq.color });
      }
    }
    return map;
  }, [squads]);

  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<ApiUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiUser | null>(null);

  // Create form
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPassword, setCPassword] = useState("");
  const [cRole, setCRole] = useState<"ADMIN" | "MANAGER">("ADMIN");

  // Debounce do email pra evitar chamar lookup a cada keystroke
  const [debouncedEmail, setDebouncedEmail] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedEmail(cEmail.trim()), 350);
    return () => clearTimeout(t);
  }, [cEmail]);

  const lookup = useUserLookup(debouncedEmail, createOpen);
  const existingUser =
    lookup.data?.exists && lookup.data.user ? lookup.data.user : null;
  const alreadyInTenant = existingUser?.hasMembershipInCurrentTenant ?? false;

  // Quando detecta user existente, auto-preenche o nome se ainda vazio
  useEffect(() => {
    if (existingUser && !cName.trim()) {
      setCName(existingUser.name);
    }
  }, [existingUser, cName]);

  // Edit form
  const [eName, setEName] = useState("");
  const [eEmail, setEEmail] = useState("");
  const [ePassword, setEPassword] = useState("");
  const [eRole, setERole] = useState<"ADMIN" | "MANAGER">("ADMIN");

  function openCreate() {
    setCName(""); setCEmail(""); setCPassword(""); setCRole("ADMIN");
    setDebouncedEmail("");
    setCreateOpen(true);
  }

  function openEdit(u: ApiUser) {
    setEName(u.name); setEEmail(u.email); setEPassword(""); setERole(u.role);
    setEditUser(u);
  }

  async function handleCreate() {
    try {
      await createUser.mutateAsync({
        name: cName.trim(),
        email: cEmail.trim(),
        // Password só vai pro backend se for user novo
        password: existingUser ? undefined : cPassword,
        role: cRole,
      });
      toast.success(
        existingUser
          ? `${existingUser.name} agora tem acesso a essa mesa`
          : "Usuário criado",
      );
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

  const adminCount = (users ?? []).filter((u) => u.role === "ADMIN").length;
  const managerCount = (users ?? []).filter((u) => u.role === "MANAGER").length;

  return (
    <div className="space-y-5">
      {/* Page header (eyebrow + title + subtitle) vem do AdminLayout topbar. */}

      {/* 4 KPI cards (alinha com design/Admin-Users.html) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-[var(--radius)] border border-line bg-card p-5">
          <p className="text-[10px] uppercase tracking-[0.12em] font-mono font-semibold text-ink-3 mb-2">
            Usuários
          </p>
          <p className="font-display font-extrabold text-[24px] text-ink leading-none num">
            {users?.length ?? 0}
          </p>
          <p className="text-[11px] text-ink-3 mt-1.5">
            {adminCount} admin · {managerCount} manager
          </p>
        </div>
        <div className="rounded-[var(--radius)] border border-line bg-card p-5">
          <p className="text-[10px] uppercase tracking-[0.12em] font-mono font-semibold text-ink-3 mb-2">
            Assessores (AAIs)
          </p>
          <p className="font-display font-extrabold text-[24px] text-ink leading-none num">
            {assessors.length}
          </p>
          <p className="text-[11px] text-ink-3 mt-1.5">
            Não logam no sistema · perfil só pra ranking/KPIs
          </p>
        </div>
        <div className="rounded-[var(--radius)] border border-line bg-card p-5">
          <p className="text-[10px] uppercase tracking-[0.12em] font-mono font-semibold text-ink-3 mb-2">
            Squads ativos
          </p>
          <p className="font-display font-extrabold text-[24px] text-ink leading-none num">
            {squads.length}
          </p>
          <p className="text-[11px] text-ink-3 mt-1.5">
            Times competindo no Squad Bet
          </p>
        </div>
        <div className="rounded-[var(--radius)] border border-line bg-card p-5">
          <p className="text-[10px] uppercase tracking-[0.12em] font-mono font-semibold text-ink-3 mb-2">
            Tenant
          </p>
          <p className="text-[15px] font-bold text-ink leading-tight uppercase tracking-wide">
            EQI
          </p>
          <p className="text-[11px] text-ink-3 mt-1.5">
            Mesa de Performance · v3.2
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={openCreate} className="gap-1.5 bg-ink hover:bg-ink/90 text-white">
          <Plus size={14} weight="bold" /> Novo usuário
        </Button>
      </div>

      <div className="rounded-[14px] overflow-hidden border border-line bg-card">
        {isLoading ? (
          <div className="p-10 flex items-center justify-center">
            <CircleNotch size={24} className="text-primary animate-spin" />
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
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
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

      {/* Tabela de Assessores (AAIs) — read-only, complemento informativo
          (alinha com sugestão do Felipe: "tabela com os assessores tambem
          para ter uma noção"). AAIs não logam no sistema, mas é útil ver
          a lista + squad + level pra contexto. */}
      <div className="flex items-center gap-3 pt-4">
        <p className="text-[10px] uppercase tracking-[0.12em] font-mono font-semibold text-ink-3">
          Assessores (AAIs)
        </p>
        <div className="flex-1 h-px bg-line" />
        <span className="text-[11px] text-ink-3">
          {assessors.length}{" "}
          {assessors.length === 1 ? "assessor cadastrado" : "assessores cadastrados"}
          {" · "}
          gerenciar em /assessores
        </span>
      </div>
      <div className="rounded-[14px] overflow-hidden border border-line bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-line/30 hover:bg-transparent">
              <TableHead className="text-xs">Nome</TableHead>
              <TableHead className="text-xs">Squad</TableHead>
              <TableHead className="text-xs">Nível</TableHead>
              <TableHead className="text-xs text-right">Pontos · semana</TableHead>
              <TableHead className="text-xs text-right">Meta · semana</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assessors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-ink-3 py-6 text-xs">
                  Nenhum assessor cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              assessors.map((a) => {
                const sq = squadByAssessor.get(a.id);
                return (
                  <TableRow key={a.id} className="border-line/20">
                    <TableCell>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <AssessorAvatar
                          initials={a.avatar}
                          photoUrl={a.photoUrl}
                          level={a.level}
                          size={28}
                        />
                        <span className="font-medium text-ink truncate">
                          {a.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {sq ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-line bg-surface text-[10px] font-mono font-semibold uppercase tracking-[0.08em] text-ink-2">
                          <span
                            className="inline-block w-1.5 h-1.5 rounded-full mr-1.5"
                            style={{ background: sq.color }}
                          />
                          {sq.name}
                        </span>
                      ) : (
                        <span className="text-[11px] text-ink-4">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-mono uppercase border-line/40">
                        {a.level}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono font-bold text-sm text-ink">
                        {a.points.toLocaleString("pt-BR")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`font-mono font-bold text-sm ${
                          a.weeklyGoalPercent >= 100
                            ? "text-[hsl(var(--success))]"
                            : a.weeklyGoalPercent >= 80
                            ? "text-ink-2"
                            : "text-destructive"
                        }`}
                      >
                        {a.weeklyGoalPercent}%
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog — adapta UX se o email já tem conta no sistema */}
      <Dialog open={createOpen} onOpenChange={(v) => !v && setCreateOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {existingUser ? "Adicionar acesso a essa mesa" : "Novo usuário"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">E-mail</Label>
              <div className="relative mt-1">
                <Input
                  type="email"
                  value={cEmail}
                  onChange={(e) => setCEmail(e.target.value)}
                  autoFocus
                />
                {lookup.isFetching && (
                  <CircleNotch
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 animate-spin"
                  />
                )}
              </div>

              {/* Banner: user existente já tem membership na mesa atual */}
              {alreadyInTenant && (
                <div className="mt-2 rounded-md border border-[hsl(var(--warning)/0.40)] bg-[hsl(var(--warning)/0.15)] px-3 py-2 text-xs text-[hsl(var(--warning))]">
                  Esse usuário já tem acesso a essa mesa.
                </div>
              )}

              {/* Banner: user existente sem membership na mesa atual */}
              {existingUser && !alreadyInTenant && (
                <div className="mt-2 rounded-md border border-[hsl(var(--success)/0.40)] bg-[hsl(var(--success)/0.12)] px-3 py-2 text-xs text-[hsl(var(--success))] flex gap-2">
                  <UserCheck size={14} weight="bold" className="shrink-0 mt-0.5" />
                  <div>
                    <strong>{existingUser.name}</strong> já tem conta no sistema
                    {existingUser.otherMemberships.length > 0 && (
                      <>
                        {" "}(em{" "}
                        {existingUser.otherMemberships
                          .map((m) => m.tenantName)
                          .join(", ")}
                        )
                      </>
                    )}
                    . Vamos só adicionar acesso a essa mesa; a senha atual
                    dele continua valendo.
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs">Nome</Label>
              <Input
                value={cName}
                onChange={(e) => setCName(e.target.value)}
                className="mt-1"
                disabled={Boolean(existingUser)}
              />
            </div>

            {/* Senha só pra usuários novos */}
            {!existingUser && (
              <div>
                <Label className="text-xs">Senha (mínimo 8 caracteres)</Label>
                <Input
                  type="password"
                  value={cPassword}
                  onChange={(e) => setCPassword(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}

            <div>
              <Label className="text-xs">Role nessa mesa</Label>
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
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                !cName.trim() ||
                !cEmail.trim() ||
                alreadyInTenant ||
                (!existingUser && cPassword.length < 8) ||
                createUser.isPending ||
                lookup.isFetching
              }
            >
              {createUser.isPending && (
                <CircleNotch size={16} className="animate-spin mr-2" />
              )}
              {existingUser ? "Adicionar acesso" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={(v) => !v && setEditUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar: {editUser?.name}</DialogTitle>
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

      {/* Remove-from-tenant AlertDialog. Backend remove SÓ a membership
          desse user no tenant ativo — o User permanece no sistema porque
          pode ter memberships em outras mesas. Copy reflete isso. */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover "{deleteTarget?.name}" desta mesa?</AlertDialogTitle>
            <AlertDialogDescription>
              O usuário perderá acesso a esta mesa imediatamente. Se ele tiver acesso a outras
              mesas, continuará podendo logar nelas normalmente. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover da mesa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsers;
