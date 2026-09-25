# Sprint 345 — Rezept mit Zeiten, Liste, Schritten

**Version:** `18.11.3` — **PLAN** Must
**Plan:** [`84-next.md`](../84-next.md)
**Voraussetzung:** 344 (sichtbare Zutaten) + 343 (Gewürz-Pin).

## Ziel

Aus Bild-Zutaten plus Gewürz-Pin kommt **ein** belegtetes Rezept:
Zubereitungszeit, Gesamtzeit (Ofen …), Zutaten, ausführliche Schritte.
Gewürze nur aus dem Pin, passend — notfalls nur Salz und Pfeffer.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S345-1 | Recherche | `cook.ts` + research | Query aus sichtbaren Zutaten; nur zitierte URL. Leer = Absage |
| S345-2 | Optional DB | Allowlist-Schritt | TheMealDB nur mit **Nutzer-Key**; Credit + `strSource`. Ohne Key skip |
| S345-3 | Zeiten | `formatCookReply` | prep / total / Ofen nur wenn die Quelle Zahlen nennt |
| S345-4 | Liste | dieselbe Form | Bild / Gewürzregal / „Quelle will extra“ getrennt |
| S345-5 | Schritte | dieselbe Form | 1…n ausführlich, Sätze der Quelle, kein Modell-Roman |
| S345-6 | Gewürz-Wahl | `pickSpices(pin, recipe)` | Schnittmenge; nur Salz/Pfeffer erlaubt und ansagen |
| S345-7 | Merge | `skipMicroMerge` / tool | `cook` nicht in 1–2 Sätze quetschen |
| S345-8 | Quellen | research-Meta | Links unter der Nachricht — Default zu (342) |

## Won’t

Zeiten erfinden. Gericht erfinden wenn die Suche leer ist.
TheMealDB-Key `1` shippen. Bild „so sieht das fertig aus“.
Einkaufsliste ohne Ja. Allergie-Verdikt.

## Abbruchkriterium

Antwort ohne URL und trotzdem Schritte. Oder Ofenzeit ohne Quellenwort.
Oder Gewürz im Rezept, das weder Pin noch Quelle trägt.

## Manuell

Vorrat-Foto + Rezept: Titel, zwei Zeiten oder ehrliche Lücke, Liste,
Schritte. Pin nur Salz/Pfeffer → genau die. Quellen-Badge zu, aufklappbar.
