# 68 — Messbar und unterbrechbar **PLAN** (`17.0.0`)

Ausgangspunkt: Code `16.1.1`. Die acht Upgrades aus [`67-upgrades.md`](./67-upgrades.md)
plus die vier Reste, die beim Audit für `16.1.x` offen blieben, als
Lieferreihenfolge.

Die Leitentscheidung bleibt: **Parser wählen Geräte, das Modell formuliert.**
Kein Sprint hier gibt einem Modell die Hand am Fernseher.

Die Begründungen, warum die Sprints so geschnitten sind — und welche Ideen
bewusst nicht vorkommen — stehen in
[`69-modell-grundlagen.md`](./69-modell-grundlagen.md). Zwei Entscheidungen
daraus greifen in diese Planung ein und stehen unten als §17 (Sprache) und §18
(Kontingent).

---

## 0. Warum diese Reihenfolge

[`67-upgrades.md`](./67-upgrades.md) sortiert nach Nutzen pro Aufwand und setzt
**B** (Sprechpause) nach vorne, weil es die lauteste Beschwerde ist. Diese
Planung zieht **D** (Eval) davor. Der Grund steht in den Fehlern der letzten drei
Versionen, nicht in einer Vorliebe:

| Vorfall | Was der Test sagte | Was die App tat |
|---------|--------------------|-----------------|
| Router `16.1.0` | grün | acht Prompts endeten in einer Rückfrage |
| `test:014` `16.1.0` | grün nach Zeile 1 | eine veraltete Assertion brach den Lauf ab und verdeckte alles danach |
| Konflikt-Tisch `16.1.1` | grün | zwei Regeln trafen keinen existierenden Agenten |
| Wecker `16.1.1` | kein Test vorhanden | derselbe Alarm klingelte zweimal |

Vier Mal dasselbe Muster: **grün heißt nicht heil.** Solange ein Prompt-Korpus
ein Ja/Nein ausgibt, lässt sich weder belegen, dass eine Router-Änderung besser
ist, noch sehen, was sie kaputt macht. Sprint **257** (Intent-Embeddings) tauscht
ein handgestimmtes System gegen ein gelerntes — das ohne Messung zu tun wäre ein
Tausch gegen Ungewissheit.

Deshalb: erst messen (249–250), dann das Billige und sofort Spürbare (251–252),
dann Sprache (253–255), dann Struktur (256–259).

---

## 1. Versions-Roadmap

| Version | Sprint | Thema | Warum hier |
|---------|--------|-------|------------|
| `16.2.0` | 249 | Eval-Rahmen: `node:test`, eine Korpus-Quelle | Alle Fehler sichtbar statt nur der erste |
| `16.3.0` | 250 | Eval-Kennzahlen + Baseline | Ohne Messwert ist 257 nicht bewertbar |
| `16.4.0` | 251 | Sicherungsschalter + Agenten-Reste | 20 Zeilen, ohne Netz sofort spürbar |
| `16.5.0` | 252 | Lage-Entscheidung + Wecker-Nummer | Zwei bekannte Reste, klein und abgeschlossen |
| `16.6.0` | 253 | Abbruch bis in die Handler (`AbortSignal`) | Voraussetzung für Barge-in in 255 |
| `16.7.0` | 254 | VAD statt Stillezähler (Stufe 1) | Die offene Beschwerde: abgehacktes Aufnehmen |
| `16.8.0` | 255 | Semantisches Satzende + Barge-in (Stufe 2) | Baut auf 253 und 254 |
| `16.9.0` | 256 | Einstellungen aufteilen, `zod`, Migration | Datenverlust-Risiko, unabhängig machbar |
| `16.10.0` | 257 | Intent-Embeddings statt Konflikt-Tisch | Braucht 250 als Netz |
| `16.11.0` | 258 | Werkzeug-Vertrag für das Modell | Größte Reichweite, größter Eingriff |
| **`17.0.0`** | 259 | Traces als Telemetrie + **Meilenstein** | Abschluss; Sideload |

`17.0.0` bedeutet: **Jarvis kann sich selbst messen und lässt sich
unterbrechen.** Beides fehlt heute vollständig.

---

## 2. Abhängigkeiten

```text
249 Eval-Rahmen
 └─ 250 Kennzahlen ────────────────┐
                                   ├─ 257 Intent-Embeddings ─ 258 Werkzeug-Vertrag
251 Sicherungsschalter             │
252 Lage + Wecker-Nummer           │
253 Abbruch ─┬─ 255 Barge-in       │
254 VAD ─────┘                     │
256 Einstellungen ─────────────────┘
                                    └─ 259 Telemetrie + Meilenstein
```

Frei kombinierbar: **251**, **252**, **256** hängen an nichts.
Harte Ketten: **250 → 257**, **253 + 254 → 255**, alles → **259**.

---

## 3. Was in dieser Planung *nicht* vorkommt

- **Kein Modell an der Hardware.** Sprint 258 lässt das Modell einen Aufruf
  *vorschlagen*; ausgeführt wird nur, was ein Parser bestätigt und — bei
  `device`/`write` — der Nutzer bestätigt hat.
- **Kein Qdrant, kein Server.** Die Embeddings in 257 und das VAD in 254 laufen
  über `onnxruntime-web` im WebView.
- **Kein Framework für den Sicherungsschalter.** 251 ist ein Zähler, kein
  `cockatiel`.
- **Kein Umbau der Parser.** 257 ersetzt die *Bewertungsschicht*, nicht die
  deterministische Bahn.
- **Kein Training, in keiner Form.** Kein Fine-Tuning, kein SFT, kein DPO. Ohne
  GPU und Trainingsstrecke ist das nicht machbar, und es würde das Problem nicht
  treffen: Fine-Tuning prägt Form, nicht Wissen
  ([`69-modell-grundlagen.md`](./69-modell-grundlagen.md) §1.5). Der Rohstoff —
  Äußerung plus erwartete Absicht — entsteht in 249/250 trotzdem und trägt dort
  schon ohne Training.
- **Kein Reasoning-Modus.** „Länger nachdenken lassen" wird in Tokens bezahlt,
  und Tokens sind laut §18 knapp. Bei einem Sprachassistenten kostet es
  zusätzlich das, was am meisten zählt: Antwortzeit.
- **Keine Umstellung der Persona auf Englisch.** Begründung in §17.

---

## 4. Sprint 249 — Eval-Rahmen (`16.2.0`)

17 Skripte mit `node:assert`; der erste Fehler beendet den Lauf. Die Korpora
liegen dreifach getrennt in `test-prompts`, `test-sprint-prompts` und
`test-650-matrix`. Ziel: `node:test` als Rahmen, jeder Fall ein Testfall, alle
laufen durch — und **eine** Korpus-Quelle unter `src/engine/eval/`.

Details: [`sprints/sprint-249.md`](./sprints/sprint-249.md)

## 5. Sprint 250 — Eval-Kennzahlen (`16.3.0`)

Treffer je Agent, Rückfrage-Quote, `none`-Quote, Laufzeit im 95. Perzentil und
die zehn häufigsten Verwechslungspaare. Gegen eine Baseline verglichen, als
Markdown-Tabelle in die PR.

Details: [`sprints/sprint-250.md`](./sprints/sprint-250.md)

## 6. Sprint 251 — Sicherungsschalter + Agenten-Reste (`16.4.0`)

Drei Fehlschläge in Folge → 60 s ehrliche Absage statt volles Budget. Dazu die
zwei Agenten-Reste aus dem Audit: `identity` ohne Executor, und ein `verify`,
das acht Module selbst machen und der Director nur im Kommentar behauptet.

Details: [`sprints/sprint-251.md`](./sprints/sprint-251.md)

## 7. Sprint 252 — Lage-Entscheidung + Wecker-Nummer (`16.5.0`)

`lageScene` steht hart auf `false`; damit ist `lageSceneOf` unbenutzt und der
CSS-Zweig `.is-lage-scene` tot. **Braucht eine PO-Entscheidung**, weil die
46vh-Grenze der Blackscreen-Fix war. Dazu: `notify_id` speichern statt hashen.

Details: [`sprints/sprint-252.md`](./sprints/sprint-252.md)

## 8. Sprint 253 — Abbruch bis in die Handler (`16.6.0`)

`budget.ts` schneidet nur das Warten ab; der Handler läuft weiter und kann noch
`saveSettings` schreiben, nachdem sein Ergebnis verworfen wurde.

Details: [`sprints/sprint-253.md`](./sprints/sprint-253.md)

## 9. Sprint 254 — VAD statt Stillezähler (`16.7.0`)

`SILENCE_HOLD_VOICE_MS = 1100` kann nicht beides: wer Luft holt, wird
abgeschnitten; wer schnell spricht, wartet. Silero VAD als ONNX im WebView.

Details: [`sprints/sprint-254.md`](./sprints/sprint-254.md)

## 10. Sprint 255 — Satzende + Barge-in (`16.8.0`)

„Erinnere mich in fünf …" ist nach 1,5 s Stille nicht fertig. Ein Klassifikator
entscheidet inhaltlich. Barge-in bricht TTS **und** den laufenden Zug ab.

Details: [`sprints/sprint-255.md`](./sprints/sprint-255.md)

## 11. Sprint 256 — Einstellungen aufteilen (`16.9.0`)

Über 250 Felder in einem localStorage-Eintrag, ohne Migrationsschritte. Der
Gemini-Key liegt neben `hud_view`.

Details: [`sprints/sprint-256.md`](./sprints/sprint-256.md)

## 12. Sprint 257 — Intent-Embeddings (`16.10.0`)

Die Bewertungsschicht wird gelernt statt handgestimmt. Die Parser bleiben.

Details: [`sprints/sprint-257.md`](./sprints/sprint-257.md)

## 13. Sprint 258 — Werkzeug-Vertrag (`16.11.0`)

Der Vorschlag darf vom Modell kommen, die Ausführung nicht.

Details: [`sprints/sprint-258.md`](./sprints/sprint-258.md)

## 14. Sprint 259 — Telemetrie + Meilenstein `17.0.0`

Ring-Puffer der letzten 50 Züge in IndexedDB, benannt nach den GenAI-Konventionen
von OpenTelemetry. Danach Sideload `17.0.0`.

Details: [`sprints/sprint-259.md`](./sprints/sprint-259.md)

---

## 15. Abbruchkriterien

Jeder Sprint hat eine Bedingung, unter der er **nicht** ausgeliefert wird:

| Sprint | Rot, wenn |
|--------|-----------|
| 249 | ein Prompt aus dem alten Korpus fehlt in der neuen Quelle |
| 250 | die Kennzahlen des Vorlaufs lassen sich nicht reproduzieren |
| 251 | der Schalter hält einen gesunden Agenten zurück |
| 252 | der Blackscreen kommt zurück |
| 253 | ein abgebrochener Zug schreibt weiter in den Speicher |
| 254 | mehr abgeschnittene Sätze als mit der Konstante |
| 255 | Barge-in schneidet die eigene Frage ab |
| 256 | eine Migration verliert ein Feld |
| 257 | der Trennschärfe-Test scheitert, oder Trefferquote sinkt gegenüber der Baseline |
| 258 | ein Modellvorschlag erreicht ein Gerät ohne Bestätigung |
| 259 | der Ring-Puffer wächst über seine Grenze |

Neu bei **257**: der Trennschärfe-Test (`eval:separability`) läuft **vor** der
Umsetzung und kann den Sprint schließen, bevor er beginnt. Näheres in
[`sprints/sprint-257.md`](./sprints/sprint-257.md) §S257-9.

## 16. PO-Testreihenfolge

Nach **252** die erste APK dieser Schiene (die Lage-Entscheidung ist sichtbar),
nach **255** die zweite (Sprachmodus), nach **259** das Meilenstein-Sideload.

---

## 17. Interne Sprache: Deutsch bleibt, Maschinenseitiges wird englisch

PO-Frage aus der Planungsrunde. Kurzfassung; ausführlich mit Quellen in
[`69-modell-grundlagen.md`](./69-modell-grundlagen.md) §2.

Der Forschungskonsens ist nicht „Englisch ist besser", sondern **nach
Bestandteil trennen**. Für Jarvis heißt das:

| Bestandteil | Sprache | Sprint |
|-------------|---------|--------|
| Persona, Ton, Siezen, Beispielantworten | **Deutsch, unverändert** | — |
| Werkzeug-Beschreibungen, JSON-Schema, Feldnamen, Intent-Labels | **Englisch** | 258 |
| Code-Kommentare, `docs/` | **Deutsch, unverändert** | — |

Drei Gründe, die Persona nicht anzufassen:

1. Sie **demonstriert** Ton und Siezen und ist damit faktisch ein
   Few-Shot-Beispiel. Beispiele in der falschen Sprache kosten 15–20 %
   Genauigkeit.
2. Ein englischer Persona-Text provoziert **Sprachwechsel in der Ausgabe**. Im
   Textchat wäre das ein Schönheitsfehler; hier wird es vorgelesen.
3. Deutsch ist eine Hochressourcen-Sprache. Der erwartete Gewinn ist klein und
   modellabhängig — dieselbe Studie findet für Llama-3.1-8B das Gegenteil wie
   für andere Modelle.

**Das kostet keine Migration.** Alles Maschinenseitige entsteht in 258 ohnehin
neu; es wird nur von Anfang an englisch geschrieben. Ob sich sogar die Persona
lohnt, wird in **250** als A/B gemessen (S250-10) statt diskutiert.

---

## 18. Kostenlos ja, unendlich nein

Die zweite PO-Frage, und sie greift in die Architektur ein.

**Kostenlos: ja** — kein Zahlungsmittel, kein Monatsbudget. **Unendlich: nein**
und war es nie. Das Free Tier begrenzt über *Raten*, pro Organisation und nicht
pro Schlüssel:

| Modell | RPM | Requests/Tag | Tokens/Tag |
|--------|-----|--------------|------------|
| `qwen3-27b`, `gpt-oss-20b`, `gpt-oss-120b` | 30 | **1.000** | 200.000 |
| `llama-3.1-8b-instant` | 30 | **14.400** | 500.000 |
| `groq/compound-mini` | 30 | **250** | — |
| `whisper-large-v3` | 20 | 2.000 | — |

Zuerst reißen die **Tages-Tokens**, nicht die Requests: bei rund 2.500 Tokens
pro Zug erlauben 200.000 TPD etwa **80 Züge am Tag**. Im Alltag reicht das; ein
Debug-Nachmittag mit hundert Prompts ist der ganze Tag.

Drei Eingriffe in diese Planung:

| Was | Wohin | Warum |
|-----|-------|-------|
| Kontingent-Auslöser am Sicherungsschalter, `x-ratelimit-remaining-*` lesen, vor der Grenze auf das lokale 0,5B | **251** (S251-9 … S251-15) | Aus „Jarvis sagt ab" wird „Jarvis wird schlichter" |
| Prompt-Tokens und Cache-Trefferquote als Kennzahl | **250** (S250-9) | Gecachte Tokens zählen **nicht** auf die Limits an — der Prompt-Schnitt kauft Tagesbudget |
| Mehrfach-Sampling nur auf dem 8B und nur bei belegtem Nutzen | **257** (S257-11) | 14.400 statt 1.000 Requests am Tag; das große Kontingent bleibt den Antworten |

Dabei sind zwei Funde am Groq-Pfad aufgefallen, die heute Kontingent verbrennen
und in 251 mitlaufen: `groq.ts` hat **kein Skip-Gedächtnis** (anders als
`gemini.ts` mit `markSkip`) und versucht pro Modell **erst Streaming, dann
Non-Streaming** — ein totes Modell an Position 1 kostet damit zwei Requests pro
Zug, jeden Zug. Und `GROQ_MODELS_BEST_FIRST[0]` ist `qwen/qwen3.8-27b`, während
Groqs Liste `qwen/qwen3.6-27b` führt. Das gehört nachgesehen, bevor irgendetwas
anderes am Kontingent optimiert wird.

Das lokale `qwen2.5-0.5b-instruct` ist die einzige wirklich unbegrenzte Ebene.
Damit ist es nicht nur Notnagel, sondern die Antwort auf ein leeres Kontingent —
vorausgesetzt, die Umschaltung passiert *vor* dem Fehler. Genau das ist
S251-10.
