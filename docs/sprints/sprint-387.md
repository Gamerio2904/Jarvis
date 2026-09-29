# Sprint 387 — Feature-Katalog aus den Docs

**Version:** `18.19.0` — **PLAN** Must
**Plan:** [`91-next.md`](../91-next.md)
**Voraussetzung:** 385 (Tafel oder Chat darf antworten). Docs-Stand `#156` nicht mergen.

## Ziel

Auf Befehl nennt Jarvis **gebaute** Funktionen und die nächste Schiene
aus einem Freeze-Katalog. Das Modell formuliert, ergänzt keine Drafts.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S387-1 | Katalog | `feature-catalog.ts` **neu** | Zeilen `{ id, version, area, title, can, wont, prompt }`. Quelle: Hilfe + Kopf `42-planned` + Unreleased der lebenden Version. Cap ~120. Freeze-Datum + Bundle-Version im Kommentar |
| S387-2 | Parser | `board-parse.ts` oder `help` | `Was ist geplant`, `Was steht in den Docs`, `Welche Features hat {area}`, `Was kann Jarvis`, `Lies die Docs zu {area}`. Geräte gewinnen in `conflicts.ts` |
| S387-3 | Render | Chat + Tafel-Kopf | Filter nach `area`. Fehlt Zeile → „steht nicht im Katalog (Stand {version})“. Kein Koch/`#149` |
| S387-4 | Test | Unit | Kalender-Frage trifft `calendar`-Zeilen. Unbekannte Area → ehrliche Leere. Katalog enthält keine RICE-Spalte |

## Won’t

Laufzeit-Clone von `docs/`. GitHub-Docs-API. `#156` stehlen. LLM als
Quelle. 400 historische Sprints in der APK.

## Abbruchkriterium

Antwort erfindet ein Feature, das nicht in `feature-catalog.ts` steht.

## Manuell

```
Was ist geplant
Welche Features hat der Kalender
Was kann Jarvis
Lies die Docs zu Deep Research
```
