# Sprint 197 — Recall leer ohne Gespräch-Echo (`10.62.0`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Ziel-Version | **`10.62.0`** |
| Quelle | [`57-next.md`](../57-next.md) |
| Vorher | 190/192 CODE. Live G5 rot |

## Ziel

Wenn kein Memory-/Kalender-/Notiz-Treffer da ist, sagt Recall **Nichts Belegtes** — nicht die eigene Frage als *Gespräch:* mit Chip *Gedächtnis*.

## Must

| ID | Inhalt |
|----|--------|
| E1 | User-Turn der aktuellen Frage zählt nicht als Retrieve-Hit |
| E2 | `pickRecallHits` / `formatRecallReply`: Messages nicht als Erfolg, wenn Memory-Pool nach Goal-Filter leer ist |
| E3 | Live und Unit: `Welche Reisen plane ich?` ohne Goal-Pin → `Nichts Belegtes`, kein `Gespräch:` |
| E4 | Verify nicht `cited=true` nur weil ein Message-Hit existiert |

## Won’t

Messages komplett aus Retrieve werfen (alte Chatsuche `7.0` bleibt für *wo stand das mit*). e5.

## DoD

- [ ] Intensiv „G5 live kein Gespräch-Echo“ grün
- [ ] Chat-Repro wie in [`57-next.md`](../57-next.md) dieselbe Frage → ehrlicher Leer-Satz
- [ ] `Was weißt du über den Zahnarzt` bleibt Recall auf Pins/Kalender, nicht tot
