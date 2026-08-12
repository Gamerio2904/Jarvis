# Sprint 13 — Memory Polish (nach 0.4.1)

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Ziel-Version | **`0.4.2`** |
| Quelle | Deep-Test / Verbesserungsbedarf zu Sprint 8 (`0.4.0`); setzt `0.4.1` voraus |

## Ziel

Gedächtnis **präziser und steuerbarer**: bessere Extraktion, sauberer Retrieve, Summary-Timing, UI-Feinschliff — ohne neuen Intelligence-Meilenstein.

## Must (Schwachstellen / Verbesserungen)

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| P1 | **Natürliche Merk-Phrasen** — z.B. „Kannst du dir merken, dass …“ | Parser/Heuristik deckt häufige DE-Formen; Eval-Cases grün |
| P2 | **Multi-Fakt-Split** — „wohne in Köln und Hund heißt Bruno“ → atomare Items | ≥2 Keys statt einem Blob; Recall einzeln möglich |
| P3 | **Value-Normalisierung** — kein „bitte, dass…“ / „übrigens Pizza, nicht Döner“ als Rohwert | Saubere `value`-Strings; Korrektur überschreibt klar |
| P4 | **Retrieve ohne Ambient-Leak** — Zero-Overlap nicht top-3 Pins erzwingen | Irrelevanter Smalltalk ohne Memory-Injection (oder sehr selten/konfigurierbar) |
| P5 | **Summary nach Assistant-Write** + DE-only Guard | `summary_message_count` konsistent; keine CJK/Mischsprache in Summary |
| P6 | **`max_context_messages`** anbinden oder aus Settings entfernen | Kein totes Setting |
| P7 | Eval `scripts/eval_0_4_2.py` + Version `0.4.2` | Health + UI |

## Should

| ID | Inhalt |
|----|--------|
| P8 | UI: Confirm-Chip „gerade gemerkt“ nach Speichern |
| P9 | UI: Inline-Edit Memory-Wert (+ optional Kategorie) |
| P10 | UI: Chat-Summary aufklappbar (lesen) |

## Won’t

- Memory-Intent-Subklassen / Policy-Map (→ `0.5.0` / Sprint 9)
- Vektordatenbank-Pflicht
- Research / Delight

## Abhängigkeiten

- `0.4.1` Must-Fixes (Sprint 12)

## Exit

PO: Recall präziser, weniger Noise, UI steuerbarer. Tag **`v0.4.2`**.
