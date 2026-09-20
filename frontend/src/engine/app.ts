import { clearPending, getPending, saveSettings, setPending } from './store.ts'
import { parseAppIntent, type AppIntent, type UiAction } from './app-parse.ts'
import { resolveTopic, TOPIC_FACE, type SettingsTopic } from './settings-ia.ts'
import { packVerified } from './action-fsm.ts'
import { flagUtterance } from './ui-action.ts'
import type { ToolMeta } from './tools.ts'

export type { AppIntent, UiAction } from './app-parse.ts'
export { parseAppIntent } from './app-parse.ts'

export const APP_FLAG_TOOL = 'app_flag'

type AppHit = { handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }

/** Flächen in der App — Handler setzt Settings/HUD, UI öffnet über tool.action. */
export async function handleApp(
  conversationId: string,
  text: string,
): Promise<AppHit> {
  const intent = parseAppIntent(text)
  if (!intent) return { handled: false }
  if (intent.kind === 'ui') return handleUi(conversationId, intent.action)
  if (intent.kind === 'settings') return packOpenSettings(intent.topic)
  if (intent.kind === 'voice') {
    const packed = packVerified({
      domain: 'app',
      intent: 'voice',
      plan: 'voice',
      label: 'Stimme',
      observation: { action: 'voice' },
      verify: (obs) => obs.action === 'voice',
      successReply: 'Sprachmodus ist offen.',
      failReply: 'Sprachmodus nicht geöffnet.',
    })
    return { handled: true, reply: packed.reply, tool: packed.tool, lastTool: 'app' }
  }
  if (intent.kind === 'theme') {
    saveSettings({ hud_accent: intent.accent })
    const packed = packVerified({
      domain: 'app',
      intent: `theme:${intent.accent}`,
      plan: 'theme',
      label: intent.accent === 'amber' ? 'Orange' : 'Grün',
      observation: { accent: intent.accent },
      verify: (obs) => obs.accent === intent.accent,
      successReply: intent.accent === 'amber' ? 'Lage-Akzent orange.' : 'Lage-Akzent wieder Grün.',
      failReply: 'Akzent nicht gesetzt.',
      extra: { accent: intent.accent },
    })
    return { handled: true, reply: packed.reply, tool: packed.tool, lastTool: 'app' }
  }
  return { handled: false }
}

function packOpenSettings(topic: SettingsTopic): AppHit {
  const tab = resolveTopic(topic)
  const face = TOPIC_FACE[tab]
  const action = topic === 'debug' || topic === 'tests' || topic === 'probe' ? 'debug' : topic === 'gedaechtnis' ? 'memory' : 'settings'
  const packed = packVerified({
    domain: 'app',
    intent: `open:${topic}`,
    plan: action,
    label: face.label,
    observation: { action, topic },
    verify: (obs) => obs.action === action && obs.topic === topic,
    successReply: `${face.label} ist offen.`,
    failReply: `${face.label} nicht geöffnet.`,
    extra: { topic },
  })
  return { handled: true, reply: packed.reply, tool: packed.tool, lastTool: 'app' }
}

async function handleUi(conversationId: string, action: UiAction): Promise<AppHit> {
  if (action.id === 'overlay.open') {
    if (action.overlay === 'voice') {
      const packed = packVerified({
        domain: 'app',
        intent: 'voice',
        plan: 'voice',
        label: 'Stimme',
        observation: { action: 'voice' },
        verify: (obs) => obs.action === 'voice',
        successReply: 'Sprachmodus ist offen.',
        failReply: 'Sprachmodus nicht geöffnet.',
      })
      return { handled: true, reply: packed.reply, tool: packed.tool, lastTool: 'app' }
    }
    if (action.overlay === 'debug') return packOpenSettings('debug')
    if (action.overlay === 'calendar') {
      const packed = packVerified({
        domain: 'app',
        intent: 'overlay.open',
        plan: 'dock',
        label: 'Kalender',
        observation: { action: 'dock', dock: 'calendar' },
        verify: (obs) => obs.action === 'dock' && obs.dock === 'calendar',
        successReply: 'Kalender.',
        failReply: 'Kalender nicht geöffnet.',
        extra: { dock: 'calendar' },
      })
      return { handled: true, reply: packed.reply, tool: packed.tool, lastTool: 'app' }
    }
    if (action.overlay === 'watchlist') {
      const packed = packVerified({
        domain: 'app',
        intent: 'overlay.open',
        plan: 'dock',
        label: 'Filme',
        observation: { action: 'dock', dock: 'watchlist' },
        verify: (obs) => obs.action === 'dock' && obs.dock === 'watchlist',
        successReply: 'Filme.',
        failReply: 'Filme nicht geöffnet.',
        extra: { dock: 'watchlist' },
      })
      return { handled: true, reply: packed.reply, tool: packed.tool, lastTool: 'app' }
    }
    return packOpenSettings('keys')
  }
  if (action.id === 'settings.tab') return packOpenSettings(action.topic)
  if (action.id === 'overlay.close') {
    const packed = packVerified({
      domain: 'app',
      intent: 'overlay.close',
      plan: 'overlay.close',
      label: 'Overlay',
      observation: { action: 'overlay.close' },
      verify: (obs) => obs.action === 'overlay.close',
      successReply: 'Folie zu.',
      failReply: 'Folie nicht geschlossen.',
    })
    return { handled: true, reply: packed.reply, tool: packed.tool, lastTool: 'app' }
  }
  if (action.id === 'dock.go') {
    const packed = packVerified({
      domain: 'app',
      intent: `dock:${action.dock}`,
      plan: 'dock',
      label: 'Leiste',
      observation: { action: 'dock', dock: action.dock },
      verify: (obs) => obs.action === 'dock' && obs.dock === action.dock,
      successReply:
        action.dock === 'chat'
          ? 'Chat.'
          : action.dock === 'lage'
            ? 'Lage.'
            : action.dock === 'watchlist'
              ? 'Filme.'
              : action.dock === 'voice'
                ? 'Sprachmodus.'
                : 'Einstellungen.',
      failReply: 'Leiste nicht gewechselt.',
      extra: { dock: action.dock },
    })
    return { handled: true, reply: packed.reply, tool: packed.tool, lastTool: 'app' }
  }
  if (action.id === 'settings.set') {
    return confirmOrWriteFlag(conversationId, action.flag, action.on)
  }
  return { handled: false }
}

async function confirmOrWriteFlag(
  conversationId: string,
  flag: Parameters<typeof flagUtterance>[0],
  on: boolean,
): Promise<AppHit> {
  const utterance = flagUtterance(flag, on)
  const pending = await getPending(conversationId)
  const same =
    pending?.tool === APP_FLAG_TOOL &&
    String(pending.args?.flag || '') === flag &&
    Boolean(pending.args?.on) === on
  if (!same) {
    await setPending({
      conversation_id: conversationId,
      tool: APP_FLAG_TOOL,
      action: 'app',
      args: { flag, on, utterance },
      preview: utterance,
      created_at: new Date().toISOString(),
    })
    return { handled: true, reply: `Verstanden als „${utterance}". Soll ich?`, lastTool: 'app' }
  }
  await clearPending(conversationId)
  if (flag === 'hud_accent') saveSettings({ hud_accent: on ? 'amber' : 'green' })
  else if (flag === 'drive_speak') saveSettings({ drive_speak: on ? 'after' : 'only' })
  else saveSettings({ [flag]: on })
  const packed = packVerified({
    domain: 'app',
    intent: `set:${flag}`,
    plan: 'set',
    label: utterance,
    observation: { action: 'set', flag, on },
    verify: (obs) => obs.action === 'set' && obs.flag === flag,
    successReply: `${utterance}.`,
    failReply: 'Schalter nicht gesetzt.',
    extra: { flag, on },
  })
  return { handled: true, reply: packed.reply, tool: packed.tool, lastTool: 'app' }
}
