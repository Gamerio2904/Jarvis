import type { IdeaSimulationElement } from './idea-plan.ts'

export type GuiPlace = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export type GuiPlaceElement = {
  type: 'place'
  kind: 'board' | 'button'
  label: string
  place: GuiPlace
}

const PLACES: Record<string, GuiPlace> = {
  'oben links': 'top-left',
  'links oben': 'top-left',
  'oben rechts': 'top-right',
  'rechts oben': 'top-right',
  'unten links': 'bottom-left',
  'links unten': 'bottom-left',
  'unten rechts': 'bottom-right',
  'rechts unten': 'bottom-right',
  mitte: 'center',
  zentrum: 'center',
}

function clean(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/[.!?]+$/g, '')
    .trim()
}

function widgetOf(raw: string): { kind: 'board' | 'button'; label: string } | null {
  const t = raw.replace(/\s+/g, ' ').trim().toLowerCase()
  if (/tik\s*-?\s*tak\s*-?\s*to|tic\s*-?\s*tac\s*-?\s*toe|tiktakto|tictactoe/.test(t)) {
    return { kind: 'board', label: 'TikTakTo' }
  }
  if (/men[uü]e?\s*-?\s*button|men[uü]button|men[uü]\s*-?\s*knopf/.test(t)) {
    return { kind: 'button', label: 'Menü' }
  }
  if (/^(?:ein\s+|eine\s+|einen\s+)?(?:button|knopf)$/.test(t)) return { kind: 'button', label: 'Button' }
  return null
}

function placeToken(raw: string): { place?: GuiPlace; axis?: 'left' | 'right' | 'up' | 'down' } {
  const t = raw.replace(/\s+/g, ' ').trim().toLowerCase()
  if (PLACES[t]) return { place: PLACES[t] }
  if (t === 'links') return { axis: 'left' }
  if (t === 'rechts') return { axis: 'right' }
  if (t === 'oben') return { axis: 'up' }
  if (t === 'unten') return { axis: 'down' }
  return {}
}

export function shiftGuiPlace(current: GuiPlace, axis: 'left' | 'right' | 'up' | 'down'): GuiPlace {
  if (current === 'center') {
    if (axis === 'left') return 'top-left'
    if (axis === 'right') return 'top-right'
    if (axis === 'up') return 'top-left'
    return 'bottom-left'
  }
  const vertical = current.startsWith('bottom') ? 'bottom' : 'top'
  const horizontal = current.endsWith('right') ? 'right' : 'left'
  if (axis === 'left' || axis === 'right') return `${vertical}-${axis}` as GuiPlace
  return `${axis === 'up' ? 'top' : 'bottom'}-${horizontal}` as GuiPlace
}

function placeName(place: GuiPlace): string {
  if (place === 'center') return 'in der Mitte'
  if (place === 'top-left') return 'oben links'
  if (place === 'top-right') return 'oben rechts'
  if (place === 'bottom-left') return 'unten links'
  return 'unten rechts'
}

export type GuiUtterance =
  | { kind: 'show' }
  | { kind: 'add'; widget: { kind: 'board' | 'button'; label: string }; place: GuiPlace }
  | { kind: 'move'; label: string; place?: GuiPlace; axis?: 'left' | 'right' | 'up' | 'down' }

const PLACE_WORD = String.raw`oben\s+links|oben\s+rechts|unten\s+links|unten\s+rechts|links\s+oben|rechts\s+oben|links\s+unten|rechts\s+unten|mitte|zentrum|oben|unten|links|rechts`
const WIDGET_WORD = String.raw`tik\s*-?\s*tak\s*-?\s*to(?:e|\s*feld)?|tic\s*-?\s*tac\s*-?\s*toe(?:\s*feld)?|tiktakto(?:\s*feld)?|tictactoe|men[uü]e?\s*-?\s*button|men[uü]button|men[uü]\s*-?\s*knopf|button|knopf`

export function parseGuiUtterance(text: string): GuiUtterance | null {
  const t = clean(text)
  if (!t) return null
  if (/^(?:bitte\s+)?(?:simulier(?:e|en)?|zeig(?:e)?(?:\s+mir)?)\s+(?:mir\s+)?(?:bitte\s+)?(?:die\s+|eine\s+)?(?:gui|oberflaeche|oberfläche|ui|vorschau)$/.test(t)) {
    return { kind: 'show' }
  }
  const into = new RegExp(String.raw`^(?:(?:setz|leg|pack|stell)(?:e)?\s+)?(?:in\s+(?:die|den|das)|ins)\s+(${PLACE_WORD})\s+(?:ein|eine|einen|das)?\s*(${WIDGET_WORD})(?:\s+feld)?$`, 'i').exec(t)
    || new RegExp(String.raw`^(${PLACE_WORD})\s+(?:ein|eine|einen|das)?\s*(${WIDGET_WORD})(?:\s+feld)?$`, 'i').exec(t)
  const named = into || new RegExp(String.raw`^(${WIDGET_WORD})(?:\s+feld)?\s+(?:in\s+(?:die|den|das)|ins)\s+(${PLACE_WORD})$`, 'i').exec(t)
  if (named) {
    const firstIsPlace = PLACES[named[1].replace(/\s+/g, ' ')] || /^(?:oben|unten|links|rechts|mitte|zentrum)$/.test(named[1])
    const placeRaw = firstIsPlace ? named[1] : named[2]
    const widgetRaw = firstIsPlace ? named[2] : named[1]
    const placed = placeToken(placeRaw)
    const widget = widgetOf(widgetRaw)
    if (placed.place && widget) return { kind: 'add', widget, place: placed.place }
  }
  const moved = new RegExp(
    String.raw`^(?:ne+|nee|nein|doch|schieb(?:e)?|setz(?:e)?|leg(?:e)?|pack(?:e)?|verschieb(?:e)?)\s+(?:den|die|das)?\s*(${WIDGET_WORD})\s+(?:doch\s+|lieber\s+|mal\s+)?(?:nach\s+|auf\s+)?(${PLACE_WORD})$`,
    'i',
  ).exec(t)
  if (moved) {
    const widget = widgetOf(moved[1])
    const placed = placeToken(moved[2])
    if (widget && (placed.place || placed.axis)) {
      return { kind: 'move', label: widget.label, place: placed.place, axis: placed.axis }
    }
  }
  return null
}

function isPlace(element: IdeaSimulationElement): element is GuiPlaceElement {
  return element.type === 'place'
}

export function applyGuiUtterance(
  elements: IdeaSimulationElement[],
  text: string,
): { elements: IdeaSimulationElement[]; reply: string } | null {
  const intent = parseGuiUtterance(text)
  if (!intent) return null
  const placed = elements.filter(isPlace)
  if (intent.kind === 'show') {
    return {
      elements,
      reply: placed.length
        ? 'Die Oberfläche liegt auf dem Planungsbildschirm.'
        : 'Die Oberfläche ist noch leer.',
    }
  }
  if (intent.kind === 'add') {
    const next = elements.filter((element) => !(isPlace(element) && element.kind === intent.widget.kind && element.label === intent.widget.label))
    next.push({ type: 'place', kind: intent.widget.kind, label: intent.widget.label, place: intent.place })
    return {
      elements: next,
      reply: `${intent.widget.label} steht ${placeName(intent.place)}.`,
    }
  }
  const hit = [...placed].reverse().find((element) => element.label === intent.label || (intent.label === 'Menü' && element.kind === 'button'))
  if (!hit) return { elements, reply: `Es gibt noch keinen ${intent.label}.` }
  const place = intent.place || (intent.axis ? shiftGuiPlace(hit.place, intent.axis) : hit.place)
  const next = elements.map((element) => (element === hit ? { ...hit, place } : element))
  return { elements: next, reply: `${hit.label} steht ${placeName(place)}.` }
}
