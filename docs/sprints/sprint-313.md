# Sprint 313 — Lage-Briefing aus sichtbaren Fakten

**Version:** `18.6.6` — **PLAN** Must
**Plan:** [`77-next.md`](../77-next.md)
**Voraussetzung:** 307; mindestens eine Schicht 308–310.

## Ziel

„Briefing zur Lage“ / „Was liegt auf der Kugel“ liest **Cache + Pins**,
nicht `osirisai.live/api/ai`. Hirn schleift Sätze, erfindet keine Marker.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S313-1 | Kontext | `globe-brief.ts` | Aktive Schicht, bis 12 Pin-Namen, Quelle, Alter, Weltraumwetter-Text wenn 308 da |
| S313-2 | Parser | `hud-parse` | `Briefing zur Lage`, `Was liegt auf der Kugel`. Nicht `outlook` world-tour stehlen |
| S313-3 | Hirn | | `polishToolLine` / bestehendes Gemini-Schleifen. Ohne Key: Canned aus den Fakten |
| S313-4 | Leer | | Schicht aus und keine Pins → „Nichts auf der Kugel außer der Erde / ISS.“ |
| S313-5 | Tour | | Welt-Tour (`48`) unverändert. Briefing ersetzt sie nicht |

## Won’t

- POST an osirisai.live.
- Threat-Score erfinden. Aktien.

## Abbruchkriterium

Reply nennt ein Ereignis, das nicht im Cache steht.

## Manuell

`Zeig Erdbeben` dann `Briefing zur Lage` → USGS-Zahl, ein Beispiel, Alter.
Ohne Schicht: ehrlich leer, Kugel bleibt.
