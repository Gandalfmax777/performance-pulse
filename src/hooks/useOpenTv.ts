/**
 * Hook que abre o /tv em nova aba com o slug do tenant ativo na URL.
 *
 * /tv é rota PÚBLICA (sem JWT) e desde 2026-05-10 exige `?tenant=<slug>`
 * explícito — sem isso renderiza tela 404. Esse hook lê o slug ativo via
 * `useCurrentUser()` (user já está logado quando clica em "Modo TV"), e
 * retorna o callback pronto pra plugar em qualquer `onClick`.
 *
 * Substitui o `const openTv = () => window.open("/tv", ...)` que estava
 * duplicado em 9 pages do dashboard.
 */
import { useCallback } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export function useOpenTv(): () => void {
  const { tenantSlug } = useCurrentUser();

  return useCallback(() => {
    const url = tenantSlug ? `/tv?tenant=${tenantSlug}` : "/tv";
    window.open(url, "_blank", "noopener,noreferrer");
  }, [tenantSlug]);
}
