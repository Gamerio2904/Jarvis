# Sprint 417 — Zeile bei Fest

**Version:** `18.24.0` — **CODE** Must
**Plan:** [`96-next.md`](../96-next.md)
**Voraussetzung:** `plan_phase` `live` und `go` bleiben. Kein neuer Agent.

## Ziel

`Go` auf einem live Skript schreibt eine Portfolio-Zeile mit kurzem
Namen. Noch kein Bildschirm und keine Mappe.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S417-1 | Store | `store.ts` | IndexedDB 14, Store `portfolio`. Eine Zeile je `idea_id`, Felder aus Plan §2. `putPortfolio` ersetzt dieselbe Id. Keine zweite Zeile |
| S417-2 | Name | `portfolio.ts` | `shortName(title)` nach Plan §2. `Tik Tak To` bleibt. `Einkauf, Liste schreiben und Route prüfen` wird `Einkauf`. Leer wird `Projekt`. Kein Modell |
| S417-3 | Fest | `idea.ts` | Nur wenn `plan_phase` von `live` auf `go` geht und eine offene Idee da ist. Antwort `Fest. Tik Tak To liegt im Portfolio.` Zweites `Go`: Dateien noch nicht, die Zeile wird nur aufgefrischt, Antwort `Tik Tak To liegt schon im Portfolio.` Ohne live Skript bleibt der bisherige Satz |
| S417-4 | Sätze | `portfolio-parse.ts` | `Portfolio` und `Zeig Projekt …` aus Plan §4. Leer: `Das Portfolio ist leer.` Unbekannt: `Das Projekt liegt nicht im Portfolio.` Zwei Treffer: `Welches: …` mit den vollen Titeln. `Plane das` und `Go` bleiben in `ablauf-parse.ts` |

## Won't

Shredder, Mappe, Hausstand, Beispiele, Version.

## Abbruchkriterium

`Go` ohne live Skript legt eine Zeile an, oder zwei Ideen mit derselben Id entstehen.
