# 55 — Nach Rest-final (`9.10.0`) — Intensiv-Befund + nächste Sprints

**App-Stand:** Code und Sideload **`9.10.0`**. Parser-first. Hirn Gemini → Groq → 0,5B. Rest final [`54-next.md`](./54-next.md) **CODE**. Alltag-Router [`50-next.md`](./50-next.md) **CODE**. V1–V9 **CODE**. Screenshot-Fixes `9.9.2` **CODE**.

Diese Datei ist der Befund nach intensivem Parser-/Native-/Docs-Lauf **und** der Sprint-Plan danach. Gerät-Zeilen bleiben **PO** — kein Erfolgssatz ohne Handy.

Sideload `9.10.0` nach Hausstand. Kein Downgrade auf `8.0.0` / `5.0` / `4.0`. Alte 1.x/2.x-PRs **nicht** mergen (sie würden `9.10` zerstören).

---

## Intensiv-Befund (was geht / nicht / besser)

### Geht (Parser, Build, Sideload-Inhalt)

| Fläche | Nachweis |
|--------|----------|
| Parser-Suiten | `test:014`, `test:prompts`, `test:sprint`, `test:alltag`, `test:650`, `test:matrix` |
| Rest-final | `test:rest-final`: Could default aus, Datei fehlt ehrlich, e5 nie Router, Sehen-Freeze, 220/800, FGS-Klasse |
| Typecheck | `tsc -b` |
| APK | versionName `9.10.0`, versionCode `91000`, `JarvisDebugService` im Dex, **keine** ONNX-Gewichte |
| Could-Schalter | Stimme/Hirn default **aus**. Ohne Datei deutscher Grund. e5 nie `pickRoute` |
| Sehen | `capMissingReply('ground')` = *Sehen am PC ist aus* + 3060-Freeze |
| FGS-Code | Notification 73, `specialUse`, `START_NOT_STICKY`, Tap öffnet die App (nicht `jarvis://voice`), WakeLock 30 min, `resumeTimers` ohne `WebView.onResume` aus Pause/Stop |
| Alltag-Parser | Amazon Music ≠ Prime, `Chat nach Privat legen`, Blitzer ≠ Unwetter, Settings-Suche Blitzer/Amazon, Korridor ohne Overpass |

### Geht nicht / nur PO (kein Erfolgssatz)

| Fläche | Warum |
|--------|-------|
| Sprint **168** Geräte-Katalog | Parser grün. GPS, Mic, TTS, TV, Home-FGS 30 s brauchen das **Handy** |
| Home während Debug 30 s | Spike sagt: ohne FGS stirbt die WebView. FGS ist Code. **Lebt** der Lauf auf dem Gerät? PO |
| OEM-Akku (Xiaomi/Samsung/…) | FGS hilft nicht gegen Hersteller-Killer. Kein Fake-„läuft immer“ |
| Silero / Piper / Kokoro / e5 | Schalter da, Dateien **nicht** in der APK. An = ehrlich *fehlt* |
| `applyE5Rerank` | Identität, auch wenn jemand Dateien danebenlegt — kein stilles Rerank |
| L1-Smalltalk-Cache | Modul `smalltalk-cache.ts` **nicht** in `chat.ts` (unsicher am Router) |
| Blitzer mobil / Beamte | OSM-Säulen unvollständig. Mobil und Live-Jagd **Won’t** / leer |
| Amazon Music in Jarvis | Intent zur App. Kein Web-SDK. Ohne App ehrlich aus |

### Verbessern (nächste Sprints, nicht heimlich in 9.10)

| Thema | Sprint |
|-------|--------|
| PO: Katalog 168 + Home-FGS 30 s auf einem Gerät | **178** Must |
| OEM-Akku / Debug trotz Hersteller | **183** Should |
| Smalltalk-Cache nur nach Messung | **184** Could |
| Could-ONNX erst mit Gold-Messung | **181** Freeze (bleibt) |
| 168 rot → Patch | **186** / `9.9.3` nur wenn rot |
| Alltag-Tore auf dem Gerät (Mic, Wake, OSM live) | **185** PO |

---

## Geschlossen in `9.10.0` (nicht nochmal planen)

| Sprint | Thema | Stand |
|--------|-------|-------|
| 168 | Geräte-Katalog | **KATALOG** / PO |
| 169 | Debug-Spike | **CODE** GO v2 |
| 170 | Debug FGS | **CODE** |
| 171 | LocateAnything 3060 | **NO-GO** |
| 172 | Sehen-Freeze | **CODE** |
| 173 | Could-Leit | **CODE** |
| 174–176 | Silero / Piper / Kokoro+e5 | **FREEZE** |
| 177 | Rest-Gold | **CODE** |
| **179** | Alltag Parser-Härte | **CODE** (Amazon≠Prime, Ordner-Wortstellung, Settings-Suche, Korridor-Test) |
| **180** | FGS Native-Härte | **CODE** (Tap, WakeLock-Timeout, nur `resumeTimers`) |
| **182** | Docs = Code `9.10.0` | **CODE** |

Alltag-Router `8.0` (Blitzer OSM, Settings-Reiter, Ordner, Preiswache, Amazon-Intent) war schon **CODE**; 179 härtet nur Parser/Tests.

---

## Geplante Sprints (alle)

Reihenfolge = Lieferreihenfolge. Could blockiert Must nicht.

| Sprint | Version | Thema | Must? | Stand |
|--------|---------|-------|-------|-------|
| **178** | `9.10.0` Gerät | PO Handy: Katalog 168 + Home-FGS 30 s | **Must** | **PLAN** |
| **179** | in `9.10.0` | Alltag Parser-Härte | Should | **CODE** |
| **180** | in `9.10.0` | FGS Native-Härte | Should | **CODE** |
| **181** | `9.10.1`–`9.10.3` | Could-ONNX Freeze bis Messung | Could | **FREEZE** |
| **182** | in `9.10.0` | Docs auf Code-Stand | Must (diese Runde) | **CODE** |
| **183** | nach 178 | OEM-Akku / Hersteller-Killer | Should | **PLAN** |
| **184** | nach Messung | L1-Smalltalk in `chat.ts` nur identisch | Could | **PLAN** |
| **185** | `8.0` Gerät | Alltag-Tore Mic/Wake/OSM live | Should | **PLAN** / PO |
| **186** | `9.9.3` | Findings aus 168, **nur wenn rot** | Must wenn rot | **PLAN** |

### Parking (kein Sprint, bleibt Parking)

Mail, Cloud-Kalender, Alexa, Play Store, iOS, Whisper-Runtime, Cesium, Pipecat/LiveKit, Embeddings als Router, Apple CarPlay, Live-Beamte, 3B im Handy, Marvel, Erfolg ohne Observation, Encryption-at-rest, NAS-Hirn.

---

## 178 — PO Handy (Must)

[`sprints/sprint-178.md`](./sprints/sprint-178.md). Sideload `9.10.0` nach Hausstand. Probe V1–V9 + Screenshot-Bugs + Debug: Start → Home → 30 s → zurück. Schriftlich welche Zeile rot. Kein „geht“ ohne Gerät.

## 181 — Could bleibt Freeze

Keine ONNX-Dateien in die APK. Kein Default an. Gold erst nach Messung auf dem Gerät (TTFT / First-Audio / P95). e5 nie Router.

## 183 — OEM

Xiaomi/Samsung/… können FGS trotzdem killen. Ehrliches Banner oder Hersteller-Schritte. Kein zweites Hirn.

## 184 — Smalltalk-Cache

Nur identische Äußerung, ohne Uhr/Wetter/Retrieve. Erst verdrahten wenn Debug-P95 das hergibt. Sonst Modul tot lassen.

## 185 — Alltag Gerät

Parser-Härte ist 179. Live: Mic/Wake, OSM-Overpass, Preiswache-Poll. Vier Phasen des Debug-Laufs.

## 186 — nur wenn 168 rot

Sonst kein `9.9.3`.

---

## Won’t

Alte 1.x/2.x-PRs auf `main`. Pipecat. Whisper-Server. Cesium. Moshi. Embeddings-Router. Play Store. iOS. Marvel.

## Abnahme dieser Datei

1. Tabelle Geht / Nicht / Besser steht.  
2. Alle Sprints 178–186 plus Parking gelistet.  
3. Docs-Header **Jetzt `9.10.0`**.  
4. `test:014` + `test:rest-final` + `test:alltag` grün.

Index: [`42-planned.md`](./42-planned.md). Rest: [`54-next.md`](./54-next.md). Alltag: [`50-next.md`](./50-next.md). Nächste Intelligenz (PLAN, kein Gerät-Ersatz): [`56-next.md`](./56-next.md) `10.0`.
