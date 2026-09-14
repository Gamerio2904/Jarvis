# Sprint 264 — Schach-Regeln und Alltagssprache

**Version:** `17.5.0` — **PLAN** Must
**Plan:** [`70-next.md`](../70-next.md) §4
**Voraussetzung:** Sprint **260** (Parser-Sätze), **261** (Mini-Brett-Block)

## Ziel

Jeder Zug ist legal. Die Haus-Engine in `chess.ts` (`legal()` ohne Rochade,
en passant, Schachgebot) wird ersetzt, nicht „ein bisschen erweitert“.

## Warum chess.js, nicht mehr LLM-Agenten

Die Screenshots sind der Gegenbeweis: das Modell spielt nicht Schach. Ein
zweiter PromptSlice „chess-coach“ würde weiter `c8f5` erfinden. `chess.js`
ist BSD-2, ~30 kB, FEN/SAN/PGN, vollständige Regeln.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S264-1 | Abhängigkeit | `frontend/package.json` | `npm install chess.js`. Kein `chessground`. Version pinnen |
| S264-2 | Regeln-Modul | `engine/chess-rules.ts` **neu** | Wrap: `load()`, `move(sanOrUci)`, `fen()`, `turn()`, `isCheck()`, `isGameOver()`, `ascii()` nur noch Debug. Persistenz weiter `localStorage` Key `jarvis_chess_fen` — nach Load `Chess(fen)`, bei ungültigem FEN Reset auf Startposition **und** Log in History-Detail |
| S264-3 | Parser anbinden | `chess.ts` | `handleChess` ruft `chess-rules`, nicht `applyMove`. Bei illegal: `Zug e2e5 ist nicht legal.` + Mini-Brett-Block des **unveränderten** FEN |
| S264-4 | SAN + UCI + Deutsch | `chess.ts` Parser | Zusätzlich zu 260: kurze SAN (`Nf3`, `O-O`, `e4`) im Follow. Deutsch: `Rochade` → `O-O` wenn eindeutig, sonst nachfragen „kurz oder lang?“ |
| S264-5 | Antwort + Block | `handleChess` | `content`: `e4. Ich spiele …` erst in 266; in 264 ohne Engine: nach User-Zug **warten** oder Zufall **verboten**. 264 ist Regeln+Anzeigen. Gegnerzug kommt in 266. Bis dahin: `Ihr Zug e4. Schwarz am Zug.` + `blocks:[{kind:'chess', fen}]` |
| S264-6 | Alte `legal()` | `chess.ts` | `applyMove`/`legal`/`clear` **löschen**, nicht daneben behalten. Tests, die UCI gegen die Haus-Engine prüfen, auf chess.js umstellen |
| S264-7 | Korpus + Unit | `eval/corpus.ts`, `test-chess-rules.mjs` **neu** | `e2e4` legal. `e2e5` illegal. Rochade nach `e4 e5 Nf3 Nc6 Bc4 Bc5` → `O-O` legal. `Bauer e2 e4` mit follow. Screenshot-Sätze aus 260 weiter gold |

## Won’t

- Engine, UI-Modus, Kommentare (265–267).
- Zufallszug als „KI“. Lieber warten als Unsinn.

## Abbruchkriterium

Ein illegaler Zug steht danach im FEN. Oder `npm ls chessground` nicht leer.

## Tests

```bash
npm run test:chess-rules
npm run eval
```

Manuell nach 260-Sätzen: Mini-Brett im Chat, Figuren auf e4, nicht c8.
