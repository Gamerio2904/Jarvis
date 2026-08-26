# 32 — Tool-Register (`2.3`–`2.6`) **PLAN**

PO 2026-08-26: Routing umbauen. Alles was Jarvis kann (Kalender, Wetter, TV, …) liegt in einem **Register**. Die Wahl ist eine **Score-Policy**, keine If-Kette und keine Cosine-Formel.

Reihe davor: [`30-next.md`](./30-next.md) (`2.2.2` Sideload).  
Reihe danach: [`31-next.md`](./31-next.md) Alltag & Welt — **verschoben auf `2.7`–`2.23`**. DWD erst nach dem Register, sonst wächst die Kette weiter.

Bau erst auf PO-Kommando, erste Lieferung **`2.3.0`**. Eine Sideload-Stufe pro Version.

## Warum jetzt

Heute entscheidet `routeDeterministic` in `chat.ts` per **Reihenfolge**: wer zuerst `handled: true` sagt, gewinnt. Parse und Execute stecken in einem Schritt. Die Policy liegt unsichtbar in der Kette (TV vor Film, Kalender vor Wetter, …).

Das trägt ~30 Tools. Es trägt **nicht** 17 weitere aus der Welt-Reihe. Ein neues Tool heißt heute: Parser, Handler, und die richtige Stelle in der Kette — sonst klaut es „lauter“ oder „was steht an“.

## Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Register | Ja. Ein Katalog, ein Vertrag, ein Eintrag pro Fähigkeit. |
| „Mathematisch“ | **Score-Policy**, kein Embedding, kein geschlossenes Gleichungssystem. |
| Auswahl | Erst alle Parser **vorschlagen**, dann **eines** wählen, dann **ausführen**. |
| Schicht 0 | Confirm, Ordinal, Follow-up, Pending — **nicht** scoren. Zustand schlägt Similarity. |
| On-Device 0,5B | Wählt **keine** Tools. LLM nur Sprache, wenn niemand scored. |
| Gemini | Darf später Zweitmeinung sein. Primärrouter bleibt lokal. |
| Neue Tools | Ab `2.6.0` nur noch über das Register. Kein Eintrag in die If-Kette. |
| Welt-Reihe | `31-next.md` rutscht auf `2.7`–`2.23`. Register ist Voraussetzung, kein Parallelgleis. |

## Ist → Soll

```text
IST                                      SOLL
Äußerung                                 Äußerung
  → Help / Pending / Ordinal               → Schicht 0: Gates (hart)
  → TV.handled? execute                    → Schicht 1: alle Parser → Kandidaten
  → Film.handled? execute                  → Schicht 2: Policy (Score, Prior, Kosten)
  → … 30× first-match                        klar     → execute
  → LLM                                      knapp    → eine Rückfrage
                                             niemand  → LLM (kein Gerät)
```

Praktische Regel (kein Forschungstheater):

```text
Punkte(t) = Parser-Score(t)
          + Prior(t | last_tool, Fahrmodus, Gerät gekoppelt)
          − Kosten(t)          // Gerät/SMS teurer als Auskunft
wählen = argmax, aber nur wenn Abstand zur Nr. 2 ≥ Schwelle
sonst nachfragen
```

Parser-Score 0–1 aus Trefferqualität (Phrase stark/schwach, Slots voll/leer). Kein Embedding-Modell auf dem Handy.

## Reihenfolge

| Version | Inhalt | Status |
|---------|--------|--------|
| **`2.3.0`** | Vertrag + Register + Parse/Execute trennen. Pilot: Wetter, Kalender, TV. Rest noch alte Kette. | **PLAN** |
| **`2.4.0`** | Score-Policy, Konflikttabelle, `last_step`-Prior, Kosten. Pilot läuft über Policy. | **PLAN** |
| **`2.5.0`** | Alle bestehenden Tools im Register. `routeDeterministic`-Kette tot. Gold-Set. | **PLAN** |
| **`2.6.0`** | Nachfrage bei Gleichstand. Eval-Scorecard. Neue Fähigkeit = neuer Register-Eintrag. | **PLAN** |
| **`2.7.0`** | Erste Welt-Fähigkeit (DWD) — [`31-next.md`](./31-next.md) | **PLAN** (nach Register) |

Sprint-Kickoff: [`sprint-106.md`](./sprints/sprint-106.md).

## Vertrag (ein Eintrag)

Jeder Handler exportiert dasselbe. Kein Sonderweg in `chat.ts`.

| Feld | Pflicht | Bedeutung |
|------|---------|-----------|
| `id` | ja | `weather`, `calendar`, `tv`, … — gleich `last_step_tool` |
| `label` | ja | Kurz für UI/Debug: `Wetter` |
| `sideEffect` | ja | `read` \| `write` \| `device` |
| `needsConfirm` | ja | z. B. Anruf/SMS/Todo-anlegen |
| `parse(text, ctx)` | ja | `{ score, intent, slots } \| null` — **kein Netz, kein Gerät** |
| `execute(intent, ctx)` | ja | erst nach der Wahl |
| `canFollowUp(lastStep)` | ja | „lauter“, „das zweite“, „morgen auch“ |
| `examples` | ja | 5–15 Gold-Sätze (positiv + Negativ) |

`ctx` (klein, diskret — kein 384-D-Vektor):

| Feld | Beispiel |
|------|----------|
| `last_tool` | `tv` |
| `last_medium` | `spotify` |
| `pending` | Confirm-Tool |
| `in_drive` | ja/nein |
| `has_geo` | Freigabe da |
| `last_list` | Ordinal-Liste |

## Drei Schichten

### 0 — Gates (müssen gewinnen)

Nicht scoren, nicht parallelisieren.

| Gate | Beispiel | Grund |
|------|----------|--------|
| Help | `/hilfe` | Katalog, kein Tool |
| Pending Confirm | `Ja` nach „Todo anlegen?“ | Sonst gewinnt TV-OK oder Smalltalk |
| Pending PC/Maps | laufender Dialog | Zustand |
| Follow-up-Rewrite | `lauter` / `stopp` / `und um acht` | Bezug auf `last_step` |
| Ordinal | `das zweite` | Liste oder letztes Tool |

Danach: `splitIntents` wie heute (zwei Tool-Sätze an „und“). Policy **pro Klausel**, nicht über den ganzen Satz.

### 1 — Vorschlagen

Alle `parse()` parallel. Wer `null` liefert, ist raus. Niemand darf hier TV schalten oder Wetter laden.

`here` (Standort-Gate) bleibt Adapter: es scored nicht als User-Tool, sondern füllt `has_geo` / startet Freigabe. Retry (Tanke/Wetter/POI/Bahn) geht an die Policy, nicht als versteckte If-Kette in `chat.ts`.

### 2 — Policy

1. Score < 0,45 → ignorieren.  
2. Prior: `last_tool` nur bei Follow-up-artigem Satz, nicht bei jedem Turn.  
3. Kosten: `device` > `write` > `read`. Bei knappem Abstand gewinnt das billigere, oder Nachfrage.  
4. Abstand Nr. 1 zu Nr. 2 < 0,12 → **eine** Rückfrage, kein Raten.  
5. Sonst execute Nr. 1.

Schwellen in `2.4.0` festlegen, in `2.6.0` an Gold-Set justieren — nicht aus dem Bauch.

## Konflikttabelle (Must, nicht Cosine)

Bekannte Überschneidungen als Daten, nicht als Hoffnung.

| Äußerung | Gewinner | Verlierer | Regel |
|----------|----------|-----------|--------|
| `lauter` / `leiser` | `last_medium` (TV oder Spotify) | der andere | Gate 0, sonst Nachfrage |
| `stopp` | letztes Medium / Timer / Wecker | — | Gate 0 |
| `ja` / `ok` | Pending Confirm; nach TV: Pad | Smalltalk | Gate 0 |
| `das zweite` | Ordinal des letzten Tools | neues Tool | Gate 0 |
| `was steht morgen an` | `brief` wenn Tageslage, sonst `calendar` | `weather` | Brief vor Kalender vor Wetter, außer Wetterwort |
| `erinner mich …` | `reminder` | `todo`, `calendar` | Kalender nur mit klarem Terminslot (Datum+Uhr+Titel) |
| `Wetter` + Ort | `weather` | `here` | here nur bei Standortfrage |
| Film-/Serientitel | `film` / `tv` | `search` | TV nur mit Steuerwort oder letztem TV-Schritt |
| `Tanke` | `fuel` | `poi`, `drive` | fuel vor generic POI |
| `Fernseher YouTube` | `tv` | `film` | Gerät vor Lookup, außer „wo läuft …“ |
| `Guten Morgen` | LLM / `brief` nur bei Lage-Frage | alle Geräte | Smalltalk-Schutz |

Neue Kollision = neue Zeile + Gold-Satz. Kein stilles Umsortieren der Kette.

## Pilot `2.3.0` (drei Tools)

Warum genau die: **Auskunft** (Wetter), **Schreiben** (Kalender), **Gerät** (TV). Dazu Follow-ups und echte Kollisionen.

| Tool | Parse bleibt | Neu |
|------|----------------|-----|
| `weather` | `weather-parse.ts` | `parse` liefert Score, `handleWeather` nur noch `execute` |
| `calendar` | `calendar-parse.ts` | dito |
| `tv` | `tv-parse.ts` | dito; Execute erst nach Policy |

Solange der Rest in der alten Kette liegt: Pilot **vor** der Kette vorschlagen. Treffer mit Score ≥ Schwelle → Register. Sonst alte Kette. Kein Doppelfeuer.

## Alle Tools (`2.5.0`)

Inventar (Stand `2.2.2`) — jeder Eintrag muss durch denselben Vertrag.

| Klasse | IDs |
|--------|-----|
| Gerät | `tv`, `fan`, `plug`, `pc`, `device`, `drive` |
| Zeit | `calendar`, `alarm`, `timer`, `reminder`, `holiday`, `brief` |
| Listen | `todo`/`notes`, `shopping`, `birthday`, `memory` |
| Ort | `here`, `fuel`, `poi`, `transit`, `places`, `home`, `leave` |
| Lage | `weather`, `news`, `film`, `eye` |
| Meta | `search` (Chatsuche), Research bleibt Opt-in nach Deterministik |

`help`, Ordinal und Confirm sind Gates, keine Katalog-Tools.

## Gold-Set & Probe

Ohne Eval verfault jeder Router. Gold-Set ab `2.3.0` (Pilot), vollständig `2.5.0`.

| Sorte | Beispiele |
|-------|-----------|
| Klar | `Wetter heute`, `Termin morgen 9 Uhr Zahnarzt`, `Fernseher lauter` |
| Follow-up | nach Wetter: `und morgen`; nach TV: `ok`; nach Todo: `ja` |
| Kollision | `was steht morgen an`, `lauter`, `erinner mich um 8 Kaffee` |
| Smalltalk | `Hallo Jarvis.`, `Guten Morgen` — **kein** Gerät |
| Zwei Klauseln | `Wetter und Kalender` — zwei Executes, nicht eines |
| Negativ | `Wie spät ist es?` nicht Wetter; `kein Kaffee mehr` = Einkauf nicht Kalender |

**Probe je Version (wenn CODE):**

1. Pilot-/Register-Fälle aus der Tabelle — richtiger Treffer, kein Doppelfeuer.  
2. Regression: `Wetter heute`, `Steckdose an`, `Wie spät ist es?`, `kein Kaffee mehr`, `Guten Morgen`, Fahrmodus-Lautstärke = Spotify, TV `das zweite`.  
3. Falsches Gerät bei Unsicherheit: nachfragen, nicht schalten.  
4. `/hilfe` bleibt ehrlich; Register ist unsichtbar für den Nutzer.

## Dateien (Ziel)

| Datei | Rolle |
|-------|--------|
| `frontend/src/engine/registry.ts` | Katalog: Einträge registrieren, `get(id)`, `all()` |
| `frontend/src/engine/propose.ts` | Schicht 1: `parse` aller Einträge, sortiert |
| `frontend/src/engine/policy.ts` | Schicht 2: Schwellen, Prior, Kosten, Nachfrage-Text |
| `frontend/src/engine/conflicts.ts` | Konflikttabelle als Daten |
| `frontend/src/engine/registry-gold.ts` | Gold-Sätze; Script/Eval darf sie lesen |
| `frontend/src/engine/chat.ts` | Nur noch: Gates → propose → policy → execute → LLM |

Parser-Dateien (`*-parse.ts`) bleiben. Handler verlieren die „if intent then work“-Mischung: Intent raus aus `handleX`, rein in `parse`.

## Verbesserungen gegenüber der Roh-Idee

| Roh | Hier |
|-----|------|
| „Mathematisch berechnen welches Tool“ | Argmax mit **Margin + Kosten + Zustand** |
| Alles in eine Bibliothek und fertig | Bibliothek = Katalog. Wahl = Policy. Gates extra. |
| Ein Score über den ganzen Satz | Score **pro Klausel** nach `splitIntents` |
| Embedding / Cosine | Nein. 30 Parser sind billiger und ehrlicher. |
| LLM sucht das Tool | 0,5B nicht. Gemini höchstens Zweitmeinung nach `2.6`. |
| First-match wie bisher, nur hübscher | Parse und Execute **getrennt**, sonst gibt es nichts zu wählen |

## Chat (Zielbild)

| Version | Beispiel | Soll |
|---------|----------|------|
| `2.3.0` | `Wetter heute` / `Termin morgen 9 Zahnarzt` / `Fernseher Pause` | wie heute, aber über Register-Pilot |
| `2.4.0` | `lauter` nach Spotify | Spotify, nicht TV |
| `2.4.0` | `was steht morgen an` | Tageslage oder Kalender, kein Wetter |
| `2.5.0` | `kein Kaffee mehr und Timer 8 Minuten` | Einkauf **und** Timer |
| `2.6.0` | unklarer Satz, zwei hohe Scores | eine Rückfrage: `Wetter oder Kalender?` |

Nutzer merkt das Register nicht. Er merkt: weniger falsches Gerät, ehrliche Nachfrage statt Rate-TV.

## Won’t

Embeddings/Semantic-Router als Primärwahl. Tool-RAG. Function-Calling mit 0,5B. Gemini als einziger Router. Alle 30 Handler in `2.3.0` umziehen. Welt-Tools (DWD, Ferien, …) **vor** `2.6.0`. Alexa, Cloud-Kalender-OAuth, Play Store, iOS.
