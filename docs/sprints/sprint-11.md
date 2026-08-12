# Sprint 11 — Memory Hotfix (nach 0.4.2 Deep-Test)

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Priorität | **HOTFIX / HIGH** — vor Router (`0.5.0`) |
| Ziel-Version | **`0.4.3`** |
| Quelle | Deep-Test Feedback zu Sprint 10 (`0.4.2`) |

## Ziel

Die drei Qualitätslücken aus dem `0.4.2`-Test schließen, **bevor** Intent-Router kommt: saubere Multi-Fakt-Values, stabiler Recall ohne Aussetzer, präzisere Pref-Extraktion bei Speichere/Notiere.

## Must

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| H1 | **Beruf-/Clause-Split härten** — `arbeite als …` endet vor `und` / Satzgrenze; kein Nachsatz im Value | `… arbeite als Ärztin und mein Hund heißt Luna` → Beruf=`Ärztin`, Hund=`Luna` (kein Misch-Value) |
| H2 | **Recall ohne Aussetzer** — bei Token-Hit / injiziertem Memory: kein finales `SAFE_DEGENERATE` / „Kurzer Aussetzer…“; eigener Recall-Nudge oder Memory-Ack-Pfad | Eval: ≥2 Recall-Phrasen (`Erinnerst du dich an meinen Job?`, `Was ist mein Job nochmal?`) liefern Fakt, nicht Aussetzer |
| H3 | **Lieblings-/Pref ohne „mein“** — `Speichere: Lieblingsfarbe ist Grün` → Pref `lieblingsfarbe=Grün` (nicht generischer Fact-Blob) | Unit + Live-Case |
| H4 | Eval `scripts/eval_0_4_3.py` + Version `0.4.3` | Health + UI `v0.4.3`; Suite grün |

## Should

| ID | Inhalt |
|----|--------|
| H5 | Gleiche Clause-Grenzen für andere Patterns (`wohne in`, `bin …`) wo sinnvoll |
| H6 | Soft-Harvest-Pref und explizites Speichere teilen dieselbe Pref-Normalisierung |

## Won’t

- Intent-Router / Memory-Subklassen (→ Sprint 12 / `0.5.0`)
- Research / Delight
- Neue Memory-Kategorien oder Vektor-Store

## Abhängigkeiten

- Sprint 10 / `0.4.2` implementiert
- Kein Blocker auf PO-Tag von 8–10; Hotfix darf parallel zur Review laufen

## Exit / Abnahme

PO: Multi-Fakt-Values sauber, Recall-Fragen zuverlässig, Speichere-Prefs korrekt. Tag **`v0.4.3`**.
