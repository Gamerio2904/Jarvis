# 83 — Lage Serie-Netz (Rick and Morty) **CODE + APK** (`18.12.0`)

PO: Jeder Charakter der Serie als Knoten in der Lage. Klick öffnet
Steckbrief (Eigenschaften, Fähigkeiten) mit Staffel/Folge. Kanten sind
Connections. Nur belegte Fakten.

## 0. Quellen (Deep Research)

| Quelle | Was sie hergibt | Was nicht |
|--------|-----------------|-----------|
| [Rick and Morty API](https://rickandmortyapi.com/documentation) · [afuh/rick-and-morty-api](https://github.com/afuh/rick-and-morty-api) BSD-3 | 826 Charaktere, 51 Folgen S01–S05, Status, Spezies, Herkunft, Auftritte, Bilder | Keine Skills, keine Familienkanten, keine S06+ |
| Folge-Join über `episodeIds` (wie [Apify-Scraper](https://apify.com/crawlerbros/rick-and-morty-scraper) beschreibt) | Co-Appearance-Kanten: wer in derselben Folge steht | Keine Beziehungsart |
| [Social Graph / Transcripts](https://rickandmorty.ldargaud.fr/) | Open-Source-Analyse von Interaktionen | Fan-Statistik, nicht unser Snapshot |
| Fandom-Wiki (Enhancements, Operation Phoenix) | Folgenbelege für Schild, Phoenix, Cybernetik | Kein Copy-Paste; nur eigene Kurzzeile + Code |
| Netflix DE | Dieselbe TV-Serie; Katalog 2025/26 gewechselt (HBO Max, Staffel 9). Kein separates Netflix-Kanon | Kein Live-Katalog in der App |

**Won’t:** Comics, Fanfiction, erfundene Skills, S06–S09 als API-Knoten,
S05E05 als „Unsterblichkeitsschild“ (das ist *Amortycan Grickfitti*;
Schild = **S03E05** *The Whirly Dirly Conspiracy*, Phoenix = **S02E07** / **S04E01**).

## 1. Architektur

```text
rm-snapshot.json   API-Stand, Refresh: node scripts/fetch-rm-snapshot.mjs
rm-dossier.ts      kuratierte Skills + benannte Kanten, nur mit Code
rm-graph.ts        Layout, Co-Appearance, Steckbrief
SerieMapCanvas     826 runde DOM-Avatare über den Kanten, kuratierte Kanten
SerieDossier       Vollbild 300×300, Rasse, Skills mit Staffel/Folge
Lage-Tab Serie     plus Satz „Rick and Morty“ / „Charakter-Netz“
```

## 2. Sprint 341

Must: Tab, alle API-Knoten, Steckbrief mit Beleg, benannte Kanten plus
gemeinsame Folgen, Parser, Tests. Kein 18.5 parallel.

## 3. Kamera-Fähigkeiten ab Staffel 6 (`18.12.0`, Sprint 347)

Die offene API endet bei S05. Ab Staffel 6 gilt nur das, was auf dem Foto
sichtbar ist, plus Staffel und Folge, die Sie sagen. Kein Wiki, kein
Folgentitel, kein 65. Agent — Route bleibt `hud`.

```text
Foto-Knopf → saveLastEyeImage (auch vor OCR)
„Staffel 6 Folge 3“ → parseRmSceneIntent → handleRmScene
Gemini-Vision JSON {items:[{who,skill,sure}]}
Ja → IndexedDB rm_scene_skills → Dossier · Kamera
Unbekannte Gesichter → Chat-Notiz, kein neuer Knoten
```

**Won’t:** S06–S09 als API-Knoten. Erfundene Folgennamen. Wiki-Text.
Neuer Domänen-Agent. Kamera-Write für S01–S05. Nutella/Carbonara/Wäsche
als Szene.

## 4. Bilder + Graph im Chat (`18.12.2`)

Die API-Avatare liefen ins Rate-Limit (farbige Kreise). Alle 826 JPEGs
liegen unter `public/rm-avatars/{id}.jpeg`. `rmAvatar` ist lokal, die
API nur Fallback.

Chat-Fragen zum Netz (`Wer ist Rick Sanchez`, `Wann hatte er ein
automatisches Schild`) gehen über `hud` / `rm-ask` und zitieren nur
Steckbrief und Beleg. Kein Wikipedia-Raten. Route bleibt `hud`.
