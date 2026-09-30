# Sprint 401 — Code in der Antwort

**Version:** `18.21.0` — **PLAN** Must
**Plan:** [`93-next.md`](../93-next.md)
**Voraussetzung:** 399 und 400.

## Ziel

`Übertrage das fürs Tablet` zeichnet die Codes in die Antwort. Die Namen
stimmen mit dem Codec überein.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S401-1 | Bild | `xfer.ts` Chat-Block | Ein QR-Bild pro Stück, Beschriftung `1/3`, ruhiger Rand, groß genug für ein Foto. Kein Netz dafür |
| S401-2 | Satz | `xfer.ts` | Nennt die Dateien im Code und die ausgelassenen beim Namen. Keine Datei und keine Kopierzeile: `Keine Datei im Gespräch. Zuerst den Datei-Knopf.` |
| S401-3 | Test | `test-xfer.mjs` | Zwei kleine Dateien → mindestens ein Bild-Block. Eine über dem Budget → kein Bild dieser Datei, der Name steht in der Antwort |

## Won't

Das Foto auf der anderen Seite. Der Lade-Knopf.

## Abbruchkriterium

Die Antwort sagt, eine Datei sei im Code, die der Codec abgelehnt hat.
