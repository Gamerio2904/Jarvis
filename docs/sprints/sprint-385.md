# Sprint 385 — Tischplatte-Modus (Theme A/B + Schalter)

**Version:** `18.19.0` — **PLAN** Must
**Plan:** [`91-next.md`](../91-next.md) §4.0
**Voraussetzung:** Homescreen `18.18.0` (382–384). **Kein Execute in diesem Sprint-Dokument.**

## Ziel

Ein Jarvis-Theme. Launcher = Wallpaper **A** plus Icons, die **aus A
geschnitten** wirken (kein Candy-Tint). Tischplatte an = Hintergrund
**schaltet** auf Wallpaper **B** (Werkbank), Icons weg. Parser `board`,
nicht `desk`.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S385-1 | Flag | `store.ts` | `tischplatte_on: false`, `tischplatte_seed`, `tischplatte_hint` validiertes JSON |
| S385-2 | Schalter | `GlanceRail.tsx` | Unter den Werten: Tischplatte an/aus. Persistenz. Kein erfundener Wert daneben |
| S385-3 | Zwei Wände | `HomeScreen.tsx` `Workbench.tsx` **neu** CSS | Ebenen `.home-wall--launcher` (A) und `.home-wall--board` (B). `is-tischplatte` Crossfade ≤ 400 ms. `prefers-reduced-motion` = hart. Canvas-2D Gitter, ein Seed für A und B |
| S385-4 | Icons = A | `HomeScreen.tsx` `home-apps.ts` `index.css` | Glas-Kachel mit `backdrop-filter` / fixer Textur von A. Glyph Theme-Tinte. `tint` nicht mehr Kachelfarbe. Die neun internen Apps (Chat … Filme), keine fremden Launcher-Icons |
| S385-5 | Hint | `board-theme.ts` **neu** | Nur auf „neuer Hintergrund“. Groq JSON Keys `accent\|glow\|density\|motif`. Ein Hint färbt A **und** B. Enum `orbit\|grid\|pulse`. Fail-closed Default |
| S385-6 | Parser | `board-parse.ts` **neu** `parse-catalog.ts` | `Tischplatte an/aus`, `Werkbank`, `Projekttafel`. **Nicht** `Schreibtisch an`, **nicht** nacktes `Tisch an` |
| S385-7 | HUD | Lage-/HUD-Skip | `tischplatte\|werkbank\|projekttafel` analog Homescreen, kein `unknown_place` |

## Won’t

Execute jetzt. WebGL. Bildgenerator-API zur Laufzeit. Desk-Foto.
Always-on Kamera. 64. Organizer-Agent. Marvel-Prompt ins CSS. Material-
oder Lucide-Bunt auf Jarvis-Glas. A und B als zwei fremde Stile.

## Abbruchkriterium

`Schreibtisch an` öffnet die Werkbank. Oder `Tischplatte an` geht an `desk`.
Oder Icons bleiben 18.18-Candy während A Jarvis-Glas ist. Oder Tischplatte
an ändert nur die Icons, nicht den Hintergrund.

## Manuell

```
Tischplatte an
Tischplatte aus
Schreibtisch an
```

Erstes: Hintergrund wechselt A→B, Icons weg. Zweites: B→A, Icons wieder
im Look von A. Drittes: Desk-Vertrag.
