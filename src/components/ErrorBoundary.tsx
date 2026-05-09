import { Component, type ErrorInfo, type ReactNode } from "react";
import { Warning, ArrowClockwise } from "@phosphor-icons/react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-8">
          <div className="card-glass rounded-2xl p-8 max-w-md w-full text-center border border-destructive/30">
            <Warning size={48} weight="bold" className="text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-2">Algo deu errado</h1>
            <p className="text-sm text-muted-foreground mb-4">
              {this.state.error?.message ?? "Erro inesperado na aplicação."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              <ArrowClockwise size={16} weight="bold" />
              Recarregar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
