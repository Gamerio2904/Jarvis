# 12 — NAS 24/7 & Android-APK (historisch)

> **Stand 2026-08-15:** **SUPERSEDED.** Jarvis läuft on-device auf dem Handy (`0.13.1`). NAS, Docker, FastAPI, Ollama und Reverse-Proxy entfallen. Aktuell: [`13-on-device.md`](./13-on-device.md) · Sideload: [`apk.md`](./apk.md).

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
