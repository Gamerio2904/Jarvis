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

/** Schutzgitter für einzelne Fenster: Crasht nur dieses Panel, bleibt der Rest
 * der App nutzbar. Der Reset-Knopf wirft das Fenster neu auf statt die App. */
export class PanelBoundary extends Component<Props & { label: string }, State> {
  state: State = { err: null }

  static getDerivedStateFromError(err: Error): State {
    return { err }
  }

  componentDidCatch(err: Error, info: ErrorInfo): void {
    console.error(`[jarvis] Panel-Crash (${this.props.label})`, err, info.componentStack)
  }

  render() {
    if (!this.state.err) return this.props.children
    return (
      <div className="watch-overlay fx-in" role="alert">
        <header className="watch-head">
          <div>
            <h2>{this.props.label}</h2>
            <p>Hier ist etwas schiefgegangen — der Rest der App läuft weiter.</p>
          </div>
        </header>
        <p className="settings-hint">{this.state.err.message}</p>
        <button
          type="button"
          className="retry-btn"
          onClick={() => this.setState({ err: null })}
        >
          Fenster neu aufbauen
        </button>
      </div>
    )
  }
}
