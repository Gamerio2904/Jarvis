# Sprint 265 — Schach-Modus (chess.com-Funktionen, Jarvis-Look)

**Version:** `17.6.0` — **PLAN** Must
**Plan:** [`70-next.md`](../70-next.md)
**Voraussetzung:** Sprint **264**

## Ziel

Eine eigene Fläche `ChessMode`, analog `VoiceMode`: Brett füllt den Screen,
Chat bleibt erreichbar über Zurück. Nicht die Lage-Kachel, nicht nur die
Bubble.

## Design — chess.com-Funktionen, Jarvis-Optik

Abschauen **Funktionen**, nicht das Gelb-Grün von chess.com.

| chess.com | Bei Jarvis |
|-----------|------------|
| Ziehbare Figuren, letzte-Zug-Markierung | ja, Accent `--accent`, dunkle/helle Felder aus Theme (`ui_theme`) |
| Legale Felder beim Anheben | ja, Punkt auf leerem Feld, Ring auf Schlag |
| Uhren | optional, Default **aus** (Handy, kein Blitz-Zwang). Schalter in der Leiste |
| Notation rechts/unten | Zugliste SAN, jüngste unten, tippen = Stellung zeigen (takeback erst wenn 266 nicht stört — in 265: Liste read-only) |
| New game / Flip board / Undo | Neu, Drehen, Zug zurück (ein Halbzug, Confirm-Chip wie Geräte) |
| Difficulty | in 266 |
| Chat/Zuschauer | **Kein** Social. Jarvis-Kommentar kommt in 267 in die Leiste unter dem Brett, nicht als Fake-Chat |

**Nicht** chessground (GPL). Eigenes Brett: 8×8 `button`/`div`, SVG-Figuren
(eigenes Set oder MIT-Set z.B. CBurnett **public domain** — prüfen, Dateien
nach `frontend/src/ui/chess/pieces/`). Unicode aus `ChessBoard.tsx` ist für
die Mini-Bubble ok, im Modus zu klein zum Ziehen.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S265-1 | Route in der App | `App.tsx` + Nav | Neuer Zustand `chessOpen` oder `hud`-ähnlich: Intent `show`/`new` aus `handleChess` setzt Flag `last_chess_open` in Settings (session, wie `hud_force`). Tab **nicht** in der Island — sonst fünf Icons. Einstieg: Chat-Block antippen **oder** Satz „Schach“ öffnet den Modus. Island bleibt Chat/Lage/Hören/Kalender/Mehr |
| S265-2 | `ChessMode.tsx` | `ui/ChessMode.tsx` **neu** | Vollflächig über dem Chat, Close-Button wie Lage-aus. Kopf: Wer am Zug, Schachgebot. Fuß: Neu / Drehen / Zurück |
| S265-3 | Brett | `ui/chess/Board.tsx` **neu** | Pointer-Events: down auf eigene Figur, up auf Feld. Illegal = Wackeln, FEN unverändert. Promotion: vier Figuren-Wahl am Rand, kein stilles Damen-Umwandeln ohne Frage |
| S265-4 | Sync | `chess-rules.ts` | Ein Store: `subscribeChess(fn)` analog `subscribeHistory`. Chat-Mini-Brett und Modus lesen dieselbe FEN. Kein zweites `localStorage`-Key |
| S265-5 | Sprachzüge im Modus | `VoiceMode` bleibt getrennt | Wer im Schach-Modus spricht, geht weiter über `streamChat`. Parser aus 264 greift. Kein paralleler Mic-Stack |
| S265-6 | CSS | `index.css` | `--chess-light`, `--chess-dark` aus Theme ableiten (Dark: oliv/anthrazit, Light: sand/moos). Kein chess.com-Grün-Klon |
| S265-7 | A11y | Brett | `aria-label` je Feld `e2 Bauer weiß`. Fokus-Tastatur: Pfeile + Enter |

## Won’t

- Online-Gegner, Accounts, Puzzles, Lichess-Login.
- Engine (266), Coach (267).
- Fünftes Island-Icon.

## Abbruchkriterium

Ziehen und Parser-Zug zeigen verschiedene Stellungen. Oder Modus blockiert
den Composer nach „Zurück“.

## Manuell

1. `Lass uns Schach spielen` → Modus auf, Startstellung, Weiß unten.
2. Bauern e2 nach e4 ziehen → Markierung, Schwarz am Zug.
3. Zurück → Chat, Mini-Brett in der letzten Bubble zeigt e4.
4. `Zeig mir das Schachbrett` → Modus wieder auf, dieselbe Stellung.
