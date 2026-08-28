# Sprint 130 — Sleep-Time + Recall-Tool (`6.80`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** |
| Priorität | nach Working Memory `6.70` |
| Ziel-Version | `6.80.0`; Reihe `6.80`–`6.82` in [`46-next.md`](../46-next.md) |
| Voraussetzung | Sprint 129 |
| Quelle | LightMem: sensorisch filtern, Thema, verdichten **offline** |

## Ziel

Job wenn idle/laden oder nach N Turns — nicht im Chat-Pfad, nicht am Steuer im Sprachmodus. Filter: Hilfe, „lauter“, Timer-Echos weg. Upsert nur parser-sicher; JSON-Facts nur wenn Gemini/Groq-Opt-in an. Register-Tool `recall` (Search mergen). Gold + Debug-Gruppe.

## Must

| ID | Inhalt |
|----|--------|
| S1 | Trigger überspringt ehrlich (Fahrt, kein Idle) |
| S2 | Ohne Cloud-Key keine erfundenen Pins |
| S3 | Sleep löscht nicht; Contradiction bleibt User-Parser |
| S4 | `recall` nur Register, kein `if` in `chat.ts` |
| S5 | Gold: Zahnarzt-Recall, Milch-Suche, kein-Kaffee, Gemini-aus |

## Won’t (dieser Sprint)

Python-LightMem. LLMLingua-2. Qdrant. Sleep-Daten zu Google ohne Opt-in. e5-small (Could `6.83`). Sideload (`6.84` nach Hausstand).
