# Sprint 460 — Simulations-Gold und Release-Gate `18.30.0`

**Version:** `18.30.0` — **PLAN** Must  
**Plan:** [`../100-next.md`](../100-next.md)  
**Voraussetzung:** Sprints 455–459.

## Ziel

GUI-Vorschau, Feedbackloop und Workflow-Dry-Run sind sicher, nachvollziehbar
und ohne Seiteneffekte getestet.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S460-1 | Abuse-/Side-effect-Regression | `scripts/test-idea-plan.mjs` | HTML-Injection, falsche Bestätigung und externe Aktion abweisen |
| S460-2 | UI-Geräteabnahme | `TEST-18.30.md` | Browser und Android-WebView inklusive Bedienhilfen |
| S460-3 | Plan-/Entwurfsregression | `scripts/test-app-ui.mjs` | Separater Entwurf, Scan, PSP, Sprints und Portfolio bleiben nutzbar |
| S460-4 | Release-Gate | `package.json`, `engine/store.ts` | `18.30.0` / `183000` nur nach grüner Abnahme |

## Abbruchkriterium

Bei ausführbarem Modellinhalt oder einer realen Nebenwirkung im Dry-Run kein
Release.
