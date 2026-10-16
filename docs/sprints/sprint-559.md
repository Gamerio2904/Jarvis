# Sprint 559 — Loslassen und Welt-Gate

**Version:** `18.66.0` — **PLAN** Must

**Plan:** [`../107-next.md`](../107-next.md)

**Hängt an:** 558

**Gateway:** go

## Ziel

Loslassen übergibt die Bewegung der Hand. Der andere Würfel bleibt liegen. Schließen beendet die Sitzung.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S559-1 | Loslassen | `welt.ts`, `welt-physik.ts` | Das Gelenk geht weg. Der Würfel bekommt die Geschwindigkeit der Hand, fällt, stößt und wechselt zu `liegt`. Die Ruhe-Lage ist der neue Anker. Die Zeile sagt `abgesetzt`. |
| S559-2 | Der andere | `test-welt.mjs` | Während `w2` fällt, bleiben Lage und Drehung von `w1`, solange sie sich nicht berühren. |
| S559-3 | Sitzung | `WeltOverlay.tsx`, `107-next.md` | Schließen verwirft die Sitzung. Das Geräteergebnis wird an A5–A12 geschrieben. L1 bis L4 bleiben stehen. Ein No-Go wird nicht still auf go gesetzt. |

## Go, No-Go, Abbruch

- Go, wenn: A12 gilt und die Lücken L1 bis L4 im Plan noch benannt sind.
- No-Go, wenn: Loslassen einen unbeteiligten Würfel verschiebt, Schließen die Welt der nächsten Sitzung still wiederherstellt, oder `Scanne den Raum` die Welt öffnet.
- Abbruch: Ein gespeichertes Zimmer, Verdecken durch echte Möbel, eine zweite Hand, Quest. Die Versionsnummer `18.66.0` setzt nur dieser Sprint, und nur beim Bauen.

## Prompt

Beim Öffnen der Finger übernimmt der Würfel die Bewegung der Hand, fällt, stößt und bleibt liegen. Seine neue Ruhe-Lage ist der Anker. Der andere Würfel bleibt unverändert, solange ihn niemand trifft. Schließen beendet die Sitzung und stellt sie beim nächsten Öffnen nicht wieder her. Schreibe das Geräteergebnis in den Plan. Ein Fehlschlag bleibt ein Fehlschlag.
