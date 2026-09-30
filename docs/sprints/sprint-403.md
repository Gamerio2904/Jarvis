# Sprint 403 — Gold

**Version:** `18.21.0` — **PLAN** Must
**Plan:** [`93-next.md`](../93-next.md)
**Voraussetzung:** 398–402.

## Ziel

Die Sätze aus [`TEST-18.21.md`](../TEST-18.21.md) routen, der PC-QR nicht.
Version und Testkarten erst hier, nicht vorher.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S403-1 | Gold | `eval/corpus.ts` | `Übertrage das fürs Tablet` und `Mach den QR-Code` → `xfer`. `PC QR scannen` → `pc`. `Lies das PDF` bleibt `doc` |
| S403-2 | Karten | `test-copy.ts` `probe-lanes.ts` | Gruppe `18.21 Datei-QR` in Spur Heute. Dieselben Sätze wie `TEST-18.21.md` |
| S403-3 | Version | `package.json` Docs | App-Code `18.21.0`, versionCode `182100`, erst wenn 398–402 grün sind. Bis dahin bleibt die Sideload `18.20.1` |

## Won't

APK in diesem Plandokument. Die Datei entsteht beim Ausführen, nicht beim Planen.

## Abbruchkriterium

`PC QR scannen` wird `xfer`, oder die Testkarten liegen in der App, bevor der Code eine Antwort zeichnet.
