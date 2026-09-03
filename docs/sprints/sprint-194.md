# Sprint 194 — Experience / Utility-Prune (`10.60.0`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** Should |
| Ziel-Version | **`10.60.0`** |
| Quelle | [`56-next.md`](../56-next.md) §11 |
| Vorher | Sprint 192 (Eval da, sonst Utility blind) |

## Ziel

Korrektur des Nutzers (`stimmt nicht`, `vergiss …`) markiert den letzten Recall-Hit als wenig nützlich. Prune darf das neben Confidence nutzen.

## Must

| ID | Inhalt |
|----|--------|
| U1 | Zähler `not_useful` am Pin oder schmales Log in IDB, im Hausstand |
| U2 | Prune: niedrige Utility + alt vor hoher Confidence, Pins `name`/`zuhause`/`boundary` bleiben |
| U3 | Kein automatisches Anpassen der Retrieve-Boosts |

## Won’t

Fine-Tune. Hard-Negative-Datensatz. Nachts `w_entity` ändern. Skill-Codegen.

## DoD

- [ ] Nach REVISE/Forget: Gold G1–G6 nicht regressiv
- [ ] Hausstand rund
