const KIND: Record<string, string> = {
  calendar: 'date',
  alarm: 'bell',
  timer: 'time',
  reminder: 'pin',
  birthday: 'date',
  holiday: 'date',
  ferien: 'date',
  todo: 'check',
  idea: 'bulb',
  memory: 'bulb',
  teach: 'bulb',
  pack: 'bulb',
  research: 'search',
  search: 'search',
  osint: 'search',
  news: 'news',
  outlook: 'news',
  weather: 'cloud',
  warn: 'cloud',
  sky: 'cloud',
  board: 'grid',
  shopping: 'bag',
  'watch-price': 'bag',
  food: 'bag',
  poi: 'pin',
  maps: 'pin',
  here: 'pin',
  fuel: 'pin',
  transit: 'pin',
  taxi: 'pin',
  leave: 'pin',
  film: 'play',
  clip: 'play',
  watchlist: 'play',
  amazon: 'play',
  backup: 'box',
  xfer: 'box',
  doc: 'box',
}

export function agentKind(id: string): string {
  return KIND[id] || 'spark'
}

function Job({ kind }: { kind: string }) {
  if (kind === 'date') {
    return (
      <g className="agent-job">
        <rect x="44" y="40" width="16" height="14" rx="3" />
        <path d="M47 40v-3M57 40v-3M44 45h16" />
      </g>
    )
  }
  if (kind === 'bell') {
    return (
      <g className="agent-job">
        <path d="M52 38c0-5 3-7 3-7s3 2 3 7" />
        <path d="M49 46h12" />
        <circle cx="55" cy="49" r="1.4" />
      </g>
    )
  }
  if (kind === 'time') {
    return (
      <g className="agent-job">
        <circle cx="54" cy="46" r="7" />
        <path d="M54 42v4l3 2" />
      </g>
    )
  }
  if (kind === 'pin') {
    return (
      <g className="agent-job">
        <path d="M54 38c-3 0-5 2.4-5 5.2 0 3.6 5 8.8 5 8.8s5-5.2 5-8.8c0-2.8-2-5.2-5-5.2z" />
        <circle cx="54" cy="43" r="1.5" />
      </g>
    )
  }
  if (kind === 'check') {
    return (
      <g className="agent-job">
        <rect x="44" y="40" width="16" height="14" rx="3" />
        <path d="M48 47l2.5 2.5L56 44" />
      </g>
    )
  }
  if (kind === 'bulb') {
    return (
      <g className="agent-job">
        <circle cx="54" cy="44" r="6" />
        <path d="M51 50h6M52 53h4" />
      </g>
    )
  }
  if (kind === 'search') {
    return (
      <g className="agent-job">
        <circle cx="52" cy="44" r="5" />
        <path d="M56 48l5 5" />
      </g>
    )
  }
  if (kind === 'cloud') {
    return (
      <g className="agent-job">
        <path d="M48 50h12a4 4 0 0 0 0-8 5 5 0 0 0-9-1 3.5 3.5 0 0 0-3 9z" />
      </g>
    )
  }
  if (kind === 'news') {
    return (
      <g className="agent-job">
        <path d="M46 40h14v14H46z" />
        <path d="M48 44h10M48 47h10M48 50h6" />
      </g>
    )
  }
  if (kind === 'grid') {
    return (
      <g className="agent-job">
        <rect x="44" y="40" width="6" height="6" rx="1" />
        <rect x="52" y="40" width="6" height="6" rx="1" />
        <rect x="44" y="48" width="6" height="6" rx="1" />
        <rect x="52" y="48" width="6" height="6" rx="1" />
      </g>
    )
  }
  if (kind === 'bag') {
    return (
      <g className="agent-job">
        <path d="M48 44h12l-1 10H49z" />
        <path d="M50 44v-3a4 4 0 0 1 8 0v3" />
      </g>
    )
  }
  if (kind === 'play') {
    return (
      <g className="agent-job">
        <rect x="44" y="40" width="16" height="14" rx="3" />
        <path d="M51 44l6 3-6 3z" />
      </g>
    )
  }
  if (kind === 'box') {
    return (
      <g className="agent-job">
        <path d="M46 44l8-4 8 4-8 4z" />
        <path d="M46 44v8l8 4 8-4v-8" />
      </g>
    )
  }
  return (
    <g className="agent-job">
      <path d="M54 40l1.4 4.2H60l-3.6 2.6 1.4 4.2-4.2-2.8-4.2 2.8 1.4-4.2L47 44.2h4.6z" />
    </g>
  )
}

export function AgentGlyph({ agent, mood }: { agent: string; mood: 'think' | 'run' | 'wait' | 'edit' | 'bye' }) {
  const eye = mood === 'think' ? -3.5 : mood === 'run' ? 1.5 : 0
  return (
    <svg className={`agent-glyph is-${mood}`} viewBox="0 0 64 64" aria-hidden>
      <circle className="agent-glyph-face" cx="28" cy="36" r="20" />
      <circle className="agent-eye" cx={22 + eye} cy="34" r="2.3" />
      <circle className="agent-eye" cx={34 + eye} cy="34" r="2.3" />
      {mood === 'think' ? (
        <path d="M22 44h12" />
      ) : (
        <path d="M22 43c3 3 8 3 11 0" />
      )}
      {mood === 'think' ? <circle className="agent-think" cx="46" cy="16" r="2" /> : null}
      <circle className="agent-badge" cx="54" cy="47" r="11" />
      <Job kind={agentKind(agent)} />
    </svg>
  )
}
