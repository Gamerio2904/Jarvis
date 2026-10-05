# Sprint 95 — Standort (`1.42.0`)

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | **MUST** |
| Ziel-Version | **`1.42.0`** |
| Quelle | PO-Screenshot: „Wo bin ich?“ geraten; Freigabe nicht anstoßbar |
| Voraussetzung | `1.41.0` |
| Plan | [`28-next.md`](../28-next.md) |

## Ziel

Live-Ort ehrlich. Freigabe anstoßen (Systemdialog / App-Einstellungen), Schalter nicht selbst umlegen. Unabhängig von Tanke **und** dieselbe Pipeline für Tanke/Wetter.

## Must

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| O1 | `Wo bin ich gerade?` → GPS + Ortsname, kein Gemini-Raten | Parser vor LLM |
| O2 | `aktivieren` / `Standort aktivieren` öffnet Dialog oder App-Einstellungen | Native `openSettings` |
| O3 | Nach Tanke ohne GPS: dieselbe Freigabe, dann Tanke nochmal | `retry: fuel` |
| O4 | Version `1.42.0` Sideload | versionCode 14200 |

## Probe

Standort aus: `Wo bin ich gerade?` → ehrlich, `aktivieren`. Danach Ort. `Fahr mich zu einer Tanke` nutzt denselben Fix.

## Won’t

Heimlich den Systemschalter umlegen, Apple-Ortung, erfundenen Arbeitsweg.
