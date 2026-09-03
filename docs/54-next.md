# 54 — Rest final (`9.10`) **PLAN**

**App-Stand:** Code und Sideload **`9.9.2`**. Parser-first. Hirn Gemini → Groq → 0,5B. Alltag-Router, Recall, V1–V9, Screenshot-Fixes sind **CODE**. Dieses Dokument ist die **letzte geplante Schiene** — nicht ein neues Produkt.

Vier Bündel, in dieser Reihenfolge. Could darf 1–3 nicht blockieren. Jedes ONNX-/Gewicht-Bündel hat ein eigenes **GO/NO-GO** (Größe, Latenz, Lizenz). NO-GO = ehrlich aus, kein Fake.

| # | Bündel | Sprints | Version | Must? |
|---|--------|---------|---------|-------|
| 1 | Geräte-Katalog auf dem Handy | **168** (Katalog), Findings nur wenn rot | `9.9.2` / `9.9.3` | **Must** (PO) |
| 2 | Debug-Hintergrund v2 | **169** Spike, **170** FGS oder Freeze | `5.12` / `5.17` | **Should** |
| 3 | LocateAnything-Gewichte | **171** 3060-Messung, **172** Sidecar oder Freeze | `4.77`–`4.80` | **Must** nach GO, sonst Freeze |
| 4 | Qualität-Could | **173** Leit, **174** Silero+Smart Turn, **175** Piper, **176** Kokoro+e5, **177** Gold | `9.10` | **Could** |

Sideload nur nach Hausstand + Gold des jeweiligen Bündels. Kein Downgrade auf `8.0.0` / `5.0` / `4.0`.

---

## Kurz: was wir bauen (und was nicht)

| Wunsch | Bei uns | Votum |
|--------|---------|-------|
| Probe V1–V9 + Screenshot-Bugs auf dem Gerät | Katalog 168, einzeln kopieren, GPS/Mic/TTS/TV | **ja** (PO) |
| Debug-Lauf überlebt Home | Spike: stirbt JS? Nur dann Foreground-Service „Jarvis testet…“ | **ja** nach GO |
| App zu = Lauf tot | Bleibt Won’t | **Won’t** |
| LocateAnything-Boxen auf dem PC | Sidecar `JarvisSee`, nicht 3B im WASM | **ja** nach 3060-GO |
| Gewichte ohne Messung | Parser bleibt, Chat sagt Sehen aus | **Won’t** |
| Silero + Smart Turn ONNX | ~10 MB, nur in der Stille nach VAD, Endpoint 200 ms vs 800 ms | **Could** |
| Piper offline deutsch | sherpa-onnx, First-Audio lokal, Algieba/Edge bleiben Lane-1 | **Could** |
| Kokoro-82M | Messen gegen Edge/Algieba, nicht beides plus Piper | **Could** Spike |
| e5-small | Nur `retrieve.ts` Rerank, **nie** Router | **Could** Spike |
| Pipecat-Server, Whisper, Cesium, Moshi, Embeddings-Router | — | **Won’t** |

---

## 1. Gerät — Sprint 168

Katalog: [`sprints/sprint-168.md`](./sprints/sprint-168.md). Parser **CODE**. PO auf dem Handy: Chat A, Stimme B, Kugel C, News/TV D–F, Probe V1–V9, Hirn H.

**Done wenn:** DoD-Häkchen in 168. Rote Verdicts → Patch auf `9.9.3`, kein neues Produkt. Grün → kein Sideload-Bump.

---

## 2. Debug-Hintergrund — Sprints 169–170

Ist: Lauf `5.11` **CODE**. v1: App offen + `setKeepScreenOn`. Home killt die WebView. Wake-Dienst (`JarvisWakeService`) ist **Wake-Word**, nicht Debug.

| Stufe | Soll | Wann |
|-------|------|------|
| Spike `5.12` | Ein Gerät: Home während Lauf. Stirbt JS? Reicht WakeLock? | 169 |
| v2 `5.17` | Nur bei GO: FGS „Jarvis testet…“ + WakeLock. Kein zweites Hirn. Notify bestehend. | 170 |
| Freeze | Spike NO-GO oder zu teuer: Banner „Bitte App offen lassen.“ Gold ohne Service | 170 |

**Won’t:** Lauf nach Prozess-Kill. Lauf ohne offene APK. Auto-Ja. Zweiter FGS neben Wake.

**Done Spike:** Tabelle Gerät / Home / Screen-aus / Kill + Votum GO oder Freeze.

---

## 3. LocateAnything — Sprints 171–172

Parser `ground-parse` / `/v1/ground` **CODE**. Votum 2026-08-29: **NO-GO Gewichte** ohne 3060-Messung. Das bleibt, bis 171 misst.

| Schritt | Inhalt |
|---------|--------|
| 171 `4.77` | RTX 3060 12 GB, 1280 px, WSL2 vs nativ, Latenz, Lizenz. GO/NO-GO schriftlich |
| 172 GO | Sidecar `JarvisSee`, Status `off\|loading\|ready\|error`, unsicher = kein Klick |
| 172 NO-GO | Freeze: Chat **Sehen am PC ist aus**. Keine erfundenen Boxen. Parser unverändert |

**Won’t:** 3B WASM. Face-ID. Live-Kamera. NVIDIA-Cloud. APK-Gewichte. FastAPI-Hirn.

---

## 4. Qualität-Could — Sprints 173–177

Recherche: [`52-research-latency-quality.md`](./52-research-latency-quality.md). Loop (Prefix, Groq-SSE, SLO, Edge-First, Barge-in) ist **CODE**. ONNX-Gewichte sind **Could**.

### Leit `9.10.0` (173)

| Regel | Satz |
|-------|------|
| Opt-in | Settings → Stimme / Hirn. Default = heutige Lane (Energie-VAD, Edge+Algieba) |
| Größe | Spike vor Bundle. APK darf nicht still +100 MB werden |
| Parser | Unverändert vor dem Hirn. e5 **nie** als Tool-Router |
| Eine Extra-TTS | Piper **oder** Kokoro, nicht beide plus Edge plus Algieba |
| Deutsch | Siezen. Kein Marvel. Erfolg ohne Observation bleibt verboten |
| Drive | Mic-Barge und ONNX-VAD default aus am Steuer, bis Auto-Messung |

### Bau Could

| Version | Inhalt | Sprint | Default |
|---------|--------|--------|---------|
| **`9.10.0`** | Leit + Größenbudget + Settings-Schalter (noch tot) | 173 | — |
| **`9.10.1`** | Silero-VAD ONNX + Smart Turn v3 (8 MB). Nur nach Stille. WASM oder JNI | 174 | aus, bis P95 Endpunkt sinkt ohne False-Stop |
| **`9.10.2`** | Piper `de_DE-thorsten` über sherpa-onnx. First-Audio lokal. Lane-1 bleibt Edge/Algieba | 175 | aus |
| **`9.10.3`** | Kokoro-82M Spike vs Edge/Algieba/Piper. e5-small Spike vs Keyword-RRF | 176 | **nicht** bundeln ohne GO |
| **`9.10.9`** | Gold: was GO hatte, opt-in; Rest Freeze. Debug-Spans TTFT/First-Audio | 177 | — |

Eval-Spans im Debug-Export (TTFT, First-Audio, Pfad) dürfen in 177 mit, ohne neues Modell.

L1-Antwort-Cache nur für identischen Smalltalk ohne Uhr/Wetter/Retrieve — Could in 177, sonst lügen wir bei der Uhr.

### Could-GO (pro Sprint)

| Modell | GO wenn | NO-GO wenn |
|--------|---------|------------|
| Silero + Smart Turn | Endpunkt ~200 ms bei fertigem Satz, 800 ms bei „und…“; False-Barge im Auto nicht schlimmer | Hall, Echo, unfertige Sätze |
| Piper | First-Audio < Edge auf dem Gerät **oder** Offline-Satz wenn Netz tot; APK-Delta akzeptabel | >40 MB ohne messbaren Gewinn |
| Kokoro | Deutlich näher an Algieba als Piper, und Piper reicht nicht | 82 MB für gleichen Satz |
| e5-small | Keyword-RRF messbar falsch auf PO-Set (≥3 klare Fehltreffer) | 120 MB, Router-Versuch, „fühlt sich smarter an“ |

---

## Reihenfolge (Pull)

1. **168** Gerät — blockiert Sideload-Behauptungen, nicht den Spike-Text von 169/171/173.  
2. **169 → 170** Debug — kein 3060.  
3. **171 → 172** Sehen — wartet auf 3060 am Tisch.  
4. **173 → 177** Could — nach 168, parallel zu 169–172 erlaubt, **kein** Must für Gold von 1–3.

Parking unverändert: Mail, Cloud-Kalender, Alexa, Play Store, iOS, NAS-Hirn, Welt-Geocoder, Live-Sat, Whisper, Cesium, Pipecat-Server, Moshi, Encryption-at-rest.

---

## Won’t (Serie)

Apple CarPlay. Live-Beamte. 3B im Handy. Gewichte ohne Messung. Zweites Hirn. Embeddings als Router. Pipecat/LiveKit-Runtime. Marvel. Erfolgssatz ohne Observation. Play Store. iOS.

## Abnahme

1. 168: PO-Häkchen oder schriftlich welche Zeile rot.  
2. 170: Home während Debug → Lauf lebt **oder** Banner ehrlich.  
3. 172: Boxen nur mit Sidecar-ready; sonst „Sehen aus“.  
4. 177: Default-App ohne Could-Gewichte gleich `9.9.2`. Opt-in nur für GO-Modelle. `test:014` grün.

Sprints: [`sprints/sprint-168.md`](./sprints/sprint-168.md)–[`sprints/sprint-177.md`](./sprints/sprint-177.md). Sehen: [`41-next.md`](./41-next.md). Debug: [`44-next.md`](./44-next.md). Stimme: [`52-research-latency-quality.md`](./52-research-latency-quality.md). Index: [`42-planned.md`](./42-planned.md).
