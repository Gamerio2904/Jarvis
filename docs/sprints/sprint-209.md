# Sprint 209 — Drei-Flächen Leit (`12.0.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** Must |
| Ziel-Version | **`12.0.0`** |
| Quelle | [`59-next.md`](../59-next.md) |
| Vorher | Tablet `4.53` CODE. PC V7–V9 CODE |

## Ziel

Rollen festnageln, bevor jemand ein zweites Hirn baut. Settings und Docs sagen dasselbe: ein Gedächtnis, drei Fenster.

## Must

| ID | Inhalt |
|----|--------|
| L1 | Settings → Gerät: Rollenkarte Handy / Tablet / PC (Hirn vs Fenster vs Werkzeug) |
| L2 | Copy: „Tablet allein = Hirn. Tablet + Handy = Fenster braucht Token.“ |
| L3 | Won’t-Zeile: kein Cloud-Account, kein Quest-Must, kein zweites IndexedDB |
| L4 | `13-on-device.md` / `desktop/README.md` auf `10.60.2` + Verweis 59 |

## Won’t

Presence-HTTP. Native Server. Layout-Rewrite. APK-Gewichte.

## DoD

- [x] Texte live in Settings, nicht nur Docs
- [x] Kein Verhalten geändert außer Copy (Execute 210+ legt Layout/Presence drauf)
