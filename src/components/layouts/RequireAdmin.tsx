import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

/**
 * Guard que restringe o acesso a rotas admin. Assume que RequireAuth já
 * confirmou a existência do token — aqui só valida a role.
 *
 * Enquanto `useCurrentUser` está carregando, mostra um loader pra evitar
 * "flash" de redirect antes da role chegar.
 */
export function RequireAdmin({ children }: { children: ReactElement }) {
  const { isLoading, isAdmin } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
