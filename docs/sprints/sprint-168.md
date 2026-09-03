# Sprint 168 — Ausführlicher Geräte-Test (`9.9.2`) **PLAN + Katalog**

Erster Sprint der Rest-Serie [`54-next.md`](../54-next.md). Danach Debug `169`–`170`, Sehen `171`–`172`, Qualität-Could `173`–`177`.

| Feld | Wert |
|------|------|
| Status | **KATALOG** (Parser **CODE**, Gerät PO) |
| Ziel-Version | `9.9.2` |
| Quelle | Screenshot-Bugs, Probe V1–V9 |

Parser und Routing sind in `test:014` und der Debug-Gruppe **Screenshot-Bugs** fest. Der Rest läuft auf dem Handy, weil GPS, Mic, Edge-TTS und Tizen sich nicht im Node-Test beweisen.

Einstellungen → Tests: Gruppe **Screenshot-Bugs** plus Probe **V1–V9**. Jeden Prompt einzeln kopieren, nicht als Block.

## A. Chat (Tipp, nicht Stimme)

| # | Eingabe | Soll |
|---|---------|------|
| A1 | `Hallo Jarvis.` | Greeting oder Smalltalk, nicht Tool-Loop |
| A2 | `hallo wie geht es dir` | `Guten … Gut, danke. Und Ihnen?` — nicht dreimal „Was steht an?“ |
| A3 | `ähm ja ich bin auf Arbeit und wie gehts dir` | Inhalt zur Arbeit, **kein** Greeting-Loop |
| A4 | `Was passiert Gersde in der Welt` | Weltlage / Tour, **kein** Ort „Gersde“ |
| A5 | `Was passiert gerade in der Welt` | Outlook, Tagesschau/DW-Sätze oder ehrlich leer |
| A6 | `Nein was gerade in der Welt passiert habe ich gefragt` | Outlook, nicht Research-off-Floskel wenn Outlook greift |
| A7 | `Wo bin ich` | Aktuelle Straße/Ort oder ehrlich „Kein Standort“ — nicht ein alter Arbeitgeber |
| A8 | `Mach du das an` nach Research-Angebot | Einmal suchen, nicht „Kein TV“ |
| A9 | `Suche nach Fernseheren` | TV suchen/koppeln, nicht Internet-Research-aus |
| A10 | `Ja Fernseher aus` | TV-aus oder ehrlich ungepaart |
| A11 | `Lage` einmal | Eine Lage-Fläche, keine Chip-Spam, keine ERDE-Anleitung |

Abbruch: gleiche Greeting-Zeile zweimal, „Gersde“ als Eigenname, Valeo-Adresse obwohl man woanders steht.

## B. Stimme (Mic grün)

| # | Sprechen | Soll |
|---|---------|------|
| B1 | „Hallo wie geht’s dir“ | 1–2 ganze Sätze, First-Audio spürbar unter ~1,5 s nach Ende des Hörens |
| B2 | „Ähm ja ich bin auf Arbeit…“ | Filler weg, kein Greeting-Loop |
| B3 | „Was passiert gerade in der Welt“ | Auch bei undeutlichem „Gersde“ → Weltlage |
| B4 | „Wo bin ich“ | Gleicher Ort wie A7 |
| B5 | Undeutlich „Fernseher aus“ / „Fernseheren“ | TV-Pfad |
| B6 | Lange Antwort-Versuch „erzähl alles“ | Trotzdem 1–2 Sätze, Punkt, kein Abbruch mitten im Wort |

Abbruch: >2 s Stille vor dem ersten Ton ohne Netzgrund; Telegramm-Stichworte; Transkript „Edge Conrad…“ im Chat.

## C. Lage / Kugel

| # | Aktion | Soll |
|---|--------|------|
| C1 | Lage → Kugel | Erde sichtbar, Hinweis kurz, kein ERDE-Tutorial |
| C2 | Finger nach rechts | Kontinente nach rechts |
| C3 | Finger nach oben | Kontinente nach oben (nicht Spiegel) |
| C4 | Loslassen | Trägheit klingt ab, danach **steht** die Kugel (kein Idle-Karussell) |
| C5 | Pinch | Zoom ohne Ruckeln-Dauerfeuer |
| C6 | Pin „Sie“ | Entspricht A7 / aktuellem GPS, nicht 0/0, nicht Valeo wenn man nicht dort ist |
| C7 | Lage aus | Chat wieder voll, Kugel-rAF tot |

Abbruch: dauerhaft warmes Gerät bei stiller Kugel; Invert; Pin am Äquator ohne Fix.

## D. Nachrichten / Research

| # | Eingabe | Soll |
|---|---------|------|
| D1 | `Nachrichten` | Tagesschau-Sätze oder ehrlich „Tagesschau nicht da“ |
| D2 | Weltlage bei Research aus | Outlook-Feed, nicht „Suche ist aus“ (das gilt für Live-Zahlen, nicht für Tagesschau) |
| D3 | `ja bitte` nach Research-Angebot | Einmal Netz, Quellen |
| D4 | Tippfehler `Gersde` | wie A4 |

## E. TV / Research-Verwechslung

| # | Kontext | Eingabe | Soll |
|---|---------|---------|------|
| E1 | Research-Pending | `Mach du das an` | Suche, nicht TV |
| E2 | last-tool TV | `lauter` | TV lauter |
| E3 | kein TV | `Fernseher an` | Settings/koppeln, kein Fake-Erfolg |
| E4 | Tippfehler | `Suche nach Fernseheren` | Discover |

## F. Truncation / Mund

| # | Check | Soll |
|---|-------|------|
| F1 | Ortsname mit Bindestrich | `Bietigheim-Bissingen` ganz oder Retry-Satz, nicht `Bietigheim.` |
| F2 | Körper → Mund | Keine Zeile, die wie ein Hör-Transkript klingt |
| F3 | Chat-Titel | Kürzt mit Ellipse, Inhalt im Chat vollständig |

## G. Probe V1–V9 (bestehend)

Einstellungen → Probe V1–V9. Jeden Prompt einzeln. Unverändert zu `9.9.0`/`9.9.1`.

| Probe | Thema |
|-------|--------|
| V1 | Overlay / Weltlage |
| V2 | Voice & App |
| V3 | Verified Actions |
| V4 | Dokumente |
| V5 | Gedächtnis |
| V6 | TV |
| V7 | PC |
| V8 | Live |
| V9 | Hardening |

## H. Hirn (KI)

Nur mit Gemini-Key (sonst Groq / ehrlich 0,5B).

| # | Eingabe | Soll |
|---|---------|------|
| H1 | Smalltalk ohne Tool | Siezen, keine Marvel-Lüge, keine erfundenen Live-Zahlen |
| H2 | `Wetter heute` | Open-Meteo, Parser, nicht Essay |
| H3 | Undeutlich getippt | Repair + Parser, nicht „keine Ahnung zu Gersde“ |
| H4 | Sprachmodus H1 | 1–2 Sätze, hörbar schnell |

## DoD Gerät (PO)

- [ ] A1–A11
- [ ] B1–B6
- [ ] C1–C7
- [ ] D–F
- [ ] V1–V9 unverändert grün
- [ ] Hausstand vorher exportieren, Sideload `9.9.2` über `9.9.1` oder `9.9.0`

Parser-DoD:

- [x] `test:014` inkl. Screenshot-Gruppe
- [x] `tsc -b`
