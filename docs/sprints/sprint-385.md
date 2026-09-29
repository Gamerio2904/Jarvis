# Sprint 385 — Tischplatte-Modus (Glas + Schalter)

**Version:** `18.19.0` — **PLAN** Must
**Plan:** [`91-next.md`](../91-next.md)
**Voraussetzung:** Homescreen `18.18.0` (382–384). **Kein Execute in diesem Sprint-Dokument.**

## Ziel

Rechte Leiste schaltet Tischplatte. Icons weg. Glas-Hintergrund
(prozedural, Jarvis-Palette). Parser trifft `board`, nicht `desk`.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S385-1 | Flag | `store.ts` | `tischplatte_on: false`, `tischplatte_seed`, `tischplatte_hint` validiertes JSON |
| S385-2 | Schalter | `GlanceRail.tsx` | Unter den Werten: Tischplatte an/aus. Persistenz. Kein erfundener Wert daneben |
| S385-3 | Fläche | `HomeScreen.tsx` `Workbench.tsx` **neu** `App.css` | An: Icon-Raster hidden. Workbench Vollfläche unter Leiste/Mini-Chat/Kugel. Canvas-2D Gitter + CSS-Glas. `prefers-reduced-motion` = statisch |
| S385-4 | Hint | `board-theme.ts` **neu** | Nur auf „neuer Hintergrund“. Groq JSON Keys `accent|glow|density|motif`. Enum `orbit\|grid\|pulse`. Fail-closed Default |
| S385-5 | Parser | `board-parse.ts` **neu** `parse-catalog.ts` | `Tischplatte an/aus`, `Werkbank`, `Projekttafel`. **Nicht** `Schreibtisch an`, **nicht** nacktes `Tisch an` |
| S385-6 | HUD | Lage-/HUD-Skip | `tischplatte\|werkbank\|projekttafel` analog Homescreen, kein `unknown_place` |

## Won’t

Execute jetzt. WebGL. Bildgenerator-API. Desk-Foto. Always-on Kamera.
64. Organizer-Agent. Marvel-Prompt ins CSS.

## Abbruchkriterium

`Schreibtisch an` öffnet die Werkbank. Oder `Tischplatte an` geht an `desk`.

## Manuell

```
Tischplatte an
Tischplatte aus
Schreibtisch an
```

Erstes: Icons weg, Glas. Zweites: Icons zurück. Drittes: Desk-Vertrag.
