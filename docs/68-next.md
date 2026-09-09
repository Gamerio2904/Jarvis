# 68 — Messbar und unterbrechbar **PLAN** (`17.0.0`)

Ausgangspunkt: Code `16.1.1`. Die acht Upgrades aus [`67-upgrades.md`](./67-upgrades.md)
plus die vier Reste, die beim Audit für `16.1.x` offen blieben, als
Lieferreihenfolge.

Die Leitentscheidung bleibt: **Parser wählen Geräte, das Modell formuliert.**
Kein Sprint hier gibt einem Modell die Hand am Fernseher.

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
| 257 | Trefferquote sinkt oder Rückfrage-Quote steigt gegenüber der Baseline |
| 258 | ein Modellvorschlag erreicht ein Gerät ohne Bestätigung |
| 259 | der Ring-Puffer wächst über seine Grenze |

## 16. PO-Testreihenfolge

Nach **252** die erste APK dieser Schiene (die Lage-Entscheidung ist sichtbar),
nach **255** die zweite (Sprachmodus), nach **259** das Meilenstein-Sideload.
