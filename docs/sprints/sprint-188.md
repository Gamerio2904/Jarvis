# Sprint 188 — Memory-Schema + Hausstand (`10.10.0`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** |
| Ziel-Version | **`10.10.0`** |
| Quelle | [`56-next.md`](../56-next.md) §6 |
| Vorher | Sprint 187 |

## Ziel

`MemoryItem` trägt optionale Felder `kind`, `entities`, `event_time`, `tense`, `related_ids`, `importance`, `parent_key`. Alter Hausstand importiert ohne Verlust.

## Must

| ID | Inhalt |
|----|--------|
| S1 | Felder in `store.ts` + Backup-Export/Import Defaults |
| S2 | Settings-Liste zeigt Kind/Entities wenn gesetzt |
| S3 | Write-Pfade setzen `kind` aus bestehender `category`, wenn nichts genauer ist |

## Won’t

Embedding-Spalte. Pflichtfelder die alte Pins ungültig machen. Graph-GUI.

## DoD

- [ ] Export → Wipe → Import: alte Pins da, neue Keys leer ok
- [ ] `test:014` Memory-Write/Recall weiter grün
