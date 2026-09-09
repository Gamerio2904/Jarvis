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
  mode: 'tablet' | 'phone-scene' | 'phone-lage' | 'chat'
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
      ok: p.composerVisible && !p.messagesHidden,
      mode: 'phone-lage',
      detail: 'Handy: Lage-Panel + Chat + Composer sichtbar',
    }
  }
  return { ok: p.composerVisible, mode: 'chat', detail: 'Nur Chat' }
}
