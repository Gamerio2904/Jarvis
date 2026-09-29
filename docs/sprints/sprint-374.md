# Sprint 374 — Episode-Karte nach der Sitzung

**Version:** `18.16.0` — **CODE** Should
**Plan:** [`88-next.md`](../88-next.md)
**Voraussetzung:** Gate aus 370. Digest-Agent bleibt auf Zuruf.

## Ziel

Nach einer Sitzung eine **kurze, ablaufende** Karte: „Heute: Timer Nudeln,
Geburtstag Mama.“ Morgen zitierbar über Recall. Kein Roman.

## Ist

`digest` fasst auf Zuruf zusammen. Historie 50 Züge, Sitzung, kein Pin.
Sleep schreibt fast nichts.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S374-1 | Quelle | `working-memory.ts` + letzte Tools | Nur Tool-Keys und User-Zeilen ≥ 8 Zeichen, keine Dumps (`dumpLike`) |
| S374-2 | Write | `writeMemory` origin `sleep` oder `tool`, kind episode/fact, `expires_at` ≤ 48 h | Gate IGNORE bei Smalltalk |
| S374-3 | Trigger | App Hintergrund / Sprachmodus-Ende / max 1× / 12 h (an Sleep-Takt) | Kein Groq-Pflicht. Template-Satz erlaubt |
| S374-4 | Lesen | Recall „was war gestern“ / Greeting 373 darf **eine** Episode zitieren wenn Datum passt | Ohne Episode: nichts erfinden |

## Won’t

Stimmungsprotokoll. Cloud-Upload. Unbegrenzte Tagebücher.

## Abbruchkriterium

Episode ohne Ablauf. Oder Groq schreibt die Karte und erfindet Tools.

## PO-Prüfung

1. Timer + Mama-Geburtstag, App kurz weg, später „was stand heute an“ —
   nur was wirklich lief, oder ehrlich leer.
