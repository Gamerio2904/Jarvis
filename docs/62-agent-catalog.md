# 62 — Agenten-Katalog (Route → Agent → Cluster)

Stand: Plan **`14.0`**. Jede Zeile = **eine** Domänen-Fähigkeit, die in 14.9 als `AgentSpec` existieren **muss**. Route-ID bleibt stabil (Parser-Tests, Hausstand, Debug).

Legende: **Int** = interner Agent (kein User-Chat). **Front** = Jarvis/Friday only.

---

## Cluster: Geräte (`geraete`)

| Route | Label DE | Organ | sideEffect | Heute `handle` |
|-------|----------|-------|------------|----------------|
| `tv` | Fernseher | hand, mouth | device | `tv.ts` |
| `fan` | Ventilator | hand | device | `fan.ts` |
| `plug` | Steckdose | hand | device | `plug.ts` |
| `device` | Gerät (Uhr/Akku/Taschenlampe) | hand | device | `device.ts` |
| `amazon` | Amazon Music | hand | device | `amazon.ts` |
| `app` | App starten | hand | write | `app.ts` |

## Cluster: Medien (`medien`)

| Route | Label DE | Organ | sideEffect | Heute `handle` |
|-------|----------|-------|------------|----------------|
| `film` | Film / Streaming | mouth, eye | read | `film.ts` |

## Cluster: Navigation (`navigation`)

| Route | Label DE | Organ | sideEffect | Heute `handle` |
|-------|----------|-------|------------|----------------|
| `drive` | Fahrmodus / Route | hand, eye | device | `drive.ts` |
| `maps` | Karten / Anruf / SMS | hand | read | `places.ts` |
| `here` | Standort | eye | read | `here.ts` |
| `fuel` | Tanke | eye | read | `fuel.ts` |
| `poi` | POI / Bar / Öffnungszeiten | eye | read | `poi.ts` |
| `transit` | Bahn / ÖPNV | eye | read | `transit.ts` |
| `taxi` | Taxi | hand | read | `taxi.ts` |
| `leave` | Losgehen | hand | read | `leave.ts` |
| `blitzer` | Blitzer / Baustelle | eye | read | `blitzer.ts` |
| `hud` | Lage / Kugel / Körper | eye | write | `hud.ts` |
| `trace` | Traceroute | brain | read | `trace.ts` |

## Cluster: Alltag (`alltag`)

| Route | Label DE | Organ | sideEffect | Heute `handle` |
|-------|----------|-------|------------|----------------|
| `calendar` | Kalender | memory, hand | write | `calendar.ts` |
| `alarm` | Wecker | hand | write | `alarms.ts` |
| `timer` | Timer | mouth, hand | write | `timers.ts` |
| `reminder` | Erinnerung | memory | write | `reminders.ts` |
| `todo` | Todos / Notizen | memory | write | `tools.ts` |
| `brief` | Tageslage | memory | read | `brief.ts` |
| `birthday` | Geburtstag | memory | write | `birthday.ts` |
| `holiday` | Feiertag | memory | read | `holiday.ts` |
| `ferien` | Schulferien | memory | read | `ferien.ts` |
| `shopping` | Einkaufsliste | hand | write | `shopping.ts` |
| `home` | Zuhause-Routine | memory | write | `home.ts` |
| `watch-price` | Preiswache | brain | write | `watch-price.ts` |
| `chat-folder` | Chat-Ordner | brain | write | `folders.ts` |

## Cluster: Information (`information`)

| Route | Label DE | Organ | sideEffect | Heute `handle` |
|-------|----------|-------|------------|----------------|
| `weather` | Wetter | eye, brain | read | `weather.ts` |
| `news` | Nachrichten | brain | read | `news.ts` |
| `outlook` | Weltlage | brain | read | `outlook.ts` |
| `search` | Chatsuche | brain | read | `search-chat.ts` |
| `warn` | Unwetter | brain | read | `warn.ts` |
| `fx` | Wechselkurs | brain | read | `fx.ts` |
| `sport` | Sport | brain | read | `sport.ts` |
| `sky` | Himmel (ISS/Mond) | eye | read | `sky.ts` |
| `nature` | Natur | eye | read | `nature.ts` |
| `flights` | Flüge | eye | read | `flights.ts` |
| `food` | Lebensmittel | brain | read | `food.ts` |
| `library` | Buch | brain | read | `library.ts` |
| `law` | Gesetz / Grillen | brain | read | `law.ts` |
| `haushalt` | Haushalt | brain | read | `haushalt.ts` |
| `sensors` | Sensoren | hand | read | `sensors.ts` |
| `chess` | Schach | brain | read | `chess.ts` |
| `digest` | Gespräch zusammenfassen | brain | write | `digest.ts` |

## Cluster: Gedächtnis & Lernen (`wissen`)

| Route | Label DE | Organ | sideEffect | Heute `handle` |
|-------|----------|-------|------------|----------------|
| `memory` | Gedächtnis schreiben/lesen | memory, brain | write | `memory.ts` |
| `recall` | Recall | memory | read | `recall` via retrieve |
| `teach` | Fachwissen anlegen | brain | write | `knowledge.ts` |
| `pack` | Fachwissen abfragen | brain | read | `knowledge.ts` |

## Cluster: Werkstatt (`werkstatt`)

| Route | Label DE | Organ | sideEffect | Heute `handle` |
|-------|----------|-------|------------|----------------|
| `pc` | PC steuern | pc_hand, pc_eye | device | `pc.ts` |
| `eye` | Auge / Foto | eye | read | `eye.ts` |
| `doc` | Datei | eye, hand | read | `doc.ts` |
| `desk` | Tisch / Ground | eye, pc_eye | read | `desk.ts` |

## Cluster: System (`system`)

| Route | Label DE | Organ | sideEffect | Heute `handle` |
|-------|----------|-------|------------|----------------|
| `backup` | Hausstand Export/Import | brain | read | `backup.ts` |
| `face` | Jarvis / Friday | mouth | write | `face.ts` |
| `wont` | Won't-Liste | brain | read | `wont-parse.ts` |

## Front-only (kein Domänen-Agent)

| Pfad | Label | Heute |
|------|-------|-------|
| `help` | /hilfe | `guards.ts` |
| `identity` | Wer bist du | `chat.ts` |
| `greeting` | Smalltalk Begrüßung | `greeting.ts` |
| `research` | Live-Lookup LLM | `chat.ts` + `research-parse.ts` |

## Interne Agenten (Int)

| ID | Label | Module |
|----|-------|--------|
| `router` | Router | `route-pick.ts`, `policy.ts`, `conflicts.ts` |
| `curator` | Wissensmeister | `memory-gate.ts`, `sleep-memory.ts`, `knowledge-harvest.ts` |
| `recall-engine` | Abruf | `retrieve.ts` |
| `verify` | Verify | `action-fsm.ts` |
| `director` | Director | `chat.ts` → `director.ts` |
| `turn-gate` | Turn-Gate | `turn-gate.ts` |
| `brain-picker` | Hirn-Wahl | `brain-pick.ts` |
| `chain` | Ketten-Split | `chain.ts` |
| `latency` | Latenz | `latency.ts` |
| `body-snap` | Körper-Snap | `body-snap.ts` |
| `research-guard` | Quellen-Gate | `research-parse.ts` |

**Summe Domänen:** **60** Einträge in `agents/parse-catalog.ts` (die Tabelle oben zählt den Planungsstand 52). Davon haben **59** einen Executor; `identity` parst nur und wird vor dem Director in `chat.ts` beantwortet. Gegenprobe: `npm run test:agents-robust` vergleicht Katalog, `EXECUTOR_IDS` und die Namen im Konflikt-Tisch.  
**Summe intern:** 11 (plus `director` = 12).
