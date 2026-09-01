# Sprint 140 — Sleep-Prune + Consolidation (`7.0.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | V5 Abschluss |
| Ziel-Version | `7.0.0` |
| Quelle | [`49-next.md`](../49-next.md) 7.30, Audit „Bereinigung“ |
| Plan | Industry V5 Teil 4 |

## Ziel

Aufräumen läuft ohne Cloud: abgelaufen, Dump-Werte, niedrige Confidence nach 14 Tagen, Kappe 80. Sleep-Harvest nur ohne Gemini-Key, Confidence 0.4 plus TTL. Pins mit Confidence unter 0.55 kommen nicht in den Prompt.

## Must

| ID | Inhalt |
|----|--------|
| S1 | `pruneStaleMemory` / `pruneMemoryItems` |
| S2 | Sleep schreibt nur Regel-Facts, Origin `sleep` |
| S3 | `memoryBlock` nur `semanticPins` |
| S4 | Version `7.0.0` |

## Won’t

Sleep-JSON an Google. e5-small. Device-Registry V6.

## DoD

- [x] Prune-Fixtures in `test:014`
- [x] Typecheck grün
