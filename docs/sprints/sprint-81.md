# Sprint 81 — Alltag 1.29 (`1.29.0`)

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | **MUST** |
| Ziel-Version | **`1.29.0`** |
| Quelle | PO 2026-08-17 Screenshot + Fire TV + GUI + Widget + [Ventilator](https://www.amazon.de/dp/B0CGQSNR76) |
| Voraussetzung | Sideload `1.28.3` |

## Ziel

Suche liefert Links statt Canned. Fire TV läuft in der APK. GUI mit Icons, runder Mic. Widget 2×4 mit Sprache an/aus. Ein Deckenventilator über LAN-Brücke.

## Must

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| R1 | Gemini-Text bei Suche behalten | Kein Canned über einer echten Antwort |
| R2 | Quellen: Grounding + DDG + Wikipedia | Klickbare Links |
| R3 | Badge nie `empty` | Deutscher Status |
| R4 | Composer-Layout | Text nicht senkrecht |
| T1 | Fire TV ohne `'in'`-Check | Plugin in der APK |
| G1 | Icon-Composer, Mic rund | Foto/Mic/Senden ohne Text-Pills |
| W1 | Widget 2×4 + Mikro-Toggle | Wake-Word an/aus vom Homescreen |
| F1 | Broadlink lokal, Codes auf dem Gerät | Kein Cloud-Konto |
| F2 | Settings → Haus: IP, lernen, testen | Text unter dem Knopf |
| F3 | `Ventilator an/aus`, Stufe, Licht | Parser vor dem LLM |
| F4 | Ungepaart ehrlich | Kein Fake-Erfolg |
| F5 | Version `1.29.0` | Sideload nach 1.28.3 |

## Probe

Siehe [`23-next.md`](../23-next.md).

## Won’t

Alexa, Tuya-Cloud, Home Assistant als Hub, Confirm, Play Store.
