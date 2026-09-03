# Sprint 207 — Fachwissen-Gold + Copy (`11.50.0`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** Must |
| Ziel-Version | **`11.50.0`** |
| Quelle | [`58-next.md`](../58-next.md) |
| Vorher | 203–205 mindestens T1–T3/T6. 206 optional |

## Ziel

`test:knowledge-11` (Name frei) misst den **Live-Pfad**, nicht ein synthetisches JSON. Settings-Tests bekommen Kopierprompts. Ohne e5.

## Must

| ID | Inhalt |
|----|--------|
| G1 | T1 Teach-Paste → Pack |
| G2 | T2 Topic-Ask → Pack-Antwort |
| G3 | T3 Mate-Ask → kein Pack-Leak |
| G4 | T4 zweites Fach unabhängig |
| G5 | T5 Forget |
| G6 | T6 `isDeepResearch` + Query-Count (Netz mockbar) |
| G7 | Copy-Gruppe **Fachwissen-11**: Reel-Satz (ohne Marvel-Magie) + Alltagsfach (Steuer oder FritzBox-Doku) |

## Won’t

MTEB. 1000 Chats. Reel-Audio als Fixture. e5.

## DoD

- [ ] `npm run test:knowledge-11` grün ohne Encoder
- [ ] Memory-10 Gold weiter grün
- [ ] Copy lügt nicht (Offer vs stilles Speichern)
