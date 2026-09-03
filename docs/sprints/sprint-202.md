# Sprint 202 — Fachwissen Leit + Store (`11.0.0`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** Must |
| Ziel-Version | **`11.0.0`** |
| Quelle | [`58-next.md`](../58-next.md) |
| Vorher | Memory-10 CODE `10.60.0`. Intensiv 196–201 eigene Schiene |

## Ziel

Typen und IndexedDB für **KnowledgePacks**. Prefs-Cap 80 bleibt unangetastet. Kein Parser, kein Prompt, kein Deep-Research in diesem Sprint — nur das Fundament, das 203–208 nicht umbauen müssen.

## Must

| ID | Inhalt |
|----|--------|
| S1 | `KnowledgePack` / `KnowledgeClaim` in eigener Datei (`knowledge-types.ts` oder `knowledge-store.ts`) |
| S2 | Neues Object-Store `knowledge_packs`, DB-Version +1 (`jarvis-ondevice` heute v7) |
| S3 | `PACK_CAP=12`, `CLAIM_CAP=24`, Summary ≤ 800, Claim ≤ 240 |
| S4 | CRUD: list / getByTopic / put / delete. Prune ältestes nicht-`user_ok` zuerst, dann ältestes `updated_at` |
| S5 | Hausstand: optionales `knowledge_packs` in `backup_version: 1` (wie `price_watches`). Alter Export importiert ohne Verlust |
| S6 | Packs **nicht** über `writeMemory` / Gate. Kein `key=notiz` für Papers |

## Won’t

Qdrant. Embeddings. Teach-Parser. Prompt-Inject. APK-Gewichte. `if` in `chat.ts`.

## DoD

- [ ] Store-Roundtrip in Unit (put → list → delete)
- [ ] `test:014` / Memory-Gold unverändert grün
- [ ] Docs = Schema in [`58-next.md`](../58-next.md)
