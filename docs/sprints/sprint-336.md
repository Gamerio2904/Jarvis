# Sprint 336 — API und Cache neu

**Version:** `18.9.5` — **PLAN** Must
**Plan:** [`80-next.md`](../80-next.md)
**Voraussetzung:** 331, 332.

## Ziel

„API aktualisieren“ und „neu laden“ sind **Retry + Cache-Bust**, kein
Key-Tausch. Fehlt ein Key, nimmt Recover die Quelle **ohne** Key.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S336-1 | Quota | `quota.ts` Recover | 429 → `Retry-After` einmal, Ansage „warte kurz, versuche neu“ |
| S336-2 | Cache | layer/omdb/news TTL | Fail verwirft den Slot. Zweiter Lauf ohne Cache |
| S336-3 | Key | Hirn / OMDb | Kein Groq-Key → Gemini oder Absage. Kein OMDb-Key → Titel ohne Noten, kein Fake-% |
| S336-4 | Ansage | Copy | „Der Dienst blockt. Ich lade neu.“ / „Ohne diesen Schlüssel gehe ich den anderen Weg.“ |
| S336-5 | Test | `test-recover.mjs` | 429 dann 200. Leerer Key → kein erfundenes Rating |

## Won’t

- Keys aus dem Chat schreiben. Keys rotieren. Zweite bezahlte API still anlegen.

## Abbruchkriterium

Ein 429 wird zum erfundenen Treffer. Oder Settings-Key ändert sich von allein.

## Manuell

OMDb-Key leer, Film auf die Liste: Karte ohne %, keine 83 % aus dem Nichts.
