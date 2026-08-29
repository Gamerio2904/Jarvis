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
}

export type Candidate = {
  id: string
  score: number
  sideEffect: SideEffect
}
