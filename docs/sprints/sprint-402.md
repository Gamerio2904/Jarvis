# Sprint 402 — Foto, Knopf, Kopierfelder

**Version:** `18.21.0` — **PLAN** Must
**Plan:** [`93-next.md`](../93-next.md)
**Voraussetzung:** 401.

## Ziel

Ein Foto des Codes im Chat wird zur Antwort mit Knopf und Feldern. Ein
unvollständiger Satz hat keinen Knopf.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S402-1 | Lesen | Foto-Pfad vor OCR | `jsQR` lokal, schon im Baum. Treffer `jarvis-xfer:v1` geht an `xfer`, nicht an Gemini. Anderer Inhalt bleibt beim bisherigen Lesen |
| S402-2 | Sammeln | `xfer.ts` | Stücke derselben Id. Fehlt eins: `Code 1 von 3. Noch 2 Fotos vom selben Satz.` Kein Knopf |
| S402-3 | Knopf | Chat-Block | `Dateien laden` speichert jede Datei unter ihrem Namen. Danach Bytes der Sendeseite nach der Frist, Empfänger hält sie nicht über den Ladevorgang hinaus |
| S402-4 | Felder | dieselbe Nachricht | Eine Zeile, ein Feld, `Kopieren` wie die Testprompts. Kein Feld, wenn der Satz keinen Kopiertext hatte. Kein Schreiben ins Gedächtnis |

## Won't

Live-Scanner, Systemkamera außerhalb des Chats, Datei öffnen.

## Abbruchkriterium

Ein Foto ohne diesen Präfix bekommt einen Lade-Knopf, oder der Knopf erscheint, bevor alle Stücke da sind.
