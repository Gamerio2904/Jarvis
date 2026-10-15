# Sprint 533 — Ziele auf dem Feld antippen

**Version:** `18.53.0` — **PLAN** Must

**Plan:** [`../106-next.md`](../106-next.md)

**Hängt an:** 531

**Gateway:** offen

## Ziel

Nach Ja leuchten nur legale Karten, eigene blau und gegnerische rot, und ein Tipp bestätigt das Ziel.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S533-1 | Markierung | `YugiohDuel.tsx` | Zwei oder mehr Kandidaten für Zerstören, Verbannen, Bounce oder Revive verlangen einen Tipp. Abbrechen legt die Aktivierung zurück. |
| S533-2 | Tests | `test-yugioh-rules.mjs` | Ein illegales Ziel lässt sich nicht bestätigen. Ein einzelnes legales Ziel darf ohne Extra-Schritt gelten, wenn der Text nur eines zulässt. |

## Go, No-Go, Abbruch

- Go, wenn: Die Engine wählt bei mehreren Kandidaten nicht mehr still.
- No-Go, wenn: Die Markierung zeigt eine Karte, die die Zielregel ausschließt.
- Abbruch: Die Tipp-Wahl widerspricht dem Validator aus Sprint 526.
