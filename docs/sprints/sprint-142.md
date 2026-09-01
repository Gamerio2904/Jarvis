# Sprint 142 — Stabilität Kern (`6.91.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | vor Recall `7.0` und Alltag `8.0` |
| Ziel-Version | `6.91.0` |
| Quelle | Phase-0-Audit [`51-phase0-audit.md`](../51-phase0-audit.md), PO-Screenshots |
| Plan | Industry V1 Teil 1 |

## Ziel

Root Causes aus Audit und Chat-Screenshots: Debug-Session, Turn-Gate, Parser-Falschalarme (Ort, Wetter, Aldi, Route-Replace), Titel-Ellipsis, Recall-Dumps, Street View + Globe-Stumpf. Kein neues Feature-Major.

## Must

| ID | Inhalt |
|----|--------|
| A1 | `turn-gate.ts` — Request-ID, Dedup, UI-Lock, Conversation-Lock |
| A2 | `debug-session.ts` — FSM, 90 s Timeout/Turn, Persist, eigene conversationId |
| A3 | Settings-Unmount tötet den Lauf nicht; Chat + Download danach |
| A4 | Android-Back / popstate schließt Overlay |
| A5 | Drive `closeGen` — stale onDone öffnet nicht |
| A6 | `WRITE_DASH` keine Vereinsliste |
| A7 | Wetter-Greeting ist kein Follow-up |
| A8 | Fahrmodus: „lieber nach Freiberg am Neckar“ = dest |
| A9 | POI-Brand Aldi/Lidl/Rewe/Edeka; Grocery-List-Namen weg |
| A10 | Chat-Titel Ellipsis; `test:014` inkl. Screenshot-Fälle |
| A11 | Street View von London: Kugel fliegt, Chip „Geht nicht“ |
| A12 | `briefPlace` ohne leere Tagesschau; Polish 300 Tokens + Truncation-Guard |
| A13 | Recall/Search: `formatRecallReply`, nie `Gesprächstitel: body` |
| A14 | `RECALL_ALL` listet Memory-Fakten, kein retrieve-Dump |
| A15 | `onMeta` reicht die Conversation an die UI (Header sofort) |

## Won’t

Foreground-Service `5.12`. WebRTC. Memory-Graph. PDF. SmartThings. App-Action-Registry. TTS-Kaskade (Sprint 145).

## DoD

- [ ] `test:014` grün
- [ ] Typecheck grün
- [ ] Vereinsliste speichert keinen Ort
- [ ] Greeting löst kein Wetter aus
- [ ] Replace-Dest nur im Fahrmodus
- [ ] Debug-Turns gehen nicht in den Alltagschat
- [ ] Street View London: Route `wont`, Label deutsch, Gazetteer-Ort
- [ ] Recall-Reply ohne `Zeig mir London:`
- [ ] `Was weißt du über mich` ohne RAG-Dump
