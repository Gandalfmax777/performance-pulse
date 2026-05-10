import { useEffect } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

/**
 * Aplica `data-tenant={slug}` no <html> em runtime baseado no JWT do user logado.
 * O CSS escopado em `index.css` (`[data-tenant="bdn"]`, etc) ativa
 * automaticamente o tema do tenant.
 *
 * Multi-tenant introduzido em 2026-05-10. Antes era estático em index.html.
 */
export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { tenantConfig } = useCurrentUser();

  useEffect(() => {
    document.documentElement.setAttribute("data-tenant", tenantConfig.slug);
  }, [tenantConfig.slug]);

  return <>{children}</>;
}
