# 47 — Split, Identität, Overlay, Sideload (`6.52`–`6.60`) **CODE**

Nach [`46-next.md`](./46-next.md) / Sprint 127 (`6.51` **CODE**). 128–130: Live-Doppelbefehl, naive Identität ohne Hirn, Overlay Gemini zuerst, Sideload `6.60.0`.

**Nicht** in dieser Schiene: Debug-Service `5.12`. LocateAnything-Gewichte (`4.77`). Welt-Geocoder, Street View, 1,5B, Play Store, iOS.

## Reihenfolge

| Sprint | Version | Inhalt |
|--------|---------|--------|
| 127 | `6.51.0` | Parser nach Prompt-Test — **CODE** |
| 128 | `6.52.0` | Live-Split + Identität ohne Modell — **CODE** in `6.60.0` |
| 129 | `6.53.0` | Overlay: Gemini zuerst, 0,5B Backup, Fertig ohne Download — **CODE** in `6.60.0` |
| 130 | `6.60.0` | Sideload-APK — **CODE** |

App-Code und APK: **`6.60.0`**. Vor Neuinstall: Hausstand exportieren.

## Sprint 128 — Split + Identität

| Prompt | Patch | Grün wenn |
|--------|-------|-----------|
| `Körper an und Zeig London` | `pickRoute` splittet, letzter Treffer `hud` | CI + Debug `hud` |
| `Zeig Spotify und London` | Split-Teil, der nur ein Lexikon-Ort ist → `Zeig Ort` | drive + Pin |
| `Bist du ChatGPT?` / `Bist du eine KI?` / `Wie heißt du?` | Canned Identität | Route `identity` ohne Modell |
| `Wer bist du?` | bleibt memory | unverändert |

## Sprint 129 — Overlay ehrlich

Setup-Karte: Gemini zuerst. Fertig ohne Download. 0,5B letzter Knopf. Hinweis Hausstand.

## Sprint 130 — APK

`versionName`/`versionCode` aus `package.json`. `releases/Jarvis.apk`. Kein Play-Store-Claim.

## Tests

`test:matrix` 0/33. `test:sprint` 0/133. `test:prompts` 164.

Sprints [`sprints/sprint-128.md`](./sprints/sprint-128.md)–[`sprint-130.md`](./sprints/sprint-130.md).
