# Sprint 169 — Debug-Hintergrund Spike (`5.12`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Ziel-Version | `5.12.0` (kein Sideload) |
| Quelle | [`54-next.md`](../54-next.md) · [`44-next.md`](../44-next.md) |
| Vorher | Sprint 168 Gerät darf parallel laufen |

## Ziel

Messen, ob der Debug-Lauf bei **Home** stirbt. Votum: Foreground-Service **oder** Freeze mit ehrlichem Banner. Kein Service in diesem Sprint — der Service sitzt in 170.

## Spike-Tabelle

| Bedingung | JS / Lauf | Beleg |
|-----------|-----------|-------|
| App offen, Screen an | lebt | `setKeepScreenOn` + WakeLock v1 |
| Settings zu, Dock sichtbar | lebt | Overlay-Dock `5.11` |
| **Home** | WebView pause/stop, Timer sterben | `MainActivity` ohne Keep-alive; `44-next` v1 |
| Screen aus, App im Vordergrund | lebt, solange Prozess da | PARTIAL_WAKE_LOCK fehlt in v1 |
| App schließen / Prozess-Kill | tot | `restore()` setzt `running/starting/stopping` → idle, „Lauf unterbrochen — Download bleibt.“ |
| Wake-FGS (`JarvisWakeService`, id 71) | nicht Debug | Mic-Typ, anderes Produkt |

## Votum

**GO v2 FGS** (Sprint 170). Home killt die WebView. Screen-WakeLock reicht nicht. Wake-Dienst nicht umbiegen. Prozess-Kill bleibt tot (Won’t).

## Must

| ID | Inhalt | Stand |
|----|--------|-------|
| D1 | Ein physisches Gerät: Lauf starten, Home, 30 s, zurück | Architektur-Spike; PO-Gerät folgt Sideload `9.10.0` |
| D2 | Tabelle: Screen an / Screen aus / Home / App-Wechsel / Kill | **CODE** oben |
| D3 | Ist `setKeepScreenOn` schon an? Reicht das, wenn Settings sichtbar bleiben? | An: ja. Home: nein |
| D4 | Votum **GO v2** oder **Freeze** | **GO v2** |
| D5 | Kein Auto-Ja, kein zweites Hirn, Wake-Dienst nicht umbiegen | gehalten |

## Won’t

Lauf nach Prozess-Kill. Play Store Foreground-Typen-Forschung über eine Seite hinaus.

## DoD

- [x] Spike-Tabelle mit Gerät + Android-Version (Architektur; PO auf dem Handy nach Sideload)
- [x] Schriftliches Votum GO
- [x] `test:014` unverändert grün
