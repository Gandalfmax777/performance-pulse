/**
 * Dropdown de troca de mesa (tenant). Aparece só pra users com >1 membership.
 *
 * Multi-tenant per-user introduzido em 2026-05-10. JWT carrega o tenant ATIVO
 * — trocar dispara POST /auth/switch-tenant que retorna novo token e dados
 * frescos. Tanstack Query invalida queries pra refetch tenant-scoped.
 */
import { useState } from "react";
import { Buildings, Check, CaretDown, CircleNotch, ShieldStar } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useCurrentUser, useSwitchTenant } from "@/hooks/useCurrentUser";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function TenantSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const { tenant, tenantConfig, memberships, hasMultipleMemberships } =
    useCurrentUser();
  const switchTenant = useSwitchTenant();
  const [open, setOpen] = useState(false);

  if (!tenant || !hasMultipleMemberships) {
    return null;
  }

  async function handleSwitch(tenantId: string) {
    if (tenantId === tenant?.id) {
      setOpen(false);
      return;
    }
    try {
      await switchTenant.mutateAsync(tenantId);
      const target = memberships.find((m) => m.tenantId === tenantId);
      toast.success(`Mesa: ${target?.tenantName ?? tenantId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao trocar mesa");
    } finally {
      setOpen(false);
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-surface-2 transition w-full",
            collapsed && "justify-center",
          )}
          title={`Mesa atual: ${tenant.fullName}`}
        >
          {tenantConfig.logoUrl ? (
            <div className="w-4 h-4 shrink-0 rounded overflow-hidden">
              <img
                src={tenantConfig.logoUrl}
                alt={tenant.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : tenant.isAdminOrg ? (
            <ShieldStar size={16} weight="bold" className="text-primary shrink-0" />
          ) : (
            <Buildings size={16} weight="bold" className="text-ink-2 shrink-0" />
          )}
          {!collapsed && (
            <>
              <span className="truncate text-left flex-1 text-ink-2 font-medium">
                {tenant.name}
              </span>
              {switchTenant.isPending ? (
                <CircleNotch size={12} className="animate-spin shrink-0" />
              ) : (
                <CaretDown size={12} weight="bold" className="text-ink-3 shrink-0" />
              )}
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[220px]">
        <DropdownMenuLabel className="text-xs uppercase tracking-wider text-ink-3">
          Trocar de mesa
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {memberships.map((m) => {
          const isActive = m.tenantId === tenant.id;
          return (
            <DropdownMenuItem
              key={m.tenantId}
              onSelect={(e) => {
                e.preventDefault();
                handleSwitch(m.tenantId);
              }}
              className="flex items-center gap-2"
            >
              {m.isAdminOrg ? (
                <ShieldStar size={14} weight="bold" className="text-primary shrink-0" />
              ) : (
                <Buildings size={14} weight="bold" className="text-ink-3 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{m.tenantName}</div>
                <div className="text-xs text-ink-3 truncate">
                  /{m.tenantSlug} · {m.role === "ADMIN" ? "Admin" : "Gestor"}
                  {m.isAdminOrg && " · org admin"}
                </div>
              </div>
              {isActive && <Check size={14} weight="bold" className="text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
