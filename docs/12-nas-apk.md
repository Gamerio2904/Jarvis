# 12 — NAS 24/7 & Android-APK **SUPERSEDED**

> **Historisch.** On-Device ab `0.13.0`: [`13-on-device.md`](./13-on-device.md). **Jetzt:** Sideload [`apk.md`](./apk.md) `6.60.0`. Compose/`deploy/` und NAS-LLM **Parking**. Tote Links auf `13-lan-proxy.md` / `deploy-nas.md` entfernt.

Die Reihe `0.10.x` (Compose + Token-APK) und `0.12.0` (NAS-Proxy) bleiben als **Planungshistorie** in den Sprint-Dateien 34–39 und 43. Sie sind **kein** nächster Schritt.

## Warum entfallen

- DS218 kann kein LLM.
- PO 2026-08-14: komplett auf dem Handy, Altlasten löschen.
- Die APK denkt selbst — sie braucht kein Backend im Hausnetz.

## Was stattdessen gilt

| Früher geplant | Jetzt |
|----------------|-------|
| Compose auf der NAS | entfällt |
| Owner-Token + NAS-URL | entfällt |
| APK gegen `:8080` | APK **ist** Jarvis |
| `1.0.0` = NAS | `1.0.0` = späterer MAJOR, Inhalt PO |

Samsung-TV war nie Teil von `0.10` und ist **geparkt** (`0.11.x`).
