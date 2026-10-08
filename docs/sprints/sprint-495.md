# Sprint 495 — Backlog und Lieferumfang trennen

**Version:** `18.39.0` — **CODE*** Must  
**Plan:** [`../103-next.md`](../103-next.md)  
**Voraussetzung:** 491–494 abgeschlossen und Geräte-Gate `18.38.0` bestanden.

## Ziel

Ungeplante Projektideen und Anforderungen lassen sich von Sprints unterscheiden,
ohne bisherige Planinhalte oder Identitäten zu verlieren.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S495-1 | Datenmodell | `idea-plan.ts` `store.ts` | Backlog-Einträge mit stabiler ID, Beschreibung, Anforderungsbezug und explizitem Zustand ergänzen; bestehende Planfelder migrieren. |
| S495-2 | Ansichten | `Workbench.tsx` `ScriptStage.tsx` | Zwischen Backlog und Sprint-Lieferumfang wechseln; ungeplante Arbeit nicht als freigegebenen Sprint darstellen. |
| S495-3 | Verknüpfung | Validator und Tests | Doppelte/ungültige IDs und verwaiste Anforderungen melden; Verschieben ist explizit und per Undo rückgängig zu machen. |

## Abbruchkriterium

Migration verliert oder dupliziert Planinhalt, oder Backlog-Arbeit erscheint
ohne Bestätigung als ausführbarer Sprint.
