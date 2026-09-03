# Sprint 196 — Alias-Lexikon härten (`10.61.0`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Ziel-Version | **`10.61.0`** |
| Quelle | [`57-next.md`](../57-next.md) |
| Vorher | 190 Retrieve 2 CODE |

## Ziel

Alias-Gruppen tragen nur **enge** Alltagspaare. Ein Wort, das in vielen Pins vorkommt, darf nicht die ganze Gruppe zünden.

## Must

| ID | Inhalt |
|----|--------|
| A1 | `passwort` raus aus der WLAN-Gruppe. Treffer über `wlan`/`wifi`/`fritzbox`/`router` |
| A2 | `essen` raus aus der Döner-Gruppe. Pizza-Pin nicht bei `Mag ich Döner?` |
| A3 | `termin`/`arzt`/`kalender` nicht als Zahnarzt-Anker. Zahnarzt bleibt Zahnarzt |
| A4 | `extractEntities` / `aliasQueries` / `expandBlob` dieselbe Regel |
| A5 | G2 bleibt grün: `WLAN-Passwort` trifft FritzBox-Pin (über wlan/fritzbox, nicht über bloßes Passwort) |

## Won’t

Synonym-ML. BM25-Lib. e5. Neue Gruppen ohne Gold.

## DoD

- [ ] Intensiv A1–A6 grün (`test:memory-10-intens`)
- [ ] `test:memory-10` G2/G3 weiter grün
- [ ] Bank-Passwort-Pin nicht vor FritzBox bei WLAN-Query
