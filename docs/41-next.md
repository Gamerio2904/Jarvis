# 41 — Lokales Sehen / LocateAnything (`4.76`) **CODE** (Protokoll, Vision aus)

PO 2026-08-27: Jarvis soll **sehen, ohne dass das Bild zu Google muss** — und auf dem PC **klicken, wo etwas wirklich liegt**. Inspiration, nicht Kopie:

https://www.instagram.com/reel/DaJuh6euSLq/?igsi=MWt1dDhkdXBsbnUybg==

**Nicht** [`40-next.md`](./40-next.md): dort ist `4.66` **Körper** (3D-Schema, Darstellung). LocateAnything macht PC-Auge/PC-Hand **treffsicher**, es ersetzt den Körper nicht.

> **Jetzt:** Code **`6.60.0`**. Sideload **`6.60.0`**. Parser für Zeig/Zählen/Tippen **CODE**. Vision/Gewichte **aus** bis 3060-GO. Auge und PC-Klick ohne Sidecar weiter über Gemini (`eye.ts`, `pc.ts`).

**Warum `4.76`, nicht `4.66`:** `4.66`–`4.75` = Körper, Sprint 115. Diese Schiene beginnt **danach**. Handy-WASM trägt kein 3B-VLM.

## Reel — was dort wirklich steht

NVIDIA **LocateAnything-3B** (Eagle, arXiv:2605.27365, HF `nvidia/LocateAnything-3B`). Parallel Box Decoding: ganze Box in einem Schritt. Bis 10× auf **H100** vs. Qwen3-VL — nicht auf dem Handy. GUI-Grounding, Detection, OCR-Ort. Kein Chat-LLM.

| Versprechen | Bei uns |
|-------------|---------|
| 10× schneller | Tempo nur auf der RTX, ehrlich sagen |
| Ganze Box | genau der PC-Klick |
| Open Source | Download am PC, nie in der APK |

## Ist (`6.60.0`)

| Thema | Code | Lücke |
|-------|------|-------|
| Auge | `eye.ts` — Foto → Gemini, sonst Absage | Bild zu Google |
| PC-Bild | `pc.ts` Screenshot lokal, Vorlesen Gemini | Deutung Cloud ohne Sidecar |
| PC-Klick | Gemini JSON `{nx,ny}` + Parser `ground-parse` | GUI-Grounding ohne JarvisSee-Gewichte |
| Food/Pflanze | Name oder Foto; API / Gemini | Locate **lokalisiert**, bestimmt keine Art |
| Körper `4.66` | **CODE:** PC-Auge-Kachel ehrlich leer/verbunden | keine Boxen ohne Sidecar |
| GPU | RTX 3060 12 GB | LocateAnything-Karte: A100/H100/4090, OS Linux → **GO/NO-GO** |

## Was besser würde

Privater Screenshot, treffsicherer Klick, Crop für OFF/iNaturalist, Overlay „wo ist Speichern“ ohne Fehlklick. NO-GO in `4.77` → Gemini-Auge bleibt, kein Fake.

## Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Intern | `ground` am PC neben JarvisPC. Chat: Auge, klick, wo ist. |
| Wo | Nur RTX. Handy bekommt Boxen, nicht das 3B. |
| Wozu | **Wo** liegt X. Nicht Smalltalk, nicht Artname. |
| Fallback | PC-Vision aus → Gemini wenn an → heutige Sätze. |
| Router | Ersatz-Pfad in `pc`/`eye`. Neue Fähigkeiten: Parser + Register, kein `if` in `chat.ts`. |
| Lizenz | NVIDIA non-commercial, privat ok. Gewichte nie in der APK. |
| Python | Nur Sidecar `JarvisSee` localhost, kein FastAPI-Hirn. |
| Körper | `4.73` zeigt PC-Auge-Zustand. LocateAnything füllt ihn mit Boxen, wenn GO. |

## Neues bauen

| Idee | Votum |
|------|--------|
| Zeig / wo ist (Overlay, kein Klick) | **ja** `4.87` |
| Zählen / Liste | **ja** `4.88` |
| Feld finden + tippen | **ja** `4.89` |
| Nachklick-Delta | **ja** `4.90` |
| Beleg lokal (Betrag/Datum) | **ja** `4.91` |
| Zettel → Termin nach Ja | **ja** `4.92` |
| TV-Foto → Taste (kein Live-Bild) | **ja** `4.93` |
| Schreibtisch wo liegt X | **ja** `4.94` |
| Waschlabel → ISO | **ja** `4.95` |
| EAN-Box → Open Food Facts | **ja** `4.96` |
| Genau zwei GUI-Schritte, je Confirm | **ja** `4.97` |
| Autonomer Computer-Use, Live-AR, Face-ID, Banking, Spielstand erfinden | **Won’t** |

LocateAnything liefert **wo**. Ziffern auf dem Beleg: Crop + OCR im Sidecar **oder** Gemini nur auf den Crop.

## Research

### `4.76.0` Leitentscheidung — dieser Sprint

Done wenn: dieses Dokument + Sprint 116 + Versioning, **ohne** `4.66` zu überschreiben.

### `4.77.0` RTX 3060 + Windows

Messen: Fit in 12 GB bei 1280 px, WSL2 vs. nativ, Latenz, Lizenzzeile. **GO/NO-GO.**

**Votum 2026-08-29: NO-GO für Gewichte.** In dieser Umgebung liegt keine RTX 3060, kein Windows-Sidecar, kein JarvisSee. Ohne Messung keine Gewichte, keine erfundenen Boxen. Parser bleibt CODE, Vision ehrlich aus.

### `4.78.0` Sidecar

`JarvisSee` localhost, JarvisPC proxyt `/v1/ground`. Status `vision: off\|loading\|ready\|error`. Stub in CI.

### `4.79.0` Klick vs. Gemini

5–10 echte Shots: Button, Explorer, unsicher = kein Blindklick.

### `4.80.0` Foto, Konflikte, OCR-Weg

| Äußerung | Gewinner |
|----------|----------|
| `Lies das Foto` | `eye` |
| `Was siehst du auf dem PC` | `pc` |
| `klick Start` | `pc` click |
| `Wo ist Speichern` | find, kein Klick |
| `Wie viele Fenster` | count |
| Beleg / Zettel-Termin | `slip` |
| TV-Foto Anmelden | `tv` + ground |
| `Körper an` | `körper` (`4.70`), nicht Sehen |

## Bau

| Version | Inhalt | Sprint |
|---------|--------|--------|
| **`4.76.0`** | Leitentscheidung + Parser `ground-parse` + `/v1/ground` Client | 116 **CODE** in `5.11.0` |
| **`4.77.0`–`4.80.0`** | Research 3060 / Sidecar / Klick / Foto | **`4.77` NO-GO** ohne 3060-Messung; Sidecar fehlt |
| **`4.81.0`** | `/v1/ground` + Status | **CODE** Client; Sidecar fehlt → ehrlich aus |
| **`4.82.0`** | **Reel-Kern:** `doClick` versucht Box, unsicher = kein Klick | **CODE** Fallback Gemini nur mit Satz |
| **`4.83.0`** | Overlay ohne Klick (`Wo ist Speichern`) | **CODE** Parser + ehrliche Antwort |
| **`4.84.0`–`4.86.0`** | Foto zum PC, Crop Food/Nature, Fallback/Gold | Gold **CODE**; Crop nach GO |
| **`4.87.0`–`4.93.0`** | Zeig, Zählen, Tippen, Beleg, Termin, TV-Foto | 117 Parser **CODE**, Vision braucht Sidecar |
| **`4.94.0`–`4.97.0`** | Schreibtisch, Waschlabel, EAN, zwei Schritte | 118 Parser **CODE** |
| **`4.98.0`–`4.99.0`** | Gold, Sideload nach Hausstand | Gold **CODE**, Sideload geplant |

NO-GO in `4.77` bleibt: Gewichte nicht in der APK, keine erfundenen Boxen. Ohne JarvisSee sagt der Chat **Sehen am PC ist aus**.

## Chat (Ziel)

`klick Start` — Box oder unsicher. `Wo ist Speichern` — Overlay, Maus still. `Was steht auf dem Beleg` — Zahl nur aus Crop. `Termin aus dem Zettel` — nur nach Ja. `Einstellungen, dann Datenschutz` — zwei Confirms, kein dritter.

## Won’t

3B im WASM. Face-ID. Live-Kamera. NVIDIA-Cloud. APK-Gewichte. FastAPI-Hirn. Computer-Use-Schleife. Beleg → Bank. Körper-3D ersetzen.

Sprints: [`sprint-116.md`](./sprints/sprint-116.md)–[`sprint-118.md`](./sprints/sprint-118.md). Körper: [`40-next.md`](./40-next.md). Index: [`42-planned.md`](./42-planned.md).
