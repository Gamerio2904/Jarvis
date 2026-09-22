import type { WeatherLast } from './weather-parse.ts'

export type SideEffect = 'read' | 'write' | 'device'

export type RouteCtx = {
  conversationId: string
  text: string
  lastTool: string
  lastMedium: string
  inDrive: boolean
  weatherLast?: WeatherLast | null
  plugNames?: string[]
  lastPlace?: string
  /** Abbruch des laufenden Zuges. Wird vom Bus gesetzt, nicht vom Router. */
  signal?: AbortSignal
  /** Letzter gescheiterter Agent — senkt denselben nicht ins Plaudern. */
  last_failed_tool?: string
}

export type Candidate = {
  id: string
  score: number
  sideEffect: SideEffect
  /** Parse-Score vor Kosten. Entscheidet die Schwelle, `score` nur die Reihenfolge. */
  base?: number
}
