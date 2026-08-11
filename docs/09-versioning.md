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
| **MAJOR** | Grober Produktsprung / Architekturbruch | z.B. Assistent mit Tools, anderer Laufzeit-Stack |
| **MINOR** | Geplantes Sprint-/Etappenziel erreicht | Neues nutzbares Fähigkeitsniveau |
| **PATCH** | Nachzieher / Fixes / kleine Ergänzungen **nach** einem MINOR-Ziel | Zwischenversionen: `1.0.1`, `1.0.2`, … |

### Beispiele

| Version | Bedeutung (Beispiel) |
|---------|----------------------|
| `0.1.0` | Erstes lauffähiges Local-Smalltalk-Increment (Sprint-1-Ziel) |
| `0.1.1` | Persona-/Bugfix nach Review |
| `0.2.0` | Nächstes geplantes Ziel (z.B. Chat-Liste poliert / Persistenz hart) |
| `1.0.0` | Erstes „Alltags-taugliches“ Privat-Release (Definition PO) |

> **Hinweis:** Solange wir vor dem ersten Alltag-Release sind, bleiben wir bei **`0.x.y`**.  
> Exakter Startpunkt für `0.1.0` / `1.0.0` — siehe offene Frage Q34.

## Was wird versioniert?

| Artefakt | Wie |
|----------|-----|
| Git-Tags | `v0.1.0`, `v0.1.1`, … bei abgeschlossenen Zielen |
| Sprint-Log | Jeder Sprint nennt **Ziel-Version** (MINOR) |
| Docs | Kopfzeile oder Changelog-Eintrag mit Version |
| App/UI (später) | Angezeigte Build-/Versionsnummer |

## Sprint ↔ Version

1. Im Planning: Sprint-Ziel + **Ziel-Version** festlegen (meist nächstes `MINOR`).
2. Währenddessen: Arbeit am Branch; noch kein Tag.
3. Bei Review bestanden: Tag `vX.Y.0` (oder vereinbartes MINOR).
4. Nachbesserungen ohne neues Sprint-Ziel: `PATCH` (`vX.Y.1`, …).
5. Größere neue Scope-Idee: neuer Sprint → neues `MINOR` (oder `MAJOR`).

## Changelog

Kurz gehalten unter `docs/CHANGELOG.md` (wird mit erster Release-Version angelegt bzw. parallel geführt):

- Was ist neu / geändert / behoben
- Bezug Sprint + Version

## Abgrenzung Motion-/GUI-Updates

Premium-Motion und UI-Feinschliff können eigene **MINOR**-Ziele sein (z.B. „GUI Update Motion“), statt heimlich in Patches zu verschwinden — außer wirklich kleine Fixes.
