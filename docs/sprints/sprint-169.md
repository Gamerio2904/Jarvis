# Sprint 169 — Debug-Hintergrund Spike (`5.12`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** |
| Ziel-Version | `5.12.0` (kein Sideload) |
| Quelle | [`54-next.md`](../54-next.md) · [`44-next.md`](../44-next.md) |
| Vorher | Sprint 168 Gerät darf parallel laufen |

## Ziel

Messen, ob der Debug-Lauf bei **Home** stirbt. Votum: Foreground-Service **oder** Freeze mit ehrlichem Banner. Kein Service in diesem Sprint.

## Must

| ID | Inhalt |
|----|--------|
| D1 | Ein physisches Gerät: Lauf starten, Home, 30 s, zurück |
| D2 | Tabelle: Screen an / Screen aus / Home / App-Wechsel / Kill |
| D3 | Ist `setKeepScreenOn` schon an? Reicht das, wenn Settings sichtbar bleiben? |
| D4 | Votum **GO v2** oder **Freeze** in `44-next.md` / `54-next.md` |
| D5 | Kein Auto-Ja, kein zweites Hirn, Wake-Dienst nicht umbiegen |

## Won’t

FGS-Code. Lauf nach Prozess-Kill. Play Store Foreground-Typen-Forschung über eine Seite hinaus.

## DoD

- [ ] Spike-Tabelle mit Gerät + Android-Version
- [ ] Schriftliches Votum GO oder Freeze
- [ ] `test:014` unverändert grün
