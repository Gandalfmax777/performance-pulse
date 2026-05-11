/**
 * Registry central de tenants conhecidos no frontend.
 *
 * Multi-tenant introduzido em 2026-05-10. Após login, `useCurrentUser()`
 * busca `/auth/me` que retorna `{ tenant: { slug, brandConfig, ... } }`. O
 * `tenantConfig` final é o merge de TENANTS[slug] + tenant.brandConfig — assim
 * a UI nunca quebra se o admin esquecer campos no painel /admin/tenants.
 *
 * Este arquivo é a ÚNICA fonte de verdade pra metadados estáticos de tenant.
 * Inclui:
 *  - Brand visuals (cor primária, gradients, fontes) — overridable via backend
 *  - `tv`: tipografia tunada do Modo TV (peso/tracking do display Archivo)
 *  - `login`: brand do painel esquerdo da tela /login (pre-auth, "last login")
 *
 * Pra adicionar tenant novo (1 arquivo + CSS):
 *  1. Adicionar entry em TENANTS abaixo (slug type expande automático)
 *  2. Criar `[data-tenant="<slug>"]` em src/index.css (light) e
 *     `.dark[data-tenant="<slug>"]` (dark)
 *  3. Cadastrar tenant via /admin/tenants (backend) + upload de logo R2
 */

export type TenantSlug = "eqi" | "bdn";

/** Tipografia tunada por tenant pro Modo TV (slides editoriais). */
export interface TenantTvConfig {
  /** Label curto pra chrome header da TV ("EQI", "BDN"). */
  label: string;
  /** Nome completo pra eyebrow "Relatório semanal — <fullName>". */
  fullName: string;
  /** Peso da fonte Archivo pro display gigante (700–900). */
  displayWeight: number;
  /** Letter-spacing do display gigante (negativo aperta o título). */
  displayLetter: string;
}

/** Brand do painel esquerdo do /login (pre-auth, lê last-login slug). */
export interface TenantLoginBrand {
  /** Letra inicial mostrada quando não há logo cacheado. */
  initial: string;
  gradientFrom: string;
  gradientTo: string;
  accentBg: string;
  accentText: string;
  accentHighlight: string;
  accentBlob: string;
}

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
  tv: TenantTvConfig;
  login: TenantLoginBrand;
}

export const TENANTS: Record<TenantSlug, TenantConfig> = {
  eqi: {
    slug: "eqi",
    name: "EQI Investimentos",
    fullName: "EQI · Mesa de Performance",
    loginEyebrow: "EQI · Mesa de Performance",
    sidebarEyebrow: "EQI · MESA",
    primaryColor: "#1f7a4d",
    displayFont: "Archivo",
    gradientFrom: "var(--brand-deep)",
    gradientTo: "var(--brand-light)",
    tv: {
      label: "EQI",
      fullName: "EQI Investimentos",
      displayWeight: 700,
      displayLetter: "-0.035em",
    },
    login: {
      initial: "E",
      gradientFrom: "hsl(var(--brand-deep))",
      gradientTo: "hsl(220 27% 5%)",
      accentBg: "hsl(var(--brand-light))",
      accentText: "hsl(var(--brand-deep))",
      accentHighlight: "hsl(var(--brand-light))",
      accentBlob: "hsl(var(--brand-light) / 0.22)",
    },
  },
  bdn: {
    slug: "bdn",
    name: "BDN Tech",
    fullName: "BDN · Mesa de Performance",
    loginEyebrow: "BDN · Mesa de Performance",
    sidebarEyebrow: "BDN · MESA",
    primaryColor: "#1bccf6",
    displayFont: "Archivo",
    gradientFrom: "var(--brand-deep)",
    gradientTo: "var(--brand-light)",
    tv: {
      label: "BDN",
      fullName: "Build Develop Network",
      displayWeight: 800,
      displayLetter: "-0.04em",
    },
    login: {
      initial: "B",
      gradientFrom: "hsl(var(--brand-deep))",
      gradientTo: "hsl(207 100% 4%)",
      accentBg: "hsl(var(--brand-light))",
      accentText: "hsl(var(--brand-deep))",
      accentHighlight: "hsl(var(--brand-light))",
      accentBlob: "hsl(var(--brand-light) / 0.22)",
    },
  },
};

/**
 * Alias legado de TENANTS — mantido pra import existente em `Login.tsx`
 * e quaisquer consumidores externos. Em código novo, prefira `TENANTS`.
 *
 * @deprecated use `TENANTS` direto.
 */
export const TENANT_FALLBACKS = TENANTS;

export function isTenantSlug(slug: string): slug is TenantSlug {
  return slug in TENANTS;
}

/**
 * Tenant fallback quando nenhuma informação está disponível.
 *
 * BDN é a org admin da plataforma — qualquer cenário onde o slug não foi
 * informado (auth/me sem tenant, /login sem last login, etc.) cai aqui.
 * Mover pra "eqi" no passado mascarava bugs (TV BDN mostrando dados EQI).
 */
export const DEFAULT_TENANT_SLUG: TenantSlug = "bdn";

export function resolveTenantConfig(
  slug: string | undefined,
  brandConfig?: Record<string, unknown>,
): TenantConfig {
  const safeSlug: TenantSlug =
    slug && isTenantSlug(slug) ? slug : DEFAULT_TENANT_SLUG;
  return {
    ...TENANTS[safeSlug],
    ...(brandConfig ?? {}),
    slug: safeSlug,
  };
}
