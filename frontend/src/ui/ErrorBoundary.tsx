import { Component, type ErrorInfo, type ReactNode } from 'react'
import { APP_VERSION } from '../engine/store.ts'

type Props = { children: ReactNode }
type State = { err: Error | null }

/** Fängt Render-Fehler ab — sonst bleibt die WebView schwarz. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { err: null }

  static getDerivedStateFromError(err: Error): State {
    return { err }
  }

  componentDidCatch(err: Error, info: ErrorInfo): void {
    console.error('[jarvis] UI crash', err, info.componentStack)
  }

  render() {
    if (!this.state.err) return this.props.children
    return (
      <div className="boot-fallback" role="alert">
        <h1>Ultron</h1>
        <p>Die Oberfläche ist abgestürzt ({APP_VERSION}).</p>
        <p className="boot-fallback-detail">{this.state.err.message}</p>
        <button
          type="button"
          className="retry-btn"
          onClick={() => {
            this.setState({ err: null })
            window.location.reload()
          }}
        >
          Neu laden
        </button>
      </div>
    )
  }
}
