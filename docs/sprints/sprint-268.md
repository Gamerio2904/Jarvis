# Sprint 268 — Meilenstein `18.0.0`

**Version:** `18.0.0` (versionCode `180000`) — **PLAN** Must, Meilenstein
**Plan:** [`70-next.md`](../70-next.md)
**Voraussetzung:** Sprints **260–267** (267 Should: wenn rot, Meilenstein
ohne Coach, dann `17.8.0` überspringen und 267 nachziehen)

## Ziel

Sideload, an dem der PO sieht: Screenshot-Bugs tot, Tabelle und Bild im Chat,
Schach ist ein Spiel.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S268-1 | Version | `store.ts` `APP_VERSION`, `package.json`, Tests die die Version asserten | `18.0.0`, versionCode über `apply-native-tv.mjs` |
| S268-2 | Docs | `66-agents-ist.md` Chat-Blöcke + Schach-Modus; `CHANGELOG`; `apk.md` | Ist nicht Plan |
| S268-3 | PO-Liste | `TEST-18.0.0.md` | Die Sätze unten, ein Prompt = ein Kasten |
| S268-4 | APK | `./build-apk.sh` | `aapt dump badging` → versionName `18.0.0` versionCode `180000` |
| S268-5 | Eval | `npm run eval` + `run-all-tests.sh` | Muss grün, inklusive neuer Skripte 261/264/266/267 |

## PO-Kern (wird `TEST-18.0.0.md`)

```
Lass uns Schach spielen
```

Modus auf, Startstellung, **nicht** „App geöffnet“.

```
Bauer e2 e4
```

Bauer auf e4, Jarvis zieht **legal**, nicht Läufer c8-f5.

```
Zeig mir das Schachbrett
```

Modus/Brett, **keine** Kugel.

```
Wie steht die Bundesliga?
```

Tabelle als Karte, kurze Sprachzeile.

```
Hast du die Wahlergebnisse aus Sachsen-Anhalt mitbekommen?
```

Suche oder ehrliches Research-Angebot — **kein** „ohne Websuche kann ich
keine Zahlen nennen“ aus dem Modell, während Research aus ist, ohne den
Schalter zu erklären.

Ein absichtlich abgebrochener Modell-Satz darf nicht als Fließtext mit
`volatil. bis eine` stehenbleiben.

## Abbruchkriterium

Einer der Screenshot-Sätze verhält sich wie am 14.9.2026.
