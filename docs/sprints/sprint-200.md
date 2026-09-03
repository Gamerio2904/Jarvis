# Sprint 200 — Gold = Live-Pfad (`10.65.0`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **CODE** Should |
| Ziel-Version | **`10.65.0`** |
| Quelle | [`57-next.md`](../57-next.md) |
| Vorher | 192 Gold CODE. Intensiv-Probe existiert |

## Ziel

`test:memory-10` misst, was die App wirklich schreibt: `parseMemoryFacts` → oft Key `notiz`, Retrieve inkl. User-Messages, `formatRecallReply`. Die Intensiv-Rots von 196–198 werden Gate, nicht nur `console.log`.

## Must

| ID | Inhalt |
|----|--------|
| L1 | G2/G3 über Merk-Text (`notiz`), nicht nur synthetisches `key=fritzbox`/`reise` |
| L2 | G5 mit Message-Korpus: kein Gespräch-Echo |
| L3 | G4 Copy: Contradiction-Delete **oder** Gate-REVISE — eine Wahrheit, Tests und Kopierprompts gleich |
| L4 | `test:memory-10-intens` exit 1 bei Rot nach 196–198, oder die Fälle wandern nach `test:memory-10` |

## Won’t

MTEB. 1000 synthetische Chats. Sideload-Zwang.

## DoD

- [ ] `npm run test:memory-10` deckt Live-Keys und G5-Echo
- [ ] Copy-Gruppe Memory-10 lügt nicht (REVISE vs Delete)
