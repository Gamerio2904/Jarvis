# Sprint 370 — Geburtstag schreibt ins Personen-Knäuel

**Version:** `18.16.0` — **CODE** Must
**Plan:** [`88-next.md`](../88-next.md)
**Voraussetzung:** 369.

## Ziel

„Mama hat am 3. März Geburtstag“ landet im **selben** Graph wie später Tel
und Ort. Reminder für den Alarm bleibt.

## Ist

`birthday.ts` ruft `upsertMemory` nackt. Kein Gate, keine `entities`, keine
`related_ids`. `writeMemory` in `memory-gate.ts` kann MERGE/REVISE und
`neighborLinks`.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S370-1 | Gate | `birthday.ts` | `writeMemory({ key: name, value: '3.3.', category: 'birthday', spoken, entities: extractEntities(name, value) })` statt nacktem Upsert |
| S370-2 | Reminder | `birthday.ts` | `addReminder` + Notify **unverändert** (Wecker-Pfad) |
| S370-3 | Link | `memory-gate.ts` | Nach STORE/REVISE: bestehende Rows mit überlappenden Entities (mama/mutter) in `related_ids` |
| S370-4 | Alte Pins | einmalig oder lazy | Vorhandene `category=birthday` ohne entities: beim nächsten Write oder Recall `extractEntities` nachziehen. Kein Cloud-Job |
| S370-5 | Route | Gold | Sweep-Satz bleibt `birthday`. Kein Diebstahl durch recall beim **Schreiben** |

## Won’t

Kalender-Event „Samstag Geburtstag Jakob 18 Uhr“ umbiegen. Das bleibt
`calendar`. Kein zweiter Agent im Zug.

## Abbruchkriterium

Geburtstag ohne Reminder. Oder Gate DROP löscht den Pin still. Oder Write
startet Groq.

## PO-Prüfung

1. Satz wie Gold: Erinnerung steht, Pin steht.
2. Speicher (Debug/Export): entities enthalten mama **und** mutter.
