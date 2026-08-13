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

| Version | Bedeutung | Sprint |
|---------|-----------|--------|
| `0.1.0` | **MVP** Local Smalltalk | Sprint 1 |
| `0.1.1` | **Must-Fixes** nach MVP-Test (Persona, Injection, Modell, Sampling, Smoke) | Sprint 2 |
| `0.2.0` | **Verbesserungen** (Streaming, UI-Fehler, Eval, Löschen, härtere Guards) | Sprint 3 |
| `0.2.1` | **Must-Fixes** nach `0.2.0`-Deep-Test (Listen/Roleplay, Duzen v2, Whole-Reply-Inject, Sticky v2, Eval) | Sprint 4 |
| `0.2.2` | **Charakter-Fixes** nach `0.2.1`-Deep-Test (Boilerplate hard-refuse, Kaputt-Pfad jarvis-treu) | Sprint 5 |
| `0.3.0` | **GUI Update** Premium-Motion (Spotify-Dunkel + ChatGPT-Layout, smoother UX) | Sprint 6 |
| `0.3.1` | **GUI Polish** nach `0.3.0`-Test (Gradient/Focus/Backdrop, ruhiger Chat-Wechsel) | Sprint 7 |
| `0.4.0` | **Gedächtnis & Kontext** (Langzeitgedächtnis v1, Summary, Kompression) | Sprint 8 |
| `0.4.1` | **Memory Must-Fixes** (False-Confirm, Guard/Aussetzer, Vergiss-alles) | Sprint 9 |
| `0.4.2` | **Memory Polish** (Parser/Split/TTL/UI-Filter, Widerspruch-Heuristik) | Sprint 10 |
| `0.4.3` | **Memory Hotfix** (Clause-Split, Recall-Stabilität, Pref ohne „mein“) | Sprint 11 |
| `0.5.0` | **Intelligence Core** (Router: merk/recall/forget + clarify; Routing; Scores) | Sprint 12 |
| `0.5.1` | **Router Hotfix** (Inject/Task, Weak-Write, Non-Memory-Fallbacks) | Sprint 13 |
| `0.5.2` | **Router Polish** (Patterns, Live-Scorecard, Routing-Ehrlichkeit) | Sprint 14 |
| `0.6.0` | **Internet-Research** opt-in, citation-required | Sprint 15 |
| `0.6.1` | **Research Hotfix** (Query-PII/Noise, Topic-Extraktion, Settings-Hygiene) | Sprint 16 |
| `0.6.2` | **Research Polish** (Persona, Dual-Provider/DDG, Scorecard) | Sprint 17 |
| `0.7.0` | **Delight + Settings** (Momente, Jokes, Sound, Eggs, flaches Settings) | Sprint 18 |
| `0.7.1` | **Quality Hotfix** (Guards, Settings-Clamp, Research-Junk, Inject, Identität) | Sprint 19 |
| `0.7.2` | **Reply Quality Polish** (weniger Canned, Recall, CJK, Multi-Turn, Capabilities) | Sprint 20 |
| `0.7.3` | **Delight & Session Polish** (Mood-Scope, Eggs-off, Research-UX, Latenz) | Sprint 21 |
| `0.8.0` | **Assist Clarity** (Clarify-First, `/hilfe`, Streaming-UX, Research/Memory-Feedback) | Sprint 22 |
| `1.0.0` | **NAS / 24/7** | Phase 3 |

### Weitere Beispiele

| Version | Bedeutung (Beispiel) |
|---------|----------------------|
| `0.1.2` | Hotfix-Patch nach `0.1.1`, falls nötig |
| `0.2.3` | Hotfix-Patch nach `0.2.2`, falls nötig |
| `0.3.2` | Hotfix nach `0.3.1`, falls nötig |
| `0.5.3` | Weiterer Router-Patch nach `0.5.2`, falls nötig |
| `0.6.3` | Weiterer Research-Patch nach `0.6.2`, falls nötig |
| `0.7.3` | Weiterer Quality-Patch nach `0.7.2`, falls nötig |
| `0.8.1` | Hotfix nach `0.8.0`-Deep-Test, falls nötig |

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
