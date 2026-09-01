import { normalizeUtterance } from './utterance.ts'

export const PC_COPY_PROMPTS = [
  'FIFA starten',
  'Was siehst du auf dem PC',
  'PC live',
  'Live aus',
  'klick Mitte',
  'Züge anklicken',
  'Maus nach rechts',
  'Zeig Ordner Downloads',
  'PC testen',
] as const

export type PcIntent =
  | { kind: 'status' }
  | { kind: 'screen' }
  | { kind: 'stream' }
  | { kind: 'stream_stop' }
  | { kind: 'launch'; query: string }
  | {
      kind: 'click'
      nx?: number
      ny?: number
      target?: string
      button?: 'left' | 'right'
      times?: number
    }
  | { kind: 'move'; dx?: number; dy?: number; nx?: number; ny?: number; x?: number; y?: number }
  | { kind: 'type'; text: string }
  | { kind: 'key'; key: string }
  | {
      kind: 'files'
      op: 'list' | 'mkdir' | 'rename' | 'move' | 'delete' | 'open'
      path: string
      dest?: string
    }

const SKIP =
  /\b(wecker|timer|tanke|fahrmodus|carplay|wetter|einkauf|todo|spotify|ventilator|akku|wlan|fernseh|\btv\b|netflix|youtube)\b/i

const PC_CUE =
  /\b(?:am\s+)?(?:pc|rechner|computer|desktop)\b|\bauf\s+dem\s+(?:pc|rechner|computer)\b/i

const FIFA = /\b(?:fifa|ea\s*sports\s*fc|ea\s*fc)\b/i

function stripPc(raw: string): string {
  return raw
    .replace(PC_CUE, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function namedPath(raw: string): string {
  return raw
    .replace(/^(?:den|die|das|dem|einen?)\s+/i, '')
    .replace(/[.!?]+$/g, '')
    .trim()
}

export function parsePcIntent(text: string): PcIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 180) return null
  if (SKIP.test(t)) return null
  if (/\bcaptcha\b/i.test(t)) return null
  if (/\b(banking|überweis|ueberweis|iban)\b/i.test(t)) return null

  if (
    /^\s*(?:pc|rechner)\s+(?:testen|da|erreichbar|koppeln|prüfen)\s*[.!?]*$/i.test(t) ||
    /^\s*(?:ist\s+der\s+)?(?:pc|rechner)\s+(?:da|an|erreichbar)\s*[.!?]*$/i.test(t)
  ) {
    return { kind: 'status' }
  }

  if (
    /^\s*(?:live[\s-]*(?:bild|stream)?|webrtc|pc[\s-]*live)\s+(?:aus|stopp|stop|beenden|zu)\s*[.!?]*$/i.test(
      t,
    ) ||
    /^\s*(?:beende|stopp(?:e)?)\s+(?:das\s+)?(?:live[\s-]*(?:bild|stream)?|webrtc)\s*[.!?]*$/i.test(t) ||
    /^\s*live\s+aus\s*[.!?]*$/i.test(t)
  ) {
    return { kind: 'stream_stop' }
  }

  if (
    /^\s*(?:pc|rechner)\s+live\b/i.test(t) ||
    /^\s*(?:bildschirm|schirm)\s+live\b/i.test(t) ||
    /^\s*live[\s-]*(?:bild|stream)\b/i.test(t) ||
    /^\s*webrtc\s*[.!?]*$/i.test(t) ||
    (PC_CUE.test(t) && /\blive\b/i.test(t))
  ) {
    return { kind: 'stream' }
  }

  if (
    (PC_CUE.test(t) &&
      /\b(bildschirm|schirm|was\s+siehst|was\s+ist\s+auf|zeig(?:e)?\s+(?:mal\s+)?(?:den\s+)?bildschirm)\b/i.test(
        t,
      )) ||
    /^\s*(?:was\s+siehst\s+du\s+auf\s+dem\s+pc|pc[\s-]*bildschirm|bildschirm\s+vom\s+pc)\s*[.!?]*$/i.test(
      t,
    )
  ) {
    return { kind: 'screen' }
  }

  const launchFifa =
    /(?:start(?:e)?|öffne|spiel(?:e)?)\s+(?:mal\s+)?(?:fifa|ea\s*sports\s*fc|ea\s*fc)\b/i.exec(t) ||
    /(?:fifa|ea\s*sports\s*fc|ea\s*fc)\s+(?:starten|öffnen|an)\s*$/i.exec(t)
  if (launchFifa || (FIFA.test(t) && /\b(start|öffne|spiel)\b/i.test(t) && !/\bfilm\b/i.test(t))) {
    return { kind: 'launch', query: 'fifa' }
  }

  const launch = /(?:start(?:e)?|öffne)\s+(?:mal\s+)?(.+?)\s+auf\s+dem\s+(?:pc|rechner)\s*$/i.exec(t)
  if (launch) {
    const q = stripPc(launch[1]).replace(/^(?:den|die|das)\s+/i, '')
    if (q.length >= 2) return { kind: 'launch', query: FIFA.test(q) ? 'fifa' : q }
  }
  const launch2 = PC_CUE.test(t)
    ? /(?:start(?:e)?|öffne)\s+(?:mal\s+)?(.+)$/i.exec(stripPc(t))
    : null
  if (launch2) {
    const q = launch2[1].replace(/^(?:den|die|das|programm)\s+/i, '').replace(/[.!?]+$/g, '').trim()
    if (q.length >= 2 && !/^(pc|rechner)$/i.test(q)) {
      return { kind: 'launch', query: FIFA.test(q) ? 'fifa' : q }
    }
  }

  const typeM = /(?:tippe|schreib(?:e)?)\s+(?:auf\s+dem\s+pc\s+)?[„"](.+?)[”"]\s*$/i.exec(t)
  if (typeM && (PC_CUE.test(t) || /tippe/i.test(t))) {
    return { kind: 'type', text: typeM[1] }
  }
  const type2 = PC_CUE.test(t) ? /(?:tippe|schreib(?:e)?)\s+(.+)$/i.exec(stripPc(t)) : null
  if (type2) {
    const text = type2[1].replace(/^[„"]|[”"]$/g, '').trim()
    if (text.length >= 1) return { kind: 'type', text }
  }

  if (PC_CUE.test(t) && /\b(enter|eingabe|escape|esc|tab)\b/i.test(t)) {
    const key = /\besc(ape)?\b/i.test(t) ? 'esc' : /\btab\b/i.test(t) ? 'tab' : 'enter'
    return { kind: 'key', key }
  }

  const filesDel =
    /(?:lösch(?:e)?|entferne)\s+(?:den\s+|die\s+|das\s+)?(?:ordner|datei)\s+(.+)$/i.exec(t)
  if (filesDel && (PC_CUE.test(t) || /\b(ordner|datei|desktop|downloads)\b/i.test(t))) {
    return { kind: 'files', op: 'delete', path: namedPath(stripPc(filesDel[1])) }
  }
  const filesMk =
    /(?:leg(?:e)?\s+an|erstell(?:e)?|mach(?:e)?)\s+(?:einen?\s+)?ordner\s+(.+)$/i.exec(t)
  if (filesMk) {
    return { kind: 'files', op: 'mkdir', path: namedPath(stripPc(filesMk[1])) }
  }
  const filesList =
    /(?:zeig(?:e)?|list(?:e)?|was\s+ist\s+in)\s+(?:den\s+|die\s+|das\s+)?ordner\s+(.+)$/i.exec(t)
  if (filesList) {
    return { kind: 'files', op: 'list', path: namedPath(stripPc(filesList[1])) }
  }
  const filesOpen = /(?:öffne)\s+(?:den\s+|die\s+)?ordner\s+(.+)$/i.exec(t)
  if (filesOpen && (PC_CUE.test(t) || /\b(desktop|downloads|dokumente)\b/i.test(t))) {
    return { kind: 'files', op: 'open', path: namedPath(stripPc(filesOpen[1])) }
  }
  if (/^\s*(?:ordner\s+)?desktop\s*[.!?]*$/i.test(t) || /^\s*zeige?\s+desktop\s*$/i.test(t)) {
    return { kind: 'files', op: 'open', path: 'desktop' }
  }

  const moveAbs =
    /maus\s+(?:auf|nach)\s+(\d{2,4})\s*[x/,]\s*(\d{2,4})\s*$/i.exec(t) ||
    /maus\s+(?:auf|nach)\s+(\d{2,4})\s+(\d{2,4})\s*$/i.exec(t)
  if (moveAbs && (PC_CUE.test(t) || /\bmaus\b/i.test(t))) {
    return { kind: 'move', x: Number(moveAbs[1]), y: Number(moveAbs[2]) }
  }
  if (/\bmaus\b/i.test(t) && (PC_CUE.test(t) || /^\s*maus\b/i.test(t))) {
    if (/\blinks\b/i.test(t)) return { kind: 'move', dx: -120, dy: 0 }
    if (/\brechts\b/i.test(t)) return { kind: 'move', dx: 120, dy: 0 }
    if (/\b(hoch|oben)\b/i.test(t)) return { kind: 'move', dx: 0, dy: -120 }
    if (/\b(runter|unten)\b/i.test(t)) return { kind: 'move', dx: 0, dy: 120 }
  }

  if (/\bzüge?\s+anklicken\b/i.test(t) || /^\s*(?:klick(?:e)?\s+)?(?:den\s+)?zug\b/i.test(t)) {
    return {
      kind: 'click',
      target: 'aktueller Zug oder hervorgehobener Button',
      button: 'left',
      times: 1,
    }
  }

  if (
    /\b(?:klick(?:en)?|click)\b/i.test(t) &&
    (PC_CUE.test(t) || /^\s*(?:klick|click)/i.test(t))
  ) {
    const button = /\brechts\b/i.test(t) && /\bklick/i.test(t) ? 'right' : 'left'
    const times = /\bdoppelt\b/i.test(t) ? 2 : 1
    if (/\bmitte\b|\bzentrum\b/i.test(t)) return { kind: 'click', nx: 0.5, ny: 0.5, button, times }
    if (/\boben\s+links\b/i.test(t)) return { kind: 'click', nx: 0.12, ny: 0.12, button, times }
    if (/\boben\s+rechts\b/i.test(t)) return { kind: 'click', nx: 0.88, ny: 0.12, button, times }
    const on = /\b(?:auf|den|die|das)\s+(.+)$/i.exec(t)
    const target = (on?.[1] || t.replace(/.*\b(?:klick(?:e)?(?:n)?|click|anklicken)\s+/i, ''))
      .replace(/^(?:auf\s+|mal\s+)/i, '')
      .replace(/[.!?]+$/g, '')
      .trim()
    if (target && !/^(mitte|zentrum|hier|da|mal)$/i.test(target) && target.length >= 2) {
      return { kind: 'click', target, button, times }
    }
    return { kind: 'click', button, times }
  }

  return null
}
