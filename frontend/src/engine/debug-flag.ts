/** Schmaler Schalter, damit Kalender den Debug-Lauf sieht ohne Zyklus. */

let active = false

export function setDebugRunActive(next: boolean) {
  active = next
}

export function isDebugRunActive(): boolean {
  return active
}
