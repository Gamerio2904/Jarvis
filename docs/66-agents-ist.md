# 66 — Agenten-Netzwerk: Ist-Stand (Code `17.0.0`)

> Dieses Dokument beschreibt, **was der Code tut** — nicht was geplant war.
> [`62-next.md`](./62-next.md) ist das Planungsdokument zu 14.0; wo die Namen
> dort von der Umsetzung abweichen, gilt diese Datei.

## 1. Ein Zug von vorne nach hinten

```text
chat.streamChat
  → startLatency() + openHistoryTurn(text)     (Zeit und Historie öffnen)
  → normalizeUtterance + splitIntents          (chat.ts, mehrteilige Sätze)
  → routeDeterministic
  → runDirectorTurn(conversationId, text)      (director.ts)
       1. beginAgentTurn()                     Zug-Nummer, Traces leer,
                                               alter Zug wird abgebrochen
       2. curatorPreflight()                   Gedächtnis-Pflege, Budget 2,5 s
       3. getPending()                         offene Rückfrage schlägt alles
       4. decideTurn(ctx)                      → { pick, candidates, ctx }
       5. runAgent(pick.id, ctx)               Budget + Wiederholung + Schalter
       6. applyRetry(hit)                      fuel/weather/poi/transit
       7. rescueByProposal(ctx)                nur wenn Schritt 4 nichts fand
  → wenn kein Treffer: BrainOrchestrator (Groq → Gemini → 0,5 B)
  → sayAssistant() + finishLatency()           Antwort, Zeit, Zug versiegelt
```

Der Director sieht **immer einen einzelnen Intent**. Das Aufteilen mehrteiliger
Sätze passiert vorher in `chat.ts` (`splitIntents` + `partitionChain`).

Neu seit `17.0.0` sind die Schritte **4** (`decideTurn` statt
`decideRouteFromCtx`, siehe §2) und **7** (Werkzeug-Vorschlag, siehe §9), sowie
das Öffnen und Versiegeln des Zuges für die Historie (§4).

## 1b. Wer organisiert — und wer nicht

Es gibt **keinen** Katalog-Agenten, der andere Agenten per Prompt ein- und
ausschaltet. Die Organisation ist absichtlich auf vier **deterministische**
Teile plus einen Kurzschluss verteilt. Begründung und Won’t: [`70-next.md`](./70-next.md) §0b.

| Wer | Wann er greift | Was er darf | Was er nicht darf |
|-----|----------------|-------------|-------------------|
| `chat.routeDeterministic` | **vor** dem Director | Hilfe, Identität, Begrüßung, offene Geräte-Rückfragen (Maps/PC/Taxi), Ketten-Nachlauf | keinen Katalog-Score, keine Geräte ohne Pending |
| **Director** `runDirectorTurn` | Default (`agent_network_v2`) | einen Agenten pro Zug wählen und ausführen, Vorschlag einschleusen, Schreiben/Geräte bei Fehler **nicht** ans Modell geben | parallele Agenten, freie Modell-Tools |
| **Router** `decideTurn` | im Director Schritt 4 | Parser-Score, Konflikte, Kosten, Verb-nach-vorn | LLM-Tiebreak (das war Sprint 257, Tor hat gehalten) |
| **Bus** `agentDispatch` | im Director Schritt 5 | Budget, eine Wiederholung nur beim Lesen, Sicherungsschalter | Zustand schreiben nach Abbruch (Signal in `turn-abort.ts`) |
| **Curator** | Director Schritt 2 | Gedächtnis pflegen (2,5 s), Writes über `decideGate` | Routing, Geräte |
| **BrainOrchestrator** | nur wenn Director `hit == null` | Groq / Gemini / 0,5B wählen | Agenten starten, Tools ausführen |
| **Werkzeug-Vertrag** | Director Schritt 7, nur `looksCommandish` | ein JSON-Schema vorschlagen | ausführen — das tut der Parser am kanonischen Satz |

`identity` hat seit `17.0.0` einen Executor **und** den Kurzschluss in
`chat.ts`. Der Kurzschluss gewinnt. Das ist kein toter Executor: wenn der
Flag-Pfad `agent_network_v2: false` den Registry-Weg nimmt, antwortet der
Katalog. Zusammenlegen nur, wenn ein Bug aus der Doppelung kommt — heute
keiner.

Intern (`router`, `curator`, `propose`) erscheinen in Traces und in der
Agenten-Karte, sind aber **keine** `AgentSpec`-Zeilen. Die Karte liest
`parseCatalog()` (60 Domänen).

**Nicht bauen:** ein fünfter LLM-Organizer, AgentGrid-Rollen, parallele
Domänen-Agenten in einem Zug.

## 2. Routing-Rechnung

Eine Entscheidung entsteht in vier Schritten, alle in `route-pick.ts:propose`:

| Schritt | Ort | Wirkung |
|---------|-----|---------|
| `parse` | `agents/parse-catalog.ts` | jeder Agent liefert `parserScore(text, extra)` oder `null` |
| `applyConflicts` | `conflicts.ts` | bekannte Überschneidungen: `drop` entfernt, `boost` hebt |
| `withPrior` | `policy.ts` | `+0.14` für den letzten Agenten, wenn die Äußerung ein Nachlauf ist |
| `withCost` | `policy.ts` | `read −0`, `write −0.02`, `device −0.05`; setzt `base` |

`parserScore` liegt zwischen **0.45 und 0.98**:

```text
0.58
+ Kürze     ≤24 Zeichen +0.14 · ≤48 +0.08 · ≤80 +0.02 · sonst −0.08
+ Knappheit ≤4 Wörter   +0.06 · ≤8   +0.02
+ extra     die Spezifität, die der Agent im Katalog anmeldet
```

**Wichtig:** `score` ist ein **Rangwert, keine Wahrscheinlichkeit**. Die Decke
`SCORE_CEIL = 4` liegt deshalb weit über dem Parser-Band — sonst würde ein
gewollter Konflikt-Boost von `+0.25` an der Grenze wegsättigen und den Abstand
zum Zweiten verlieren.

### Schwelle und Rang sind zwei Dinge

- **Schwelle** prüft `base` (den Parse-Score vor Kosten) gegen `SCORE_MIN = 0.45`.
- **Rang** sortiert nach `score` (nach Kosten), dann nach fester Vorfahrt, dann
  nach ID.

Weil `parserScore` bei `0.45` bodet, ist **jeder Parser-Treffer wählbar**. Die
Kosten dürfen ihn nicht unter die Schwelle drücken — sie sollen nur die
günstigere Seite vorziehen.

### Wann Jarvis zurückfragt

`pickPolicy` fragt **erst, wenn nichts mehr trennt**:

```text
1. kein Kandidat über der Schwelle          → none  (→ Modell)
2. nur einer                                 → run
3. base-Abstand ≥ SCORE_MARGIN (0.12)        → run
4. Kosten trennen (score-Abstand > 1e-6)     → run   (die günstigere Seite)
5. feste Vorfahrt trennt (TIE_ORDER)         → run
6. sonst                                     → ask
```

Schritt 4 und 5 sind neu in `16.1.0`. Vorher entschied allein der Abstand unter
`SCORE_MARGIN` auf `ask` — und weil die Kosten höchstens `0.05` betragen,
konnten sie diesen Abstand **nie** überschreiten. Jede Kosten-Differenz war
damit eine Rückfrage statt einer Entscheidung. Acht dokumentierte Prompts
(`Lautstärke 50`, `lauter um 10`, `Spiel Dune Film`, `Was steht an?`,
`Wo ist Norden?`, `Termin aus dem Zettel`, `Wo ist die Apotheke`,
`Spiele ein YouTube Video auf dem Fernseher`) endeten in einer Rückfrage.

`TIE_ORDER` in `policy.ts` listet die Agenten vom engsten zum breitesten
Auslöser. Nicht gelistete Agenten sind gleichrangig und fragen weiter zurück —
die Rückfrage bleibt als letzter Ausweg erhalten.

### Ein Pfad für App und Test

`decideRoute` ist die **einzige** Entscheidung. Vorher gab es zwei:
`pickRouteFromCtx` (Tests) wandelte ein `ask` still in „nimm die erste Seite"
um, `runDirectorTurn` (App) fragte wirklich zurück. Kein Test konnte deshalb
eine Rückfrage sehen. Heute prüfen drei Korpora auf `ask`:
`test:prompts`, `test:sprint`, `test:matrix`.

### `decideTurn`: Verb nach vorn, dann noch einmal

Deutsch stellt den Infinitiv ans Ende („einen Timer stellen"). Die Parser
suchen ihn vorn. `decideTurn` in `route-pick.ts` versucht zuerst den Originaltext;
findet er niemanden, schreibt `frontVerb` den Satz um („stell einen Timer") und
entscheidet **noch einmal**. Der Handler bekommt den umgeschriebenen Text, nicht
das Original — sonst würde der Parser ihn ein zweites Mal ablehnen.

Das greift nur, wenn Schritt 1 leer bleibt. Ein Treffer auf dem Original wird
nicht überschrieben.

### Alltagsdeutsch seit `17.0.0`

Sprint 257 sollte Embeddings bei Gleichstand rechnen. Das Trennschärfe-Tor
(`eval:separability`) hat den Fall nicht gefunden: der Korpus hat **0 %
Rückfrage** und einen hohen Anteil „kein Kandidat". Die Kapazität ging in drei
Parser-Lücken:

- Zahlwörter vor Ursache: „erinnere mich um acht an den Zahnarzt"
- Verb-final, siehe oben
- `mach das an` im Nachlauf (TV), analog zu `mach das aus`

## 3. Agenten-Bus

`agents/bus.ts:agentDispatch(id, ctx)` — nicht `agentBus.dispatch` wie in
[`62-next.md`](./62-next.md) skizziert.

| Nebenwirkung | Budget | Wiederholung |
|--------------|--------|--------------|
| `read` | 25 s | ein zweiter Versuch nach 400 ms |
| `device` | 15 s | keine |
| `write` | 8 s | keine |

**Warum nur Lesen wiederholt wird:** ein zweiter Schreib-Lauf legt Termine
doppelt an.

Seit `17.0.0` (Sprint 253) trägt jeder Zug ein `AbortSignal`
(`engine/turn-abort.ts`). `beginAgentTurn()` bricht den alten Zug ab, bevor
der neue zählt. `withBudget` und `http-json` hören darauf — ein zweiter
Versuch nach einem Abbruch startet nicht mehr. Ein Handler, der das Signal
ignoriert, läuft weiter; wir warten nur nicht auf ihn.

Ein dauerhaft kaputter Agent wird vom Sicherungsschalter
(`agents/breaker.ts`) nach drei Fehlern für 60 s stillgelegt. Lesen fällt
dann ans Modell, Schreiben und Geräte antworten ehrlich, dass der Dienst
gerade nicht geht.

### Scheitern ist nicht Ablehnen

`AgentResult` trägt `failed` und `failReason`. Ein Wurf oder ein überschrittenes
Budget ist **nicht** dasselbe wie „der Handler passt nicht":

- **Lesen** fällt weiter ans Modell — dort gibt es nichts zu behaupten.
- **Schreiben und Geräte** antworten ehrlich: „… hat nicht funktioniert. Ich
  habe nichts geändert." Ein Durchfallen wäre gefährlich, weil das Modell einen
  Erfolg behaupten könnte, den es nie gab.

## 4. Traces und Historie

`agents/trace-store.ts` hält die Traces **des laufenden** Zugs im Modul-Zustand.

- Jeder Eintrag trägt die **Zug-Nummer**. Ein abgebrochener Zug, dessen Handler
  noch läuft, schreibt nicht mehr in den neuen.
- Gedeckelt auf **200** Einträge pro Zug.
- `beginAgentTurn()` zählt hoch und leert Traces, Brain-Slots, `lastUserFacts`
  und `lastPolicyAsk`.

`engine/history.ts` hält die **letzten 50 Züge** dieser Sitzung — Äußerung,
Antwort, Pfad, Zeiten, Agenten-Schritte, Hirn-Plätze und Kontingent-Stand.

- Zusammengeführt wird **nach** der Antwort: `finishLatency()` ruft seine
  Zuhörer, `history.ts` siegelt dann. Im Zug wird nichts kopiert.
- `latency.ts` deckt dieselben 50 Züge ab (`MAX_LOG = 50`).
- Texte über 200 Zeichen werden gekürzt.
- Ein Neustart löscht die Historie. Der Export (`downloadHistory` in den
  Einstellungen, Knopf „Export" in der Lage) schreibt nur auf Knopfdruck.
- Durchblättern: Lage → Körper → Agenten, Liste unter dem Baum. Antippen
  klappt den Zug auf. Nichts davon startet ein Gerät.

## 5. Katalog

| Zahl | Wert | Quelle |
|------|------|--------|
| Agenten mit `parse` | 60 | `agents/parse-catalog.ts` |
| Agenten mit `execute` | 60 | `agents/execute-map.ts` |

`identity` hat seit `17.0.0` einen Executor (`PERSONA_ASK_TEXT`). Vorher fing
`chat.ts` die Frage ab; der Umweg durch `runAgent` fiel stumm ans Modell.

`agentById` läuft über eine Map, nicht über eine lineare Suche.
`orphanExecutorIds()` deckt Executoren ohne Katalog-Eintrag auf — die wären
für immer unerreichbar. `test:agents-robust` prüft, dass `EXECUTOR_IDS` sich
mit `execute-map.ts` deckt.

Der Konflikt-Tisch nennt Agenten über Zeichenketten, und ein Name, den es nicht
gibt, fällt nirgends auf: die Regel greift scheinbar, ändert aber nichts.
`drop(out, 'research')` lief so zwei Regeln lang ins Leere — der Suchagent heißt
`search`. Seit `16.1.0` vergleicht `test:agents-robust` jeden Namen aus
`conflicts.ts` gegen den Katalog.

## 6. Wer eine abgelaufene Frist schließt

Ein Timer hat zwei Uhren: den Alarm im Android-System und einen `setTimeout` in
der laufenden App. Beide klingeln, aber nur eine kann den Speicher anfassen —
und lange tat es keine. `jarvis-timer-fire` wurde geworfen, ohne dass jemand
zuhörte, also blieb die Zeile `status: 'open'`.

Das fiel erst beim nächsten Start auf: `syncReminderAlarms` hält jede offene
Frist der letzten zwei Stunden für **verpasst** und holt den Alarm nach.
Derselbe Timer klingelte ein zweites Mal.

| Weg | Wer schließt die Zeile |
|-----|------------------------|
| App steht vorne | `jarvis-timer-fire` → `markFiredByNotifyId` (`App.tsx`) |
| App zu, Android | System-Alarm klingelt; `syncReminderAlarms` schließt beim Start nach, **ohne** nachzuklingeln |
| App zu, Browser | Frist starb mit dem Tab — `syncReminderAlarms` holt sie nach |

`hasNativeAlarms()` trennt die letzten beiden Fälle. Das Nachholen ist im
Browser richtig und auf Android falsch, und vorher tat der Code beides gleich.

`markFiredByNotifyId` rechnet über die offenen Zeilen zurück, weil
`notifyIdFromKey` eine Einbahnstraße ist: das Ereignis kennt nur seine
Notify-Nummer, nicht die Erinnerung dahinter. Wiederkehrende Fristen rücken
dabei vor statt zu schließen — vom **geplanten** Schlag gerechnet, nicht vom
tatsächlichen, sonst wandert ein 7-Uhr-Wecker mit jeder Doze-Verzögerung nach
hinten. Das Android-Plugin rechnet seit `16.1.0` genauso (`nextRecurAt` über
`Calendar`, damit die Uhrzeit die Zeitumstellung übersteht).

## 7. Tests

| Skript | Deckt ab |
|--------|----------|
| `eval` | ein Korpus, jeder Fehler einzeln (`node:test`) |
| `eval:report` | Genauigkeit, Ask-Rate, Tokens, p50/p95 |
| `eval:separability` | Trennschärfe-Tor (S257-9) |
| `test:prompts` | 286 Chips + Rückfrage-Sperre |
| `test:sprint` | Gold, Alltag, kaputte Absicht + Rückfrage-Sperre |
| `test:matrix` | Lock 6.60 + Rückfrage-Sperre |
| `test:agents` | Katalog-Metadaten, Executor-IDs |
| `test:agents-robust` | Budget, Timer-Aufräumen, Traces, Kosten-Rang, Vorfahrt, Konflikt-Namen, Schalter |
| `test:turn-e2e` | echter Zug: Timer steht, Kugel offen, Fehlerpfade, abgelaufene Frist |
| `test:turn-detect` | Satzende-Heuristik ohne Länge-als-Beweis |
| `test:settings-migrate` | Feldschutz, benannte Migration |
| `test:verb-front` | Verb-final, Zahlwort, TV-an/aus |
| `test:tool-propose` | Vertrag, Schema, Bestätigung, Einschleusen |
| `test:history` | Ringpuffer, Kürzung, kein leerer Zug, Export |

`test:turn-e2e` fährt `runDirectorTurn` in Node. Möglich wurde das durch zwei
Dinge: alle relativen Importe tragen `.ts` (Node löst extensionslos nicht auf),
und `fake-indexeddb` plus ein `localStorage`-Shim machen den Store sichtbar.
Ohne Shim schluckt der Store jeden Fehler und liest ewig die Defaults.

`scripts/run-all-tests.sh` zählt statt abzubrechen — der blinde Fleck aus
Sprint 249, als `test:014` nach der ersten Assertion den Rest verdeckte.

## 8. Grenzen

- **Kein Parallellauf.** Ein Zug führt genau einen Agenten aus. Ketten laufen
  sequentiell über `chain.ts`.
- **Historie überlebt keinen Neustart.** Sie liegt im Speicher, nicht auf der
  Platte. Für „gestern Abend" bleibt der Export, den der Nutzer auslöst.
- **Ein Vorschlag ist kein Befehl.** Das Modell darf ein Werkzeug vorschlagen;
  ausgeführt wird nur, was der Parser am kanonischen Satz bestätigt. Siehe §9.
- **Silero bleibt opt-in.** Stufe B von Sprint 254 lädt die Datei nach, bündelt
  sie nicht in die APK.

## 9. Werkzeug-Vorschlag

Wenn kein Parser greift und die Äußerung nach einem Befehl klingt
(`looksCommandish`), darf Groq **ein** Werkzeug vorschlagen
(`completeGroqJson`, `response_format: json_schema`, `strict: true`).

Der Vorschlag wird **nicht** ausgeführt. `render` macht daraus einen
kanonischen deutschen Satz („stell einen Timer für 12 Minuten"), der durch
dieselbe Pipeline läuft wie ein Tipp. `confirmedUtterance` prüft, dass der
Router denselben Agenten wählt, den der Vertrag nennt — ein Titel
„mach den Fernseher an" in einer Erinnerung startet den Fernseher nicht.

Geräte und Schreibvorgänge fragen vorher „ja/nein". Lesen läuft ohne Nachfrage.
Schlägt der Vorschlag fehl, fällt der Zug ins Modell — ein zweiter Aufruf,
bewusst, damit Gedächtnis und Research nicht verloren gehen.
