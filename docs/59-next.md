# 59 — Jarvis 12.0 Drei Flächen, ein Hirn **PLAN**

PO 2026-09-03: Reel [huwprosser / DXyvXCNITAK](https://www.instagram.com/reel/DXyvXCNITAK/) — Caption *„We’re building something cool.“* Tags `#ironman #jarvis #technology #vr`. Folge-Clips derselben Reihe zeigen **Tablet + Laptop + Schreibtisch**. Auftrag: analysieren, Deep Research, **wie wir das für Handy, Tablet und PC** umsetzen. Detaillierter Plan. **Kein Execute.**

**App-Stand:** Code **`10.60.2`** auf `main`. Sideload **`10.60.2`**. Hirn Gemini → Groq → 0,5B. Parser zuerst. Handy = Hirn. PC = Werkzeug (`JarvisPC.bat`). Tablet = **dieselbe APK**, Layout ab 900 px. Memory-10 [`56-next.md`](./56-next.md) **CODE**. Intensiv [`57-next.md`](./57-next.md) **PLAN**. Fachwissen [`58-next.md`](./58-next.md) **PLAN**. Gerät 178/193 **PO**.

`12.0` ist die nächste **Flächen-Schiene**: nicht ein zweites Hirn auf dem PC, nicht Quest-HUD, nicht Fine-Tune. Ein Gedächtnis, drei Fenster.

---

## Produkt in einem Satz

Jarvis sitzt **einmal** (IndexedDB + Keys auf dem Gerät, das Hirn ist). Handy ist die Tasche, Tablet die Schreibtisch-Lage, PC das Werkzeug plus optional ein **Viewer**. Sprechen Sie auf der einen Fläche weiter, wo die andere aufgehört hat — im **selben WLAN**, mit Token, nicht über die Cloud.

---

## 1. Was das Reel wirklich zeigt

Instagram liefert **kein Transkript**. Verifiziert: [@huwprosser](https://www.instagram.com/reel/DXyvXCNITAK/), 1. Mai, 53k Likes, Kommentare fast nur „send setup / repo“. Hashtags: Iron Man, Jarvis, Technology, **VR**. Ein Nachbar-Clip (13. Juni) ist ausdrücklich **Tablet + Bildschirm + Laptop + Schreibtisch**.

Das ist nicht Manina-Labs (Fach-Research, [`58-next.md`](./58-next.md)). Das ist Huw Prossers **JARVIS-IRL**-Serie: Stimme am Schreibtisch, Kamera auf die Fläche, Headset im Bild, „cooler“ HUD.

### Was Huw öffentlich dazu sagt (nicht das Reel-Audio)

| Quelle | Aussage | Für uns |
|--------|---------|---------|
| [Some thoughts on JARVIS](https://www.huwprosser.com/blog/some-thoughts-on-jarvis) (12. Mai 2026) | **Kein** API-Wrapper. Drei **offline** Modelle, selbst trainiert, synthetische Daten: kleines Interaction-Modell (UI/Smalltalk, RL), großes langsames Modell, schnelles Film-TTS. Läuft auf **MacBook Pro M1 32 GB**. Persönliches Projekt, **kein Verkauf** (Disney-Marke). | Anderer Stack. 32 GB Mac ≠ Sideload-APK. Fine-Tune **Won’t**. |
| LinkedIn-Demo (Desk-View) | „Look at my desk“ → Kamera sieht Quest 3, Raspberry Pi; Toggle *desk view*; *good night* / *stop looking*. | **Seh-Befehl + Schalter**, nicht stiller 24/7-Spion. |
| [jarvis-mlx](https://github.com/huwprosser/jarvis-mlx) | Öffentliches Repo **veraltet**. Whisper + Phi/Mistral + MeloTTS auf Apple Silicon. | Historie, nicht unser Execute. |
| [VR is Cooked](https://huwprosser.com/) (Juli 2025) + [DropVR](https://dropvr.com) | VR-Industrie im Kreis; stattdessen **Dateien zwischen Geräten** (AirDrop-artig). | VR als Produkt **Won’t Must**. LAN-Drop ist der ehrliche Rest. |

Kommentare unter dem Reel („setup please“) erwarten ein **Kit**. Huw verkauft keins. Wir auch nicht: Sideload + `JarvisPC.bat`.

---

## 2. Kritik am Wunsch „mach das wie Huw, auf Handy Tablet PC“

Drei Fantasien, ein Produkt:

| Fantasie | Warum falsch |
|----------|----------------|
| Mac-Hirn + Fine-Tune + Film-TTS auf allen drei Geräten | Jedes Gerät ein Modell = drei Personas, drei Caps, kein Hausstand. Unser 0,5B ist **Fallback**, nicht Produkt. Piper/Kokoro **Freeze**. |
| Quest / WebXR-HUD „wie Iron Man“ | Huw selbst: VR is cooked. Kein Headset-SDK im Repo. **Parking.** |
| Drei volle Apps, jede mit eigenem IndexedDB | Zwei Hirne = zwei Mate-Pins, Keys doppelt, Sleep-Chaos. **Won’t.** |
| Immer-an Schreibtisch-Webcam | Privacy-Vision, Akku, Android-Hintergrundkamera. Desk-View nur **auf Zuruf**, wie Huws Toggle. |
| Cloud-Sync „ein Account, alle Geräte“ | Kein Jarvis-Server. Hausstand ist Datei, nicht Firebase. |

### Was der Wunsch richtig sieht

| Beobachtung | Warum das zählt |
|-------------|-----------------|
| Schreibtisch braucht eine **große** Fläche | Tablet-Lage (`≥900px`) existiert — Chat daneben, nicht statt. Handy-Lage **ersetzt** den Chat (`lageScene`). Das fühlt sich nicht nach Huw-Desk an. |
| PC ist im Reel **im Bild**, nicht nur ein Tool-Chip | Heute: BAT + JPEG-Dock. Kein Jarvis-**Fenster** auf Windows. |
| Dieselbe Stimme / dasselbe Gedächtnis | Hausstand-Export ist manuell. Gespräch folgt **nicht**, wenn man das Tablet aufstellt. |
| „Schau auf den Tisch“ | Auge (Foto) und PC-Screenshot sind da. Es fehlt der **Parser** und der ehrliche Schalter. |
| Dateien zwischen Flächen | DropVR-Idee, nicht Quest. |

---

## 3. Netz — wie man Multi-Device 2026 ehrlich baut

| Muster | Realität | Übernehmen | Lassen |
|--------|----------|------------|--------|
| Ein Source-of-Truth, Rest sind Fenster | Browser-Sync, Local-first (CRDT) oder LAN-Proxy | **Handy/Tablet-APK = Hirn.** PC/zweites Fenster = Client mit Token | CRDT-Cloud, Accounts |
| LAN-only pairing (wie AirPlay / unser PC-Token) | QR + shared secret, kein WAN | Presence-Token analog `X-Jarvis-Token` | mDNS ins Internet, Cloudflare-Tunnel |
| Thin client | Chat-POST an das Hirn, UI lokal | `/v1/presence` auf dem Hirn-Gerät | Zweites Gemini auf dem PC |
| Desk camera as tool | Frame on demand | Eye-Foto / PC-JPEG, Gemini deutet | Always-on, Cloud-Vision-Index |
| Huw: 3 offline models on M1 | 32 GB, selbst trainiert | — | Gewichte in der APK |
| WebRTC mesh | Peers, TURN | LAN-JPEG bleibt ehrlich | TURN, öffentliches Signaling |

**Leitentscheidung:** Hirn bleibt **ein** Gerät (meist Handy; Tablet darf Hirn sein, wenn es die APK *allein* nutzt). Zweite und dritte Fläche sind **Fenster**. Kein zweites IndexedDB als Wahrheit.

---

## 4. Ist — Handy / Tablet / PC heute

```text
Android-APK (Capacitor WebView)
  ├─ Handy   Chat + Mic + Wake + Tools
  ├─ Tablet  dieselbe APK, Lage-Grid ab 900 px
  └─ PC      kein Jarvis-UI — nur desktop/JarvisPC.bat :18790
```

| Fläche | Datei / Mechanik | Ist | Lücke zum Reel |
|--------|------------------|-----|----------------|
| Handy | `App.tsx`, IndexedDB `jarvis-ondevice` | Hirn, Keys, Memory, Mic | Tasche ja; Desk-HUD nein (Lage verdrängt Chat) |
| Tablet | `matchMedia('(min-width: 900px)')`, `index.css` `.main.is-lage` | Lage links, Chat rechts | Kein Kiosk, kein „Lage immer“-Default, Composer klein |
| Friday | `face.ts`, `persona.ts` | Zweites **Gesicht**, ein Hirn | Kein Marvel, kein zweites Gerät |
| PC-Tool | `JarvisPC.ps1`, `pc.ts`, `pc-host.ts` | Status/Screenshot/Klick/Launch, LAN-JPEG, Token | Kein Chat-Fenster, kein Gedächtnis |
| Live | `pc-rtc.ts` | `webrtc: off`, 1 Hz JPEG | Kein Video-Peer |
| Sehen | `eye.ts`, `doc.ts`, PC-Screenshot | Foto / JPEG → Gemini | Kein „Tisch an/aus“ |
| Sync | `backup.ts` Hausstand-JSON | Manuell Export/Import | Gespräch folgt nicht |
| Presence-HTTP | — | **fehlt** | Tablet/PC können das Handy-Hirn nicht anreden |
| VR | — | **fehlt** | Hashtag, kein Code |

Won’ts, die `12.0` **nicht** kippt: Apple CarPlay, Play Store, iOS, NAS-Hirn, stilles WhatsApp, TURN, SmartThings, e5-Router.

Gerät-PO (178 Mic/Wake/FGS) bleibt die Voraussetzung, dass Tablet-Kiosk und Wake am Schreibtisch **leben**. Plan blockiert Execute nicht, Abnahme schon.

---

## 5. Soll — Rollen

| Gerät | Rolle | Speicher | Mic / TTS | Tools |
|-------|-------|----------|-----------|--------|
| **Handy** | Hirn-Default. Tasche, Wake, Keys | IndexedDB Source of Truth | ja | alle |
| **Tablet** | Schreibtisch-Lage. Gleiche APK | Entweder **selbst Hirn** (allein genutzt) **oder Fenster** (Presence aufs Handy) | ja, wenn Hirn; sonst optional | Lage, Chat, TV, gleiches Register |
| **PC** | Werkzeug + Viewer | Kein zweites Gedächtnis | TTS optional im Viewer; Mic Could | `JarvisPC` bleibt :18790 |
| **Quest / WebXR** | Parking | — | — | — |

Zwei erlaubte Haus-Setups, nicht mehr:

1. **Ein Gerät:** nur Handy **oder** nur Tablet — wie heute. Kein Presence.
2. **Schreibtisch:** Handy in der Tasche = Hirn. Tablet und/oder PC-Browser = Fenster, Token, gleiches WLAN.

Verboten: Tablet *und* Handy beide voll schreiben, ohne dass eines Fenster ist.

```text
Handy (Hirn)  --LAN Token-->  Tablet-APK im Fenstermodus
              --LAN Token-->  PC-Browser / BAT-Viewer
              --LAN Token-->  JarvisPC :18790  (unverändert, Steuerung)
```

Presence ist die **Umkehrung** von JarvisPC: das Hirn **lauscht**, das Fenster **sendet** eine Zeile und **liest** den Verlauf. Port getrennt (Vorschlag **18791**), gleiches Token-Muster, nur `192.168.*` / `10.*`.

---

## 6. Flächen im Detail

### Handy

Bleibt Produkt. Keine zweite Engine. Settings: „Ich bin das Hirn“ (Default) / Presence-Server an + QR. Desk-Blick und PC-Steuerung unverändert vom Handy aus.

### Tablet (Must, zuerst — da ist schon Code)

Reel-Desk = große dunkle Lage + Chat **daneben**. Das ist [`33-next.md`](./33-next.md) / [`39-next.md`](./39-next.md) `4.53`, nicht neu erfinden.

Härten, nicht klonen:

| Soll | Warum |
|------|--------|
| `Lage immer` leicht findbar; auf ≥900 px Default an | Sonst Portrait-Handy-Gefühl auf dem Pad |
| Verlauf im Tablet-Chat, nicht nur ein Input-Tile | Huw-Desk braucht Geschichte |
| Große Hit-Ziele, Composer bleibt sichtbar | Finger + Stift |
| Keep-screen / Kiosk-Hinweis ehrlich | Android sperrt Voll-Kiosk ohne Device-Owner |
| Friday weiter ein Gesicht, kein zweites Hirn | [`39-next.md`](./39-next.md) |

Fenstermodus (nach 211/212): Tablet-APK ohne eigenes Memory-Write; POST ans Handy.

### PC (Must als Viewer, Tool bleibt)

Zwei Schichten, nicht vermischen:

| Schicht | Ist | Soll `12.0` |
|---------|-----|-------------|
| **Werkzeug** | BAT :18790 Screenshot/Klick/Launch | unverändert, V9 LAN-only |
| **Fenster** | fehlt | Kleines Fenster oder Browser: Verlauf + Zeile senden + Lage-Read-only. Hirn = Handy |

Keine Electron-Zweit-App, kein Python. Entweder Tab aus der bestehenden BAT oder `http://HANDY-IP:18791/` im Browser. Ohne laufendes Handy-Hirn: ehrlich „Hirn nicht im Netz“, kein Fake-Chat.

### VR (Won’t Must)

Hashtag ≠ Produkt. Huw: VR cooked; DropVR = Dateien. Bei uns: Datei/Notiz über LAN **Could** (Sprint 216). Headset-HUD **Freeze/Parking**.

---

## 7. Desk-Blick (Should, nicht der erste Sprint)

Huw: *toggling the desk view* — Schalter, nicht Spion.

| Befehl | Ist | Soll |
|--------|-----|------|
| „Schau auf den Tisch / Schreibtisch an“ | kein Parser | Letztes **Auge-Foto** oder letzter **PC-JPEG**. Fehlt Frame: „Foto oder PC live.“ |
| „Tisch aus“ | — | Kein Frame mehr im Prompt |
| Always-on Webcam | — | **Won’t** |
| Quest-Passthrough | — | **Won’t** |

Gemini deutet das Bild (wie Eye). 0,5B beschreibt keine Pixel. LocateAnything-Gewichte bleiben Freeze.

---

## 8. Sprints

Eigene Schiene `12.x`. Kein Diebstahl von `10.61` (Intensiv) oder `11.0` (Fachwissen). Parallel zu 196–208 möglich. Gerät 178 bleibt PO.

| Sprint | Version | Thema | Must? | Stand |
|--------|---------|-------|-------|-------|
| **209** | `12.0.0` | Leit, Rollenmatrix, Settings-Texte, Won’t | Must | **PLAN** |
| **210** | `12.10.0` | Tablet-Kommandozentrale (Lage, Verlauf, Composer) | Must | **PLAN** |
| **211** | `12.20.0` | Presence-Token + QR, LAN-Guard | Must | **PLAN** |
| **212** | `12.30.0` | Hirn-Gerät hostet `/v1/presence` (Verlauf + POST Zeile) | Must | **PLAN** |
| **213** | `12.40.0` | PC-Viewer (Browser/BAT-Fenster) | Must | **PLAN** |
| **214** | `12.50.0` | Desk-Blick-Parser (Tisch an/aus) | Should | **PLAN** |
| **215** | `12.60.0` | Gold drei Flächen + Copy | Must | **PLAN** |
| **216** | `12.70.0` | LAN-Datei-Drop (DropVR-light); VR Parking | Could | **PLAN** |

Execute erst nach Go. Dieser Docs-Sprint bumped die APK nicht.

### Reihenfolge-Begründung

Tablet zuerst: sichtbarer Desk ohne Native-HTTP. Token vor dem Server. Presence vor dem PC-Fenster (sonst hat das Fenster nichts zum Reden). Desk-Blick und Drop sind Nice-to-have; ohne sie ist „drei Flächen“ schon ehrlich.

---

## 9. Gold (Sprint 215)

| ID | Fläche | Soll |
|----|--------|------|
| **F1** | Tablet ≥900 px | Lage + Chat-Verlauf + Composer gleichzeitig |
| **F2** | Handy Portrait + Lage | Chat darf Lage weichen — **dokumentiert**, kein Bug |
| **F3** | Presence aus | Zweites Gerät schreibt **nicht** ins Handy-Gedächtnis |
| **F4** | Presence an + Token | Zeile vom Viewer landet im **selben** Conversation-Store |
| **F5** | PC ohne BAT | Werkzeug ehrlich tot; Viewer sagt „Hirn/PC nicht erreicht“ |
| **F6** | Desk-Blick ohne Foto | Keine erfundene Schreibtisch-Liste |
| **F7** | Mate-Pin | Nur auf dem Hirn-Gerät; Fenster sieht ihn nach Presence, nicht lokal erfunden |

Kein MTEB. Kein Quest-Fixture. e5 bleibt Freeze.

---

## 10. Won’t

- Fine-Tune / drei Offline-Modelle / Film-TTS-Klon (Huw-Mac)
- Zweites IndexedDB als Wahrheit
- Cloud-Account-Sync, Firebase, WAN-Tunnel
- Apple CarPlay, iOS-App, Play Store
- Quest / WebXR / Iron-Man-Helm als Must
- Always-on Schreibtisch-Kamera
- TURN / öffentliches WebRTC
- NAS-Hirn, Python-PC-Backend
- Marvel-Rolle, englische Filmzitate
- Stilles Mithören / stilles Desk-Logging
- Neues `if` in `chat.ts` — Presence ist Transport, Parser bleiben Dateien (`desk-parse.ts`, Settings)

---

## 11. Ehrliche Grenzen

| Wunsch | Wahrheit |
|--------|----------|
| „Wie im Reel, Setup schicken“ | Es gibt kein Huw-Repo zum Klonen. Unser Setup: Sideload + gleiches WLAN + Token. |
| Ein Hirn offline auf allen dreien | Hirn **ein** Gerät. Fenster brauchen das Hirn **an** und im WLAN. |
| Tablet ohne Handy | Erlaubt — dann **ist** das Tablet das Hirn (Setup 1). Presence aus. |
| PC denkt allein | Nein. BAT steuert Windows. Viewer spricht mit dem Handy. |
| VR-Brille | Parking. Datei-Drop ist der Rest von Huws 2026-These. |
| Mic/Wake am Tablet-Kiosk | Sprint 178 PO. Plan lügt das nicht grün. |

---

## 12. Abnahme dieser Datei

- [x] Reel (Huw, VR-Hashtag, Desk/Tablet-Folge) von Manina-Research getrennt.
- [x] Huw-Blog/LinkedIn/mlx/VR-cooked zitiert, nicht abgeschrieben.
- [x] Ist Handy/Tablet/PC mit Dateien ehrlich.
- [x] Leit: ein Hirn, drei Fenster, LAN-Token.
- [x] Sprints 209–216, Versionen `12.0`–`12.70`, kein Diebstahl von `10.61`/`11.0`.
- [x] Kein Execute, kein APK-Bump.

Index: [`42-planned.md`](./42-planned.md). Tablet-Ist: [`33-next.md`](./33-next.md), [`39-next.md`](./39-next.md). PC-Ist: [`desktop/README.md`](../desktop/README.md). On-Device: [`13-on-device.md`](./13-on-device.md). Fachwissen bleibt [`58-next.md`](./58-next.md).
