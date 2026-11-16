import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Film, RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SJ Cinemas Simulator Caught Error:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('sjcinemas_custom_trailers');
      localStorage.removeItem('sjcinemas_active_trailer_id');
      localStorage.removeItem('sjcinemas_custom_video_url');
      localStorage.removeItem('sjcinemas_custom_video_name');
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#070913] text-white">
          <div className="max-w-md w-full bg-[#0d1020] border border-red-500/40 rounded-3xl p-6 shadow-2xl text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-red-600/20 border border-red-500/50 flex items-center justify-center text-red-400 mb-4 shadow-lg shadow-red-950/50">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h2 className="text-xl font-black text-white mb-1">
              SJ CINEMAS <span className="text-red-500">NAGARI</span>
            </h2>
            <p className="text-xs text-white/60 mb-4">
              Simulator encountered an unexpected rendering issue.
            </p>

            <div className="w-full p-3 rounded-xl bg-black/50 border border-white/10 text-left font-mono text-[11px] text-red-300 mb-5 break-all max-h-32 overflow-y-auto">
              {this.state.error?.message || 'Unknown render exception'}
            </div>

            <button
              onClick={this.handleReset}
              className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 font-bold text-sm text-white shadow-lg shadow-red-950/60 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Cache & Reload Simulator</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

