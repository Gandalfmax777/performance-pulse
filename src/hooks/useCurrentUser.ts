import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, getAuthToken, setAuthToken } from "@/api/client";
import { resolveTenantConfig, type TenantConfig, type TenantSlug } from "@/config/tenants";

export interface ApiTenant {
  id: string;
  slug: string;
  name: string;
  fullName: string;
  brandConfig: Record<string, unknown>;
  isAdminOrg: boolean;
  active: boolean;
}

export interface ApiMembership {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  tenantFullName: string;
  isAdminOrg: boolean;
  role: "ADMIN" | "MANAGER";
}

export interface ApiCurrentUser {
  user: {
    id: string;
    email: string;
    name: string;
    role: "ADMIN" | "MANAGER";
  };
  tenant: ApiTenant;
  memberships: ApiMembership[];
}

const QUERY_KEY = ["currentUser"] as const;

export function useCurrentUser() {
  const token = getAuthToken();
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => apiFetch<ApiCurrentUser>("/auth/me"),
    enabled: Boolean(token),
    staleTime: Infinity,
  });

  const user = query.data?.user;
  const tenant = query.data?.tenant;
  const memberships = query.data?.memberships ?? [];
  const tenantConfig: TenantConfig = resolveTenantConfig(
    tenant?.slug,
    tenant?.brandConfig,
  );

  return {
    user,
    tenant,
    tenantConfig,
    tenantSlug: tenantConfig.slug satisfies TenantSlug,
    memberships,
    isLoading: query.isLoading,
    isAdmin: user?.role === "ADMIN",
    /** Super admin = membro ADMIN de uma org admin (ex: BDN). */
    isSuperAdmin: user?.role === "ADMIN" && Boolean(tenant?.isAdminOrg),
    /** True se o user pertence a múltiplas mesas (mostra o switcher). */
    hasMultipleMemberships: memberships.length > 1,
  };
}

interface SwitchTenantResponse {
  token: string;
  user: ApiCurrentUser["user"];
  tenant: ApiTenant;
  memberships: ApiMembership[];
}

/**
 * Troca o tenant ativo. Recebe o tenantId alvo, persiste o novo token e
 * invalida queries pra refetch dos dados scoped no novo tenant.
 */
export function useSwitchTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tenantId: string) =>
      apiFetch<SwitchTenantResponse>("/auth/switch-tenant", {
        method: "POST",
        body: { tenantId },
      }),
    onSuccess: (data) => {
      setAuthToken(data.token);
      // Atualiza /auth/me imediatamente sem refetch
      qc.setQueryData(QUERY_KEY, {
        user: data.user,
        tenant: data.tenant,
        memberships: data.memberships,
      } satisfies ApiCurrentUser);
      // Invalida tudo que é tenant-scoped — refetch automático
      qc.invalidateQueries();
    },
  });
}
