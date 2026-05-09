/**
 * Configuração estática do app.
 *
 * TENANT é fixo neste estágio do redesign — multi-tenant em runtime fica fora
 * do escopo até o backend expor o tenant do usuário (claim no /me ou no JWT).
 * Os tokens BDN preservados em src/index.css ficam inativos até esse momento.
 *
 * Para reativar BDN no futuro:
 *   1. Backend retorna `tenant` no /me
 *   2. Criar TenantProvider que aplica `data-tenant` no <html> via useEffect
 *   3. Trocar `TENANT` desta const por valor lido do user
 */
export const TENANT = "eqi" as const;

export type Tenant = typeof TENANT;
