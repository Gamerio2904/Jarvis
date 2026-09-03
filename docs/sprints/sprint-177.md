# Sprint 177 — Rest-Gold (`9.10.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Ziel-Version | `9.10.0` (Gold der Serie; Could-Gewichte nicht gebündelt, daher kein `9.10.9`-Bump) |
| Quelle | [`54-next.md`](../54-next.md) · 168–176 |
| Vorher | 168 KATALOG/PO. 170 FGS CODE. 172 Freeze. 174–176 Freeze |

## Ziel

Serie schließen. Default-App = **`9.9.2` plus Debug-FGS plus ehrliche tote Could-Schalter**. Rest Freeze. Parking bleibt Parking.

## Tabelle

| Sprint | Thema | Stand |
|--------|-------|-------|
| 168 | Gerät | **KATALOG** / PO |
| 169 | Debug-Spike | **CODE** GO v2 |
| 170 | Debug FGS | **CODE** |
| 171 | 3060 | **NO-GO** |
| 172 | Sehen | **CODE** Freeze |
| 173 | Could-Leit | **CODE** |
| 174 | Silero+ST | **FREEZE** |
| 175 | Piper | **FREEZE** |
| 176 | Kokoro+e5 | **FREEZE** |
| 177 | Gold | **CODE** |

## Must

| ID | Inhalt | Stand |
|----|--------|-------|
| G1 | Tabelle CODE / Freeze / PO | oben |
| G2 | Debug-Export TTFT / First-Audio / Pfad / P95 | `buildReport.latency` |
| G3 | L1-Smalltalk-Cache nur identisch, ohne Uhr/Wetter/Retrieve | Modul `smalltalk-cache.ts`, **nicht** in `chat.ts` verdrahtet (unsicher am Router) |
| G4 | `test:014`, `test:prompts`, `test:rest-final`, `tsc -b` | Pflicht |
| G5 | Sideload mit Hausstand, Verhalten: Debug überlebt Home | `9.10.0` |

## Won’t

Neue Modelle. Play Store. iOS. Marvel. Encryption-at-rest. Mail/Alexa. e5 als Router.

## DoD

- [x] `54-next.md` Bau-Tabelle auf CODE oder Freeze
- [x] `42-planned.md`: offene Must außer 168-PO und 3060-Warten
