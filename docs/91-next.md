# 91 — Tischplatte + Deep Research + Hirn-Vorschläge **PLAN** (`18.19`)

PO: Wenn die rechte Leiste **Tischplatte an** schaltet, verschwinden die
App-Icons. Der Homescreen wird eine **glasartige, interaktive Werkbank**
für Projektplanung (PSP, Sprints, Forschung). Jarvis liest Funktionen aus
einem Docs-Katalog, startet Recherche- und Plan-Jobs nebeneinander und
reicht Vorschläge ans Haupthirn — die erst nach Prüfung Memory werden.

**Dieses Dokument ist PLAN. Kein Execute, kein App-Code, keine APK.**
Sprints **385–391**. Ziel-Version **`18.19.0`** erst beim Execute.
Grundlage: App-Code **`18.18.0`** [`90-next.md`](./90-next.md). Sideload
bleibt **`18.17.0`** bis eine spätere APK.

Andere Drafts bleiben getrennt: Koch `#149`, Kamera-Wahl `#151`, Clips
`#152`, Experte `#153`, Docs-Stand `#156`, Abbruch-Hotfix `#158`, PLAN
`#159`.

Hirn-Slots bleiben: **Groq primär → Gemini Spezialist (Vision, Grounding,
Deep Research) → 0,5B Fallback.** Parser wählen Geräte. Ein Domänen-Agent
pro Zug. Kein 5. LLM-Organizer, kein AutoGen-Schwarm.

---

## 0. Produkt in einem Satz

Homescreen hat zwei Lagen: **Launcher** (Icons, `18.18`) und **Tischplatte**
(Glas + Projekt). Dieselbe Mini-Chat- und Sprach-Kugel steuert die Tafel.
Forschung und Sprintplan sind **Jobs in einem Handler**, nicht zwei Hirne.
Was ins Haupthirn soll, liegt zuerst in einer **Vorschlags-Schlange** und
geht nur nach Ja durch `writeMemory`.

---

## 1. Ist (Diagnose)

Was der Wunsch oft in einen Topf wirft, liegt im Code schon als **vier
getrennte Flächen**. Die Lücke ist die Projektion, nicht ein zweites OS.

| Fläche | Datei | Ist (`18.18.0`) | Lücke |
|--------|-------|-----------------|-------|
| Homescreen | `HomeScreen.tsx` `GlanceRail.tsx` | Neun Icons, Werte-Leiste **ohne** Schalter Tischplatte | Kein Modus, der Icons ausblendet |
| Schreibtisch | `desk.ts` `desk-parse.ts` | „Schreibtisch an“ = letztes Auge-/PC-Foto in den Prompt. Kein Overlay | **Anderer** Vertrag. Gold darf nicht stehlen |
| Ambient | `App.css` `.ambient` | CSS-Orbs, kein WebGL | Kein Glas-Board, keine Karten |
| Idee / Scrum | `idea.ts` `idea-plan.ts` | Feste Vorlage Kern/Härten/Probe. Groq füllt Felder. Chat-Markdown, kein Overlay | Plan liegt unsichtbar, sobald der Chat scrollt |
| Deep Research | `research-parse.ts` `web-search.ts` `brain-orchestrator.ts` | Modus der Suche: 3–5 DDG-Queries + Wikipedia + Gemini-Grounding. Teach-Offer danach | Query-Rollen hart verdrahtet (Anzug/Stalingrad). Kein GitHub. Kein Claim-Objekt. Allgemein, nicht „nur Tisch“ — aber dünn |
| Research-Pending | `research-pending.ts` | Opt-in, TTL, Ja bitte | Keine Job-Karte auf einer Tafel |
| Docs | `docs/*.md` im Repo | Mensch liest GitHub. APK hat **keinen** Docs-Baum | „Was ist geplant?“ fällt ins LLM oder in Hilfe-Schnipsel |
| Haupthirn | `memory-gate.ts` `writeMemory` | STORE/MERGE/IGNORE/REVISE. Origin `user` / `sleep` / `tool`. Teach-Packs nach „lern das“ | Research darf **nicht** still Prefs schreiben. Es gibt keine Review-Schlange für Agenten-Funde |

Gold heute: `Schreibtisch an` → `desk`. `Idee:` → `idea`. `Recherchiere tief:` → Deep-Flag im Chat-Loop, **kein** eigener Parser-Agent.

---

## 2. Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Zwei Tische | **Tischplatte** = Homescreen-Modus (Glas, PSP). **Schreibtisch** = Foto-Blick (`desk`). Getrennte Parser, getrennte Gold-Zeilen |
| Schalter | Rechte Werte-Leiste: `Tischplatte an/aus`. Zusätzlich Chat/Stimme: „Tischplatte an“ |
| Icons | An → Raster `display:none` / `hidden`. Mini-Chat, Sprach-Kugel, Werte-Leiste, Dock-Start **bleiben** |
| Hintergrund | **Prozedurales Glas** (CSS + Canvas-2D), Jarvis-Palette. Optional ein kurzer Groq-Hint `{accent, glow, density}` — das ist das ehrliche „KI-themed“. Kein Imagen/DALL-E/Midjourney in der APK |
| Projektmodell | PSP (Projektstrukturplan) = Baum Auftrag → Epics (Ideen) → Sprints (Kern/Härten/Probe + Custom) → Tasks. Kanban-lite: Jetzt / Als Nächstes / Park / Fertig. Kein Jira, kein RICE, kein Story-Point |
| Scrum | **Kein** neuer LLM-Scrum-Master. Der bestehende `idea`-Agent füllt die Vorlage; die Tischplatte **projiziert** denselben `IdeaPlan` |
| Docs | Gebauter **Feature-Katalog** (JSON, Freeze beim Bundle). Parser liest Zeilen. Jarvis erfindet keine Features, die nicht in der Tabelle stehen |
| Deep Research | Bleibt **Modus der Suche** (Slot `research-deep`), allgemein, nicht tisch-exklusiv. Härten: Query-Rollen, Quellenpflicht, optionale GitHub-Suche |
| Parallel | **Jobs**, nicht Schwarm. Ein User-Zug → ein Agent (`board` **oder** `idea` **oder** Deep im Chat-Loop). `Promise.all` nur **in** einem Handler (Fetches). Zwei Groq-Aufrufe hintereinander, nie zwei Organizer |
| Hirn schreiben | Research/Board legen `MemoryProposal` an. Nutzer sagt Ja → `writeMemory`. Nein → verwerfen. Stiller Write aus Recherche = Abbruch |

---

## 3. Won’t

- Execute in diesem Dokument (kein `HomeScreen.tsx` anfassen, solange PLAN).
- Android-Launcher, fremde App-Icons, Live-Wallpaper-Service.
- WebGL, Cesium, Lottie, Three.js, shader-Wallpaper.
- Bildgenerator-API (Imagen, DALL-E, Midjourney, Stable Diffusion in der APK).
- Always-on Webcam, Desk-Foto mit Tischplatte vermischen.
- AutoGen / CrewAI / 5. LLM-Organizer / zweites Hirn / 64. Agent als Router.
- Groq wählt den Agenten (`proposeTool` bleibt Paraphrase, Parser bestätigt).
- Jira, Notion, GitHub-Issues schreiben, Dateien nach `docs/sprints/` aus der APK.
- RICE/ICE, Velocity, Gantt mit erfundenen Daten.
- 6–12-Stunden-Crawl, FGS-Recherche, Instagram-Ingest, arXiv-PDF-Volltext-Dump.
- Stilles `writeMemory` aus Deep Research oder Sleep-ähnlichem Job.
- Live-Klon des GitHub-`docs/`-Baums in der APK (ToS, Größe, Stale).
- Docs-Stand-Draft `#156` mergen oder stehlen.
- Neuer Cloud-Vendor. Nur vorhandene offizielle APIs: DDG-HTML, Wikipedia, Gemini Grounding, optional **GitHub REST Search** mit User-Token.

---

## 4. Tischplatte — Fläche

### 4.1 Schalter

In `GlanceRail` unter den Werten, nicht statt der Werte:

```
Tischplatte    [ an | aus ]
```

Store-Flag `tischplatte_on` (boolean, Default `false`). Persistenz wie
`last_desk_on`, **eigenes** Feld. `desk` rührt es nicht an.

Parser `board-parse.ts` (neu), Agent `board` (61. Parser, Overlay, kein
Organizer):

| Äußerung | Treffer |
|----------|---------|
| `Tischplatte an` / `Werkbank an` / `Projekttafel an` | `board` on |
| `Tischplatte aus` / `Icons wieder` / `Homescreen Icons` | `board` off |
| `Schreibtisch an` | **`desk`**, unverändert |
| `Tisch an` ohne „platte“ | bleibt `desk` (Gold) |

HUD-Skip: `tischplatte|werkbank|projekttafel` in `LAYER_SKIP`, analog Homescreen.

### 4.2 Was verschwindet, was bleibt

| Element | Tischplatte an | aus |
|---------|----------------|-----|
| Neun App-Icons | weg | sichtbar |
| Ambient-Orbs | werden zur Glas-Textur | wie `18.18` |
| Werte-Leiste | bleibt, Schalter sichtbar | bleibt |
| Mini-Chat | bleibt (Befehle an die Tafel) | bleibt |
| Sprach-Kugel | bleibt | bleibt |
| Dock Start | bleibt, schaltet **aus** wenn man Start drückt während an? **Nein:** Start bei an = Tafel bleibt. Chat-Icon im Dock öffnet Chat, Tafel-Flag bleibt bis Aus |

### 4.3 Glas-Hintergrund („KI-generiert“, ehrlich)

Drei Schichten, alle lokal, 60 fps anstreben, bei `prefers-reduced-motion`
statisch:

1. **Feld** — Canvas-2D: dunkles Navy, hex-/Kreis-Gitter, langsames Noise.
   Seed aus Datum + `tischplatte_seed` (Zahl). Kein Bild-Download.
2. **Glas** — CSS `backdrop-filter`, Karten mit Hairline, Cyan/Amber-Kante
   wie Homescreen-Kacheln. Klick = Karte groß (Inhalt, nicht Zoom-API).
3. **Hint (optional)** — Ein Groq-JSON ≤ 80 Tokens, **nur** wenn der Nutzer
   „neuer Hintergrund“ sagt und Groq-Key da: `{ "accent":"#7dd3c7", "glow":0.4, "density":0.3, "motif":"orbit" }`.
   Parser-Whitelist der Keys. Kein Prompt „male Iron Man“. Motiv-Enum:
   `orbit` / `grid` / `pulse`. Fehlt Key → Default-Palette.

Das ist generativ im Sinne von **Parametertafel**, nicht im Sinne von
Pixel-Synthese. Wer ein Foto-Wallpaper will: Won’t in `18.19`.

Interaktiv: Pointer verschiebt Highlight (Parallax ≤ 12 px). Karten sind
Buttons. Kein Physik-Engine.

---

## 5. Was ein gutes Jarvis-Projekt braucht

Nicht das volle PMI-Handbuch. Die Tafel zeigt **genau diese** Objekte —
mehr Felder erfindet das Modell nicht (gleiche Härte wie `idea-plan.ts`).

```
Auftrag          1 Satz, aus der aktiven Idee oder „Jarvis selbst“
PSP (Baum)
  Epic           = Idee aus idea.ts (id, title, status)
    Sprint       = IdeaSprint (Kern / Härten / Probe / C1…)
      Task       = lieferumfang {id, task, anleitung}
Backlog          Ideen status parked / open
Kanban           now | next | parked | done  (Abbildung von Idea.status + Sprint.n)
Forschung        offene Fragen + letzte ResearchMeta (Quellenpflicht)
Hirn-Vorschläge  MemoryProposal[] noch ohne Ja
Won’t / Abbruch  aus der Vorlage, sichtbar als rote Glassplitter
```

**PSP** hier = Projektstrukturplan (WBS), nicht Watts Humphreys Personal
Software Process. Schätzstunden und Defect-Log sind **Won’t**.

Aktives Projekt:

| Modus | Quelle |
|-------|--------|
| Default | Die letzte Idee (`last_step_title`) plus deren `plan` |
| „Zeig Jarvis-Plan“ | Feature-Katalog der **laufenden** Schiene (`18.18`/`18.19`), nicht der Git-History |
| Keine Idee | Leere Tafel + Satz „Sagen Sie Idee: … oder Tischplatte aus.“ Kein erfundener Backlog |

Der Plan wird **nicht ausgeführt**. Jarvis schreibt keine Sprint-Dateien
und merged keine PRs. Gleicher Vertrag wie [`72-next.md`](./72-next.md).

---

## 6. Projektion aufs Glas

Eine React-Fläche `Workbench.tsx` (Execute), Daten nur aus Store:

| Zone | Inhalt | Klick |
|------|--------|-------|
| Oben | Auftrag + Version aus Katalog | — |
| Links | PSP-Baum, eingeklappt bis Epic | Epic = Idee fokussieren |
| Mitte | Drei Kern-Karten + Custom | Karte groß: Ziel, Tasks, Won’t |
| Rechts | Forschung-Chips (Titel + Domain) | Chip = Quelle öffnen **oder** ehrlich „ohne URL nicht“ |
| Unten | Job-Leiste: `Recherche läuft` / `Plan liegt` / `Vorschlag 1` | Stopp bricht `AbortSignal` |

Kein zweites Chat-Log auf der Tafel. Antworten kommen über Mini-Chat /
bestehenden Chat, die Tafel **aktualisiert** sich aus Store.

Leer: Glas bleibt, Text „Kein Plan. Idee: … oder recherchiere tief …“.
Nicht die Marvel-Werkstatt erfinden.

---

## 7. Docs und Funktionen auslesen

### 7.1 Katalog, nicht Git

Beim Execute entsteht `frontend/src/engine/feature-catalog.ts` (gebaut,
commitbar): Zeilen aus **aktueller** Hilfe + `42-planned` Pull-Reihenfolge
**Kopf** + `CHANGELOG` Unreleased der **lebenden** Version. Kein Scrape
zur Laufzeit.

Zeile:

```
{ id, version, area, title, can, wont, prompt }
```

`can` = was der Parser wirklich kann (ein Satz). `prompt` = ein Gold-Satz
oder leer. Cap ~120 Zeilen, nicht 400 historische Sprints.

### 7.2 Befehle

Agent `board` (Lesen) **oder** bestehendes `help`, Score so dass Geräte
gewinnen:

| Äußerung | Antwort |
|----------|---------|
| `Was ist geplant` / `Was steht in den Docs` | Katalog-Kopf: nächste Schiene + 5 Zeilen, Quelle `42-planned` Freeze |
| `Welche Features hat der Kalender` | Filter `area=calendar`, nur Zeilen mit `can` |
| `Was kann Jarvis` | 8–12 Zeilen nach area, nicht 200 |
| `Lies die Docs zu Deep Research` | Katalog `area=research` + ehrlich „APK hat keinen Docs-Ordner“ |

LLM darf **formulieren**, nicht **ergänzen**. Fehlt die Zeile → „steht
nicht im Katalog“, kein Halluzinieren eines Koch-Modus aus Draft `#149`.

Docs-Stand `#156` bleibt getrennt. Wenn der später ein Live-Lesen baut,
darf `18.19` den Katalog **ersetzen**, nicht duplizieren.

---

## 8. Deep Research — allgemein professioneller

Deep Research ist **kein** Tisch-Feature. Die Tafel **zeigt** Ergebnisse.
Der Slot `research-deep` bleibt der Ort (Gemini Grounding, sonst Groq +
Digest). Härten in Sprint 388, nutzbar ohne Tischplatte.

### 8.1 Ist-Grenze

Heute: `deepResearchQueries` hängt Spezial-Queries an (Anzug, Stalingrad)
und sucht DDG + Wikipedia. `guardResearchReply` hält Zahlen an Snippets.
Kein GitHub, kein Claim-Array, kein zweiter Suchpass auf den besten
Treffer-Titeln.

### 8.2 Soll (weiterhin ein Loop)

Query-Rollen, fest im Code, nicht vom Modell erfunden:

| Rolle | Zweck |
|-------|--------|
| `core` | Thema roh |
| `constraint` | Grenzen, Stand der Technik, Kritik |
| `compare` | Alternativen / vs |
| `wiki` | Wikipedia DE/EN |
| `code` | `site:github.com` plus optional GitHub Search API |

Max **5** Queries wie heute. Neue Rollen **ersetzen** die Anzug-Hardcodes
durch Theme-Detektoren (energy, history, software, …), Default = core +
constraint + wiki.

Zweiter Pass (Should): aus den Top-3-Titeln eine Verfeinerungs-Query, nur
wenn Pass 1 ≥ 2 URLs hat. Kein dritter Pass. Timeout über `AbortSignal`.

**Claim:** `{ claim, url, retrieved_at }`. Antwort zitiert nur Claims.
Ohne URL = nicht im Bericht. Gleicher Geist wie Knowledge-Packs.

**OSS:** „suche Open-Source zu X“ setzt Rolle `code`. GitHub REST
`/search/repositories?q=` nur mit **User-Token** in Settings (optional,
offizielle API). Ohne Token: DDG `site:github.com` und ehrlich „ohne
GitHub-Key nur öffentliche HTML-Suche, unvollständig“. Kein Scraping von
github.com/login, kein inoffizielles API.

Opt-in `research_opt_in` und Teach-Offer („Soll ich das als Fachwissen
merken?“) bleiben. Neu: nach Deep **zusätzlich** Memory-Proposals
(§10), getrennt vom Pack-Teach.

Won’t: 8k-Essay, 12 h, Multi-Agent Researcher/Critic (steht schon in
[`58-next.md`](./58-next.md) Won’t).

---

## 9. „Parallele Agenten“ — was das hier heißen darf

Der PO-Satz *Deep Research Agent sucht OSS, Scrum Agent plant Sprints*
ist **zwei Jobs**, nicht zwei Director-Züge mit zwei Personas.

```
Nutzer: „Such Open Source für Kalender-ICS und plane Sprints für Idee 1“
        │
        ▼
   Parser: board  (Doppelbefehl, split exists)
        │
        ▼
   board-Handler
        ├─ Job research  → fillDeepResearchLinks  (Fetches Promise.all)
        ├─ Job plan      → wartet auf Quellen-Digest ODER läuft auf Idea-Text
        │                   Groq füllt idea-plan EINMAL
        └─ Store: last_research_json + Idea.plan
        ▼
   Tafel zeichnet Chips + Karten
   Ein Reply-Satz: was gefunden / was geplant / was Won’t
```

Regeln:

1. Director bleibt **ein** Agent pro Zug. Hier `board` (oder `idea`, wenn
   nur Plan und Tafel aus). Deep-only ohne Tafel bleibt der Chat-Loop wie
   heute — kein Zwang über `board`.
2. `Promise.all` = HTTP-Lesen, nicht zwei `completeGroq` gleichzeitig
   (Free-Tier, Abbruch). Plan-Fill **nach** Research, wenn der Satz beides
   will — das ist sequentiell und trotzdem „beides in einem Atem“.
3. UI darf zwei Chips „Recherche“ und „Plan“ gleichzeitig **pending**
   zeigen, während Fetches laufen. Das fühlt sich parallel an.
4. Kein Agent spricht den anderen an. Kein JSON-Protokoll zwischen LLMs.
5. Split-Intents (`chain.ts`) dürfen nacheinander `research` dann `idea`
   feuern, wenn der Parser zwei Klauseln sieht — weiterhin sequentiell,
   ein Satz pro Handler.

Namen in der UI (deutsch, ehrlich):

| Chip | Code |
|------|------|
| Recherche | Job `research` |
| Sprintplan | Job `plan` (idea-plan) |
| Katalog | Job `catalog` (sync, kein Netz) |
| Hirn-Vorschlag | Job `propose` |

Kein englisches „Scrum Master Agent“ in der Persona.

---

## 10. Vorschläge ins Haupthirn

### 10.1 Lücke

`writeMemory` ist der einzige Weg in Cap-80. Origin `tool` hat schon 0.8
Confidence — zu hoch für ungeprüfte Web-Funde. Teach-Packs sind
**Fachwissen**, nicht Mama-Geburtstag. Research-Pending ist **Suche an**,
nicht Memory.

### 10.2 `MemoryProposal`

Neues Store-Objekt (IndexedDB), **nicht** sofort Pin:

```
{
  id, text, key?, category, origin: 'research' | 'board' | 'catalog',
  claim?, url?, confidence: 0.35,
  status: 'pending' | 'accepted' | 'rejected',
  created_at
}
```

`origin` in `MemoryOrigin` um `'research'` erweitern **nur** beim Accept.
Pending zählt nicht gegen Cap-80.

### 10.3 Wer darf vorschlagen

| Quelle | Darf vorschlagen | Wird Pin wann |
|--------|------------------|---------------|
| Nutzer „merk dir …“ | schreibt direkt `writeMemory` (heute) | sofort, Gate |
| Deep Research | 1–3 Claims mit URL | nach „Ja, merken“ / Chip auf der Tafel |
| Board/Plan | Zielsatz der Idee, nicht der ganze Plan | nach Ja |
| Sleep | bleibt 375, niedrig, **kein** Web-Claim | unverändert |
| Katalog | nie (Code-Wissen, kein Leben) | — |

### 10.4 Prüfung

1. Gate `decideGate` auf dem Kandidaten **vor** der Schlange: Dump/Smalltalk
   → gar nicht vorschlagen.
2. UI: Glas-Chip oder Chat „Vorschlag: {text} Quelle: {domain}. Merken?“
3. Ja → `writeMemory({ origin: 'research', confidence: 0.55, … })`.
   User-Write bei REVISE gewinnt (wie Sleep vs User in 375).
4. Nein / Timeout 24 h → `rejected`, kein Pin.
5. Pack-Teach („lern das als Fachwissen“) bleibt **zweiter** Weg, nicht
   derselbe Store.

Recall: ungeprüfte Proposals erscheinen **nicht** in `memoryBlock`.

---

## 11. Parser, Agent, Hirn

| Rolle | Ist | `18.19` |
|-------|-----|---------|
| `desk` | Foto-Tisch | unverändert, Gold hart |
| `idea` | Idee + Plan-Fill | unverändert; Tafel **liest** `Idea.plan` |
| `help` | Hilfe | Katalog-Fragen dürfen `board` oder `help` — ein Gewinner in `conflicts.ts` |
| Chat-Loop Deep | `isDeepResearch` | härten, kein neuer Agent-id zwingend |
| **`board` neu** | — | Toggle, Projektion, Jobs starten, Katalog-Lesen, Proposal-Chips |

`proposeTool` darf `board` nur vorschlagen, wenn der Vertrag
`Tischplatte an` / `Zeig PSP` / `Was ist geplant` matched. Geräte gewinnen
weiter.

Kein Embedding in `pickRoute`. Groq formuliert den einen Reply-Satz.

---

## 12. Daten (Store)

Neue Settings-Flags (Execute):

| Key | Default | Bedeutung |
|-----|---------|-----------|
| `tischplatte_on` | false | Modus |
| `tischplatte_seed` | 0 | Canvas-Seed |
| `tischplatte_hint` | `{}` | Palette JSON, validiert |

Neue IndexedDB-Stores: `memory_proposals`. Jobs leben in Settings JSON
`board_jobs` (Array, Cap 4, TTL 15 min) — analog Research-Pending, nicht
unbegrenzt.

Hausstand: Flag + Proposals exportieren (wie Memory). Jobs nicht.

---

## 13. Sprints (`18.19.0` beim Execute)

| Sprint | Thema | Rolle |
|--------|--------|--------|
| [385](./sprints/sprint-385.md) | Tischplatte-Modus: Schalter, Icons weg, Glas, Parser ≠ Desk | Must PLAN |
| [386](./sprints/sprint-386.md) | PSP + Sprintkarten auf dem Glas (Idee-Plan projizieren) | Must PLAN |
| [387](./sprints/sprint-387.md) | Feature-Katalog aus Docs, auf Zuruf | Must PLAN |
| [388](./sprints/sprint-388.md) | Deep Research härten (allgemein) + OSS/GitHub | Must PLAN |
| [389](./sprints/sprint-389.md) | Jobs: Recherche + Plan in einem Handler, Chips | Must PLAN |
| [390](./sprints/sprint-390.md) | MemoryProposal → Prüfung → `writeMemory` | Must PLAN |
| [391](./sprints/sprint-391.md) | Gold, Konflikte, Tests | Must PLAN |

Harte Kette: 385 → 386 (ohne Glas keine Karten). 387 unabhängig nach 385.
388 unabhängig (Research existiert ohne Tafel) — auf der Tafel erst mit
386/389 sichtbar. 389 braucht 385 + 388. 390 braucht Gate (liegt) und
 ideally 388 Claims. 391 zuletzt.

Landet in App-Code **`18.19.0`** erst nach Execute. Sideload bleibt
**`18.17.0`** bis APK (Homescreen `18.18` ebenfalls noch ohne Sideload).

---

## 14. Testprompts (für Execute, nicht jetzt)

```
Tischplatte an
```

Icons weg, Glas da, Werte-Leiste hat Schalter an.

```
Schreibtisch an
```

Weiter `desk`. Ohne Foto: „Kein Frame…“ — **nicht** die Werkbank.

```
Tischplatte aus
```

Icons zurück.

```
Idee: ICS ohne Google-Kalender
Zeig den Sprintplan für Idee 1
Tischplatte an
```

Drei Kern-Karten auf dem Glas, Inhalt aus der Vorlage, kein RICE.

```
Was ist geplant
Welche Features hat der Kalender
```

Katalog-Zeilen, kein Koch aus Draft.

```
Recherchiere tief: Open-Source Kalender ICS Parser ohne Google
```

Mehrere Queries, Quellen mit URL, ohne Tischplatte im Chat. Mit Tafel:
Chips rechts.

```
Such Open Source zu ICS und plane Sprints für Idee 1
```

Ein Zug, zwei Jobs, ein Satz. Kein zweites Hirn.

```
Merk dir den Vorschlag
Nein
```

Erst nach Ja ein Pin. Nein speichert nicht.

Negativ: `Tisch an` ≠ Tischplatte. Wetter-Ort bleibt Wetter. `alle
Steckdosen aus` bleibt Plug.

---

## 15. Risiken

| Risiko | Gegenmaßnahme |
|--------|----------------|
| „Tisch an“ stiehlt Desk-Gold | Getrennte Regex, Gold in 391, `conflicts.ts` desk > board außer Token `platte` |
| Groq-Hint wird zur Marvel-Rolle | Enum-Whitelist, kein Freitext ins CSS |
| Schwarm-Erwartung | UI-Copy „Jobs“, Persona sagt nicht „ich starte Agenten-Schwarm“ |
| Katalog veraltet | Freeze-Datum in der Datei; Satz „Stand Bundle {version}“ |
| GitHub ohne Token leer | Ehrlich sagen, DDG-Fallback |
| Cap-80 voll durch Web-Dump | Proposals nicht im Cap; Accept max 3 pro Research; Gate IGNORE Dump |

---

Index: [`42-planned.md`](./42-planned.md). Versionen:
[`09-versioning.md`](./09-versioning.md). Ideen-Vorlage:
[`72-next.md`](./72-next.md). Deep-Ist: [`58-next.md`](./58-next.md).
Hirn-Härte: [`87-next.md`](./87-next.md). Homescreen:
[`90-next.md`](./90-next.md).
