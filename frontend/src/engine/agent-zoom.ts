/** Zoom-Grenzen und Schwenk-Grenzen für das Agenten-Netz. */
export const MAP_ZOOM_MIN = 1
export const MAP_ZOOM_MAX = 5

export function clampZoom(z: number): number {
  if (!Number.isFinite(z)) return MAP_ZOOM_MIN
  return Math.max(MAP_ZOOM_MIN, Math.min(MAP_ZOOM_MAX, z))
}

/** Schwenken nur so weit, dass das Netz nicht aus dem Bild rutscht. */
export function clampPan(pan: number, span: number, zoom: number): number {
  if (!Number.isFinite(pan)) return 0
  const room = Math.max(0, (Math.max(0, span) * (clampZoom(zoom) - 1)) / 2 + 40)
  return Math.max(-room, Math.min(room, pan))
}

/** Punkte und Schrift wachsen gedämpft mit dem Zoom. */
export function zoomMagnify(zoom: number): number {
  return Math.min(2, 1 + (clampZoom(zoom) - 1) * 0.45)
}

/** Ab hier stehen die Namen aller Agenten am Punkt. */
export function labelsVisible(zoom: number): boolean {
  return clampZoom(zoom) >= 1.6
}
