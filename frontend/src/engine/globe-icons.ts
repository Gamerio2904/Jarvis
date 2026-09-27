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

export function aircraftScale(zoom: number): number {
  const z = Number.isFinite(zoom) ? zoom : 1
  if (z >= 10) return 1.55
  if (z >= 6) return 1.25
  return 1
}

export function drawAircraft(
  pen: CanvasRenderingContext2D,
  x: number,
  y: number,
  heading?: number,
  scale = 1,
): void {
  const s = Number.isFinite(scale) && scale > 0 ? scale : 1
  pen.save()
  pen.translate(x, y)
  pen.rotate(headingRad(heading))
  pen.scale(s, s)
  pen.beginPath()
  pen.fillStyle = 'rgba(158, 203, 255, 0.18)'
  pen.arc(0, 0, 8.4, 0, Math.PI * 2)
  pen.fill()
  pen.fillStyle = '#b8dcff'
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
  pen.strokeStyle = 'rgba(18, 36, 62, 0.55)'
  pen.lineWidth = 0.7
  pen.stroke()
  pen.beginPath()
  pen.fillStyle = 'rgba(255, 255, 255, 0.62)'
  pen.arc(0, -3.1, 1.05, 0, Math.PI * 2)
  pen.fill()
  pen.restore()
}

export function drawSat(pen: CanvasRenderingContext2D, x: number, y: number, iss: boolean): void {
  const panelW = iss ? 7.2 : 5.2
  const panelH = iss ? 2.4 : 2
  const body = iss ? 3.2 : 2.4
  pen.beginPath()
  pen.fillStyle = iss ? 'rgba(200, 220, 255, 0.16)' : 'rgba(180, 205, 230, 0.1)'
  pen.arc(x, y, iss ? 11 : 8, 0, Math.PI * 2)
  pen.fill()
  pen.strokeStyle = 'rgba(210, 230, 255, 0.7)'
  pen.lineWidth = 1.2
  if (iss) {
    pen.beginPath()
    pen.arc(x, y, 9, 0, Math.PI * 2)
    pen.stroke()
  }
  pen.fillStyle = 'rgba(140, 180, 220, 0.95)'
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

export function drawFire(pen: CanvasRenderingContext2D, x: number, y: number, pulse = 0): void {
  const lift = 1 + Math.sin(pulse || 0) * 0.1
  pen.save()
  pen.translate(x, y)
  pen.scale(1, lift)
  pen.beginPath()
  pen.fillStyle = 'rgba(224, 96, 64, 0.2)'
  pen.arc(0, 1, 11, 0, Math.PI * 2)
  pen.fill()
  pen.beginPath()
  pen.fillStyle = '#e07050'
  pen.moveTo(0, -8)
  pen.quadraticCurveTo(6, -1, 3.2, 5)
  pen.quadraticCurveTo(0, 8, -3.2, 5)
  pen.quadraticCurveTo(-6, -1, 0, -8)
  pen.closePath()
  pen.fill()
  pen.beginPath()
  pen.fillStyle = '#f0c060'
  pen.moveTo(0, -1)
  pen.quadraticCurveTo(2.2, 2, 0, 5.2)
  pen.quadraticCurveTo(-2.2, 2, 0, -1)
  pen.fill()
  pen.restore()
}

export function drawQuake(pen: CanvasRenderingContext2D, x: number, y: number): void {
  pen.beginPath()
  pen.strokeStyle = 'rgba(240, 160, 96, 0.5)'
  pen.lineWidth = 1.4
  pen.arc(x, y, 9, 0, Math.PI * 2)
  pen.stroke()
  pen.beginPath()
  pen.fillStyle = '#f0a060'
  pen.moveTo(x, y - 5.5)
  pen.lineTo(x + 5.2, y + 4.2)
  pen.lineTo(x - 5.2, y + 4.2)
  pen.closePath()
  pen.fill()
}

export function drawStorm(pen: CanvasRenderingContext2D, x: number, y: number): void {
  pen.beginPath()
  pen.fillStyle = 'rgba(232, 184, 74, 0.2)'
  pen.arc(x, y, 10, 0, Math.PI * 2)
  pen.fill()
  pen.beginPath()
  pen.fillStyle = '#e8b84a'
  pen.arc(x - 2.2, y - 1.4, 4.1, 0, Math.PI * 2)
  pen.arc(x + 2.6, y - 0.8, 3.2, 0, Math.PI * 2)
  pen.fill()
  pen.beginPath()
  pen.fillStyle = '#f4d48a'
  pen.moveTo(x + 0.4, y + 1.4)
  pen.lineTo(x + 3.1, y + 7.4)
  pen.lineTo(x - 0.6, y + 4.1)
  pen.lineTo(x + 1.3, y + 4.1)
  pen.lineTo(x - 2.3, y + 8)
  pen.lineTo(x - 0.3, y + 1.4)
  pen.closePath()
  pen.fill()
}
