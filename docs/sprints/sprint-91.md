# Sprint 91 — Gedächtnis im Dialog (`1.38.0`)

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | **MUST** |
| Ziel-Version | **`1.38.0`** |
| Quelle | PO 2026-08-17 besseres Verständnis |
| Voraussetzung | `1.37.0` |
| Plan | [`28-next.md`](../28-next.md) |

## Ziel

Der vorhandene Speicher antwortet auf natürliche Fragen und Korrekturen — kein zweites Memory-System.

## Must

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| M1 | Recall-Varianten | „Was trinke ich?“ / „mein Getränk?“ / „wie heiße ich?“ |
| M2 | Widerspruch | „kein Kaffee mehr“ überschreibt |
| M3 | Anapher auf `last_step` | „das lauter“, „stopp das“, „lösch das“ |
| M4 | Ort + Termin wo der Parser schon nah ist | Eine Zeile, ehrlich wenn unklar |
| M5 | Chatsuche + Titel | Alter Turn; Titel aus dem Befehl, nicht „Hallo Jarvis“ |
| M6 | Version `1.38.0` | Sideload |

## Probe

Siehe [`28-next.md`](../28-next.md) `1.38.0`.

## Won’t

Cloud-Memory, zweites Profil, Encryption-Projekt.
