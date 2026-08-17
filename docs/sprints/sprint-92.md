# Sprint 92 — Stimme bleiben (`1.39.0`)

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Priorität | **MUST** |
| Ziel-Version | **`1.39.0`** |
| Quelle | PO 2026-08-17 Verständnis + flüssig (nach Tempo `1.32.1`) |
| Voraussetzung | `1.38.0` |
| Plan | [`28-next.md`](../28-next.md) |

## Ziel

Zuhören und Sprechen bleiben zuverlässig: Treffer, Abbruch, Navi-Mix.

## Must

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| V1 | `NO_MATCH` | Nicht als „User war still“ schlucken, wenn gesprochen wurde |
| V2 | Unvollständiges STT | Nicht mit halbem Satz routen |
| V3 | Barge-in | Antippen stoppt Stimme und hört |
| V4 | Navi + Jarvis | Nicht zwei Stimmen übereinander |
| V5 | Zwischenstand + Fehler | Deutsche Partials; „Nichts gehört“ nur wenn leer; Loop läuft weiter |
| V6 | Version `1.39.0` | Sideload |

## Probe

Siehe [`28-next.md`](../28-next.md) `1.39.0`.

## Won’t

Neue TTS-API, englische Default-Stimme.
