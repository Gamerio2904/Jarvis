# Sprint 15 — Verlässliche Internet-Research

| Feld | Wert |
|------|------|
| Status | **READY FOR REVIEW** |
| Ziel-Version | **`0.6.0`** |
| Quelle | [`10-intelligence-capabilities.md`](../10-intelligence-capabilities.md) § 7 |

## Ziel

Opt-in **Research mit Quellen**: nachvollziehbar, zitiert, wiederholbar — **kein Raten** ohne Beleg. Local LLM synthetisiert nur aus Snippets.

> „100 % verlässlich“ = Engineering-DoD (Citations, Opt-in, Allowlist, Audit, Refuse ohne Quelle) — nicht epistemische Allwissenheit.

## Must

| ID | Story | Done wenn |
|----|-------|-----------|
| R1 | **Opt-in Toggle** in Settings (Default **Aus**) | Ohne Opt-in kein Netzaufruf — auch bei Research-Intent |
| R2 | **Retrieval-Pipeline** — Query → Allowlist-Provider → Snippets+URLs+Timestamp lokal | Rohdaten persistiert pro Turn |
| R3 | **Citation-required Synthese** — Antwort nur aus Snippets; faktische Claims stützbar | Jede harte Aussage hat Quelle |
| R4 | **No-source refuse** — unbeantwortbar / Netz down / leer → klare Meldung, kein Fülltext | Eval-Cases grün |
| R5 | **UI** — Badge „Mit Quellen“, flach aufklappbare Quellenliste | Keine Nested-UI |
| R6 | **Audit-Log** — Query, Zeit, Quellen lokal einsehbar | PO kann Turn nachvollziehen |
| R7 | Eval-Suite Research + Version `0.6.0` | `eval`-Cases + Health |

## Should

| ID | Inhalt |
|----|--------|
| R8 | Widerspruchs-Hinweis wenn Quellen divergieren |
| R9 | Privacy-Hinweis: nur minimierte Query geht raus |

## Won’t

- Cloud-LLM als Denker
- Scraping ohne Transparenz
- Research als Default-on
- Research Hotfix/Polish (→ Sprints 16–17 / `0.6.1`–`0.6.2`)
- Delight-Pack (→ Sprint 18 / `0.7.0`)

## Abhängigkeiten

- Intent-Router erkennt `research` (Sprint 12 / `0.5.0`)
- Empfohlen: Router-Hotfix `0.5.1` (Sprint 13); Polish `0.5.2` optional
- Settings-Toggle (kann minimal hier landen; volles Settings-UX in Sprint 18)

## Exit

Live: Frage mit Quellen beantwortet; unbekannte Frage → Refuse; Opt-in aus → kein Netz. Tag **`v0.6.0`**.
