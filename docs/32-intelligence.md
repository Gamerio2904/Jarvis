# 32 — Intelligenz (`3.0`) **CODE**

PO 2026-08-26: Jarvis **3.0** macht die Wahl schärfer. Fähigkeiten liegen in einem Register. Die Wahl ist eine Score-Policy, keine If-Kette und kein Embedding. Dazu: Härten des Bisherigen und die Welt-Reihe aus [`31-next.md`](./31-next.md), mitgeliefert.

Reihe davor: [`30-next.md`](./30-next.md) (`2.2.2`). App-Code: **`3.0.0`**.

## Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Major | `3.0.0` = Intelligenz. Fokus: besser verstehen, welches Tool gilt. |
| Register | Katalog + Vertrag. Parse vor Execute. |
| Wahl | Score-Policy mit Prior, Kosten, Konflikttabelle. Bei Gleichstand eine Rückfrage. |
| 0,5B | Wählt keine Tools. LLM nur Sprache. |
| Neue Tools | Nur Register-Eintrag, kein `if` in `chat.ts`. |
| Welt | `3.1`–`3.17` Inhalte **CODE**, mitgeliefert in `3.0.0`. |

## Ist → Soll (geliefert)

```text
Äußerung
  → Schicht 0: Gates (Help, Confirm, Ordinal, Follow-up, Pending)
  → Schicht 1: alle Parser → Kandidaten (`route-pick.ts`)
  → Schicht 2: Policy (`policy.ts` + `conflicts.ts`)
       klar     → execute (`registry.ts`)
       knapp    → eine Rückfrage
       niemand  → LLM
```

## Versionen

| Version | Inhalt | Status |
|---------|--------|--------|
| **`3.0.0`** | Register, Policy, Konflikte, Nachfrage, bestehendes härten | **CODE** |
| **`3.1.0`** | Unwetter / DWD | **CODE** (in `3.0.0`) |
| **`3.2.0`** | Schulferien DE | **CODE** (in `3.0.0`) |
| **`3.3.0`** | Wechselkurse EZB / Frankfurter.app | **CODE** (in `3.0.0`) |
| **`3.4.0`** | Research: Wikipedia + Destatis zuerst | **CODE** (in `3.0.0`) |
| **`3.5.0`** | Stimme: neue Fakten in ganzen Sätzen (vorhandenes TTS) | **CODE** (in `3.0.0`) |
| **`3.6.0`** | Open Food Facts | **CODE** (in `3.0.0`) |
| **`3.7.0`** | Open Library | **CODE** (in `3.0.0`) |
| **`3.8.0`** | Bundesliga OpenLigaDB | **CODE** (in `3.0.0`) |
| **`3.9.0`** | Weitere Ligen, gleiche Schiene | **CODE** (in `3.0.0`) |
| **`3.10.0`** | Pflanzen iNaturalist | **CODE** (in `3.0.0`) |
| **`3.11.0`** | Himmel: ISS, Mond lokal | **CODE** (in `3.0.0`) |
| **`3.12.0`** | Tiere iNaturalist | **CODE** (in `3.0.0`) |
| **`3.13.0`** | Flüge OpenSky | **CODE** (in `3.0.0`) |
| **`3.14.0`** | Recht: Text + Link, kein Rat | **CODE** (in `3.0.0`) |
| **`3.15.0`** | Haushalt / Waschsymbole ISO 3758 | **CODE** (in `3.0.0`) |
| **`3.16.0`** | Sensoren: ehrlich ohne Pedometer | **CODE** (in `3.0.0`) |
| **`3.17.0`** | Schach im Chat | **CODE** (in `3.0.0`) |

Sprint: [`sprint-106.md`](./sprints/sprint-106.md). Welt-Details: [`31-next.md`](./31-next.md).

## Dateien

| Datei | Rolle |
|-------|--------|
| `route-types.ts` | `RouteCtx`, Kandidat |
| `route-pick.ts` | Schicht 1, nur Parser |
| `policy.ts` | Schwellen, Kosten, Nachfrage |
| `conflicts.ts` | Überschneidungen |
| `registry.ts` | Execute + Gates Pending |
| `chat.ts` | Gates, dann `routeRegistry` |

## Probe

1. `Wetter heute`, `Termin morgen 9 Zahnarzt`, `Fernseher an` — Register.  
2. `kein Kaffee mehr` — Gedächtnis, nicht Einkauf.  
3. `Fahr mich zur Freundin` — Fahrmodus, nicht Karte.  
4. `lauter` nach Spotify — Spotify.  
5. `Gibt’s Unwetter?`, `Was ist der Dollar?`, `Schach neu`.  
6. Regression: `Steckdose an`, `Wie spät ist es?`, `Guten Morgen`, `das zweite`.  
7. `/hilfe` nennt Version `3.0.0`.

## Won’t

Embeddings als Primärwahl. Function-Calling mit 0,5B. Gemini als einziger Router. Alexa, Cloud-Kalender-OAuth, Play Store, iOS.
