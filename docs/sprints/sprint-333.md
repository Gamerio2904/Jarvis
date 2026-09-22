# Sprint 333 — Rules-first Verify

**Version:** `18.9.2` — **PLAN** Must
**Plan:** [`80-next.md`](../80-next.md)
**Voraussetzung:** 331. EdgeCat: Richter nur bei Ambivalenz.

## Ziel

Nach einem Write prüft das **Modul** `ok` / `leer` / `fehler`. Nur `leer`
darf einen Ein-Satz-Groq-Check (JSON, kein Chat). Erfolg nur bei `ok`.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S333-1 | Pack | `packVerified` / Agent-Result | `verify: 'ok' \| 'empty' \| 'error'` an Write-Agenten die es schon können |
| S333-2 | Director | `director.ts` | `error` → `failureReply`. `ok` → Reply des Moduls. `empty` → optional Groq-JSON „liegt der Satz?“ |
| S333-3 | Guard | `guards.ts` | `Ist erledigt` / `lautet jetzt` bleibt gestrichen, auch nach Verify |
| S333-4 | Test | `test-turn-e2e.mjs` | Kalender-Create ohne Event in IDB → keine Erfolgszeile |

## Won’t

- Generischer LLM-Kritiker nach jedem Zug. Z3. Zweites Hirn.

## Abbruchkriterium

Verify-LLM ändert einen Write oder erfindet einen Termin.

## Manuell

Termin anlegen, sofort „Änder …“. Titel steht. Kein „Ist erledigt“ ohne Store-Zeile.
