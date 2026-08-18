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
| **MAJOR** | Grober Produktsprung / Meilenstein | z.B. `1.0.0` = nächster Sprung nach `0.11` (PO) |
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
| `0.8.1` | **Assist Hotfix** (normalize_value, soften_duzen, Soft-Confirm Value-Gate) | Sprint 23 |
| `0.8.2` | **Edge & Reply Polish** (Capabilities-Varianten, Canned, Forget/Soft-Reject, Residual-Duzen) | Sprint 24 |
| `0.8.3` | **Assist Ops Polish** (Scorecard, Delight-Persist, Audit-UI, Latency-Hinweis) | Sprint 25 |
| `0.8.4` | **Siezen & Recall Hotfix** (Broken-Siezen, Identity-Recall, CJK-Task) | Sprint 26 |
| `0.8.5` | **Persona & Continuity Hotfix** (Master-Scrub, Rest-Duzen, Clarify-Follow-up) | Sprint 27 |
| `0.9.0` | **Local Tools Core** (Runtime, Notes, Todos, Confirm) | Sprint 28 |
| `0.9.1` | **Tools Hotfix** (False-Confirm, Memory↔Tool, Inject) | Sprint 29 |
| `0.9.2` | **Tools Polish** (Continuity, Listen-UX, Scorecard) | Sprint 30 |
| `0.9.3` | **Memory Quality Hotfix** (Multi-Fact, Pref-Recall) | Sprint 31 |
| `0.9.4` | **Assist Continuity & Siezen** (Clarify-Plan, Residual-Siezen, EN) | Sprint 32 |
| `0.9.5` | **Tools Hygiene & Confirm-UX** (Scope, UI-Confirm, Aufräumen) | Sprint 33 |
| `0.10.0` | **NAS Core** (Compose, Volumes, Autostart) | Sprint 34 |
| `0.10.1` | **NAS Hotfix** (Backup, Rechte, Startfehler) | Sprint 35 |
| `0.10.2` | **NAS Auth & LAN** (Owner-Token) | Sprint 36 |
| `0.10.3` | **APK Core** (Capacitor Sideload) | Sprint 37 |
| `0.10.4` | **APK Hotfix** (Tastatur, Reconnect, Fehler) | Sprint 38 |
| `0.10.5` | **APK Polish** (First-Run, Icon) — `0.10` zu | Sprint 39 |
| `0.11.0` | **Samsung TV Core** (Tizen lokal, WOL, Vol, HDMI) | Sprint 40 |
| `0.11.1` | **Samsung TV Hotfix** | Sprint 41 |
| `0.11.2` | **Samsung TV Settings-UI** (suchen/koppeln/testen) | Sprint 42 |
| `0.12.0` | **NAS-Proxy & APK** — **superseded** durch On-Device | Sprint 43 |
| `0.13.0` | **On-Device Handy** (WASM-LLM, kein Server) | Sprint 44 |
| `0.13.1` | **Modell-Download Hotfix** (Cache API, kein OPFS-„file not found“) | Sprint 45 |
| `0.13.2` | **Chat-Hang Hotfix** (Streaming, Threads, Timeout) | Sprint 46 |
| `0.14.0` | **Qualität & Latenz** — bestehendes härten, nichts Neues | Sprint 47 |
| `0.14.1` | **TV verbinden & steuern** — Tizen on-device (ex-`0.11`) | Sprint 48 |
| `0.16.0` | **Gemini Opt-in** — Google-API, Default aus | Sprint 50 |
| `1.0.0` | **Jarvis 1.0** — On-Device, TV, Gemini-Kaskade, APK `Jarvis.apk` | nach `0.16` |
| `1.1.0` | Sound + Research-Quellen | Sprint 51 |
| `1.2.0` | Erinnerungen mit Zeit | Sprint 52 |
| `1.3.0` | Ort & Wetter | Sprint 53 |
| `1.4.0` | Kalender-GUI (lokal) | Sprint 54 |
| `1.5.0` | Sprachmodus + Homescreen-Shortcut | Sprint 55 |
| `1.6.0` | Wetter als Lage + Tipp | Sprint 56 |
| `1.7.0` | Timer + Klingeln (Screen aus) | Sprint 57 |
| `1.8.0` | Wiederkehrende Erinnerungen | Sprint 58 |
| `1.9.0` | Wetter-Nachfragen | Sprint 59 |
| `1.10.0` | Homescreen-Widget | Sprint 60 |
| `1.11.0` | Wake-Word (Handy an) | Sprint 61 |
| `1.12.0` | Wecker + eigener Ton | Sprint 62 |
| `1.13.0` | GUI fest, Chat scrollt, Motion | Sprint 63 |
| `1.13.1` | Kalender-Datum + Wecker-Titel | Sprint 64 |
| `1.13.2` | Timer-Ton (nicht nur Vibration) | Sprint 65 |
| `1.14.0` | Kontext überall + Gedächtnis gleich | Sprint 66 |
| `1.15.0` | Personen/Orte + Google-Maps-Route | Sprint 67 |
| `1.16.0`–`1.23.0` | Einkauf … Widget (geplant gestuft) | Sprints 68–75, **mitgeliefert in `1.24.0`** |
| `1.24.0` | Alltag 1.16–1.24 inkl. Gespräch suchen | Sprint 76 |
| `1.24.1` | Chat-Hang TV/Standort | Sprint 76 Patch |
| `1.25.0` | Einstellungen Vollbild + Themen-Leiste | Sprint 77 |
| `1.26.0` | Fahrmodus, Spotify, Auge, TV-Lautstärke | Sprint 78 |
| `1.27.0` | Internes Spotify im Fahrmodus | Sprint 79 |
| `1.27.1` | Anruf-Hotfix (Service-Prefix, Nummer) | Sprint 79 Patch |
| `1.27.2` | Fahrmodus „Nach Heilbronn“ + Sprache | Sprint 79 Patch |
| `1.28.0` | Wake-Word Hintergrund + Fire TV HDMI | Sprint 80 |
| `1.28.1` | Wake-Word öffnet Sprachmodus | Sprint 80 Patch |
| `1.28.2` | Fire-TV-Test sichtbar, Gen-2-Hinweis | Sprint 80 Patch |
| `1.28.3` | Wecker klingelt (Dienst + Alarm-Lautstärke) | Sprint 80 Patch |
| `1.29.0` | Suche, Fire TV in der APK, GUI-Icons, Widget 2×4, Ventilator | Sprint 81 |
| `1.30.0` | CarPlay flüssig: HUD, Voice-Tabs, Navi-Ansagen | Sprint 82 |
| `1.31.0` | Stimme Charon + Latenz; Jarvis-Smalltalk | Sprint 83 |
| `1.32.0` | Samsung-Apps YouTube/Amazon/Disney/Netflix | Sprint 84 |
| `1.32.1` | Sprachmodus Tempo (kein Hänger, sofort Ton) | Sprint 85 |
| `1.33.0` | Suche & Antworten (Preise, keine Absage, CarPlay öffnen) | Sprint 86 |
| `1.33.1` | Fernseher: YouTube-Video vs Film, Follow-up `… ab` | Sprint 86 Patch |
| `1.33.2` | Widget öffnet Sprachmodus (hören + antworten) | Sprint 86 Patch |
| `1.33.3` | Wecker klingelt wieder (nicht nur Anzeige) | Sprint 86 Patch |
| `1.34.0` | Bessere Antworten (History, Memory, Persona, Groq) | Sprint 87 |
| `1.35.0` | CarPlay besser (Replan, Cue, HUD, Zoom, Ankunft) | Sprint 88 |
| `1.36.0` | Alltag-Phrasen (bestehende Tools, Smalltalk-Schutz) | Sprint 89 |
| `1.37.0` | Flüssig (Chat, Overlay, Wake-Word, Voice, TV, Widget) | Sprint 90 |
| `1.38.0` | Gedächtnis im Dialog (Recall, Widerspruch, Anapher) | Sprint 91 |
| `1.39.0` | Stimme bleiben (NO_MATCH, Barge-in, Navi vs Jarvis) | Sprint 92 |
| `1.40.0` | Härten (Eval, False-Positives, keine Fake-Erfolge) | Sprint 93 |
| `1.40.1` | Sätze zu Ende; TV-Tasten/Ordinal, YouTube-Suche, kein Live-Bild | Sprint 93 Patch |
| `1.40.2` | Timer spricht ohne Klingeln; natürliche Timer-Sätze | Sprint 93 Patch |
| `1.40.3` | Chat/Stimme näher am Film-Jarvis (Understatement) | Sprint 93 Patch |
| `1.41.0` | Tanke: nächste + günstigste, immer E10, Preise | Sprint 94 |
| `1.42.0` | Wo bin ich: GPS + Freigabe anstoßen | Sprint 95 |
| `1.43.0` | CarPlay ehrlich: Overlay, Restweg, POI, Anruf/SMS | Sprint 96 |
| `1.44.0` | Filme: IMDb/RT über OMDb, wo gratis; Rabatt-Suche | Sprint 97 |
| `1.45.0` | Öffnungszeiten für Läden aus OSM | Sprint 98 |
| `1.46.0` | Anruf/SMS direkt, erst nach Nachfrage | Sprint 99 |
| `1.47.0` | PC live: Bildschirm, Maus, FIFA, Ordner | Sprint 100 |
| `1.47.1` | Ein-Klick-Kopieren IP/Token/Prompts | Sprint 100 Patch |
| `1.48.0` | Luft/Sonne auf Nachfrage, Bahn, Tagesschau, Feiertage | Sprint 101 |
| `1.48.1` | Satzbildung näher am Film-Jarvis | Sprint 101 Patch |

### Weitere Beispiele

| Version | Bedeutung (Beispiel) |
|---------|----------------------|
| `0.1.2` | Hotfix-Patch nach `0.1.1`, falls nötig |
| `0.2.3` | Hotfix-Patch nach `0.2.2`, falls nötig |
| `0.3.2` | Hotfix nach `0.3.1`, falls nötig |
| `0.5.3` | Weiterer Router-Patch nach `0.5.2`, falls nötig |
| `0.6.3` | Weiterer Research-Patch nach `0.6.2`, falls nötig |
| `0.7.3` | Delight/Session-Patch (Sprint 21; mitgeliefert in `0.8.0`) |
| `0.8.5` | Persona/Continuity-Patch nach `0.8.4` (Sprint 27) |
| `0.9.0` | Local Tools Core — Option A (Sprint 28) |
| `0.9.1` | Tools Hotfix (Sprint 29) |
| `0.9.2` | Tools Polish (Sprint 30) |
| `0.9.3` | Memory Quality Hotfix (Sprint 31) |
| `0.9.4` | Assist Continuity & Siezen (Sprint 32) |
| `0.9.5` | Tools Hygiene & Confirm-UX (Sprint 33) |
| `0.10.0` | NAS Core — Compose 24/7 (Sprint 34) |
| `0.10.5` | APK Polish — Abschluss NAS+APK (Sprint 39) |
| `0.11.0` | Samsung TV Core (Sprint 40) |

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
