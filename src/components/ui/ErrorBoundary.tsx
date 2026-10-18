import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 sm:p-12 text-center rounded-3xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-apple-card max-w-lg mx-auto my-8 animate-in fade-in duration-200">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-apple-gray-900 dark:text-white">
            {this.props.fallbackTitle || 'Произошла ошибка при отображении'}
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-apple-gray-500 dark:text-apple-gray-400">
            Ваши задания и данные сохранены. Попробуйте сбросить состояние или обновить страницу.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-2xl bg-black/5 dark:bg-white/10 text-xs font-semibold text-apple-gray-800 dark:text-apple-gray-200 hover:bg-black/10 dark:hover:bg-white/15 transition-all"
            >
              Попробовать снова
            </button>
            <button
              onClick={this.handleReload}
              className="px-4 py-2 rounded-2xl bg-apple-blue text-white text-xs font-semibold shadow-apple-sm hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Перезагрузить страницу</span>
            </button>
          </div>

          {this.state.error && (
            <details className="mt-4 text-left text-[11px] text-apple-gray-400 dark:text-apple-gray-500 bg-black/[0.02] dark:bg-white/[0.02] p-2 rounded-xl">
              <summary className="cursor-pointer font-mono">Подробности ошибки</summary>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono">
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
