# Sprint 413 — Überarbeiten

**Version:** `18.23.0` — **PLAN** Must
**Plan:** [`95-next.md`](../95-next.md)
**Voraussetzung:** 412. Status `warten`.

## Ziel

Eine genannte Karte wird neu geschrieben. Ein zweites `Plane das` ersetzt
den ganzen Ablauf. Beides läuft noch nicht.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S413-1 | Eine Karte | `ablauf.ts` `AblaufWindow.tsx` | `Ändere den Wecker: 7:30`, `Wecker auf 7:30, Rest so`, `Überarbeite den Plan: …`. Modell schreibt nur diese Aufgabe neu, wieder nur eine bekannte Id und ein Satz, den der Agent parst. Akzentlinie, alter Satz 400 ms durchgestrichen, darunter **geändert**, Status der Karte `geändert`. Chat: dieselbe Liste plus `geändert: Wecker.` Kein Treffer: `Die Zeile gibt es nicht.` und die Namen |
| S413-2 | Ersetzen | `ablauf.ts` | Zweites `Plane das` bei `warten` legt eine neue Zeile an. Die vorige bleibt, Status `zu`, und läuft nicht. `ablauf_id` zeigt auf die neue Zeile. Status kurz `schreibt`, dann `warten` oder die Leere aus 411 |
| S413-3 | Nachbarn | `conflicts.ts` | Ein Satz mit eigenem Agenten läuft wie bisher, das Fenster bleibt. Schieben, Werfen, Zurückholen und `Räum den Tisch` antworten `Der Ablauf liegt auf dem Tisch.` und ändern keine Lage |

## Won't

Gleichzeitiger Lauf, Testkarten, Version.

## Abbruchkriterium

Freier Text ohne die drei Änderungssätze ersetzt eine Karte, oder die anderen Karten verlieren ihren Text.
