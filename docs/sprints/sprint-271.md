# Sprint 271 — Meilenstein `18.0.0`

**Version:** `18.0.0` (versionCode `180000`) — **CODE** Must, Meilenstein Kugel
**Plan:** [`70-next.md`](../70-next.md)
**Mitgeliefert:** 268–269. **270** nicht gezogen. **260–267** (Schach/Blöcke) bleiben PLAN.

## Ziel

Sideload, an dem der PO sieht: Screenshot-Bugs tot, Tabelle und Bild im Chat,
Schach ist ein Spiel, die Kugel hat Tag/Nacht und Bahn, Schichten nur auf Zuruf.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S271-1 | Version | `store.ts` `APP_VERSION`, `package.json`, Tests die die Version asserten | `18.0.0`, versionCode über `apply-native-tv.mjs` |
| S271-2 | Docs | `66-agents-ist.md` Chat-Blöcke + Schach-Modus; `48-next.md` / `43-next.md` Kugel-Ist; `CHANGELOG`; `apk.md` | Ist nicht Plan |
| S271-3 | PO-Liste | `TEST-18.0.0.md` | Die Sätze unten, ein Prompt = ein Kasten |
| S271-4 | APK | `./build-apk.sh` | `aapt dump badging` → versionName `18.0.0` versionCode `180000` |
| S271-5 | Eval | `npm run eval` + `run-all-tests.sh` | Muss grün, inklusive neuer Skripte 261/264/266/267 |

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

```
Zeig die Erde
```

Kugel: Tag- und Nachtseite erkennbar, ISS als **Bahn** plus Punkt, **kein**
Label „Live“.

```
Zeig Erdbeben
```

Marker + Quelle/Alter (USGS). Ohne den Satz keine Erdbeben-Wolke.

```
Was fliegt über uns
```

Wenige Objekte in der Nähe **oder** ehrlicher Wegfall, wenn die Quelle keinen
Ausschnitt hergibt.

## Abbruchkriterium

Einer der Screenshot-Sätze verhält sich wie am 14.9.2026.
EarthOS / Cesium / `globe.gl` ohne Messung in der APK.
Ein zweiter LLM-Organizer-Agent im Katalog.
