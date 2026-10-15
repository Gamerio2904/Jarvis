# Sprint 540 — Beschworene Spalte selbst wählen

**Version:** `18.56.0` — **CODE** Must

**Plan:** [`../106-next.md`](../106-next.md)

**Hängt an:** 511

**Gateway:** go

## Ziel

Mehrere legale Spalten leuchten, und der Spieler tippt eine. Extra-Deck-Monster nur in eine Extra-Monsterzone oder eine von einem eigenen Link gezeigte Hauptspalte.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S540-1 | Zonen | `yugioh-zones.ts` | Eine nicht gezeigte Spalte ist nicht wählbar. Es entsteht keine sechste Hauptzone. engineStamp erhöhen. |
| S540-2 | Tests | `test-yugioh-rules.mjs` | Zwei freie Spalten verlangen eine Wahl. Eine einzelne legale Spalte darf ohne Extra-Tipp belegt werden. |

## Go, No-Go, Abbruch

- Go, wenn: Die Engine legt bei mehreren legalen Spalten nicht mehr in die erste freie.
- No-Go, wenn: Eine fremde Extra-Monsterzone oder eine vom Link nicht gezeigte Spalte nimmt die Karte an.
- Abbruch: Die Wahl widerspricht linkExtraZones oder extraSummonZone.
