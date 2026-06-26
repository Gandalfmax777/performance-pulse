import { CircleNotch, WifiSlash, Tray, ArrowClockwise } from "@phosphor-icons/react";

/**
 * Estados de query reutilizáveis (loading / erro / vazio) pras páginas
 * autenticadas. Evita que falha de rede vire tela em branco silenciosa —
 * o usuário vê o que houve e pode tentar de novo.
 */

export function LoadingState({ label = "Carregando…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-ink-3">
      <CircleNotch size={28} className="animate-spin text-primary mb-3" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ErrorState({
  message = "Não foi possível carregar os dados.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <WifiSlash size={32} weight="bold" className="text-destructive mb-3" />
      <h2 className="text-base font-bold text-ink mb-1">Erro ao carregar</h2>
      <p className="text-sm text-ink-3 mb-4 max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
        >
          <ArrowClockwise size={16} weight="bold" />
          Tentar de novo
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  message = "Nada por aqui ainda.",
}: {
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6 text-ink-3">
      <Tray size={32} className="mb-3 opacity-50" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
