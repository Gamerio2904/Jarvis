/** Layout-Gold F1/F2 ohne Browser. */

export const TABLET_BP = 900

export type LayoutProbe = {
  width: number
  lageOn: boolean
  lageWide: boolean
  messagesHidden: boolean
  composerVisible: boolean
}

export function lageSceneOf(width: number, lageOn: boolean): boolean {
  return lageOn && width < TABLET_BP
}

export function tabletCommandCenter(p: LayoutProbe): {
  ok: boolean
  mode: 'tablet' | 'phone-scene' | 'chat'
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
    return {
      ok: p.messagesHidden && p.composerVisible,
      mode: 'phone-scene',
      detail: 'Handy-Portrait + Lage: Chat weicht — erlaubt, kein Bug',
    }
  }
  return { ok: p.composerVisible, mode: 'chat', detail: 'Nur Chat' }
}
