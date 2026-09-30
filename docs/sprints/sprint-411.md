# Sprint 411 — Modell füllt den Ablauf

**Version:** `18.23.0` — **PLAN** Must
**Plan:** [`95-next.md`](../95-next.md)
**Voraussetzung:** 410.

## Ziel

Groq, dann Gemini, füllt Arbeitszeilen und Wellen. Der Chat zeigt den
Ablauf. Es läuft noch kein Agent, das Fenster bleibt zu.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S411-1 | Fill | `ablauf.ts` | Dieselben Slots wie `fillPlanWithModel`: Groq, dann Gemini. JSON `work` und `waves` mit `agent` und `task`. Nur Ids aus `EXECUTOR_IDS`. Aufgabe mindestens drei Zeichen, ein Satz, den der Agent schon parst. Höchstens sechs Arbeitszeilen, acht Karten, drei Wellen. Karte mit `und plane Sprints` verdrängt eine zweite Ideenkarte derselben Füllung. Unbekannte Id wird graue Zeile, Status bleibt `vorgeschlagen` |
| S411-2 | Leere | `ablauf.ts` | Keine gültige Karte: kein Speicher, Antwort `Kein Ablauf. Der Text nennt keine konkrete Arbeit.` Sonst Status `warten` und die Chatliste aus Plan §4, Schlusszeile `Sag So, oder was anders sein soll.` |
| S411-3 | Prompt | `ablauf.ts` | Deutsch. Keine neue Id, keine App-Version, kein Dateipfad, keine erfundenen Fakten. Abhängige Schritte in eine spätere Welle. Leerer Arbeitstext ergibt leeres JSON |

## Won't

Fenster, Lauf, Testkarten, Version.

## Abbruchkriterium

Eine Karte nennt eine Id, die es nicht gibt, und würde später trotzdem laufen. Oder der Fill schreibt eine Datei.
