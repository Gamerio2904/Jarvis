# Sprint 206 — Settings Daten: Fachwissen (`11.40.0`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **CODE** Should |
| Ziel-Version | **`11.40.0`** |
| Quelle | [`58-next.md`](../58-next.md) |
| Vorher | 202–204 (Liste braucht Store + Teach) |

## Ziel

Packs sind sichtbar, löschbar, im Hausstand. Kein zweites Backup-Format.

## Must

| ID | Inhalt |
|----|--------|
| U1 | Settings → Daten: Abschnitt Fachwissen (Titel, Claim-Zahl, Datum) |
| U2 | Löschen einzeln. „Alle Packs“ mit Confirm, Prefs bleiben |
| U3 | Export/Import Hausstand enthält `knowledge_packs` |
| U4 | Leerzustand ehrlich: „Noch kein Fachwissen. Nach einer Recherche «lern das» sagen.“ |
| U5 | Settings-IA-Topic `daten` findet „Fachwissen“ / „Pack“ |

## Won’t

Graph-UI. Markdown-Zweitwelt. Cloud-Sync. Pack-Editor mit Markdown.

## DoD

- [ ] Export → Wipe → Import stellt Packs wieder her
- [ ] Memory-Pins unverändert
