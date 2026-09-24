/** Layout-Gold F1/F2 ohne Browser. */

export const TABLET_BP = 900

export type LayoutProbe = {
  width: number
  lageOn: boolean
  lageWide: boolean
  messagesHidden: boolean
  composerVisible: boolean
  hudView?: 'tiles' | 'body' | 'globe' | 'serie'
  bodyWithChat?: boolean
}

export function tabletCommandCenter(p: LayoutProbe): {
  ok: boolean
  mode: 'tablet' | 'phone-scene' | 'phone-lage' | 'phone-lage-chat' | 'chat'
  detail: string
} {
  const wide = p.width >= TABLET_BP
  if (wide && p.lageOn) {
    const ok = !p.messagesHidden && p.composerVisible && p.lageWide
    return {
      ok,
      mode: 'tablet',
      detail: ok
        ? 'Lage + Verlauf + Composer gleichzeitig'
        : 'Tablet-Lage braucht Verlauf und Composer, nicht nur die Chat-Kachel',
    }
  }
  if (!wide && p.lageOn) {
    const bodyChat = p.hudView === 'body' && p.bodyWithChat !== false
    if (bodyChat) {
      return {
        ok: p.composerVisible && !p.messagesHidden,
        mode: 'phone-lage-chat',
        detail: 'Handy: Körper und Chat gleichzeitig, Vollbild auf Zuruf',
      }
    }
    return {
      ok: p.messagesHidden && !p.composerVisible,
      mode: 'phone-lage',
      detail: 'Handy: Lage Vollbild, Chat und Composer weg, Nav bleibt',
    }
  }
  return { ok: p.composerVisible, mode: 'chat', detail: 'Nur Chat' }
}
