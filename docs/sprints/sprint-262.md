# Sprint 262 — Tabellen zeigen (Bundesliga zuerst)

**Version:** `17.3.0` — **PLAN** Must
**Plan:** [`70-next.md`](../70-next.md)
**Voraussetzung:** Sprint **261**

## Ziel

`Wie steht die Bundesliga?` zeigt eine **Karte**, nicht 18 Monospace-Zeilen.
Die Zahlen kommen weiter von OpenLigaDB — kein neues Backend.

## Heute

`sport.ts` `formatTable` baut

```
Platz Verein       Pkt  Tore
 1  Bayern        20   18:6
```

in `reply`. HUD-Zeile kürzt auf drei Vereine. Parser und Fetch sind CODE.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S262-1 | Block bauen | `sport.ts` `handleSport` | Wenn `intent.table`: `blocks: [{ kind:'table', caption:'Bundesliga '+year, columns:['Pl','Verein','Sp','Tore','Pkt'], rows: rows.map(...) }]`. `content` bleibt eine **kurze** Sprecherzeile: `Bayern führt mit 20 Punkten.` — nicht die 18 Zeilen, sonst liest TTS die Tabelle |
| S262-2 | Renderer | `ChatBlocks.tsx` | Kopfzeile muted, Tabellen-Zeile 1–3 Accent-Grün (Meisterkampf), 16–18 Warnung (Abstieg) nur bei `bl1` und 18 Zeilen. Keine Logos in diesem Sprint (Wappen = 263, sonst hängt Tabelle an Bild-CORS) |
| S262-3 | Parser-Lücken | `parseSportIntent` | `zeig(?:e)?(?:\s+mir)?(?:\s+die)?\s+(?:bundesliga(?:tabelle)?\|tabelle)` zusätzlich zu `steht\|tabelle`. Sonst fällt „zeig mir die Bundesliga Tabelle“ ggf. an HUD/LLM |
| S262-4 | HUD-Skip | `hud-parse.ts` | `bundesliga\|tabelle` in die Skip-Liste neben `schachbrett` |
| S262-5 | Korpus | `eval/corpus.ts` | `Zeig mir die Bundesliga Tabelle` → `sport`. `Wie steht die Bundesliga?` bleibt `sport` |
| S262-6 | Test | `test-014.mjs` Sport-Block | `handleSport('Wie steht die Bundesliga?')` (Netz) oder gemocktes `fetchTable`: `meta`/Return hat `blocks[0].kind==='table'` und 18 Zeilen. Ohne Netz: Unit auf `tableBlockFromRows(fixture)` |

## Won’t

- Live-Ticker jede Minute (Akku). Ein Fetch pro Frage wie heute.
- Wappen, xG, Fussball.de-Login.
- Markdown-Tabellen aus dem Modell.

## Abbruchkriterium

TTS liest 18 Vereine. Oder ohne Netz wird eine Tabelle **erfunden**.

## Manuell

```
Wie steht die Bundesliga?
```

```
Zeig mir die Bundesliga Tabelle
```

Erwartung: Karte im Chat, kurze Sprachzeile, Quelle „OpenLigaDB“ unter der
Karte (caption oder kleine Zeile, kein zweiter LLM-Satz).
