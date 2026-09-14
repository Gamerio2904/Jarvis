# Sprint 266 — Gegner: Engine, nicht Modell

**Version:** `17.7.0` — **PLAN** Must
**Plan:** [`70-next.md`](../70-next.md) §4
**Voraussetzung:** Sprint **265**

## Ziel

Jarvis antwortet mit einem **legalen** Zug aus einer Engine. Groq/Gemini
dürfen den Zug nicht wählen.

## Warum Stockfish nachladen, nicht bündeln

`stockfish.js` / `stockfish.wasm` ist GPL-3 und mehrere MB. Dieselbe Regel
wie Silero (Sprint 174/254): **nicht in die APK**, opt-in, Messung, ehrlicher
Text wenn die Datei fehlt.

Lizenz: GPL gilt für das WASM-Binary. Die App bleibt, wenn das Paket
**getrennt** geladen wird und der Quelltext-Hinweis in den Einstellungen
steht (Notice + Link zum Stockfish-Repo). Nicht chessground linken.

Fallback ohne Paket: `chess.js` `.moves()` + einfaches Material-Negamax in
`chess-engine.ts` **ohne** WASM, Stärke bewusst schwach, Label **„ohne
Engine“**. Lieber ehrlich schwach als `c8f5`.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S266-1 | Pack | `quality-pack.ts` | Neue Id `stockfish`. Dateien z.B. `/wasm/stockfish.wasm` + js-Loader. Setting `chess_engine` boolean Default **false**. Text: „Stockfish nachladen, GPL, ~5–10 MB, nur Schach.“ |
| S266-2 | Worker | `engine/chess-engine.ts` + `engine/chess-engine.worker.ts` | UI-Thread sendet `{fen, movetime}`. Worker antwortet `{bestmove, cp, mate}`. Timeout 1.5 s Standard (Latenz). Kein `go infinite` |
| S266-3 | Nach User-Zug | `handleChess` / `ChessMode` | Nur wenn Schwarz (Jarvis) am Zug und Spiel „gegen Jarvis“. `bestmove` über `chess-rules.move`. Illegal vom Worker → verwerfen, Fallback-Negamax |
| S266-4 | Stufen | Settings + Leiste | 1 = Negamax 1 ply (immer da), 2 = Stockfish 300 ms, 3 = 1500 ms. Ohne WASM sind 2/3 ausgegraut mit dem Pack-Grund |
| S266-5 | Weiß/Schwarz | `ChessMode` | Default Nutzer Weiß. „Ich will Schwarz“ dreht das Brett und Engine zieht sofort `e2e4` o.ä. |
| S266-6 | Test | `test-chess-engine.mjs` | Ohne WASM: nach `e2e4` kommt ein **legaler** Schwarz-Zug (nicht `c8f5`). Mit gemocktem Worker: `bestmove` wird gespielt. Illegaler Mock wird verworfen |

## Won’t

- Lichess-Bot-API (Account, Netz, ToS).
- Groq „pick a move in JSON“ — auch nicht als Fallback.
- Opening-Books aus dem Netz beim ersten Zug (Latenz). Optional später Freeze.

## Abbruchkriterium

Engine-Zug ist illegal. Oder WASM auf dem UI-Thread (Ruckler im Chat).

## Manuell

Pakete aus, Stufe 1: Partie durchspielen, jeder Jarvis-Zug legal.
Pakete an: spürbar stärker, UI bleibt bedienbar während der 1.5 s (Spinner am
Brett, Composer nicht blockieren — Engine läuft im Worker).
