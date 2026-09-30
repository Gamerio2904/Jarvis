# Sprint 414 — Gleichzeitig ausführen

**Version:** `18.23.0` — **CODE** Must
**Plan:** [`95-next.md`](../95-next.md)
**Voraussetzung:** 413.

## Ziel

`So` führt die Wellen aus. Karten einer Welle laufen gleichzeitig. Danach
zeigt die Sprintliste dieselben Zeilen.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S414-1 | Annehmen | `ablauf.ts` `director.ts` | `So`, `Übernehmen` und `Ja` nach der Regel aus Plan §4 setzen Status `läuft`. `Ja` bei offenem Merk-Vorschlag oder anderem Wunsch bleibt bei diesem Wunsch. Knopf **So** ist derselbe Weg |
| S414-2 | Wellen | `ablauf.ts` | `runAgent` mit dem Aufgabensatz. Karten einer Welle gleichzeitig. Nächste Welle erst, wenn jede Karte geantwortet hat. Unhandled wird `Noch leer.`, die anderen laufen zu Ende. Graue Zeilen starten nicht. Keine zweite Rückfrage, kein weiterer Organizer. Sammelantwort ohne Micro-Merge. Keine Repo-Datei, keine Version |
| S414-3 | Fenster und Liste | `AblaufWindow.tsx` `Workbench.tsx` | Laufstrich an allen Karten des Bandes, Antwort als zweite Zeile. `Plan zu` während `läuft` beendet die aktuelle Welle, überspringt spätere und schließt. Die Zeile bleibt. Sonst blendet das Fenster nach der letzten Welle aus. Die Zeile bleibt mit Status `fertig`. Die Sprintliste zeigt Nummer, Label, Aufgabe und `fertig` oder die leere Antwort, bis `Zeig Sprints` die Ideenzeilen holt |

## Won't

Testkarten, versionCode, APK.

## Abbruchkriterium

Eine Karte läuft, bevor der Status `läuft` ist, oder eine Welle startet, bevor die vorige Antwort da ist.
