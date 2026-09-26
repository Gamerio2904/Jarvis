import type { GeoPinKind } from './globe-geo.ts'

/** OpenSky true_track: 0° = Nord. Canvas-Nase zeigt nach −Y, danach rotieren. */
export function headingRad(deg?: number): number {
  const n = Number.isFinite(deg) ? Number(deg) : 0
  return (n * Math.PI) / 180
}

export function pinMarkerKind(kind: GeoPinKind): 'here' | 'flight' | 'sat' | 'iss' | 'dot' {
  if (kind === 'here') return 'here'
  if (kind === 'flight') return 'flight'
  if (kind === 'sat') return 'sat'
  if (kind === 'iss') return 'iss'
  return 'dot'
}

export function drawHerePin(
  pen: CanvasRenderingContext2D,
  x: number,
  y: number,
  opts: { stale?: boolean; pulse?: number },
): void {
  const stale = Boolean(opts.stale)
  const fill = stale ? '#6a8f72' : '#1ed760'
  if (!stale) {
    const wave = 10 + Math.sin(opts.pulse || 0) * 3
    pen.beginPath()
    pen.strokeStyle = 'rgba(30, 215, 96, 0.45)'
    pen.lineWidth = 1.2
    pen.arc(x, y - 3, wave, 0, Math.PI * 2)
    pen.stroke()
  }
  pen.beginPath()
  pen.fillStyle = fill
  pen.moveTo(x, y + 8)
  pen.quadraticCurveTo(x + 7, y + 1, x + 6, y - 3)
  pen.arc(x, y - 4, 6, 0.15, Math.PI - 0.15, true)
  pen.quadraticCurveTo(x - 7, y + 1, x, y + 8)
  pen.closePath()
  pen.fill()
  pen.beginPath()
  pen.fillStyle = stale ? '#1a241c' : '#04120a'
  pen.arc(x, y - 4, 2.1, 0, Math.PI * 2)
  pen.fill()
}

export function drawAircraft(pen: CanvasRenderingContext2D, x: number, y: number, heading?: number): void {
  pen.save()
  pen.translate(x, y)
  pen.rotate(headingRad(heading))
  pen.fillStyle = '#9ecbff'
  pen.beginPath()
  pen.moveTo(0, -7)
  pen.lineTo(2.1, -1.2)
  pen.lineTo(6.6, 1.1)
  pen.lineTo(1.5, 1.5)
  pen.lineTo(2.3, 5.6)
  pen.lineTo(0, 3.5)
  pen.lineTo(-2.3, 5.6)
  pen.lineTo(-1.5, 1.5)
  pen.lineTo(-6.6, 1.1)
  pen.lineTo(-2.1, -1.2)
  pen.closePath()
  pen.fill()
  pen.restore()
}

export function drawSat(pen: CanvasRenderingContext2D, x: number, y: number, iss: boolean): void {
  const panelW = iss ? 7.2 : 5.2
  const panelH = iss ? 2.4 : 2
  const body = iss ? 3.2 : 2.4
  pen.strokeStyle = 'rgba(210, 230, 255, 0.7)'
  pen.lineWidth = 1.2
  if (iss) {
    pen.beginPath()
    pen.arc(x, y, 9, 0, Math.PI * 2)
    pen.stroke()
  }
  pen.fillStyle = 'rgba(180, 205, 230, 0.95)'
  pen.fillRect(x - body - panelW - 0.4, y - panelH / 2, panelW, panelH)
  pen.fillRect(x + body + 0.4, y - panelH / 2, panelW, panelH)
  pen.fillStyle = '#f4f7fb'
  pen.fillRect(x - body, y - body, body * 2, body * 2)
  if (iss) {
    pen.strokeStyle = 'rgba(244, 247, 251, 0.7)'
    pen.beginPath()
    pen.moveTo(x - body - panelW - 0.4, y)
    pen.lineTo(x + body + panelW + 0.4, y)
    pen.stroke()
  }
}
