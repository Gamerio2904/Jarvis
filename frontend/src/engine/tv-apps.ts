export type TvAppId = 'youtube' | 'netflix' | 'disney' | 'prime'

export const TV_APP_LABEL: Record<TvAppId, string> = {
  youtube: 'YouTube',
  netflix: 'Netflix',
  disney: 'Disney+',
  prime: 'Prime Video',
}

/** Tizen application IDs, tried in order. */
export const TV_APP_IDS: Record<TvAppId, string[]> = {
  youtube: ['111299001912', '9Ur5IzDKqV.TizenYouTube'],
  netflix: ['11101200001', 'org.tizen.netflix-app'],
  disney: ['3201901017640', 'com.disney.disneyplus-prod'],
  prime: ['3201512006785', 'org.tizen.primevideo'],
}

const PACKAGE_APP: Record<number, TvAppId> = {
  8: 'netflix',
  9: 'prime',
  10: 'prime',
  192: 'youtube',
  235: 'youtube',
  300: 'prime',
  337: 'disney',
  613: 'prime',
}

export function tvAppFromPackage(pkg: {
  packageId?: number
  technicalName?: string
  clearName?: string
  shortName?: string
}): TvAppId | null {
  const id = pkg.packageId
  if (id != null && PACKAGE_APP[id]) return PACKAGE_APP[id]
  const blob = `${pkg.technicalName || ''} ${pkg.clearName || ''} ${pkg.shortName || ''}`.toLowerCase()
  if (/youtubetv|youtube tv/.test(blob)) return null
  if (/\bnetflix\b|\bnfx\b/.test(blob)) return 'netflix'
  if (/\bdisney/.test(blob)) return 'disney'
  if (/\byoutube\b|\byot\b/.test(blob)) return 'youtube'
  if (/dvd|blu-?ray|amazondvdbr/.test(blob)) return null
  if (/\bprime\b|\bamazonprime\b|\bamazonimdbtv\b|\bfreevee\b|\bamazon\b/.test(blob)) return 'prime'
  return null
}
