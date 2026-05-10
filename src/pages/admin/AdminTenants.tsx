import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CircleNotch, Plus, PencilSimple, Image as ImageIcon, Buildings } from "@phosphor-icons/react";
import {
  useTenants,
  useCreateTenant,
  useUpdateTenant,
  useUploadTenantLogo,
  type Tenant,
} from "@/hooks/useTenants";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TenantFormState {
  name: string;
  fullName: string;
  primaryColor: string;
  displayFont: string;
  active: boolean;
}

const FONTS = ["Archivo", "Inter", "Manrope", "Geist"];

const AdminTenants = () => {
  const { isSuperAdmin, tenant: currentTenant } = useCurrentUser();
  const { data: tenants, isLoading } = useTenants();
  const createTenant = useCreateTenant();
  const updateTenant = useUpdateTenant();
  const uploadLogo = useUploadTenantLogo();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Tenant | null>(null);

  // Create form
  const [cSlug, setCSlug] = useState("");
  const [cName, setCName] = useState("");
  const [cFullName, setCFullName] = useState("");
  const [cPrimaryColor, setCPrimaryColor] = useState("#1f7a4d");
  const [cDisplayFont, setCDisplayFont] = useState("Archivo");
  const [cIsAdminOrg, setCIsAdminOrg] = useState(false);
  const [cAdminEmail, setCAdminEmail] = useState("");
  const [cAdminName, setCAdminName] = useState("");
  const [cAdminPassword, setCAdminPassword] = useState("");

  // Edit form
  const [edit, setEdit] = useState<TenantFormState>({
    name: "",
    fullName: "",
    primaryColor: "#1f7a4d",
    displayFont: "Archivo",
    active: true,
  });
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  function openCreate() {
    setCSlug("");
    setCName("");
    setCFullName("");
    setCPrimaryColor("#1f7a4d");
    setCDisplayFont("Archivo");
    setCIsAdminOrg(false);
    setCAdminEmail("");
    setCAdminName("");
    setCAdminPassword("");
    setCreateOpen(true);
  }

  function openEdit(t: Tenant) {
    const cfg = t.brandConfig;
    setEdit({
      name: t.name,
      fullName: t.fullName,
      primaryColor: typeof cfg.primaryColor === "string" ? cfg.primaryColor : "#1f7a4d",
      displayFont: typeof cfg.displayFont === "string" ? cfg.displayFont : "Archivo",
      active: t.active,
    });
    setEditTarget(t);
  }

  async function handleCreate() {
    try {
      await createTenant.mutateAsync({
        slug: cSlug.trim().toLowerCase(),
        name: cName.trim(),
        fullName: cFullName.trim(),
        brandConfig: {
          primaryColor: cPrimaryColor,
          displayFont: cDisplayFont,
        },
        isAdminOrg: cIsAdminOrg,
        adminEmail: cAdminEmail.trim(),
        adminName: cAdminName.trim(),
        adminPassword: cAdminPassword,
      });
      toast.success(`Tenant ${cSlug} criado`);
      setCreateOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar tenant");
    }
  }

  async function handleUpdate() {
    if (!editTarget) return;
    try {
      await updateTenant.mutateAsync({
        id: editTarget.id,
        name: edit.name,
        fullName: edit.fullName,
        brandConfig: {
          ...editTarget.brandConfig,
          primaryColor: edit.primaryColor,
          displayFont: edit.displayFont,
        },
        active: edit.active,
      });
      toast.success("Tenant atualizado");
      setEditTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    }
  }

  async function handleLogoUpload(file: File) {
    if (!editTarget) return;
    try {
      await uploadLogo.mutateAsync({ id: editTarget.id, file });
      toast.success("Logo atualizado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha no upload");
    }
  }

  // Re-fetch quando o currentTenant muda (ex: super admin troca tenant)
  useEffect(() => {
    if (editTarget && tenants) {
      const refreshed = tenants.find((t) => t.id === editTarget.id);
      if (refreshed) setEditTarget(refreshed);
    }
  }, [tenants, editTarget]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12 text-ink-3">
        <CircleNotch size={32} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-ink">Mesas (tenants)</h2>
          <p className="text-sm text-ink-3 mt-1">
            {isSuperAdmin
              ? "Como super admin de uma org admin, você gerencia todas as mesas da plataforma."
              : `Você gerencia a mesa ${currentTenant?.fullName ?? ""}.`}
          </p>
        </div>
        {isSuperAdmin && (
          <Button onClick={openCreate} className="gap-2">
            <Plus size={16} weight="bold" /> Nova mesa
          </Button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(tenants ?? []).map((t) => {
          const logoUrl =
            typeof t.brandConfig.logoUrl === "string" ? t.brandConfig.logoUrl : null;
          const primaryColor =
            typeof t.brandConfig.primaryColor === "string"
              ? t.brandConfig.primaryColor
              : "#1f7a4d";
          return (
            <article
              key={t.id}
              className="rounded-xl border border-line bg-card p-4 flex gap-4 items-start"
            >
              <div
                className="w-14 h-14 rounded-lg flex items-center justify-center shrink-0 overflow-hidden bg-surface-2"
                style={{ background: logoUrl ? undefined : primaryColor }}
              >
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={t.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Buildings size={24} weight="bold" className="text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-ink truncate">{t.name}</h3>
                  {t.isAdminOrg && (
                    <Badge className="bg-ink/10 text-ink hover:bg-ink/10">
                      Admin org
                    </Badge>
                  )}
                  {!t.active && (
                    <Badge className="bg-red-500/10 text-red-700 hover:bg-red-500/10">
                      Inativa
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-ink-3 mt-0.5 truncate">
                  /{t.slug} · {t.fullName}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEdit(t)}
                  className="mt-3 gap-1.5 -ml-2"
                >
                  <PencilSimple size={14} weight="bold" /> Editar
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova mesa</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Slug (lowercase, único)</Label>
              <Input value={cSlug} onChange={(e) => setCSlug(e.target.value)} placeholder="acme" />
            </div>
            <div>
              <Label>Nome curto</Label>
              <Input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="ACME Capital" />
            </div>
            <div>
              <Label>Nome completo</Label>
              <Input
                value={cFullName}
                onChange={(e) => setCFullName(e.target.value)}
                placeholder="ACME · Mesa de Performance"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Cor primária</Label>
                <Input
                  type="color"
                  value={cPrimaryColor}
                  onChange={(e) => setCPrimaryColor(e.target.value)}
                />
              </div>
              <div>
                <Label>Fonte de display</Label>
                <select
                  className="w-full rounded-md border border-line bg-card px-3 py-2 text-sm"
                  value={cDisplayFont}
                  onChange={(e) => setCDisplayFont(e.target.value)}
                >
                  {FONTS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border border-line p-3">
              <div>
                <Label>Org admin</Label>
                <p className="text-xs text-ink-3">Se marcado, esta mesa pode gerenciar todas as outras.</p>
              </div>
              <Switch checked={cIsAdminOrg} onCheckedChange={setCIsAdminOrg} />
            </div>

            <hr className="border-line" />
            <p className="text-xs text-ink-3">Admin inicial da nova mesa:</p>

            <div>
              <Label>Nome do admin</Label>
              <Input value={cAdminName} onChange={(e) => setCAdminName(e.target.value)} />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input
                type="email"
                value={cAdminEmail}
                onChange={(e) => setCAdminEmail(e.target.value)}
              />
            </div>
            <div>
              <Label>Senha (mín 8)</Label>
              <Input
                type="password"
                value={cAdminPassword}
                onChange={(e) => setCAdminPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={createTenant.isPending}>
              {createTenant.isPending && (
                <CircleNotch size={14} className="animate-spin mr-2" />
              )}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={Boolean(editTarget)} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar mesa · {editTarget?.slug}</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <div className="space-y-3">
              <div>
                <Label>Nome curto</Label>
                <Input
                  value={edit.name}
                  onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Nome completo</Label>
                <Input
                  value={edit.fullName}
                  onChange={(e) => setEdit({ ...edit, fullName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Cor primária</Label>
                  <Input
                    type="color"
                    value={edit.primaryColor}
                    onChange={(e) => setEdit({ ...edit, primaryColor: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Fonte</Label>
                  <select
                    className="w-full rounded-md border border-line bg-card px-3 py-2 text-sm"
                    value={edit.displayFont}
                    onChange={(e) => setEdit({ ...edit, displayFont: e.target.value })}
                  >
                    {FONTS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-3">
                  {typeof editTarget.brandConfig.logoUrl === "string" ? (
                    <img
                      src={editTarget.brandConfig.logoUrl}
                      alt="Logo"
                      className="w-14 h-14 rounded-md object-cover border border-line"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-md border border-line bg-surface-2 flex items-center justify-center text-ink-3">
                      <ImageIcon size={20} />
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadLogo.isPending}
                  >
                    {uploadLogo.isPending && (
                      <CircleNotch size={14} className="animate-spin mr-2" />
                    )}
                    Trocar logo
                  </Button>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleLogoUpload(f);
                    }}
                  />
                </div>
                <p className="text-xs text-ink-3">PNG, JPEG, WebP ou SVG · max 1MB</p>
              </div>

              {(isSuperAdmin && !editTarget.isAdminOrg) && (
                <div className="flex items-center justify-between rounded-md border border-line p-3">
                  <div>
                    <Label>Mesa ativa</Label>
                    <p className="text-xs text-ink-3">Desativar bloqueia logins e queries.</p>
                  </div>
                  <Switch
                    checked={edit.active}
                    onCheckedChange={(v) => setEdit({ ...edit, active: v })}
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditTarget(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={updateTenant.isPending}>
              {updateTenant.isPending && (
                <CircleNotch size={14} className="animate-spin mr-2" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTenants;
