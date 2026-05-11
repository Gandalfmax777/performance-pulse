/**
 * Wrapper fetch pra chamadas do backend.
 *
 * Uso: `apiFetch("/health")` vai pra `${VITE_API_URL}/health`.
 *
 * Injeta Authorization: Bearer <token> automaticamente a partir do
 * localStorage e redireciona pra /login em 401.
 */

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

export const TOKEN_STORAGE_KEY = "pp_token";
/** Slug do último tenant logado. Persistido entre sessões pra adaptar o
 *  layout do /login ao último brand visto (estilo "last login" das apps
 *  modernas). NÃO é limpo no logout — propósito é exatamente sobreviver. */
export const LAST_TENANT_STORAGE_KEY = "pp_last_tenant";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAuthToken(token: string): void {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearAuthToken(): void {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function getLastTenant(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LAST_TENANT_STORAGE_KEY);
}

export function setLastTenant(slug: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAST_TENANT_STORAGE_KEY, slug);
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  searchParams?: Record<string, string | number | boolean | undefined>;
  /** Se true, não injeta Authorization nem redireciona em 401 (útil pro próprio login). */
  skipAuth?: boolean;
}

/**
 * TRUE quando a aplicação está rodando na rota pública /tv.
 *
 * A rota /tv é exibida na TV da mesa de vendas sem login. Nesse contexto,
 * não queremos anexar token (podia ter um legado no localStorage) nem
 * redirecionar pra /login em 401 — o usuário da TV é anônimo.
 *
 * Avaliado por chamada (não em module-load) pra funcionar com navegação
 * client-side. Window check guarda SSR.
 */
function isPublicTvRoute(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.pathname === "/tv" || window.location.pathname.startsWith("/tv/");
}

/**
 * Lê `?tenant=<slug>` da URL atual. Usado em /tv pra forwardar o slug
 * pras chamadas de API públicas — o backend `resolveTenantForPublicRoute`
 * sem JWT e sem query param cai em "eqi" fallback. Plataforma roda em
 * domínio único (BDN hospeda todos), então a URL é a fonte única de verdade.
 */
export function getTenantQueryParam(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("tenant");
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { body, searchParams, headers, skipAuth: explicitSkipAuth, ...rest } = options;
  // Em /tv, sempre bypass auth mesmo se o caller não passou skipAuth.
  const skipAuth = explicitSkipAuth || isPublicTvRoute();

  const url = new URL(path.replace(/^\//, ""), API_URL.endsWith("/") ? API_URL : API_URL + "/");
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined) url.searchParams.append(key, String(value));
    }
  }

  // No /tv (sem JWT), forwarda o slug da URL pro backend via ?tenant=. Sem
  // isso, `resolveTenantForPublicRoute` cai no fallback "eqi" e a TV mostra
  // dados do tenant errado mesmo que o brand local esteja correto.
  if (skipAuth && !url.searchParams.has("tenant")) {
    const tenantSlug = getTenantQueryParam();
    if (tenantSlug) {
      url.searchParams.set("tenant", tenantSlug);
    }
  }

  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(headers as Record<string, string> | undefined),
  };

  if (!skipAuth) {
    const token = getAuthToken();
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const init: RequestInit = {
    ...rest,
    headers: finalHeaders,
  };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  const response = await fetch(url.toString(), init);

  let parsed: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (response.status === 401 && !skipAuth) {
    clearAuthToken();
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      parsed,
      `API ${response.status} ${response.statusText}`,
    );
  }

  return parsed as T;
}

export const apiBaseUrl = API_URL;
