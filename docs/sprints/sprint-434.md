# Sprint 434 — Notizen per Sprache

**Version:** `18.26.0` — **PLAN** Must  
**Plan:** [`../98-next.md`](../98-next.md)  
**Voraussetzung:** Sprint 431.

## Ziel

Natürliche, explizite Sätze steuern Notizen: anlegen, auflisten, suchen,
öffnen, bearbeiten und löschen.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S434-1 | Parser-Intents | `engine/tools-parse.ts` | Create/List/Open/Edit/Delete eindeutig von Recall-Fragen trennen |
| S434-2 | Notiz-Router | `engine/tools.ts` | Bestehende Store-Funktionen aufrufen; IDs intern stabil halten |
| S434-3 | Mehrdeutigkeit und Confirm | `engine/tools.ts` | Mehrere Treffer klären; Sprachlöschung erst nach Ja ausführen |
| S434-4 | Parser-Gold | `scripts/test-notes.mjs` | Varianten, Nachbarn, Nein/Ja und falsche Treffer testen |

## Abbruchkriterium

Eine Frage wie „Was war nochmal meine Matrikelnummer?“ darf nicht als
Bearbeitungs- oder Löschbefehl geparst werden.
