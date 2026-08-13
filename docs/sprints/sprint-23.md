# Sprint 23 — Assist Hotfix (nach 0.8.0 Deep-Test)

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Priorität | **HIGH** — Korrektheit vor weiterer Assist-Politur |
| Ziel-Version | **`0.8.1`** |
| Quelle | Deep-Test `/tmp/deep_080.log` nach Sprints 20–22 / `0.8.0` |

## Ziel

Die **kritischen Edge-Bugs** aus dem `0.8.0`-Deep-Test schließen: keine kaputten Soft-Memory-Werte, kein zerstörtes Deutsch durch Duzen-Repair, Soft-Confirm nur mit validen Payloads.

## Must

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| H1 | **`normalize_value` Filler-Fix** — `ja`/`also`/… nur als **ganzes Wort** (Wortgrenze), nie Präfix | `Jazz`/`Japan`/`Jade`/`Jade Tee` bleiben intakt; Unit: `normalize_value("Jazz")=="Jazz"` |
| H2 | **Soft-Confirm Value-Gate** — vor Persist/Confirm: Min-Länge, keine 1–3-Buchstaben-Trümmer, kein reiner Filler | `Ich mag Jazz` → Soft-Confirm mit `Jazz`; nie `pan` / `de Tee` / `zz` speichern |
| H3 | **`soften_duzen` entschärfen** — kein `dir`→`Ihnen` in `merk dir`; keine Verb-Stümpfe (`möchtst Sie`, `brauchst Sie`); `Du heißt` nicht zu `Sie heißt` | Nora-Write/Recall ohne `Merk Ihnen` / `Ihnen heißt`; Unit-Suite für Phrasen |
| H4 | **Garbage-Memory Cleanup-Pfad** (best-effort) — bekannte Soft-Trümmer (`mag_pan`, `mag_de_tee`, Werte ≤2) nicht mehr injecten / optional löschen | Retrieve/Recall zeigt keine `pan`/`de Tee`-Fakten |
| H5 | Eval `scripts/eval_0_8_1.py` + Version `0.8.1` | Suite grün; Health/UI `0.8.1`; Cases Jazz/Japan/Jade + Duzen-Phrasen |

## Should

| ID | Inhalt |
|----|--------|
| H6 | Soft-Harvest: kurze Ein-Wort-Prefs (`Jazz`) explizit erlauben, nachdem Normalize korrekt ist |
| H7 | Guard: nach `soften_duzen` erneut `duzen_hits` / Verb-Muster prüfen → sonst Memory-Fallback statt kaputtem Text |
| H8 | Ältere Evals (`eval_0_7_1`) Version-Pin auf `0.8.x` akzeptieren oder Skip-Hinweis |

## Won’t

- Capabilities-Varianten / Canned-`Guten Morgen` / Forget-Wording (→ Sprint 24)
- Scorecards, Delight-Persist, Audit-UI (→ Sprint 25)
- Phase 2 Auth/Handy, Tools, TTS, NAS

## Abhängigkeiten

- `0.8.0` Deep-Test abgeschlossen (MUST 54/55, kritische Findings dokumentiert)
- Soft-Harvest + `soften_duzen` aus Sprints 20–22

## Exit / Abnahme

PO: Keine Müll-Soft-Facts; Jarvis-Deutsch nach Duzen-Repair lesbar; Eval `0.8.1` grün. Tag **`v0.8.1`**.

## Danach

- Sprint **24** / `0.8.2` — Edge-/Reply-Polish (Rest aus Deep-Test)
- Sprint **25** / `0.8.3` — Carry-over Shoulds (Scorecard, Persist, Audit)
