# Sprint 111 — Alltagskette Stimme **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | **MUST** |
| Ziel-Version | `4.19.0` (bündelt `4.20`–`4.31`, ohne Sideload) |
| Quelle | PO: Reel Sprachnachricht + Bar + Taxi |
| Plan | [`36-next.md`](../36-next.md) |

## Code

- POI `bar`/`pub` (Kneipe). Café bleibt Café. Minibar nicht.
- `Sprachnachricht` = SMS-Text, Satz „keine Voice-Note“.
- Tool `taxi`: nach Ja Anruf Kontakt Taxi oder Uber/FreeNow-Link. Nie „ist bestellt“.
- Split: `und` / `dann` / Komma. Lesen (Bar) sofort, Schreiben in `chain_json`. Ein Ja = ein Schritt.
- WhatsApp: nach Ja `wa.me`, User sendet. Still **Won’t**.
- Audio-Clip `4.29` **entfällt**.

Kein neuer Sideload.
