# Sprint 170 — Debug FGS v2 oder Freeze (`5.17`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** |
| Ziel-Version | `5.17.0` |
| Quelle | [`54-next.md`](../54-next.md) · Sprint 169 Votum |
| Vorher | **169** muss GO oder Freeze geliefert haben |

## Ziel

Nach Spike **169**: entweder Foreground-Service „Jarvis testet…“ plus WakeLock, damit Home den Lauf nicht killt — oder Freeze: Banner *Bitte App offen lassen.* App **schließen** bleibt tot.

## Must (nur bei GO)

| ID | Inhalt |
|----|--------|
| F1 | FGS nur für den Debug-Lauf, Text deutsch, Notification bestehendes `notify.ts` / Alarm-Kanal |
| F2 | Stop/Ende → Service aus, `setKeepScreenOn(false)` |
| F3 | Kein zweites Hirn, kein Wake-Word-Missbrauch |
| F4 | Kill der App = Lauf tot (Won’t ändert sich nicht) |
| F5 | Sideload nur mit Hausstand, Version nicht unter `9.9.2` |

## Must (Freeze)

| ID | Inhalt |
|----|--------|
| Z1 | Ein Satz im Debug-Fenster: App offen lassen, Home kann den Lauf beenden |
| Z2 | Kein toter Service-Stub |

## Won’t

Lauf ohne offene APK. Auto-Ja. Zweiter permanenter FGS. iOS.

## DoD

- [ ] 169-Votum umgesetzt (Service **oder** Banner)
- [ ] Home-Test wiederholt
- [ ] `test:014` / `tsc -b` grün
