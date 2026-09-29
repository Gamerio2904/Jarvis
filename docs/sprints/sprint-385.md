# Sprint 385 — Tischplatte-Modus (Theme A/B, Icons aus)

**Version:** `18.19.0` — **PLAN** Must
**Plan:** [`91-next.md`](../91-next.md) §4.0–4.4
**Voraussetzung:** Homescreen `18.18.0` (382–384). **Kein Execute in diesem Sprint-Dokument.**

## Ziel

Ein Jarvis-Theme. Launcher = Wallpaper **A** plus Icons aus A. Tischplatte
an = Hintergrund **B**, **App-Icons ausblenden** (`hidden`+`inert`). Mitte
ohne Gesicht. Parser `board`, nicht `desk`.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S385-1 | Flag | `store.ts` | `tischplatte_on`, `tischplatte_view` Default `sprints`, `tischplatte_focus`, Seed, Hint |
| S385-2 | Schalter | `GlanceRail.tsx` | Tischplatte an/aus. Persistenz |
| S385-3 | Zwei Wände | `HomeScreen.tsx` `Workbench.tsx` CSS | `.home-wall--launcher` / `--board`. Crossfade ≤ 400 ms. Ringe nur am Rand, **kein** Face in der Mitte |
| S385-4 | Icons aus | `HomeScreen.tsx` | `tischplatte_on`: `.home-grid` `hidden` `inert` `aria-hidden`. Mini-Chat/Kugel/Leiste bleiben |
| S385-5 | Icons = A | `home-apps.ts` CSS | Nur wenn Tischplatte **aus**: Glas-Kachel von A, kein Candy-`tint` |
| S385-6 | Hint | `board-theme.ts` | Ein JSON färbt A und B. Enum `orbit\|grid\|pulse` |
| S385-7 | Parser | `board-parse.ts` | `Tischplatte an/aus`. Nicht `Schreibtisch an`, nicht nacktes `Tisch an` |
| S385-8 | HUD | Skip | `tischplatte\|werkbank\|projekttafel`, kein `unknown_place` |

## Won’t

Execute. WebGL. Face-Hologramm. tldraw/xyflow-npm. Bildgenerator-API.
Marvel-Stills. Desk-Foto.

## Abbruchkriterium

Icons bleiben klickbar bei Tischplatte an. Oder ein Gesicht/Portrait sitzt
in der Mitte von B. Oder `Schreibtisch an` öffnet die Werkbank.

## Manuell

```
Tischplatte an
Tischplatte aus
Schreibtisch an
```

An: Icons weg, Wand B, Mitte leer oder Gitter — kein Kopf. Aus: Icons auf A.
