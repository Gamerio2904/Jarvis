# 76 — Stimme, TV-Wahrheit, Intelligenz, Docs **CODE** (`18.10.0`, historisch `18.5`)

> **Versionierung:** Live war schon **`18.9.8`** (versionCode `180908`).
> Als `18.5.0` / `180500` zu shippen wäre ein Downgrade — Android lehnt das ab.
> Inhalt der Schiene 301–306 landet in **`18.10.0`** (versionCode `181000`).
> `18.5` bleibt der Planname, nicht `APP_VERSION`.

Ausgangspunkt historisch: Code **`18.4.4`**. Anlass: „Fernseher an“ geht nicht;
Spracheingabe und -ausgabe sollen treffsicherer und besser klingen;
Jarvis soll sich intelligenter anfühlen; Docs und Code sind über Jahre
gewachsen.

Die Leitentscheidung bleibt: **Parser wählen Geräte, ein Agent pro Zug,
e5 nie in `pickRoute`, kein Qdrant, kein LLM-Organizer, kein Graphiti /
cognee / Mem0, kein cytoscape. Filme: OMDb, nicht RT-API.** HDMI-CEC
kann das Handy nicht — An/Aus bleibt Netzwerk.

**Dieses Dokument ist CODE + APK in `18.10.0`.** Sideload **`18.10.0`**,
versionCode `181000`. Execute: Sprints **301–306**.
18.6 / 18.8 / 18.9 sind CODE+APK — die alte Parallel-Sperre gilt nicht mehr.

---

## 0. Diagnose: „Fernseher an“ — intern oder extern?

Der Satz trifft den Parser (`parseTvIntent` → `action: 'on'`). Execute in
`tv.ts` sendet **nur ein UDP-Magic-Packet** (`tvWakeNative` →
`JarvisTvPlugin.doWake`). Kein `KEY_POWERON`, kein Poll auf
`http://TV:8001/api/v2/`, kein „ist wirklich an“. Erfolg heißt: das
Packet hat das Handy verlassen.

Referenz außen: [Home Assistant samsungtv](https://www.home-assistant.io/integrations/samsungtv/)
weckt per WoL und wartet; [samsungtvws](https://github.com/xchwarze/samsung-tv-ws-api)
hat `wol` **und** `KEY_POWER` / `KEY_POWERON`. Samsung Smart View:
WoWLAN nur wenn **Power On with Mobile** an ist, oft Ethernet-MAC ≠
WLAN-MAC.

### Wie du es an der Antwort erkennst

| Jarvis sagt | Klasse | Was tun |
|-------------|--------|---------|
| „Fernseher ist aus (Einstellungen → Fernseher).“ | **Intern / Config** | `tv_enabled` Default ist `false`. Schalter in Settings an. |
| „Keine MAC für Wake-on-LAN…“ / „Kein TV hinterlegt.“ | **Intern / Setup** | Suchen + koppeln. MAC muss 12 Hex sein. |
| „Wake-on-LAN nur in der Android-App…“ | **Intern / Plattform** | Sideload-APK, nicht Browser. |
| „WOL fehlgeschlagen: MAC ungültig“ | **Intern**, wenn die UI Müll speichert | MAC neu aus der Suche. |
| „Magic-Packet gesendet. Wacht er nicht auf…“ und der TV bleibt dunkel | **Extern** (App-Pfad hat gearbeitet) | Am TV: IP-Remote / Power On with Mobile / WoL. Gleiches WLAN, kein Gastnetz. Eco/Deep-Sleep aus. Ethernet zuverlässiger als WLAN. |
| „TV noch nicht gekoppelt“ bei **an** | tritt bei `on` **nicht** auf | Kopplung braucht nur aus/Laut/Apps. |
| Nichts / Film / Smalltalk statt TV | **Intern** STT oder Konflikt | Hören (302). Corpus hat `fanseher an` → tv. |

### Interne Lücken (CODE in 301)

1. **Erfolg ohne Beobachtung.** `packVerified` existiert, `on` nutzt es nicht.
   ReAct/HA-Muster: handeln, dann Zustand lesen.
2. **Kein `KEY_POWERON`,** wenn der TV im Netz-Standby schon `:8001` antwortet.
   `KEYS.on` ist `null`; `off` ist `KEY_POWER` (Toggle — gefährlich ohne State).
3. **MAC nur `wifiMac`**, und der Fallback ist ein Tippfehler
   (`optString("wifiMac", optString("wifiMac"))`). Ethernet-MAC fehlt.
   Falsche MAC = Packet kommt an, TV ignoriert es → fühlt sich extern an,
   ist aber eine interne Auswahl.
4. **Kein zweites Packet nach 1–2 s**, obwohl HA-User genau das brauchen.
5. Fire-`on` ist ADB-Key 224 — nur wenn der Stick erreichbar ist (extern,
   wenn USB-Debug aus).

**Urteil für diesen Stand:** Wenn die App „Magic-Packet gesendet“ sagt,
ist der **Sendepfad intern grün**. Ob der TV aufwacht, ist **meistens
extern** (Firmware, WoL-Schalter, Gastnetz, Eco). Ob wir die **richtige
MAC** und **ob der TV schon erreichbar war**, ist intern nachziehbar.
Ohne Poll können wir intern vs. extern nicht beweisen — deshalb 301
zuerst.

---

## 1. Forschung — was wir nehmen, was wir lassen

### 1.1 Fernseher

| Quelle | Kern | Für Jarvis | Nicht |
|--------|------|------------|-------|
| HA samsungtv + Issue #107649 | WoL, dann warten; Deep-Sleep = tot; TCL „Network Standby“ | Poll `:8001/api/v2/` 2–8 s nach WoL. Zweite Packet-Salve | HDMI-CEC vom Handy, ADB-Wakelock-Hacks |
| samsungtvws / PepperDash | `wol` + `KEY_POWERON` wenn WS lebt; `KEY_POWER` = Toggle | Wenn Info-HTTP 200: `KEY_POWERON`, nicht Toggle | SmartThings-Cloud |
| Samsung Smart View WoWLAN | Power On with Mobile, wifiMac | Settings-Text ehrlich; beide MACs speichern | Eigenes Samsung-SDK |
| falk-h/tv-power | ADB aus, WoL an | Fire bleibt ADB-aus / WoL-an, getrennt | CEC über GPU |

### 1.2 Hören und Sprechen

| Quelle | Kern | Für Jarvis | Nicht |
|--------|------|------------|-------|
| [Groq Whisper Large V3 Turbo](https://console.groq.com/docs/speech-to-text) | `language=de`, ~216× Echtzeit, Vocab-`prompt` | Zweite Bahn, wenn Groq-Key da und Google-STT unsicher oder repariert | Pflicht-Cloud-STT, ElevenLabs Scribe |
| Android `SpeechRecognizer` | de-DE, 8 Alternativen, `pickHeard` | Bleibt Lane-1 offline-fähig | Ersetzen |
| LiveKit Agents / [smart-turn-v3](https://huggingface.co/pipecat-ai/smart-turn-v3) | VAD 200 ms + semantisches Satzende | Java `looksComplete` an `turn-detect.ts` angleichen. Silero-ONNX ~2 MB Could-GO | Pipecat-Server, Daily/WebRTC |
| [k2-fsa/sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx) + Piper `de_DE-thorsten` | Streaming ASR + TTS + VAD, eine Runtime | Piper als Offline-Lane **nach** Messung (Pack fehlt heute) | Wyoming-Docker, Rhasspy-Pi |
| [agjs/voicebox](https://github.com/agjs/voicebox) | faster-whisper + Piper/Kokoro, CPU | Muster: Satzgrenze → TTS, nicht ganzer Blob | Zweiter HTTP-Speech-Server |
| Edge Neural Conrad/Katja (`rany2/edge-tts`) | Deutsch, frei, schnell | **Lane-1 lassen**, Gemini-TTS-Budget 3500 ms nicht davor setzen | Azure-Key |
| Moshi / Gemini Live / OpenAI Realtime | ~200 ms Duplex | Won’t Gewichte. Loop-Idee (History = Gehörtes) ja | Zweites Hirn |
| Twilio-Pipeline / Stivers | Mund-zu-Ohr 200–300 ms natürlich, >1,5 s kaputt | Erstes Audio: Edge, nicht Gemini-Warten | 200 ms auf dem Handy versprechen |

Ist im Code: Google-STT + `repairSpeech` (`fanseher`→Fernseher). Java
`looksComplete` noch `words >= 6 \|\| length >= 24` — **divergiert** von
TS (`CLOSED_COMMAND` kennt `fernseher an`). TTS: Gemini-Schnitt 720
Zeichen, Voice-Hint **1–2 Sätze**, Algieba oft am ersten Punkt tot.
Piper/Kokoro/Silero: Schalter ohne Dateien (`quality-pack.ts`).

### 1.3 Intelligenz, die sich anfühlt (ohne zweites Gedächtnis)

| Quelle | Kern | Für Jarvis | Nicht |
|--------|------|------------|-------|
| ReAct (Yao et al.) | Thought → Act → **Observe** | Jeder Geräte-Zug: Beobachtung in die Reply und ins Working Memory | Extra-LLM wählt Tools |
| Global Workspace / 75 | Selection dann Broadcast | Pack-Claims an Parser-Agenten (75 teils CODE). Tool-Ergebnis als Arbeitszeile | Zweiter Workspace |
| A-MEM / HippoRAG | Links, 1-Hop | Schon 297–300. Nicht noch eine Graph-DB | Graphiti, cognee, Mem0, Letta/MemGPT, Chroma |
| Grounding in Voice-UX | „Ich habe X verstanden“ nur bei Repair | Nach STT-Repair ein Halbsatz, sonst still ausführen | Jeden Befehl nachplappern |
| Persona-Konsistenz (07 vs `persona.ts`) | Docs sagen Master/Sir häufig, Code „Sir höchstens einmal“, Hirn Groq | Docs an Code. Voice-Hint: Gerät 1 Satz, Erklärung 2–3 | Marvel, Duzen |
| Prefix-Cache / 52 | Statische Persona vorn | Schon `prompt-split.ts`. Working Memory hinten lassen | Semantic Redis |
| Groq `completeGroq` | SSE existiert (`streamGroq`) | Erstes Satzende → TTS, nicht auf JSON warten wo schon Token da sind | Zweiter Provider |

Was sich **dumm** anfühlt, ist selten das Modell: (1) falsches STT →
falscher Parser, (2) „Packet gesendet“ bei dunklem TV, (3) 1–2
abgehackte Sätze, (4) Working Memory max 8×160 ohne Tool-Beobachtung,
(5) Knowledge-Packs kommen bei Parser-Zügen nicht in den Prompt
(`chat.ts` `knowledgeBlock` nur ohne `deterministicRoute`).

---

## 2. Schiene `18.10.0` (Sprints 301–306, historisch `18.5.x`)

Harte Kette: **301 → 302**. 303 frei neben 302. **304 braucht 301**
(Observe-Muster). 305 Docs parallel. 306 Probe.

| Plan-Name | Sprint | Landet in | Thema |
|-----------|--------|-----------|-------|
| `18.5.0` | [301](./sprints/sprint-301.md) | **`18.10.0`** | TV-Wahrheit: Poll, MAC, zweites Packet, keine Fake-An |
| `18.5.1` | [302](./sprints/sprint-302.md) | **`18.10.0`** | Hören: Java-Satzende = TS; Groq-Whisper zweite Bahn |
| `18.5.2` | [303](./sprints/sprint-303.md) | **`18.10.0`** | Sprechen: Edge zuerst, Gemini-Budget nicht vor Deutsch |
| `18.5.3` | [304](./sprints/sprint-304.md) | **`18.10.0`** | Intelligenz-Gefühl: Observe, Working Memory, Voice-Hint |
| `18.5.4` | [305](./sprints/sprint-305.md) | **`18.10.0`** | Docs + Code aufräumen |
| `18.5.5` | [306](./sprints/sprint-306.md) | **`18.10.0`** | Härten, Gold, Meilenstein |

Kein Sideload-Downgrade auf `18.5.0`. 282 bleibt
versionCode-*Schema*-Freeze, kein APK-Verbot. Combined delivery:
eine Version **`18.10.0`**, nicht `18.10.5`.

---

## 3. Docs aufräumen (305)

Nicht 90 Dateien löschen — das ist das Protokoll. **Index stärken,
Widersprüche schließen, Ziehen verhindern.**

### Behalten als Verfassung

`01` Vision, `02` Architektur, `03` Prozess, `07` Persona (Inhalt an
Code), `09` Versioning, `10` Intelligence, `42` Index, `66` Agenten-Ist,
`69` Modell-Grenzen, `apk.md`, `CHANGELOG.md`, letzte `TEST-18.4.4.md`.

### Historisch — Banner, nicht löschen

`12` NAS, `14` (Won’t Fire TV ist falsch), `16` Gemini-Hauptweg veraltet,
`32`/`52`/`67` als Protokoll mit „Grundlage Version X“, alle `*-next`
vor 70, `TEST-15`–`TEST-18.1`, Sprints 00–270 als Log.

### Widersprüche schließen (Inhalt)

| Doc | Ist | Soll |
|-----|-----|------|
| `07-persona.md` | Gemini zuerst, Master/Sir häufig | Groq primär; Sir selten wie `persona.ts` |
| `08-open-questions.md` | Gemini-Hauptweg, alte Versionen | Neu verankern auf `18.4.4` oder auf „historisch“ setzen |
| `14-quality-tv.md` | Won’t Fire TV / Apps | Banner: Fire und Apps sind CODE |
| `42-planned.md` | Kopf `17.0.0` | Live `18.4.4`, nächste Schiene 18.5 |
| Dual `46-next` / `46-test-650`, `62-next` / `62-agent-catalog` | Zwei Dateien | Eine kanonisch, die andere eine Zeile Verweis |
| Lücke `15-*.md` | fehlt | Kein Füll-Doc. In README „keine 15“ |

### Löschen — nur wenn tot und unreferenziert

Keine Massenlöschung in 305. Could: doppelte Kurz-`*-next` die nur
„siehe CHANGELOG“ sind, **nach** Verweis-Check. Sprint-Dateien bleiben.

### Neu

Dieses Doc + Sprints 301–306. Optional `docs/HISTORISCH.md` (eine Seite:
was man nicht mehr zieht).

---

## 4. Code aufräumen (305)

| Stück | Aktion |
|-------|--------|
| Java `looksComplete` | **302**, nicht nur Hygiene |
| `wifiMac` doppelter Fallback | **301** |
| `pin-bubble-backdrop` CSS ohne JSX | Streichen oder wieder einbauen — nicht beides |
| `routeRegistry` | leben hinter `agent_network_v2: false`; Kommentar „Rollback only“ |
| `brain_shadow_mode` | tot lassen oder Settings-Zeile ehrlich „Vergleich aus“ |
| ONNX-Schalter ohne Datei | Copy bleibt „fehlt“; keine Fake-Ready |
| `wllama-smoke.ts` | Dev, nicht Produkt |
| Parser-Duplikate | keine — `heard.ts` importiert zum Scoren |

---

## 5. Won’t in `18.5`

- HDMI-CEC, SmartThings, zweites Hirn, Moshi-Gewichte, Pipecat-/Wyoming-Server als Pflicht.
- Qdrant, e5 in `pickRoute`, LLM-Organizer, Graphiti, cognee, Mem0, Letta, cytoscape.
- RT-API / Scrape. OMDb bleibt.
- Piper/Kokoro/e5 **in die APK bündeln** ohne Messung (Could nach 306).
- Docs-Massenlöschung. NAS wieder Hirn. Play Store, iOS.
- `KEY_POWER` als „an“ ohne dass `:8001` tot war (Toggle würde einen
  laufenden TV ausmachen).

---

## 6. Konkrete Upgrades — Reihenfolge

Nutzen pro Aufwand, nicht Wunschkonzert. 67 und 52 bleiben gültig, wo
nicht erledigt (Abort bis Handler, Silero-Datei).

| Prio | Hebel | Wirkung | Sprint |
|------|-------|---------|--------|
| 1 | TV beobachten nach WoL | Intern vs. extern beweisbar; fühlt sich wahr an | 301 |
| 2 | STT: Java = TS; Groq-Whisper+de+Vocab | „Fernseher an“ kommt an; weniger falscher Parser | 302 |
| 3 | Edge-TTS vor Gemini-Warten | Erstes Audio ~0,4–0,8 s statt bis 3,5 s | 303 |
| 4 | Observe + Working-Memory-Zeile nach Tool | Wirkt klug: merkt, was er getan hat | 304 |
| 5 | Voice-Hint Gerät vs. Erklärung | Bessere Sätze, nicht längeres Waffle | 304 |
| 6 | Knowledge-Broadcast in Parser-Zügen (Allowlist) | 75-Rest: Film/Kalender sehen Packs | 304 |
| 7 | Docs-Banner + Persona-07 | Weniger falsche Pläne | 305 |
| 8 | Silero ~2 MB GO | Weniger Abschneiden in der Stille | Could nach 306 |
| 9 | Piper offline | Mund ohne Netz | Could |
| 10 | GUI-Reste aus Lage-PR | Tabs-Icons, Pin am Punkt, Netz größer | nicht diese Schiene |

Latenz-SLO bleibt `latency.ts`: ≤350 gut, ≤800 ok. Ziel Stimme:
**erstes hörbares Wort < 800 ms** nach Satzende auf WLAN, Edge-Lane.

---

## 7. Fokus Intelligenz

Nicht ein größeres Netz. Drei Schichten, die Menschen als „er kapiert
es“ lesen:

1. **Hören** — der richtige Satz kommt im Parser an (302).
2. **Tun und nachsehen** — Gerätezug endet mit Zustand, nicht mit
   Hoffnung (301, 304).
3. **Behalten** — letzte Aktion und Repair in 8 Working-Memory-Zeilen;
   Packs dürfen Parser-Züge sehen, wenn 75 die Allowlist schon hat.

Groq bleibt Smalltalk-Hirn. 0,5B wählt weiter keine Tools.

---

## 8. Probe (nach 306)

```
Einstellungen → Fernseher an, suchen, koppeln.
Fernseher an
```

Erwartung: entweder „ist an“ nach Poll, oder ehrlich „Packet raus, TV
antwortet nicht — WOL am Gerät, gleiches WLAN“. Kein dritter Fall
„gesendet“ als Erfolg.

```
fanseher an
Mach den Fernseher an
```

Parser tv, nicht Film.

```
Was lag als letztes am Fernseher?
```

Working-Memory-Zeile, kein Raten.

Sprache: ein Befehl, dann eine Erklärung (Wetter in zwei Sätzen). Mund
Edge, nicht 3 s Stille vor Algieba.
