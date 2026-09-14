# 70 — Zeigen und spielen **PLAN** (`18.0.0`)

Ausgangspunkt: Code `17.0.0`. Die Screenshots vom 14.9.2026 und die Lücken
im Chat (kein Bild, keine Tabelle, Schach als Text und Halluzination) sind
der Anlass, nicht ein Reel-Hype.

Die Leitentscheidung bleibt: **Parser wählen Geräte und Spiele, das Modell
formuliert.** Kein Sprint hier gibt einem Modell die Hand am Brett oder eine
HTML-Lizenz im Chat.

---

## 0. Reel und GitHub — was wirklich gilt

Das verlinkte Reel
(`instagram.com/reel/DdGJbzuur2I`) war von hier **nicht lesbar**: Instagram
liefert ohne Login nur eine Anmeldeseite, der Embed-Endpunkt hängt, Open-Graph
ist leer. Eine öffentliche Trefferzeile nennt den Titel *„Seven GitHub repos
unlock powerful new AI agent capabilities“* (Unif-API-Index, 10.9.2026). Die
sieben Repos selbst stehen in keiner von hier erreichbaren Caption. Deshalb
wird **nicht** geraten, welche sieben es „genau“ waren — es wird die
**Klasse** bewertet, die solche Reels seit Monaten zeigen, und nur übernommen,
was Jarvis ohne Verlust bei Qualität, Funktion, Latenz oder Free-Tier nützt.

| Typisches Repo | Was es tut | Für Jarvis |
|----------------|------------|------------|
| [browser-use](https://github.com/browser-use/browser-use) | Agent steuert einen Desktop-Browser | **Nein.** Jarvis läuft auf dem Handy. PC ist schon Werkzeug (`pc.ts`). Ein zweiter Browser-Agent kostet Latenz, Kontingent und Fehlerwege |
| [Composio](https://github.com/ComposioHQ/composio) | 1000+ Cloud-Tools hinter OAuth | **Nein.** Widerspricht „Parser wählen Geräte“. Bezahlt, Server, Schlüssel pro App |
| [mem0](https://github.com/mem0ai/mem0) | Cloud-Gedächtnis-Schicht | **Nein.** Gedächtnis liegt lokal (`memory-layer.ts`). Ein zweites Gedächtnis driftet |
| [langchain-ai/deepagents](https://github.com/langchain-ai/deepagents) | Plan/Subagent/Filesystem-Harness | **Nein.** Server, LangGraph, nicht on-device. Director + Katalog decken die Form |
| [firecrawl/web-agent](https://github.com/firecrawl/web-agent) | Bezahlte Suche/Scrape-Schleife | **Nein.** Gemini-Grounding und OpenLigaDB tun die Live-Fälle. Extra-API = Kontingent und Geld |
| [assistant-ui](https://github.com/assistant-ui/assistant-ui) | Getippte Chat-Teile (Karten, Tabellen, Bilder) statt nur String | **Ja, als Muster.** Nicht das Paket (Bundle, andere Design-Sprache). Der Chat braucht **typisierte Blöcke** |
| [chess.js](https://github.com/jhlywa/chess.js) | Regeln, FEN, SAN, Legalität (BSD-2) | **Ja.** Ersetzt die Haus-Engine in `chess.ts`, der Rochade und en passant fehlen |
| [lichess-org/chessground](https://github.com/lichess-org/chessground) | Brett-UI von Lichess | **Nein.** GPL-3. Würde die ganze App unter GPL zwingen. Brett selbst zeichnen, chess.com-Funktionen nachbauen, Jarvis-Look |
| [nmrugg/stockfish.js](https://github.com/nmrugg/stockfish.js) | Stockfish als WASM (GPL-3, chess.com) | **Ja, als opt-in Paket** nach dem Muster `quality-pack.ts` — nachladen, Lizenz zeigen, nicht in die APK. Niemals als LLM-Zug |
| MCP-Server / Instagram-Scraper | Agent liest Reels | **Nein.** ToS, Login, nichts, das eine Antwort besser macht |

**Übernommen wird also nicht „sieben Repos einbauen“, sondern zwei Ideen:**
getippte Chat-Teile statt Rohtext, und Schach als Regelwerk + Engine, nicht
als Smalltalk.

---

## 1. Was die Screenshots wirklich zeigen

Vier Aufnahmen, zwei Gespräche. Kein Reel-Bug — alles liegt im Code.

### Gespräch A — Schach (11:24)

| Nutzer | Was Jarvis tat | Ursache im Code |
|--------|----------------|-----------------|
| `Lass uns Schach Spielen` | „Die Schach-App ist bereits geöffnet…“ | `parseChessIntent` kennt nur `schach`, `schachbrett`, `schach neu`, UCI ohne Leerzeichen. Der Satz fällt ans **Modell**. Das erfindet eine App, die es nicht gibt |
| `Bauer e2 e4` | „Zug registriert… Läufer c8 f5“ | Weder `Bauer e2 e4` noch `e2 e4` matchen `[a-h][1-8][a-h][1-8]`. Wieder Modell. `c8f5` nach `e2e4` ist **kein legaler Zug** (Läufer c8 sitzt hinter Bauern) |
| `Zeig mir das Schachbrett` | Kugel: Ort „Schachbrett“ nicht verzeichnet | HUD-Parser `zeig mir …` mit extra `0.28` schlägt Schach (`0.08`). Skip-Liste hat `nachrichten`, nicht `schachbrett`. Chess-Parser verlangt **exakt** `schachbrett` ohne Artikel |

Das Brett in der Lage (`ChessBoard.tsx`) existiert, öffnet sich dabei nicht.
ASCII im Chat existiert, kommt nie, weil der Parser nicht greift.
Rochade/en passant fehlen in `legal()` — selbst der Parser-Pfad spielt kein
volles Schach.

### Gespräch B — Wahl Sachsen-Anhalt (11:36)

| Nutzer | Was Jarvis tat | Ursache |
|--------|----------------|---------|
| `Hast du die Wahlergebnis mitbekommen ins Sachsen Anhalt?` | „keine aktuellen Wahlergebnisse… Ohne eine Websuche…“ | `isLiveLookup` kennt Wetter/News/Preis, **nicht** Wahl/Landtag. Der Zug geht ohne Grounding ans Modell. Das Satzmuster steht nicht im Code — es ist LLM-Text |
| `Die AFD hat gewonnen… Wird es dann Neuwahlen geben?` | Allgemeine Landesverfassung, kein aktueller Stand | Immer noch kein Live-Lookup. Trainingstext statt Suche |
| `Ja das ist stand jetzt nicht der Fall` | Weiterschreiben, Satz bricht ab: „volatil. bis eine“ | Korrektur wird nicht als „du liegst falsch, such nach“ gelesen. `looksTruncated` prüft nur das **letzte** Zeichen; Groq wird bei Abbruch **nicht** wiederholt (nur Gemini, `chat.ts` Pass 0) |

### Was schon da ist und nicht neu gebaut wird

- Bundesliga-Zahlen: `sport.ts` + OpenLigaDB `getbltable` — **Texttabelle**
- Schach-FEN in `localStorage`, Lage-Kachel mit Unicode-Figuren
- Research-Angebot, Quellen-Block, Tool-Chips
- `quality-pack.ts` für nachgeladene Dateien (Silero-Muster)

---

## 2. Zielbild `18.0.0`

Jarvis **zeigt**, was er behauptet, und **spielt** Schach nach Regeln, nicht
nach Stimmung.

| Heute | Ziel |
|-------|------|
| Chat = ein String | Chat = Text plus getippte Blöcke (Tabelle, Bild, Mini-Brett) |
| Bundesliga = Monospace-Zeilen | Bundesliga = Karte mit Platz, Verein, Tore, Punkte |
| „zeig mir das Schachbrett“ → Kugel | eigener Schach-Modus, Brett live, Figuren ziehbar |
| Züge vom Modell, illegal | `chess.js` prüft, Stockfish (opt-in) zieht |
| Kommentar jedes Mal oder nie | Kommentar nur bei klarem Fehler oder starkem Zug, aus der Bewertung, nicht aus dem Bauch |

**Won’t dieser Schiene**

- chessground / GPL ins Bundle
- Schach über Groq/Gemini spielen lassen
- Markdown oder HTML aus dem Modell rendern (XSS, Halluzination als Layout)
- 1000 Cloud-Tools, Browser-Agent auf dem Handy, Instagram-Login
- Bilder „zur Verschönerung“, die niemand verlangt hat
- Stockfish in die APK (10+ MB, Sprint-174-Regel: Messung + Nachladen)

---

## 3. Reihenfolge und warum

Erst die Bugs, die die Screenshots belegen. Dann das Render-Fundament. Dann
Sport (Daten liegen schon). Dann Bilder. Dann Schach-Modus. Engine und Coach
hängen am Brett — vorher sind sie unsichtbar.

```text
260 Fixes (Route, Live, Abbruch)
  → 261 Chat-Blöcke
       → 262 Tabelle (Bundesliga)
       → 263 Bild-Block
            → 264 Schach-Regeln + Parser
                 → 265 Schach-Modus UI
                      → 266 Engine opt-in
                      → 267 Coach (selten)
                           → 268 Meilenstein 18.0.0
```

Harte Ketten: 261 vor 262/263/265. 264 vor 265. 265 vor 266/267.
Frei: nichts — 260 muss zuerst, sonst testet der PO den Modus an Sätzen, die
heute noch ins Modell fallen.

---

## 3b. Gegen die PO-Prioritäten

Vorgaben unverändert: hohe Antwortqualität, alles funktioniert, wenig Latenz,
kostenlos und viel nutzbar — nur ändern, wenn Nutzen ohne Verlust.

| Sprint | Qualität | Funktion | Latenz | Free |
|--------|----------|----------|--------|------|
| 260 | illegaler Zug und erfundene App weg | die drei Screenshot-Sätze greifen | Parser statt Modell = schneller | unverändert |
| 261 | Blöcke nur aus Parsern, nicht aus LLM-HTML | Chat kann mehr als Text | Render nach der Antwort, nicht im Zug | unverändert |
| 262 | Tabelle statt raten | OpenLigaDB schon da | ein GET wie heute | OpenLigaDB kostenlos |
| 263 | Bild nur mit Quelle | „zeig mir“ zeigt | Bild nach Text, Streaming unberührt | Wiki/OpenLiga/Gemini, kein neuer Key |
| 264 | legale Züge | Alltagssätze | chess.js lokal, Mikrosekunden | BSD, kein Netz |
| 265 | sichtbares Spiel | eigener Modus | Zeichnen lokal | — |
| 266 | starke, legale Antworten | Gegner | WASM im Worker, UI bleibt flüssig | Nachladen, nicht APK |
| 267 | Kommentare nur wenn die Bewertung sie trägt | wirkt klug, nicht geschwätzig | Eval kommt aus 266, kein Extra-LLM-Zug | — |

Was **gestrichen** wurde, obwohl es im Reel-Umfeld liegt: Browser-Use,
Composio, mem0, DeepAgents, Firecrawl-Agent, chessground. Alles entweder
Server, Geld, GPL oder ein zweiter Weg neben einem, den es schon gibt.

---

## 4. Agenten — nicht fünf LLMs

Ein Modell, das Schach „spielt“, hat in den Screenshots `c8f5` auf `e2e4`
gesetzt. Mehr Schach-Agenten vom Typ „LLM mit PromptSlice“ machen das nicht
besser, sie machen mehr Halluzinationsflächen.

**Ein** Katalog-Agent `chess` bleibt. Dahinter drei **deterministische**
Teile, keine Director-Kandidaten:

| Teil | Datei (neu) | Tut |
|------|-------------|-----|
| Regeln | `engine/chess-rules.ts` über `chess.js` | Legalität, FEN, SAN, PGN |
| Suche | `engine/chess-engine.ts` Worker | Bester Zug, Bewertung in Centipawn |
| Coach | `engine/chess-coach.ts` | Kommentar **nur** wenn ΔEval über Schwelle |

Der Director sieht weiter `chess`. UI-Modus ist `ui/ChessMode.tsx` analog zu
`VoiceMode.tsx` — eigene Fläche, nicht ein zweiter Agent.

Lichess-HTTP als Gegner entfällt: Netz, Rate-Limit, Partie liegt dann dort.
Stockfish lokal nach dem Silero-Muster ist der Free-Pfad.

---

## 5. Chat-Blöcke — Fail-closed wie der Werkzeug-Vertrag

`Message.content` bleibt der sprechbare Text (TTS liest nur den). Sichtbares
Zusätzliches liegt in `meta.blocks`:

```ts
type ChatBlock =
  | { kind: 'table'; caption: string; columns: string[]; rows: string[][] }
  | { kind: 'image'; src: string; alt: string; source: string }
  | { kind: 'chess'; fen: string }
```

Nur Parser und Sport/Schach/Research **schreiben** Blöcke. Das Modell
liefert weiter einen String. Ein vom Modell erfundenes `<img>` wird nicht
gerendert.

---

## 6. Sprint-Schnitt

| Version | Sprint | Thema |
|---------|--------|-------|
| `17.1.0` | 260 | Screenshot-Fixes: Schach-Route, Wahl-Live, Satzabbruch |
| `17.2.0` | 261 | Chat-Blöcke, Renderer, TTS liest nur `content` |
| `17.3.0` | 262 | Bundesliga- und generische Tabelle als Block |
| `17.4.0` | 263 | Bild-Block, nur auf Verlangen, mit Quelle |
| `17.5.0` | 264 | `chess.js`, deutsche Züge, „zeig mir das Brett“ |
| `17.6.0` | 265 | Schach-Modus (chess.com-Funktionen, Jarvis-Look) |
| `17.7.0` | 266 | Stockfish-Worker opt-in (`quality-pack`) |
| `17.8.0` | 267 | Coach-Kommentare aus der Bewertung, selten |
| **`18.0.0`** | 268 | Meilenstein, Sideload, `TEST-18.0.0.md` |

---

## 7. Abbruchkriterien der Schiene

- Ein Block, den das Modell frei erfunden hat, erscheint im Chat.
- Ein illegaler Zug wird ausgeführt oder angesagt.
- Stockfish liegt in der APK oder läuft auf dem UI-Thread.
- chessground oder sonst GPL im Bundle.
- Ein Bild ohne Quelle oder ohne ausdrückliches Verlangen.

PO-Checkliste und Sideload erst mit 268. 260 darf als Patch `17.1.0`
sideloaded werden, wenn der PO die Screenshot-Bugs zuerst auf dem Handy
sehen will — dann versionCode `170100`.
