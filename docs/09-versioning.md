# 09 — Versionierung

Projektübergreifende Versionslogik für Code, Docs, Sprints und Releases.

## Prinzip

Jede sinnvolle Lieferstufe hat eine **Version**.  
Die Version beschreibt **was nach dem Sprint / der Etappe erreicht sein soll** — nicht „wie viele Tage vergangen sind“.

## Schema (SemVer-artig)

```text
MAJOR.MINOR.PATCH
```

| Teil | Wann erhöhen | Bedeutung |
|------|----------------|-----------|
| **MAJOR** | Grober Produktsprung / Meilenstein | z.B. `1.0.0` = NAS 24/7 |
| **MINOR** | Geplantes Sprint-/Etappenziel erreicht | Neues nutzbares Fähigkeitsniveau |
| **PATCH** | Nachzieher / Fixes / kleine Ergänzungen **nach** einem MINOR-Ziel | Zwischenversionen: `0.1.1`, `0.1.2`, … |

### Festgelegte Meilensteine

| Version | Bedeutung |
|---------|-----------|
| `0.1.0` | **MVP** — Local Smalltalk abgenommen (Sprint-1-Ziel) |
| `0.1.x` | Patches/Feinschliff nach MVP |
| `0.2.0+` | Weitere Etappen vor NAS (UI-Update, Gedächtnis-Ausbau, Handy, …) |
| `1.0.0` | **NAS / 24/7** erreicht |

### Weitere Beispiele

| Version | Bedeutung (Beispiel) |
|---------|----------------------|
| `0.1.1` | Persona-/Bugfix nach MVP-Review |
| `0.3.0` | z.B. GUI-Update Premium-Motion |
| `0.4.0` | z.B. maximal gutes Gedächtnis (Ausbau) |

## Was wird versioniert?

| Artefakt | Wie |
|----------|-----|
| Git-Tags | `v0.1.0`, `v0.1.1`, … bei abgeschlossenen Zielen |
| Sprint-Log | Jeder Sprint nennt **Ziel-Version** (MINOR/MAJOR) |
| Docs | Kopfzeile oder Changelog-Eintrag mit Version |
| App/UI (später) | Angezeigte Build-/Versionsnummer |

## Sprint ↔ Version

1. Im Planning: Sprint-Ziel + **Ziel-Version** festlegen.
2. Währenddessen: Arbeit am Branch; noch kein Tag.
3. Bei Review bestanden: Tag `vX.Y.0` (oder vereinbartes MINOR/MAJOR).
4. Nachbesserungen ohne neues Sprint-Ziel: `PATCH` (`vX.Y.1`, …).
5. Größere neue Scope-Idee: neuer Sprint → neues `MINOR` (oder `MAJOR`).

## Changelog

Kurz gehalten unter `docs/CHANGELOG.md`:

- Was ist neu / geändert / behoben
- Bezug Sprint + Version

## Abgrenzung Motion-/GUI-Updates

Premium-Motion und UI-Feinschliff können eigene **MINOR**-Ziele sein (z.B. „GUI Update Motion“), statt heimlich in Patches zu verschwinden — außer wirklich kleine Fixes.
