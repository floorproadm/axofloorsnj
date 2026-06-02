import React from "react";

interface Props {
  children: React.ReactNode;
  /** Optional label to identify where the boundary lives in logs */
  scope?: string;
}

interface State {
  error: Error | null;
}

/**
 * Global ErrorBoundary — prevents blank white screens when a route/component
 * throws during render. Shows a recovery UI instead so the user always has a
 * way out (reload / go back / go to dashboard).
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error(`[ErrorBoundary${this.props.scope ? `:${this.props.scope}` : ""}]`, error, info);
  }

  private handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  private handleHome = () => {
    this.setState({ error: null });
    window.location.assign("/admin/dashboard");
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-dvh flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full rounded-lg border border-border bg-card p-6 shadow-soft">
          <h1 className="text-lg font-semibold text-foreground mb-2">
            Algo deu errado nesta tela
          </h1>
          <p className="text-sm text-muted-foreground mb-4">
            Encontramos um erro inesperado ao carregar esta página. Você pode tentar recarregar ou voltar para o dashboard.
          </p>
          {this.state.error?.message && (
            <pre className="text-[11px] text-muted-foreground bg-secondary/40 rounded p-2 mb-4 overflow-auto max-h-32">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex gap-2">
            <button
              onClick={this.handleReload}
              className="flex-1 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Recarregar
            </button>
            <button
              onClick={this.handleHome}
              className="flex-1 px-4 py-2 rounded-md border border-border bg-background text-foreground text-sm font-medium hover:bg-secondary transition-colors"
            >
              Ir ao Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
