# Sprint 127 — Agentic Recall Leitentscheidung (`6.60`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** |
| Priorität | nach Hirn-Schliff `6.50` in derselben Lieferung; **darf** vor Bühne `6.10` wenn PO Intelligenz zuerst will |
| Ziel-Version | `6.60.0` (Research in diesem Doc; Bau `6.61`–`6.65` = Sprint 128) |
| Quelle | PO: NVIDIA Agentic Retrieval, MemAgent, LightMem — Fragen LanceDB/Nemotron, Gemini-Opt-in, Won’t Punkt 8 |
| Plan | [`46-next.md`](../46-next.md) |
| Baut auf | Memory `0.4` / Chatsuche `1.24` / Register `3.0` / Gemini Opt-in `0.16` |

## Ziel

Festschreiben, **was** nach `6.50` die nächste Intelligenz ist: lokale Retrieve-Schleife über IndexedDB. Kein LanceDB, kein Nemotron, kein zweites Cloud-Produkt. Kein Execute.

## Must

| ID | Inhalt |
|----|--------|
| R1 | Vorteile/Nachteile LanceDB + Nemotron schriftlich, Votum Won’t |
| R2 | Cloud = bestehende Kaskade Gemini→Groq, Default aus; Sleep ohne Key nur Regeln |
| R3 | Punkt 8 (Embedding-Router, 0,5B-Tools, keine Python-Deps, kein Alles-Mitschneiden, kein Auge in dieser Schiene) begründet |
| R4 | Version `6.60`, kein Clash mit `5.0` Kugel / `6.0` Bühne |
| R5 | Execute braucht kein PC/WebGL |

## Won’t (dieser Sprint)

Code. Sideload. Modellwechsel. Neue Tools im Register.
