# 67 — Upgrade-Vorschläge: näher an Claude, ChatGPT, Astra

> Grundlage ist der Code in `16.1.0`, nicht ein Wunschbild. Jeder Punkt nennt
> die Stelle, den offenen Nachteil und eine Open-Source-Referenz. Sortiert nach
> Nutzen pro Aufwand — nicht nach Reihenfolge im Sprint.

Die Leitentscheidung bleibt: **Parser wählen Geräte, das Modell formuliert.**
Kein Vorschlag hier gibt einem Modell die Hand am Fernseher.

---

## A. Abbruch bis in die Handler (`AbortSignal`)

**Ist:** `agents/budget.ts` schneidet nur das *Warten* ab. Der Handler läuft
weiter, sein `fetch` läuft weiter, sein Ergebnis wird verworfen. Ein Nutzer, der
mitten in der Antwort etwas Neues sagt, hat zwei Züge im Flug.

**Nachteil:** Kein Barge-in. Auf dem Handy kostet ein verwaister Feed-Abruf
Akku und Datenvolumen. Und ein verworfenes Ergebnis kann trotzdem noch
`saveSettings` schreiben — der neue Zug erbt fremden Zustand.

**Ziel:** Ein `AbortController` pro Zug in `director.ts`, durchgestochen über
`RouteCtx.signal` → jeder Handler → `http-json.ts`. Dort existiert `abortAfter`
schon; es müsste nur mit `AbortSignal.any([budget, turn])` verheiratet werden.
`beginAgentTurn()` bricht den vorigen ab.

**Referenz:** `AbortSignal.any` (Node 20+, alle aktuellen WebViews), das
Cancel-Muster von `p-timeout` und `ky`.

**Aufwand:** `RouteCtx` erweitern, ~59 Executoren durchreichen (mechanisch),
`http-json.ts` an vier Stellen. Der Durchstich ist die eigentliche Arbeit.

---

## B. Sprechpause erkennen statt Stille zählen

**Ist:** `turn-detect.ts` wartet eine feste Stille ab
(`SILENCE_HOLD_VOICE_MS = 1100`). Das war der Grund für „er nimmt meine Sätze
abgehackt auf": wer mitten im Satz Luft holt, wird abgeschnitten; wer schnell
spricht, wartet unnötig.

**Nachteil:** Eine Konstante kann nicht beides. Genau hier liegt der spürbare
Abstand zu Astra und zum Realtime-Modus von ChatGPT — nicht in der Modellgröße.

**Ziel:** Zweistufig, wie es der Stand der Technik macht:
1. **VAD** statt Amplitudenschwelle — *Silero VAD* als ONNX-Modell (~1,8 MB,
   läuft in `onnxruntime-web` im WebView, kein Server).
2. **Semantisches Satzende** — ein kleiner Klassifikator entscheidet, ob der
   Satz *inhaltlich* fertig ist. „Erinnere mich in fünf …" ist es nicht,
   auch nach 1,5 s Stille.

**Referenz:** [`snakers4/silero-vad`](https://github.com/snakers4/silero-vad)
(MIT), der Turn-Detector der
[LiveKit Agents](https://github.com/livekit/agents) (Apache-2.0) als Vorbild
für Stufe 2.

**Aufwand:** Stufe 1 ist überschaubar und allein schon die Beschwerde wert.
Stufe 2 braucht ein Modell und ein Label-Set.

---

## C. Der Konflikt-Tisch skaliert nicht mehr

**Ist:** 60 Parser mit handgesetzten `extra`-Boni und `conflicts.ts` mit über
40 Regeln auf 360 Zeilen. Beim Audit für `16.1.0` fanden sich darin:
eine **tote Regel** (`/\b(fernseh|…)\b/` traf „Fernseher" nie), ein
**Kostenmodell, das nie etwas entschied**, und **Boosts, die an der Decke
wegsättigten**.

**Nachteil:** Jeder neue Agent ist ein Eingriff in ein handgestimmtes System,
und ein Fehler darin ist unsichtbar, bis ein Nutzer sich beschwert. Die Regeln
sind mit `drop`/`boost` außerdem reihenfolgeabhängig.

**Ziel:** Die schnelle Bahn bleibt — Parser sind deterministisch und sicher.
Ersetzt wird die *Bewertungsschicht*:

1. Aus den vorhandenen Korpora (`test-prompts`, Gold, Lock — zusammen über
   250 gelabelte Äußerungen) ein Intent-Datensatz.
2. `multilingual-e5-small` in `onnxruntime-web` (das Repo nennt e5 schon in
   `retrieve.ts`, dort nur als Reranker) liefert eine Ähnlichkeit zum
   Intent-Zentroid.
3. Der Score wird zu `parserScore` **addiert**, statt Konflikte von Hand zu
   verdrahten. `conflicts.ts` bleibt nur für harte Sicherheitsregeln
   (`wont`, Gerät vs. Lesen).

Wichtig: das Embedding entscheidet die **Reihenfolge**, nie die
**Ausführung**. Ausgeführt wird weiter nur, was ein Parser bestätigt hat.

**Referenz:** `onnxruntime-web`, `intfloat/multilingual-e5-small`,
`Xenova/transformers.js` (Apache-2.0).

---

## D. Aus Testskripten eine Eval machen

**Ist:** 17 eigenständige `.mjs`-Dateien mit `node:assert`. Der erste Fehler
beendet den Lauf. Ein Prompt-Korpus ist damit ein Ja/Nein, kein Messwert.

**Nachteil:** Man kann nicht sagen „diese Änderung hebt das Routing von 94 %
auf 97 %". Genau das braucht man, um Vorschlag C überhaupt zu bewerten. Und
weil der Lauf beim ersten Fehler abbricht, bleiben weitere Fehler verborgen —
beim Audit für `16.1.0` verdeckte eine veraltete Assertion in `test:014` alle
folgenden.

**Ziel:**
- `node:test` (schon vorhanden, keine Abhängigkeit) als Rahmen: jeder Fall ein
  Testfall, alle laufen durch.
- Darüber eine Eval, die **Kennzahlen** ausgibt: Treffer pro Agent,
  Rückfrage-Quote, `none`-Quote, Laufzeit im 95. Perzentil. Als Tabelle in die
  PR, mit dem Vorlauf verglichen.
- Die Korpora in **eine** Quelle unter `src/engine/`, damit sie nicht in drei
  Testdateien getrennt weiterleben.

**Referenz:** `node:test` mit `--test-reporter`, das Kennzahlen-Format von
`promptfoo` (MIT).

---

## E. Werkzeug-Vertrag für das Modell

**Ist:** Der Agenten-Pfad und der Modell-Pfad sind getrennt. Findet der Router
nichts, formuliert das Modell frei. Es kann kein Werkzeug aufrufen — nur reden.

**Nachteil:** „Erinnere mich an das, was Peter gestern gesagt hat, eine Stunde
bevor der Zug fährt" hat keinen Parser und wird deshalb nur beredet. Das ist
der Abstand zu Claude und ChatGPT: dort schlägt das Modell einen Werkzeugaufruf
mit Argumenten vor.

**Ziel:** Der Vorschlag darf vom Modell kommen, die Ausführung nicht:

1. Jeder `AgentSpec` bekommt ein `zod`-Schema für seine Argumente.
2. `zod-to-json-schema` erzeugt daraus die Werkzeugliste für den Prompt.
3. Das Modell antwortet mit `{ agent, args }`.
4. **Der Vorschlag durchläuft dieselbe Policy wie ein Parser-Treffer.** Für
   `sideEffect: device|write` bleibt eine Bestätigung Pflicht — genau das
   V9-Hardening, das `62-next.md` schon fordert.

Damit bleibt „Erfolg nur bei prüfbarem Ergebnis" erhalten, und die Reichweite
wächst trotzdem.

**Referenz:** `zod` + `zod-to-json-schema`, das Werkzeug-Muster des
Vercel AI SDK, [MCP](https://modelcontextprotocol.io) als Schema-Vorbild.

---

## F. Traces wie Industrie-Telemetrie

**Ist:** `agents/trace-store.ts` hält die Traces eines Zugs im Speicher. Sie
überleben keinen Neustart, und der Nutzer kann einen Fehler von gestern nicht
mehr zeigen.

**Ziel:** Ein Ring-Puffer der letzten ~50 Züge in IndexedDB, exportierbar (der
Debug-Export gibt es schon). Die Attribute nach den **GenAI-Konventionen von
OpenTelemetry** benennen (`gen_ai.request.model`, `gen_ai.usage.*`,
`gen_ai.operation.name`) — auch ohne Collector macht das den Debug-Bogen
vergleichbar mit dem, was in der Industrie üblich ist, und erlaubt später einen
Export ohne Umbau.

**Referenz:** OpenTelemetry Semantic Conventions für GenAI.

---

## G. Das Einstellungs-Gott-Objekt aufteilen

**Ist:** `Settings` ist ein Objekt mit über 250 Feldern in **einem**
localStorage-Eintrag. `saveSettings(patch)` liest alles, mischt, schreibt alles.

**Nachteil:** Jedes Feld hat dieselbe Lebensdauer und dasselbe Risiko — der
Gemini-Key liegt neben `hud_view`. Bis `16.1.0` setzte ein einzelnes falsches
Zeichen die komplette Einrichtung auf Werk zurück (jetzt behoben, die Rohdaten
wandern zur Seite). Es gibt weiterhin **keine Migrationsschritte**, nur
`{...DEFAULT_SETTINGS, ...prev}` — ein umbenanntes Feld verliert still seinen
Wert.

**Ziel:**
- Ein `zod`-Schema an der Grenze. Fehlerhafte Felder fallen einzeln auf ihren
  Default zurück, statt das ganze Objekt zu verlieren.
- Benannte Migrationsschritte (`v13 → v14`) statt eines Spreads.
- Getrennte Bereiche: `secrets` (Keys), `prefs` (Nutzerwahl), `session`
  (flüchtig, `hud_view` und Freunde). Nur `prefs` und `secrets` gehören ins
  Backup.

**Referenz:** `zod`, das Migrationsmuster von `zustand/middleware/persist`.

---

## H. Sicherungsschalter für kaputte Dienste

**Ist:** Ein dauerhaft kaputter Dienst wird bei jedem Zug neu versucht — mit
Budget und, beim Lesen, noch einem zweiten Versuch obendrauf.

**Nachteil:** Ohne Netz wartet der Nutzer bei jeder Frage volle 25 s plus
Wiederholung, bevor irgendetwas passiert.

**Ziel:** Ein einfacher Zähler pro Agent: drei Fehlschläge in Folge → 60 s
Pause, in der der Agent sofort und ehrlich absagt, statt ins Budget zu laufen.
Ein Erfolg setzt den Zähler zurück. Zwanzig Zeilen in `agents/bus.ts`, kein
Framework.

**Referenz:** Das Halbmond-Muster („half-open") aus `cockatiel` /
`opossum` — hier bewusst nur in der einfachsten Form.

---

## Reihenfolge

| Zuerst | Warum |
|--------|-------|
| **B** Sprechpause | die konkrete Beschwerde, größter spürbarer Effekt |
| **D** Eval | ohne Messwerte ist C nicht bewertbar |
| **H** Sicherungsschalter | zwanzig Zeilen, sofort spürbar ohne Netz |
| **A** Abbruch | Voraussetzung für echtes Barge-in in B |
| **G** Einstellungen | Datenverlust-Risiko, unabhängig machbar |
| **C** Router | braucht D als Netz |
| **E** Werkzeug-Vertrag | größte Reichweite, größter Eingriff |
| **F** Telemetrie | Komfort, kein Nutzer-Schmerz |
