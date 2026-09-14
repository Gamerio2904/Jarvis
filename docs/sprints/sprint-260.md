# Sprint 260 — Screenshot-Fixes: Route, Live, Abbruch

**Version:** `17.1.0` (versionCode `170100`) — **PLAN** Must
**Plan:** [`70-next.md`](../70-next.md) §1, §6
**Voraussetzung:** `17.0.0` (Sprints 249–259)

## Ziel

Die vier Screenshot-Sätze tun, was der Nutzer meint. Kein neues Feature.

## Belege (nicht spekulieren)

1. `Lass uns Schach Spielen` → Modell erfindet eine Schach-App.
2. `Bauer e2 e4` → Modell antwortet `Läufer c8 f5` (illegal nach e2-e4).
3. `Zeig mir das Schachbrett` → Kugel, Ort „Schachbrett“.
4. `Hast du die Wahlergebnis mitbekommen ins Sachsen Anhalt?` → Absage ohne Suche.
5. Folge: Satz endet mit `volatil. bis eine` (abgebrochen, Groq ohne Retry).

## Heute vs. Ziel

| Heute | Ziel |
|-------|------|
| Chess-Parser: exakt `schach` / `schachbrett` / UCI ohne Leerzeichen | Alltag + deutsche Figur + `e2 e4` / `e2-e4` / SAN `e4` |
| HUD extra 0.28 gewinnt gegen chess 0.08 | `schachbrett` in HUD-Skip; chess parsed `zeig mir das schachbrett` |
| `isLiveLookup` ohne Wahl | Wahl, Landtag, Wahlergebnis, Koalition+aktuell → Suche |
| `looksTruncated` nur letztes Zeichen; Retry nur Gemini | auch `. [a-z]`-Bruch; Retry auch Groq einmal |

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S260-1 | Chess-Intent: spielen / starten / lass uns | `engine/chess.ts` `parseChessIntent` | Regex analog zu `schach neu`: `\b(?:lass\s+uns\s+)?schach\s*(?:spielen\|starten)?\b`, `eine\s+partie`, `neues\s+spiel` wenn `schach` im Satz. Länge-Limit 80 auf 140 heben, sonst fällt der Screenshot-Satz raus |
| S260-2 | Deutsche Züge | `engine/chess.ts` | Figurwort optional (`bauer\|springer\|läufer\|turm\|dame\|könig`), Felder mit Leerzeichen oder Bindestrich. `Bauer e2 e4` → UCI `e2e4`. SAN kurz `e4` nur wenn `lastTool==='chess'` oder Partie läuft, sonst kollidiert `e4` mit nichts — trotzdem nur mit Schach-Kontext |
| S260-3 | „Zeig mir das Schachbrett“ | `chess.ts` + `hud-parse.ts` | Chess: `zeig(?:e)?(?:\s+mir)?(?:\s+das)?\s+schachbrett`. HUD-Skip-Liste Zeile ~196: `schach\|schachbrett` dazu. Beides: HUD darf nicht mehr `unknown_place` liefern, auch wenn Chess später enger wird |
| S260-4 | Keine erfundene App | `persona.ts` / `guards.ts` | Satz ins Won’t: nie „Schach-App geöffnet“. Partie ist in Jarvis. Test: nach S260-1 darf dieser Prompt nicht mehr ans Modell |
| S260-5 | Wahl = Live | `research-parse.ts` `isLiveLookup` | `\b(?:wahl(?:ergebnis(?:se)?)?\|landtag\|bundestag\|neuwahl(?:en)?\|koalition)\b` plus Ort oder „aktuell“/„heute“/„mitbekommen“. Nicht jede Erwähnung von „Wahl“ in Smalltalk — deshalb Andock an Fragewort oder `mitbekommen`/`steht`/`ergebnis` |
| S260-6 | Korrektur zieht Suche | `chat.ts` | Wenn `lastTool` Research/LLM und Nutzer widerspricht (`nicht der fall`, `stimmt nicht`, `falsch`) → `wantSearch=true` auf den **vorherigen** User-Turn, nicht auf den Widerspruch allein |
| S260-7 | Abbruch erkennen | `polish-guard.ts` | `looksTruncated`: zusätzlich `/[.!?]\s+[a-zäöü]/` im letzten Satz **oder** Ende ohne Satzzeichen (schon da). Screenshot `volatil. bis eine` fällt auf den zweiten Teil |
| S260-8 | Retry auch Groq | `chat.ts` ~887 | Bedingung `kind === 'gemini'` streichen für **einen** Retry bei Truncation. Zweiter Retry verboten (Kontingent). Danach `REPLY_TRUNCATED` |
| S260-9 | Korpus | `eval/corpus.ts` | Gold: die fünf Screenshot-Sätze. `Lass uns Schach spielen` → `chess`. `Zeig mir das Schachbrett` → `chess` nicht `hud`. `Bauer e2 e4` mit `lastTool chess` → `chess`. `Wie steht die Bundesliga?` bleibt `sport` (Regress) |

## Won’t

- Brett zeichnen, Stockfish, Chat-Blöcke — das ist 261+.
- `c8f5` „verbieten“ per Blacklist. Die Ursache ist der fehlende Parser.

## Abbruchkriterium

Ein Screenshot-Satz fällt weiter ans Modell. Oder `Zeig mir London` geht nicht mehr zur Kugel (HUD-Skip zu breit).

## Tests

```bash
cd frontend
node --experimental-strip-types -e "
import { parseChessIntent } from './src/engine/chess.ts'
console.log(parseChessIntent('Lass uns Schach spielen'))
console.log(parseChessIntent('Zeig mir das Schachbrett'))
console.log(parseChessIntent('Bauer e2 e4', true))
"
npm run eval
npm run test:014
```

Manuell: die fünf Sätze aus den Screenshots tippen. Schach darf **nicht** „App geöffnet“ sagen. Kugel darf bei Schachbrett **nicht** aufgehen.
