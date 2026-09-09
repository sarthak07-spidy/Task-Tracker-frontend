import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 rounded-2xl bg-red-500/15 p-4 text-red-400">
            <AlertTriangle className="size-8" />
          </div>
          <h2 className="font-display text-xl font-bold text-paper">
            Something went wrong
          </h2>
          <p className="mt-2 max-w-md text-sm text-paper-muted">
            {this.state.error?.message ?? 'An unexpected error occurred while loading this view.'}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="mt-6 flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-paper shadow-lg shadow-brand/25 transition-all hover:scale-105 active:scale-95"
          >
            <RefreshCw className="size-4" />
            Reload Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
