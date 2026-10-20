import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Prompt Diary render error', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-shell">
          <div
            role="alert"
            className="state-card error-state mx-auto mt-10 max-w-2xl p-6 text-left"
          >
            <p className="eyebrow">Erreur inattendue</p>
            <h1 className="mt-2 text-xl font-semibold tracking-tight">
              Prompt Diary a rencontré un problème.
            </h1>
            <p className="mt-2 text-sm leading-6">
              Vos données locales sont intactes. Rechargez la page pour reprendre là où vous étiez.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="button-primary mt-4"
            >
              Recharger la page
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
