# Sprint 106 — Tablet-Modus + Telefon-Stuck (`2.3.0`)

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | **MUST** |
| Ziel-Version | **`2.3.0`** |
| Quelle | PO-Debug: `phone_ask` klebt; PO: Vollbild / Tablet |
| Voraussetzung | `2.2.2` |
| Plan | PO live, vor DWD |

## Ziel

Nummer-Nachfrage verschluckt keine anderen Befehle mehr. Kontakte per „ist“ und „Nummer für …“. Tablet-Vollbild mit Animation, Name, Befehlen, Bild und Wetter.

## Must

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| T1 | `phone_ask` lässt TV, Lautstärke, Café, Fragen durch | `Fernseher an` nach fehlender Nummer steuert den TV |
| T2 | `Meine Freundin ist Odett` + `Nummer für Freundin +49…` | Alias und Kontakt liegen, `Ruf Odett an` fragt nicht nach einer neuen Nummer |
| T3 | `Ja` nach Smalltalk startet nicht den letzten TV-Befehl | `rewriteFollowUp('ja', tv)` = null |
| T4 | `aktiviere fullscreen` | Vollbild-HUD, Animation, hört auf Jarvis |
| T5 | Foto und Wetter im Vollbild | `zeig das bild`, `zeig das Wetter`, Statuskarte |
| T6 | Sideload `2.3.0` | versionCode 20300 |

## Probe

`Meine Freundin ist Odett` → `Nummer für Freundin +49…` → `Ruf Odett an` fragt nach dem Anruf, nicht nach der Nummer. Danach `Fernseher an` schaltet den TV, nicht die Nummer. `Wo kann ich jetzt in ein cafe` findet Cafés. `aktiviere fullscreen` füllt den Schirm.

## Won’t

DWD, Apple CarPlay, neue TTS-Firma, Tuya-Cloud.
