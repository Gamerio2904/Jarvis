import { TEST_COPY_GROUPS } from './engine/test-copy'
import { DEBUG_OFF_BY_DEFAULT, type DebugRunApi } from './engine/use-debug-run'

export type { DebugSendResult } from './engine/use-debug-run'

export function DebugPanel({ debug, busy }: { debug: DebugRunApi; busy: boolean }) {
  const n = debug.groupCount
  return (
    <section className="settings-card">
      <h3>Debug</h3>
      <p className="settings-lead">
        Kategorien wählen, Start öffnet ein neues Gespräch und schließt die Einstellungen. Overlays wie CarPlay dürfen
        aufgehen — der Debug-Chat bleibt als Fenster darüber sichtbar und der Lauf geht weiter. Download JSON + TXT mit
        Verdict. App offen lassen — Home kann den Lauf killen. Screen bleibt wach, solange der Lauf läuft. Kein zweiter
        Test-Dienst.
      </p>
      <div className="debug-box-bar">
        <button type="button" className="ghost-btn" disabled={debug.running} onClick={() => debug.setAll(true)}>
          Alle
        </button>
        <button type="button" className="ghost-btn" disabled={debug.running} onClick={() => debug.setAll(false)}>
          keine
        </button>
        <span className="settings-hint">
          {debug.picked.length}/{n} · {debug.items.length} Prompts
        </span>
      </div>
      <div className="debug-boxes">
        {TEST_COPY_GROUPS.map((g) => (
          <label key={g.title} className="debug-box-row">
            <input
              type="checkbox"
              checked={debug.picked.includes(g.title)}
              disabled={debug.running}
              onChange={() => debug.toggle(g.title)}
            />
            <span>
              {g.title}
              <small>
                {' '}
                {g.items.length}
                {DEBUG_OFF_BY_DEFAULT.has(g.title) ? ' · default aus' : ''}
              </small>
            </span>
          </label>
        ))}
      </div>
      <p className="settings-hint">
        Writes sind echt. Hausstand-Import nicht im Katalog. PC/TV default aus — ehrlicher Fehler zählt als skip.
      </p>
      <div className="debug-actions">
        <button type="button" className="retry-btn" disabled={debug.running || busy} onClick={debug.run}>
          {debug.running ? 'Läuft…' : debug.warned ? 'Wirklich starten' : 'Start'}
        </button>
        <button type="button" className="ghost-btn" disabled={!debug.running} onClick={debug.stop}>
          Stop
        </button>
        <button type="button" className="ghost-btn" disabled={!debug.turns.length} onClick={debug.download}>
          Chat herunterladen
        </button>
      </div>
      {debug.progress ? <p className="debug-progress">{debug.progress}</p> : null}
      {debug.turns.length ? (
        <pre className="debug-log">
          {debug.turns
            .slice(-8)
            .map((t) => `${t.verdict.toUpperCase()} · ${t.group} · ${t.label}\nSie: ${t.prompt}\nJarvis: ${t.reply}`)
            .join('\n\n')}
        </pre>
      ) : null}
    </section>
  )
}
