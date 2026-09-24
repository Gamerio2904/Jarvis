# Sprint 301 — TV-Wahrheit

**Version:** landet in `18.10.0` (historisch `18.5.0`) — **CODE** Must
**Plan:** [`76-next.md`](../76-next.md)
**Voraussetzung:** Sideload `18.4.4`. Kein CEC.

## Ziel

„Fernseher an“ endet mit einer beobachteten Lage, nicht mit „Packet
gesendet“. Intern vs. extern wird an der Reply unterscheidbar.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S301-1 | MAC | `JarvisTvPlugin.java` `addDevice` | `wifiMac`, sonst `mac` / `wiredMac` / `device.mac`. Beide speichern wenn da (`tv_mac` + optional `tv_mac_eth`). Kein doppeltes `optString("wifiMac")` |
| S301-2 | Wake | `doWake` + `tv.ts` | Bestehende Broadcasts 7/9 behalten. Zweite Salve nach 1200 ms. WoL **und** wenn `GET http://host:8001/api/v2/` in 800 ms 200: `KEY_POWERON` (nicht `KEY_POWER`) |
| S301-3 | Observe | `tv.ts` `action==='on'` | Nach Wake 6×500 ms poll Info. 200 → Erfolg „Fernseher ist an.“ Timeout → kein Fake-Erfolg: „Magic-Packet ist raus, der TV antwortet nicht. WOL am Gerät, gleiches WLAN, kein Gastnetz.“ `packVerified` mit `observation` |
| S301-4 | Toggle-Schutz | | `KEY_POWER` nur für `off` oder wenn Poll vorher tot war. Laufender TV wird nicht ausgeschaltet |
| S301-5 | Test | `test-014.mjs` / TV-Tests | Mock: Info 200 nach Wake → Erfolg. Info tot → ehrliche Absage. Keine MAC → bestehende Meldung. `tv_enabled false` unverändert |

## Won’t

- HDMI-CEC. SmartThings. `KEY_POWER` als An ohne State.
- Fire-Stick ohne ADB „an“ versprechen.

## Abbruchkriterium

Reply behauptet „an“, obwohl Poll 4xx/Timeout. Oder ein angeschalteter
TV geht durch „an“ aus.

## Manuell

TV aus, gleiches WLAN, Settings an, MAC da. „Fernseher an“. Wenn der
TV aufwacht: Satz „ist an“. Wenn nicht: Absage mit WOL-Hinweis, nicht
Erfolg.
