/** TV an: handeln, dann Zustand lesen. Kein Fake-Erfolg nach nur WoL. */

export const TV_ON_OK = 'Fernseher ist an.'
export const TV_ON_NO_ANSWER =
  'Magic-Packet ist raus, der TV antwortet nicht. WOL am Gerät, gleiches WLAN, kein Gastnetz.'
export const KEY_POWERON = 'KEY_POWERON'
export const WAKE_SALVO_MS = 1200
export const INFO_QUICK_MS = 800
export const POLL_MS = 500
export const POLL_TRIES = 6

export type TvWakeResult = { ok: boolean; message?: string }
export type TvInfoResult = { ok: boolean; status?: number; message?: string }
export type TvKeyResult = { ok: boolean; message?: string }

export type TvObserveIo = {
  wake: (mac: string) => Promise<TvWakeResult>
  info: (host: string, timeoutMs?: number) => Promise<TvInfoResult>
  sendKey: (key: string) => Promise<TvKeyResult>
  sleep: (ms: number) => Promise<void>
}

export type TvObserveOpts = {
  host: string
  mac: string
  macEth?: string
}

export type TvObserveOut = {
  ok: boolean
  reply: string
  observation: {
    wolOk: boolean
    infoOk: boolean
    powerOnSent: boolean
    polls: number
    status?: number
  }
}

function macsOf(opts: TvObserveOpts): string[] {
  const a = (opts.mac || '').trim()
  const b = (opts.macEth || '').trim()
  const out: string[] = []
  if (a) out.push(a)
  if (b && b.toLowerCase() !== a.toLowerCase()) out.push(b)
  return out
}

async function wakeAll(macs: string[], io: TvObserveIo): Promise<TvWakeResult> {
  let last: TvWakeResult = { ok: false, message: 'Keine MAC für Wake-on-LAN.' }
  for (const mac of macs) {
    last = await io.wake(mac)
    if (last.ok) return last
  }
  return last
}

export async function wakeAndObserve(opts: TvObserveOpts, io: TvObserveIo): Promise<TvObserveOut> {
  const macs = macsOf(opts)
  const fail = (reply: string, obs: TvObserveOut['observation']): TvObserveOut => ({
    ok: false,
    reply,
    observation: obs,
  })

  if (!macs.length) {
    return fail('Keine MAC für Wake-on-LAN. Unter Einstellungen eintragen oder neu suchen.', {
      wolOk: false,
      infoOk: false,
      powerOnSent: false,
      polls: 0,
    })
  }

  const host = (opts.host || '').trim()
  if (!host) {
    return fail('Kein TV hinterlegt. Unter Einstellungen suchen und koppeln.', {
      wolOk: false,
      infoOk: false,
      powerOnSent: false,
      polls: 0,
    })
  }

  const first = await wakeAll(macs, io)
  if (!first.ok) {
    return fail(
      first.message ||
        'WOL fehlgeschlagen. Magic-Packet braucht die Android-App, MAC und oft WOL am TV.',
      { wolOk: false, infoOk: false, powerOnSent: false, polls: 0 },
    )
  }

  let powerOnSent = false
  const quick = await io.info(host, INFO_QUICK_MS)
  if (quick.ok && (quick.status === 200 || quick.status == null)) {
    const key = await io.sendKey(KEY_POWERON)
    powerOnSent = Boolean(key.ok)
  }

  await io.sleep(WAKE_SALVO_MS)
  await wakeAll(macs, io)

  let polls = 0
  let status: number | undefined
  for (let i = 0; i < POLL_TRIES; i += 1) {
    polls += 1
    const hit = await io.info(host, POLL_MS)
    status = hit.status
    if (hit.ok && (hit.status === 200 || hit.status == null)) {
      return {
        ok: true,
        reply: TV_ON_OK,
        observation: { wolOk: true, infoOk: true, powerOnSent, polls, status: hit.status || 200 },
      }
    }
    if (i < POLL_TRIES - 1) await io.sleep(POLL_MS)
  }

  return fail(TV_ON_NO_ANSWER, {
    wolOk: true,
    infoOk: false,
    powerOnSent,
    polls,
    status,
  })
}
