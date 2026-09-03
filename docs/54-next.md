# 54 — Rest final (`9.10.0`) **CODE**

**App-Stand:** Code und Sideload **`9.10.0`**. Parser-first. Hirn Gemini → Groq → 0,5B. Alltag-Router, Recall, V1–V9, Screenshot-Fixes sind **CODE**. Default-Lane wie `9.9.2`, plus Debug-FGS und ehrliche Could-Schalter ohne Gewichte.

Vier Bündel. Could hat 1–3 nicht blockiert. ONNX ohne Messung = ehrlich aus, kein Fake.

| # | Bündel | Sprints | Version | Must? | Stand |
|---|--------|---------|---------|-------|-------|
| 1 | Geräte-Katalog auf dem Handy | **168** (Katalog) | `9.9.2` | **Must** (PO) | **KATALOG** |
| 2 | Debug-Hintergrund v2 | **169** Spike → **170** FGS | `5.12` / `5.17` | **Should** | **CODE** |
| 3 | LocateAnything-Gewichte | **171** NO-GO → **172** Freeze | `4.77`–`4.80` | Must nach GO | **FREEZE** |
| 4 | Qualität-Could | **173** Leit → **174–176** Freeze → **177** Gold | `9.10.0` | **Could** | Leit **CODE**, Gewichte **FREEZE** |

Sideload `9.10.0` nach Hausstand. Kein Downgrade auf `8.0.0` / `5.0` / `4.0`.

---

## Kurz: was gebaut ist (und was nicht)

| Wunsch | Bei uns | Stand |
|--------|---------|-------|
| Probe V1–V9 + Screenshot-Bugs auf dem Gerät | Katalog 168 | **KATALOG** / PO |
| Debug-Lauf überlebt Home | FGS „Jarvis testet…“ + WebView-Keep-alive | **CODE** |
| App zu = Lauf tot | Won’t | gehalten |
| LocateAnything-Boxen auf dem PC | keine 3060 | **FREEZE** — Sehen aus |
| Gewichte ohne Messung | Parser bleibt | gehalten |
| Silero + Smart Turn ONNX | Schalter, Datei fehlt | **FREEZE** |
| Piper offline deutsch | Schalter, Datei fehlt | **FREEZE** |
| Kokoro-82M | Schalter, Datei fehlt | **FREEZE** |
| e5-small | Schalter, RRF unverändert, nie Router | **FREEZE** |
| Pipecat-Server, Whisper, Cesium, Moshi, Embeddings-Router | — | **Won’t** |

---

## 1. Gerät — Sprint 168

Katalog: [`sprints/sprint-168.md`](./sprints/sprint-168.md). Parser **CODE**. PO auf dem Handy.

---

## 2. Debug-Hintergrund — Sprints 169–170 **CODE**

Spike: Home killt die WebView. Votum **GO v2**. `JarvisDebugService` (Notification 73, `specialUse`), nicht Wake (71, microphone). `START_NOT_STICKY`. Notify-Stop → Lauf ende.

---

## 3. LocateAnything — Sprints 171–172 **FREEZE**

Keine RTX 3060 → **NO-GO Gewichte**. Chat: Sehen am PC ist aus (3060-Freeze). Parser unverändert.

---

## 4. Qualität-Could — Sprints 173–177

Leit und Settings **CODE**. ONNX-Dateien **nicht** in der APK. Default = Energie-VAD 220/800, Edge vs Algieba, Keyword-RRF.

Eval-Spans im Debug-Export (TTFT, First-Audio, Pfad, P95) **CODE**. L1-Smalltalk-Cache existiert als Modul, nicht am Router.

---

## Won’t (Serie)

Apple CarPlay. Live-Beamte. 3B im Handy. Gewichte ohne Messung. Zweites Hirn. Embeddings als Router. Pipecat/LiveKit-Runtime. Marvel. Erfolgssatz ohne Observation. Play Store. iOS.

## Abnahme

1. 168: PO-Häkchen oder schriftlich welche Zeile rot.  
2. 170: Home während Debug → Lauf lebt (FGS + Keep-alive); App schließen tot.  
3. 172: „Sehen aus“, keine Boxen.  
4. 177: Default ohne Could-Gewichte. `test:014` + `test:rest-final` grün.

Sprints: [`sprints/sprint-168.md`](./sprints/sprint-168.md)–[`sprints/sprint-177.md`](./sprints/sprint-177.md). Sehen: [`41-next.md`](./41-next.md). Debug: [`44-next.md`](./44-next.md). Stimme: [`52-research-latency-quality.md`](./52-research-latency-quality.md). Index: [`42-planned.md`](./42-planned.md).
