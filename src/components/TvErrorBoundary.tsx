import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Intervalo (ms) pra auto-resetar e tentar renderizar de novo. */
  resetAfterMs?: number;
}

interface State {
  hasError: boolean;
}

/**
 * Error Boundary dedicado ao Modo TV (`/tv`).
 *
 * A TV roda sozinha numa tela de mesa — NÃO pode ficar em branco se um slide
 * estourar (ex.: dado inesperado do backend). Em vez do reload da página
 * inteira (o boundary global), mostra uma tela escura "Reconectando…" e
 * AUTO-RESETA periodicamente: como os dados vêm do Tanstack Query (que segue
 * refazendo fetch), quando o backend volta o próximo render passa e a TV se
 * recupera sozinha, sem intervenção humana.
 */
export class TvErrorBoundary extends Component<Props, State> {
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[TvErrorBoundary]", error, info.componentStack);
    // Tenta renderizar de novo depois de um intervalo — recupera sozinho
    // quando a causa (ex.: backend fora) some.
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.setState({ hasError: false });
    }, this.props.resetAfterMs ?? 5000);
  }

  componentWillUnmount() {
    if (this.timer) clearTimeout(this.timer);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="mx-auto mb-6 h-10 w-10 rounded-full border-2 border-foreground/20 border-t-primary animate-spin" />
            <p className="num text-[12px] uppercase tracking-[0.22em] text-primary mb-2">
              Reconectando
            </p>
            <p className="text-foreground/60 text-sm">
              Restabelecendo a conexão com o servidor…
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
