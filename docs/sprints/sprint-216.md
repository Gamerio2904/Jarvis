# Sprint 216 — LAN-Drop / VR Parking (`12.70.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** Could |
| Ziel-Version | **`12.70.0`** |
| Quelle | [`59-next.md`](../59-next.md) · Huw DropVR / „VR is cooked“ |
| Vorher | 212 Presence |

## Ziel

Dateien oder eine Notiz **im WLAN** zum Fenster schieben. Kein Helm.

## Must (wenn Execute)

| ID | Inhalt |
|----|--------|
| X1 | `POST /v1/presence/drop` — Notiz oder Doc-Excerpt, Cap klein |
| X2 | VR/WebXR bleibt Parking-Absatz in Settings |
| X3 | Kein öffentlicher Relay |

## Won’t

Quest-App. AirDrop-Klon für Fotos in die Cloud. Marvel-HUD.

## DoD

- [x] Drop nur mit Token
- [x] Docs: VR = Parking, nicht „kommt als Nächstes“
