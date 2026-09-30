# Sprint 407 — Ablage

**Version:** `18.22.0` — **PLAN** Must
**Plan:** [`94-next.md`](../94-next.md)
**Voraussetzung:** 406.

## Ziel

Ein Stück kann die Fläche verlassen und zurückkommen. Wenig Bewegung kürzt
den Weg. Der Tick ist optional.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S407-1 | Parser | `board-parse.ts` | `Wirf <Stück> vom Tisch`, `Schieb <Stück> aus dem Bildschirm`, `Hol <Stück> zurück`, `Räum den Tisch` |
| S407-2 | Ablage | `board-motion.ts` `Workbench.tsx` | Fahrt über den Rand, `off` wahr, letzte Stelle behalten. Ablage links, nur der Name. Zurück fährt an diese Stelle. Schon in der Ablage und schon auf dem Tisch: die Sätze aus dem Plan. `Räum den Tisch` leert die Fläche und lässt `tischplatte_on` an. Quellen und Termine im Speicher bleiben |
| S407-3 | Ruhe | `index.css` | `prefers-reduced-motion`: kurzes Umblenden, kein Flug. Tick etwa 8 ms beim Greifen und Ablegen, nur wenn das Gerät kann. Ohne Tick ist die Fahrt fertig |
| S407-4 | Beiseite | `board.ts` | `Zeig Module` und `Simulier Kalender` holen Module bzw. Draht aus der Ablage auf die Mitte. Der Draht bleibt die bisherige Wireframe-Zeile |

## Won't

Der Ring vor der Fahrt, die Antwort erst nach der Fahrt, Gold.

## Abbruchkriterium

Werfen löscht eine Quelle oder einen Termin, oder `Räum den Tisch` schaltet die Tischplatte aus.
