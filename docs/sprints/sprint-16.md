# Sprint 16 — Research Hotfix (nach 0.6.0 Deep-Test)

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Priorität | **HOTFIX / HIGH** — vor Should-Polish und Delight |
| Ziel-Version | **`0.6.1`** |
| Quelle | Deep-Test Feedback zu Sprint 15 (`0.6.0`) |

## Ziel

Die **blocker-nahen Qualitätslücken** aus dem `0.6.0`-Deep-Test schließen: Query-Sanitization (Privacy + Noise), robuste Topic-Extraktion, Settings-Default-Hygiene.

## Must

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| H1 | **Query-PII-Sanitizer** — Namen/Adressen/„schick dem Provider…“-Köder nicht an Suchprovider | Eval: PII-Bait fehlt in `research.query` / Provider-Call |
| H2 | **Long-Query / Noise-Strip** — wiederholte `bitte`/`mal`/Füllwörter und Research-Prefixe entfernen; Topic bleibt | `Recherchiere bitte×N … Python 3.13` → Query enthält Topic, nicht `bitte`-Spam |
| H3 | **Topic-Extraktion** — Query auf Kern-Thema kürzen (max sinnvoll, nicht nur `[:200]`-Schnitt mitten im Noise) | Lange Prompts → kurze, suchbare Query |
| H4 | **Settings-Default-Hygiene** — Repo-Default `research_opt_in=false`; Eval/Tests stellen nach PATCH wieder her; Health spiegelt Default | Frischer Checkout / Eval-Ende → Opt-in aus |
| H5 | Eval `scripts/eval_0_6_1.py` + Version `0.6.1` | Suite grün; Health/UI `v0.6.1` (oder gebündelt `v0.6.2`) |

## Won’t

- Research-Persona / LLM-Stil (→ Sprint 17 / `0.6.2`)
- DDG-/Dual-Provider-Qualität (→ Sprint 17)
- Delight-Pack (→ Sprint 18 / `0.7.0`)

## Abhängigkeiten

- Sprint 15 / `0.6.0` implementiert
- Empfohlen vor PO-Tag `v0.6.0` oder parallel als Patch

## Exit / Abnahme

PO: Research-Query geht minimiert raus (kein PII-/Noise-Leak); Opt-in bleibt Default aus. Tag **`v0.6.1`** (optional; Code kann mit **`v0.6.2`** gebündelt werden).
