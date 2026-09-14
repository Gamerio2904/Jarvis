# Sprint 261 — Chat-Blöcke (typisiert, fail-closed)

**Version:** `17.2.0` — **PLAN** Must
**Plan:** [`70-next.md`](../70-next.md) §5
**Voraussetzung:** Sprint **260**

## Ziel

Der Chat kann mehr als einen String zeigen, ohne dem Modell Layout zu geben.

## Warum

Bundesliga, Brett und Bilder brauchen eine Fläche. Heute ist
`Message.content` der einzige Kanal (`App.tsx` ~1792 `{m.content}`). Wer dort
Markdown oder HTML aus dem Modell rendert, öffnet XSS und Halluzination als
UI — der Werkzeug-Vertrag in 258 hat genau das für Aktionen verboten.

Das Muster aus assistant-ui (Reel-Klasse): **Teile mit Typ**, vom Host
geschrieben, nicht vom Modell.

## Heute vs. Ziel

| Heute | Ziel |
|-------|------|
| `content: string` | `content` bleibt TTS-Text; `meta.blocks?: ChatBlock[]` |
| Renderer kennt nur Text + ToolChip + SourcesBlock | plus `ChatBlocks` |
| LLM könnte HTML liefern | HTML aus `content` wird **escaped** wie heute (React-Text) |

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S261-1 | Typ | `engine/chat-blocks.ts` **neu** | Union `table` / `image` / `chess` wie in `70-next.md` §5. `readBlocks(meta)` liest nur bekannte `kind`. Unbekanntes Feld → ignorieren |
| S261-2 | Schreiben | `store.ts` `addMessage` | `meta.blocks` durchreichen, nicht umschreiben. Keine Validierung im heißen Pfad außer `readBlocks` beim Lesen |
| S261-3 | Renderer | `ui/ChatBlocks.tsx` **neu** | Switch über `kind`. Tabelle: CSS-Grid, Jarvis-Grün, keine Fremd-UI-Lib. Bild: `<img>` nur `https:` oder `blob:`, `alt` Pflicht. Mini-Brett: bestehendes `ChessBoard` wiederverwenden |
| S261-4 | Einbau | `App.tsx` nach `.bubble-text` | `{readBlocks(m.meta).map(...)}`. Streaming-Bubble **ohne** Blöcke (kommen erst mit `onDone`) |
| S261-5 | Lage-ChatTile | `Lage.tsx` `ChatTile` | Unverändert Text — 160 Zeichen. Blöcke gehören in den vollen Chat, nicht in die Kachel |
| S261-6 | TTS | `VoiceMode.tsx` / Speak-Pfad | Liest nur `content`. Ein Block darf nicht vorgelesen werden („Spalte 1 Bayern“) |
| S261-7 | Test | `scripts/test-chat-blocks.mjs` | `readBlocks` wirft Müll weg (`kind:'html'`). `https` ok, `javascript:` verworfen |

## Won’t

- `react-markdown`, `dangerouslySetInnerHTML`, assistant-ui-Paket.
- Blöcke aus Groq-JSON „frei erfinden lassen“. Nur Parser dürfen schreiben
  (ab 262/263/264). Dieser Sprint legt nur die Dose hin.

## Abbruchkriterium

Ein Block entsteht aus Modelltext. Oder TTS liest Tabellenzellen.

## Tests

```bash
npm run test:chat-blocks   # nach S261-7 eintragen in package.json + run-all-tests.sh
npx tsc -b && npm run lint
```
