import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
}

/** Catches render errors so the app degrades gracefully (e.g. WebGL issues). */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('MineGlobe error boundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-3 bg-[#0a0f1c] p-8 text-center text-[#e8edf5]">
          <h1 className="text-lg font-semibold text-[#d4af37]">Something went wrong</h1>
          <p className="max-w-md text-sm text-[#8b9bb4]">
            {this.state.message ?? 'An unexpected error occurred.'} Try reloading. If the globe fails
            to initialize, ensure WebGL is enabled in your browser.
          </p>
          <button
            type="button"
            className="rounded-lg bg-[#d4af37] px-4 py-2 text-sm font-semibold text-[#0a0f1c]"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
