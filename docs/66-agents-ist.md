# 66 — Agenten-Netzwerk: Ist-Stand (Code `16.1.1`)

> Dieses Dokument beschreibt, **was der Code tut** — nicht was geplant war.
> [`62-next.md`](./62-next.md) ist das Planungsdokument zu 14.0; wo die Namen
> dort von der Umsetzung abweichen, gilt diese Datei.

## 1. Ein Zug von vorne nach hinten

```text
chat.streamChat
  → normalizeUtterance + splitIntents          (chat.ts, mehrteilige Sätze)
  → routeDeterministic
  → runDirectorTurn(conversationId, text)      (director.ts)
       1. beginAgentTurn()                     Zug-Nummer, Traces leer
       2. curatorPreflight()                   Gedächtnis-Pflege, Budget 2,5 s
       3. getPending()                         offene Rückfrage schlägt alles
       4. decideRouteFromCtx(ctx)              → { pick, candidates }
       5. runAgent(pick.id, ctx)               Budget + Wiederholung
       6. applyRetry(hit)                      fuel/weather/poi/transit
  → wenn kein Treffer: BrainOrchestrator (Groq → Gemini → 0,5 B)
```

Der Director sieht **immer einen einzelnen Intent**. Das Aufteilen mehrteiliger
Sätze passiert vorher in `chat.ts` (`splitIntents` + `partitionChain`).

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

## 3. Agenten-Bus

`agents/bus.ts:agentDispatch(id, ctx)` — nicht `agentBus.dispatch` wie in
[`62-next.md`](./62-next.md) skizziert.

| Nebenwirkung | Budget | Wiederholung |
|--------------|--------|--------------|
| `read` | 25 s | ein zweiter Versuch nach 400 ms |
| `device` | 15 s | keine |
| `write` | 8 s | keine |

**Warum nur Lesen wiederholt wird:** ein zweiter Schreib-Lauf legt Termine
doppelt an. Ein Handler ohne eigenes Abbruchsignal läuft nach dem Budget
weiter — wir warten nur nicht mehr auf ihn (`agents/budget.ts`).

### Scheitern ist nicht Ablehnen

`AgentResult` trägt `failed` und `failReason`. Ein Wurf oder ein überschrittenes
Budget ist **nicht** dasselbe wie „der Handler passt nicht":

- **Lesen** fällt weiter ans Modell — dort gibt es nichts zu behaupten.
- **Schreiben und Geräte** antworten ehrlich: „… hat nicht funktioniert. Ich
  habe nichts geändert." Ein Durchfallen wäre gefährlich, weil das Modell einen
  Erfolg behaupten könnte, den es nie gab.

## 4. Traces

`agents/trace-store.ts` hält die Traces eines Zugs im Modul-Zustand.

- Jeder Eintrag trägt die **Zug-Nummer**. Ein abgebrochener Zug, dessen Handler
  noch läuft, schreibt nicht mehr in den neuen.
- Gedeckelt auf **200** Einträge pro Zug.
- `beginAgentTurn()` zählt hoch und leert Traces, Brain-Slots, `lastUserFacts`
  und `lastPolicyAsk`.

## 5. Katalog

| Zahl | Wert | Quelle |
|------|------|--------|
| Agenten mit `parse` | 60 | `agents/parse-catalog.ts` |
| Agenten mit `execute` | 59 | `agents/execute-map.ts` |
| ohne `execute` | `identity` | wird in `chat.ts` direkt beantwortet |

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
| `test:prompts` | 181 Chips + Rückfrage-Sperre |
| `test:sprint` | Gold, Alltag, kaputte Absicht + Rückfrage-Sperre |
| `test:matrix` | Lock 6.60 + Rückfrage-Sperre |
| `test:agents` | Katalog-Metadaten, Executor-IDs |
| `test:agents-robust` | Budget, Timer-Aufräumen, Traces, Kosten-Rang, Vorfahrt, Konflikt-Namen |
| `test:turn-e2e` | echter Zug: Timer steht, Kugel offen, Fehlerpfade, abgelaufene Frist |

`test:turn-e2e` fährt `runDirectorTurn` in Node. Möglich wurde das durch zwei
Dinge: alle relativen Importe tragen `.ts` (Node löst extensionslos nicht auf),
und `fake-indexeddb` plus ein `localStorage`-Shim machen den Store sichtbar.
Ohne Shim schluckt der Store jeden Fehler und liest ewig die Defaults.

## 8. Grenzen

- **Kein Parallellauf.** Ein Zug führt genau einen Agenten aus. Ketten laufen
  sequentiell über `chain.ts`.
- **Kein Abbruchsignal bis in die Handler.** Das Budget schneidet das Warten ab,
  nicht die Arbeit. Ein echtes `AbortSignal` bräuchte einen Durchstich bis in
  `http-json.ts`.
- **Kein Sicherungsschalter.** Ein dauerhaft kaputter Dienst wird bei jedem Zug
  neu versucht.
- **Traces sind flüchtig.** Sie überleben keinen Neustart.
