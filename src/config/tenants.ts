/**
 * Configuração de fallback dos tenants conhecidos no frontend.
 *
 * Multi-tenant introduzido em 2026-05-10. Após login, `useCurrentUser()`
 * busca `/auth/me` que retorna `{ tenant: { slug, brandConfig, ... } }`. O
 * `tenantConfig` final é o merge de TENANT_FALLBACKS[slug] + tenant.brandConfig
 * — assim a UI nunca quebra se o admin esquecer campos no painel /admin/tenants.
 *
 * Pra adicionar novo tenant: criar bloco `[data-tenant="<slug>"]` em index.css,
 * adicionar entry em TENANT_FALLBACKS, criar tenant via UI ou script.
 */

export type TenantSlug = "eqi" | "bdn";

export interface TenantConfig {
  slug: TenantSlug;
  name: string;
  fullName: string;
  loginEyebrow: string;
  sidebarEyebrow: string;
  primaryColor: string;
  displayFont: string;
  logoUrl?: string;
  gradientFrom: string;
  gradientTo: string;
}

export const TENANT_FALLBACKS: Record<TenantSlug, TenantConfig> = {
  eqi: {
    slug: "eqi",
    name: "EQI Investimentos",
    fullName: "EQI · Mesa de Performance",
    loginEyebrow: "EQI · Mesa de Performance",
    sidebarEyebrow: "EQI · MESA",
    primaryColor: "#1f7a4d",
    displayFont: "Archivo",
    gradientFrom: "var(--eqi-forest)",
    gradientTo: "var(--eqi-mint)",
  },
  bdn: {
    slug: "bdn",
    name: "BDN Tech",
    fullName: "BDN · Mesa de Performance",
    loginEyebrow: "BDN · Mesa de Performance",
    sidebarEyebrow: "BDN · MESA",
    primaryColor: "#1bccf6",
    displayFont: "Archivo",
    gradientFrom: "#002c4f",
    gradientTo: "#1bccf6",
  },
};

export function isTenantSlug(slug: string): slug is TenantSlug {
  return slug in TENANT_FALLBACKS;
}

export function resolveTenantConfig(
  slug: string | undefined,
  brandConfig?: Record<string, unknown>,
): TenantConfig {
  const safeSlug: TenantSlug = slug && isTenantSlug(slug) ? slug : "eqi";
  return {
    ...TENANT_FALLBACKS[safeSlug],
    ...(brandConfig ?? {}),
    slug: safeSlug,
  };
}
