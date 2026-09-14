# Sprint 255 — Semantisches Satzende + Barge-in **AUFGELÖST**

**Status:** **AUFGELÖST** — nicht abgesagt, sondern aufgeteilt. Der Inhalt steckt
in [`253`](./sprint-253.md) und [`254`](./sprint-254.md).
**Plan:** [`68-next.md`](../68-next.md) §10
**Grund:** Beide Hälften existieren im Code bereits; der geplante Zusatz hätte
Latenz und Kontingent gekostet, ohne einen offenen Fall zu lösen.

## Warum aufgelöst

Dieser Sprint hatte zwei Hälften. Beide gibt es schon.

### Barge-in ist gebaut

`native/voice.ts` hat `watchBargeIn()` — nativ über `startBargeWatch` und den
`barge`-Listener, im Browser über `createEnergyVad` mit `BARGE_ONSET_MS = 180`.
`ui/VoiceMode.tsx` verdrahtet es an zwei Stellen (während des Streams und
während des Abspielens), bricht die Stimme über `cutIn(pipe)` ab und verwirft
den Zug über `abortTurn`.

Auch der Selbstschutz, der als S255-6 geplant war, ist da:
`BARGE_IGNORE_TTS_MS = 400` und `isBargeInText()` filtert Backchannels („mhm",
„aha", „ok"), damit ein Zuhörgeräusch die Antwort nicht abbricht.

**Was wirklich fehlt** ist genau eine Sache: der abgebrochene Zug läuft im
Hintergrund weiter, weil die Handler kein `AbortSignal` bekommen. Das ist
Sprint **253** und stand dort schon.

### Semantisches Satzende ist gebaut

`turnLooksComplete()` in `turn-detect.ts` prüft das Transkript inhaltlich:
`INCOMPLETE_TAIL` fängt „…und", „…weil", „…für" ab, `COMPLETE_END` erkennt
Satzzeichen. `silenceMsFor()` verrechnet das Ergebnis zu 220 ms oder 1100 ms.
Das ist genau die Idee dieses Sprints, nur als Regex statt als Modell.

Diese Regex hat einen echten Fehler — Länge gilt als Vollständigkeitsbeleg —
aber der wird in **254 Stufe A** behoben, kostenlos.

## Warum der geplante Klassifikator gestrichen ist

S255-2 wollte einen Klassifikator fürs Satzende. Gegen die vier Prioritäten
gerechnet:

| Priorität | Wirkung |
|-----------|---------|
| Antwortqualität | **unklar.** Die Regex löst die belegten Fälle; offen ist nur, was sie zusätzlich fängt |
| Alles funktioniert | **schlechter.** Ein Modell im Aufnahmepfad ist ein neuer Fehlerweg an der empfindlichsten Stelle |
| Latenz | **schlechter.** Ein Aufruf pro Transkript-Änderung, also mehrfach je Äußerung — und zwar genau in dem Moment, in dem der Nutzer auf das Ende wartet |
| Kostenlos / nutzbar | **schlechter.** Bei einem Cloud-Klassifikator mehrere Requests pro Satz auf 1.000 am Tag; bei einem lokalen zusätzliche CPU während der Aufnahme |

Drei Kategorien schlechter, eine unklar. Nach der Regel „nur ändern, wenn Nutzen
ohne Verlust in einer anderen Kategorie" fällt das raus.

Der Vollständigkeit halber: das Vorbild — der Turn-Detector der
[LiveKit Agents](https://github.com/livekit/agents) — läuft dort auf einem
Server mit Dauerbetrieb, nicht auf einem Handy mit Tageslimit. Die Idee ist gut,
die Umgebung ist eine andere.

## Wohin die Tasks gegangen sind

| War | Ist |
|-----|-----|
| S255-1 Label-Set vollständig/unvollständig | **S249-9** — als `stt`-Tag im Korpus, speist S254-5 |
| S255-2 Klassifikator Satzende | **gestrichen**, Begründung oben |
| S255-3 Verrechnung Stille × Sicherheit | **S254-4** — Mittelstufe ~600 ms, ohne Modell |
| S255-4 Barge-in bricht TTS ab | **existiert** — `watchBargeIn` + `cutIn` |
| S255-5 Barge-in bricht den Zug ab | **S253** — der einzige echte Rest |
| S255-6 eigene Stimme zählt nicht | **existiert** — `BARGE_IGNORE_TTS_MS`, `isBargeInText` |
| S255-7 Rückfallebene | entfällt mit dem Klassifikator |
| S255-8 Tests + Messung | **S254-6** |

## Was das für die Schiene bedeutet

Ein Sprint weniger, und der verbleibende Teil wird billiger und prüfbarer:
Stufe A von 254 ist eine reine Funktion auf einem String und braucht kein
Mikrofon im Test. Der Sprachmodus wird dadurch **nicht** schlechter — die
Beschwerde „abgehackt" wird in 254 an ihrer tatsächlichen Ursache behoben statt
an der vermuteten.

Sollte die Messung aus S254-6 zeigen, dass nach Stufe A und Stufe B immer noch
Sätze am **Inhalt** scheitern, wird dieser Sprint neu aufgemacht — dann aber mit
einem belegten Fall statt mit einer Vermutung.
