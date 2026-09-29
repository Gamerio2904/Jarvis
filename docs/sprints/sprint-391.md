# Sprint 391 — Gold, Konflikte, Tests Tischplatte

**Version:** `18.19.0` — **PLAN** Must
**Plan:** [`91-next.md`](../91-next.md)
**Voraussetzung:** 385–390.

## Ziel

Parser-Gold und Unit-Tests belegen: Tischplatte ≠ Schreibtisch, Wallpaper
**schaltet** A→B, Icons = Ausschnitt von A (kein Candy-Tint), Katalog lügt
nicht, Deep bleibt Deep, Jobs sind kein Schwarm, Memory braucht Ja.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S391-1 | Gold | `eval/corpus.ts` `test-prompts.ts` `test-copy.ts` | `Tischplatte an` → `board`. `Zeig Sprints` / `Zeig Module` / `Simuliere Kalender` → `board`. `Schreibtisch an` → `desk`. `Tisch an` → `desk` |
| S391-2 | Konflikte | `conflicts.ts` | Plug/Wetter/Kalender schlagen `board`. `platte`-Token schlägt `desk` |
| S391-3 | Unit | `test-board*.mjs` `test-research-deep*.mjs` `test-memory-propose*.mjs` | Theme-JSON wirft unbekannte Keys weg. Deep-Queries ≥ 3 Rollen, Live-Lookup 1–2. `proposeMemory` Dump → keine Row. Accept ruft Gate |
| S391-4 | GUI | Puppeteer analog Homescreen | Toggle an: Icons `hidden`, Wallpaper-Klasse `is-tischplatte` / Wand B. Toggle aus: Icons da, Wand A. Kachel-Hintergrund = Wallpaper, nicht `tint` |
| S391-5 | Version | `store.ts` Docs | App-Code `18.19.0` erst beim Execute. Sideload bleibt `18.17.0` bis APK. `TEST-18.19.md` dann, nicht in PLAN |

## Won’t

Execute. APK. Fremde Drafts mergen. Schwarm-Gold.

## Abbruchkriterium

Ein Gold-Satz aus `18.18`/Desk/Idee wird rot, weil `board` zu gierig scored.
Oder nach Toggle sieht man dieselben Candy-Kacheln auf demselben Grund.

## Manuell

Siehe [`91-next.md`](../91-next.md) §14 plus:

```
Tisch an
Wetter Berlin
alle Steckdosen aus
```

Weiter Desk / Wetter / Plug.
