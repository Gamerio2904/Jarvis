# Sprint 13 — Memory Polish (nach 0.4.1)

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Ziel-Version | **`0.4.2`** |
| Quelle | Deep-Test / Verbesserungsbedarf zu Sprint 8 (`0.4.0`); setzt `0.4.1` voraus |

## Ziel

Gedächtnis **präziser und steuerbarer**: bessere Extraktion, Soft-Harvest mit TTL/Confidence, sauberer Retrieve, Summary-Timing, UI-Filter — ohne neuen Intelligence-Meilenstein.

## Must (Schwachstellen / Verbesserungen)

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| P1 | **Natürliche Merk-Phrasen** — z.B. „Kannst du dir merken, dass …“ | Parser/Heuristik deckt häufige DE-Formen; Eval-Cases grün |
| P2 | **Multi-Fakt-Split** — „wohne in Köln und Hund heißt Bruno“ → atomare Items | ≥2 Keys statt einem Blob; Recall einzeln möglich |
| P3 | **Value-Normalisierung** + Widerspruchs-Heuristik v1 — „nicht X, sondern Y“ ersetzt alten Wert | Saubere `value`-Strings; Key überschrieben (Voll-Policy/Nachfrage → `0.5.0`) |
| P4 | **Retrieve ohne Ambient-Leak** — Zero-Overlap nicht top-3 Pins erzwingen | Irrelevanter Smalltalk ohne Memory-Injection (oder sehr selten/konfigurierbar) |
| P5 | **Summary nach Assistant-Write** + DE-only Guard | `summary_message_count` konsistent; keine CJK/Mischsprache in Summary |
| P6 | **`max_context_messages`** anbinden oder aus Settings entfernen | Kein totes Setting |
| P11 | **Soft-Harvest: niedrige Confidence („unsicher“) + TTL** (`expires_at`) | Soft-Pins verfallen / werden unter Schwelle nicht injiziert; explizite Merks bleiben |
| P12 | **UI: Kategorien filtern** — `pref` / `fact` / `boundary` (+ optional `open_loop`) | Filter in „Was Jarvis über mich weiß“; unsichere Soft-Pins erkennbar |
| P7 | Eval `scripts/eval_0_4_2.py` + Version `0.4.2` | Cases inkl. TTL, Filter-API falls nötig; Health + UI |

## Should

| ID | Inhalt |
|----|--------|
| P8 | UI: Confirm-Chip „gerade gemerkt“ nach Speichern |
| P9 | UI: Inline-Edit Memory-Wert (+ Kategorie ändern) |
| P10 | UI: Chat-Summary aufklappbar (lesen) |
| P13 | Settings: TTL-Dauer / Soft-Harvest an|aus |

## Won’t

- Memory-Intent-Subklassen / volle Reply-Policy-Map (→ `0.5.0` / Sprint 9)
- Contradiction mit verbindlicher Nachfrage-Policy über Router (→ `0.5.0` `memory.clarify`)
- Vektordatenbank-Pflicht
- Research / Delight

## Abhängigkeiten

- `0.4.1` Must-Fixes (Sprint 12)

## Exit

PO: Recall präziser, Soft-Harvest nicht spammy, UI filterbar. Tag **`v0.4.2`**.
