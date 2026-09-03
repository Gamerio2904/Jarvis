# Sprint 212 — Hirn hostet `/v1/presence` (`12.30.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** Must |
| Ziel-Version | **`12.30.0`** |
| Quelle | [`59-next.md`](../59-next.md) |
| Vorher | 211 Token |

## Ziel

Das Hirn-Gerät nimmt eine Zeile entgegen und liefert den Verlauf. Fenster haben kein eigenes Memory-Write.

## Must

| ID | Inhalt |
|----|--------|
| H1 | Native Mini-HTTP nur LAN, Port **18791**, Header analog `X-Jarvis-Token` |
| H2 | `GET /v1/presence` — letzte Messages der offenen Conversation (cap) |
| H3 | `POST /v1/presence` — `{ text }` → bestehender `chat.ts`-Pfad, **kein** zweiter Router |
| H4 | Antwort: Assistant-Text + tool-chip roh, keine Secrets (V9 redact) |
| H5 | Server aus = Bind fehlgeschlagen ehrlich |

## Won’t

Zweites `if` in `chat.ts`. Gemini auf dem Fenster. WAN. Always-on Kamera-Stream.

## DoD

- [x] Stub-Client (Node) gegen Mock: POST landet in Store
- [x] Keys nicht im Presence-JSON
- [x] Native Bind auf Sideload-APK fehlt — Handler CODE, Schalter ehrlich „Server aus“
