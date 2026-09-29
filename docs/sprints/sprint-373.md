# Sprint 373 — Begrüßung aus Stand

**Version:** `18.16.0` — **PLAN** Should
**Plan:** [`88-next.md`](../88-next.md)
**Voraussetzung:** 369 (Pins lesbar). Parser `greeting` in `chat.ts` vor Director.

## Ziel

„Hallo“ / „Guten Morgen“ darf **einen** belegten Halbsatz nutzen: nächster
offener Termin, laufender Timer, oder letzter Working-Key. Weiter Siezen.
Kein Vorname in der Anrede. Keine erfundene Laune.

## Ist

`greetingReply`: „Guten Morgen. Ich höre.“ Unabhängig von Kalender/Timer.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S373-1 | Belege | `greeting.ts` | Optional async: ein Fakt aus `listReminders` (nächster open) **oder** `openTimers` **oder** working last. Höchstens einer |
| S373-2 | Satz | `greetingReply` | Tageszeit + Fakt oder „Ich höre.“ Wie-geht’s: eine Rückfrage, kein Katalog |
| S373-3 | Honesty | Guards | Kein „sicher gut geschlafen“. Wohnort-Pin ist keine Live-Lage |
| S373-4 | Gold | `Hallo Jarvis.` bleibt `llm` **oder** bleibt Pre-Router greeting — **eine** dokumentierte Route, Testdoc. Nicht beides lügen |

## Won’t

Therapie. Fähigkeitenliste. Wetter ohne Tool in der Begrüßung.

## Abbruchkriterium

Begrüßung erfindet einen Termin. Oder „Fernseher an“ wird greeting.

## PO-Prüfung

1. Timer läuft, dann „Hallo“ → Timer kommt vor, oder ehrlich nur Tageszeit.
2. Leerer Stand → wie heute kurz.
3. Siezen, kein Vorname.
