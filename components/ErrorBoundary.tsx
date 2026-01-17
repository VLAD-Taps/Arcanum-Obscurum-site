import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 p-6 font-sans">
          <div className="bg-red-100 dark:bg-red-900/20 p-6 rounded-full mb-6 animate-pulse">
             <AlertTriangle className="w-16 h-16 text-red-600 dark:text-red-500" />
          </div>
          <h1 className="text-3xl font-black mb-3 text-center uppercase tracking-tight">Falha no Sistema Arcano</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700 font-mono text-xs shadow-sm">
            {this.state.error?.message || "Erro desconhecido na renderização do fluxo."}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold shadow-lg shadow-red-600/30 transition-all active:scale-95 uppercase tracking-wider"
          >
            <RefreshCw size={18} /> Reiniciar Protocolo
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;