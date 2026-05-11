/**
 * Hook pra buscar info de branding de um tenant SEM auth.
 *
 * Usado em rotas pre-JWT (/tv pública) que precisam renderizar a marca
 * real (logo R2, cores) — o backend tem o endpoint `/api/public/tenants/:slug/brand`
 * que retorna só `{ slug, name, fullName, brandConfig, isAdminOrg }`.
 *
 * Comportamento:
 * - Sem slug ou slug vazio → query desabilitada
 * - 404 (tenant não existe/inativo) → cai pro stale data ou undefined
 * - Cache local Tanstack: 5min (alinhado com Cache-Control do backend)
 */
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

export interface PublicTenantBrand {
  slug: string;
  name: string;
  fullName: string;
  isAdminOrg: boolean;
  brandConfig: Record<string, unknown>;
}

export function usePublicTenantBrand(slug: string | null | undefined) {
  return useQuery({
    queryKey: ["publicTenantBrand", slug],
    queryFn: () =>
      apiFetch<PublicTenantBrand>(`/public/tenants/${slug}/brand`),
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000, // 5min — casa com Cache-Control do backend
    retry: false, // 404 é resposta válida; não fazer retry
  });
}
