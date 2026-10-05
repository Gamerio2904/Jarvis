# Sprint 69 — Losgehen (`1.17.0`)

| Feld | Wert |
|------|------|
| Status | **CODE** (in `1.24.0`) |
| Priorität | **MUST** |
| Ziel-Version | **`1.17.0`** |
| Quelle | PO 2026-08-16 · [`19-next.md`](../19-next.md) |

## Must

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| G0 | Ort am Termin im selben Satz | `Termin 15 Uhr Zahnarzt Bahnhofstraße` speichert beides |
| G1 | „Wann muss ich zum Zahnarzt los?“ | Nutzt Termin + Ort |
| G2 | Kein Ort → nachfragen, merken | Nicht „irgendwo in der Stadt“ erfinden |
| G3 | GPS jetzt; sonst nachfragen | Keine erfundene Fahrzeit |
| G4 | Route/Dauer über Netz | Ankunft = Termin − Fahrt − Puffer |
| G5 | Version `1.17.0` + APK | Sideload |

## Probe

1. `Termin morgen 15 Uhr Zahnarzt Bahnhofstraße` → Ort liegt am Termin.
2. Termin ohne Adresse → „Wo ist der Zahnarzt?“
3. Ort nennen → Uhrzeit zum Losgehen.
4. Ort aus Person („Freundin“) wenn verknüpft.

## Won’t

Google-Maps-Login, Navigation als eigene App, Gerät komplett aus.
