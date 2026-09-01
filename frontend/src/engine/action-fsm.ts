/** Verified Actions: kein Erfolgssatz ohne Observation + Verification. */

import type { ToolMeta } from './tools.ts'

export type ActionDomain = 'tv' | 'pc' | 'app' | 'navi' | 'home' | 'doc'

export type ActionPhase =
  | 'idle'
  | 'planned'
  | 'running'
  | 'waiting'
  | 'verifying'
  | 'success'
  | 'failed'
  | 'cancelled'

export type ActionPipeline =
  | 'intent'
  | 'planner'
  | 'preconditions'
  | 'execution'
  | 'observation'
  | 'verification'
  | 'state'
  | 'response'

export type ActionState = {
  domain: ActionDomain | null
  phase: ActionPhase
  pipeline: ActionPipeline
  intent: string
  plan: string
  expect: Record<string, unknown>
  observation: Record<string, unknown> | null
  error: string | null
  reply: string
}

export const ACTION_INIT: ActionState = {
  domain: null,
  phase: 'idle',
  pipeline: 'intent',
  intent: '',
  plan: '',
  expect: {},
  observation: null,
  error: null,
  reply: '',
}

export type ActionEvent =
  | { type: 'intent'; domain: ActionDomain; intent: string }
  | { type: 'plan'; plan: string; expect?: Record<string, unknown> }
  | { type: 'precheck'; ok: boolean; error?: string }
  | { type: 'wait'; reason?: string }
  | { type: 'run' }
  | { type: 'observe'; observation: Record<string, unknown> }
  | { type: 'verify'; ok: boolean; error?: string }
  | { type: 'respond'; reply: string }
  | { type: 'cancel'; reason?: string }
  | { type: 'reset' }

export function reduceAction(state: ActionState, event: ActionEvent): ActionState {
  switch (event.type) {
    case 'reset':
      return { ...ACTION_INIT }
    case 'intent':
      return {
        ...ACTION_INIT,
        domain: event.domain,
        phase: 'planned',
        pipeline: 'intent',
        intent: event.intent,
      }
    case 'plan': {
      if (state.phase === 'failed' || state.phase === 'cancelled') return state
      return {
        ...state,
        phase: 'planned',
        pipeline: 'planner',
        plan: event.plan,
        expect: event.expect || state.expect,
      }
    }
    case 'precheck': {
      if (state.phase === 'failed' || state.phase === 'cancelled') return state
      if (!event.ok) {
        return {
          ...state,
          phase: 'failed',
          pipeline: 'preconditions',
          error: event.error || 'Vorbedingung fehlt.',
        }
      }
      return { ...state, phase: 'planned', pipeline: 'preconditions', error: null }
    }
    case 'wait': {
      if (state.phase === 'failed' || state.phase === 'cancelled' || state.phase === 'success') return state
      return {
        ...state,
        phase: 'waiting',
        pipeline: 'preconditions',
        error: event.reason || null,
      }
    }
    case 'run': {
      if (state.phase === 'failed' || state.phase === 'cancelled' || state.phase === 'waiting') return state
      return { ...state, phase: 'running', pipeline: 'execution' }
    }
    case 'observe': {
      if (state.phase === 'cancelled') return state
      if (state.phase === 'failed' && !state.observation) {
        return { ...state, observation: event.observation, pipeline: 'observation' }
      }
      return {
        ...state,
        phase: state.phase === 'failed' ? 'failed' : 'verifying',
        pipeline: 'observation',
        observation: event.observation,
      }
    }
    case 'verify': {
      if (state.phase === 'cancelled') return state
      if (state.phase === 'failed' && !event.ok) {
        return {
          ...state,
          pipeline: 'verification',
          error: event.error || state.error,
        }
      }
      if (!state.observation || !event.ok) {
        return {
          ...state,
          phase: 'failed',
          pipeline: 'verification',
          error: event.error || (state.observation ? 'Verification fehlgeschlagen.' : 'Keine Observation.'),
        }
      }
      return {
        ...state,
        phase: 'success',
        pipeline: 'verification',
        error: null,
      }
    }
    case 'respond': {
      const phase = state.phase === 'success' || state.phase === 'waiting' ? state.phase : state.phase === 'cancelled' ? 'cancelled' : state.phase === 'failed' ? 'failed' : state.phase
      return { ...state, pipeline: 'response', reply: event.reply, phase }
    }
    case 'cancel':
      return {
        ...state,
        phase: 'cancelled',
        pipeline: 'state',
        error: event.reason || 'Abgebrochen.',
      }
    default:
      return state
  }
}

export function toolStatusOf(phase: ActionPhase): ToolMeta['tool_status'] {
  if (phase === 'success') return 'executed'
  if (phase === 'failed') return 'error'
  if (phase === 'waiting') return 'pending'
  if (phase === 'cancelled') return 'aborted'
  if (phase === 'running' || phase === 'verifying' || phase === 'planned') return 'running'
  return undefined
}

export function actionTool(state: ActionState, label: string, extra?: Record<string, unknown>): ToolMeta {
  return {
    tool_status: toolStatusOf(state.phase),
    tool: state.domain || (typeof extra?.tool === 'string' ? extra.tool : undefined),
    action: state.plan || state.intent,
    label,
    preview: label,
    error: state.error || undefined,
    result: {
      phase: state.phase,
      pipeline: state.pipeline,
      intent: state.intent,
      ...(state.observation || {}),
      ...(extra || {}),
    },
  }
}

function asVerify(raw: boolean | { ok: boolean; error?: string }): { ok: boolean; error?: string } {
  return typeof raw === 'boolean' ? { ok: raw } : raw
}

/** Sync-Pack: execute ist schon gelaufen. SUCCESS nur mit Observation und verify.ok. */
export function packVerified(opts: {
  domain: ActionDomain
  intent: string
  plan?: string
  label: string
  expect?: Record<string, unknown>
  preOk?: boolean
  preError?: string
  waiting?: boolean
  cancelled?: boolean
  observation: Record<string, unknown> | null
  verify?: (obs: Record<string, unknown>) => boolean | { ok: boolean; error?: string }
  successReply: string
  failReply: string
  extra?: Record<string, unknown>
}): { state: ActionState; tool: ToolMeta; reply: string } {
  let s = reduceAction(ACTION_INIT, { type: 'intent', domain: opts.domain, intent: opts.intent })
  s = reduceAction(s, { type: 'plan', plan: opts.plan || opts.intent, expect: opts.expect })
  if (opts.preOk === false) {
    s = reduceAction(s, { type: 'precheck', ok: false, error: opts.preError })
    s = reduceAction(s, { type: 'respond', reply: opts.failReply })
    return { state: s, tool: actionTool(s, opts.label, opts.extra), reply: s.reply }
  }
  s = reduceAction(s, { type: 'precheck', ok: true })
  if (opts.cancelled) {
    s = reduceAction(s, { type: 'cancel' })
    s = reduceAction(s, { type: 'respond', reply: opts.failReply })
    return { state: s, tool: actionTool(s, opts.label, opts.extra), reply: s.reply }
  }
  if (opts.waiting) {
    s = reduceAction(s, { type: 'wait' })
    s = reduceAction(s, { type: 'respond', reply: opts.successReply })
    return { state: s, tool: actionTool(s, opts.label, opts.extra), reply: s.reply }
  }
  s = reduceAction(s, { type: 'run' })
  if (opts.observation) s = reduceAction(s, { type: 'observe', observation: opts.observation })
  const checked = opts.observation && opts.verify ? asVerify(opts.verify(opts.observation)) : { ok: false, error: 'Keine Observation.' }
  s = reduceAction(s, { type: 'verify', ok: checked.ok, error: checked.error })
  const reply = s.phase === 'success' ? opts.successReply : opts.failReply
  s = reduceAction(s, { type: 'respond', reply })
  return { state: s, tool: actionTool(s, opts.label, opts.extra), reply: s.reply }
}
