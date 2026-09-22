# Sprint 334 — Abstention + Micro-Merge

**Version:** `18.9.3` — **CODE** Must
**Plan:** [`80-next.md`](../80-next.md)
**Voraussetzung:** 331.

## Ziel

Read-Fail ohne `factual` fällt nicht mehr ins Chat-Modell. Tool-Bestätigungen
werden nicht umgeschrieben.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S334-1 | Fail | `director.ts` `failureReply` | `failed` Read ohne Daten → Absage, `hit` gesetzt, kein `hit: null` |
| S334-2 | Merge | `chat-blocks.ts` | `skipMicroMerge` für alle Write-Bestätigungen (Kalender schon). Allowlist statt Blacklist wenn kürzer |
| S334-3 | Unknown | `command-neighbors.ts` | commandish + Recover erschöpft → Unknown, nicht Smalltalk |
| S334-4 | Test | `test-sprints-272-281.mjs` | news/fuel Fail → „rate nicht“ / „nichts geändert“, kein leerer String der ins LLM darf |

## Won’t

- e5 in `pickRoute`. LLM als letzter Tool-Picker.

## Abbruchkriterium

Ein Read-Fail erzeugt eine plaudernde Erfolgszeile.

## Manuell

Tanke ohne Key / tot: Absage. Kein erfundener Preis.
