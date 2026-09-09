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
| `16.3.0` | 250 | Eval-Kennzahlen, Prompt-Tokens, Sprach-A/B | Ohne Messwert ist 257 nicht bewertbar |
| `16.4.0` | 251 | Sicherungsschalter + Kontingent + Agenten-Reste | Trägt in allen vier Kategorien; hängt an nichts |
| `16.5.0` | 252 | Lage-Entscheidung + Wecker-Nummer | Zwei bekannte Reste, klein und abgeschlossen |
| `16.6.0` | 253 | Abbruch bis in die Handler + Barge-in verdrahten | Spart Akku, Kontingent und verwaisten Zustand |
| `16.7.0` | 254 | Satzende-Heuristik (Stufe A), Silero opt-in (Stufe B) | Die offene Beschwerde, an der tatsächlichen Ursache |
| `16.8.0` | 256 | Feldschutz + Migrationsschritte | Netz für alle Sprints, die Felder anlegen |
| `16.9.0` | 257 | Intent-Embeddings, nur auf dem ambigen Pfad | Braucht 250 als Netz |
| `16.10.0` | 258 | Werkzeug-Vertrag, erzwungenes JSON, Schemas englisch | Größte Reichweite, größter Eingriff |
| **`17.0.0`** | 259 | Historie im Speicher + **Meilenstein** | Abschluss; Sideload |

**Aufgelöst:** Sprint **255** — beide Hälften existieren im Code
([`sprints/sprint-255.md`](./sprints/sprint-255.md)). Der Rest steckt in 253
(S253-9) und 254 (Stufe A).

`17.0.0` bedeutet: **Jarvis kann sich selbst messen, lässt sich unterbrechen und
überlebt ein leeres Kontingent.**

---

## 2. Abhängigkeiten

```text
249 Eval-Rahmen
 └─ 250 Kennzahlen ────────────────┐
                                   ├─ 257 Intent-Embeddings ─ 258 Werkzeug-Vertrag
251 Sicherungsschalter + Kontingent│
252 Lage + Wecker-Nummer           │
253 Abbruch + Barge-in             │
254 Satzende (A) → Silero (B)      │
256 Feldschutz ────────────────────┘
                                    └─ 259 Historie + Meilenstein
```

Frei kombinierbar: **251**, **252**, **253**, **254 Stufe A** und **256** hängen
an nichts. Harte Ketten: **250 → 257**, **254 A → 254 B**, alles → **259**.

Das ist der Unterschied zur vorigen Fassung: durch das Auflösen von 255 hängt
der ganze Sprachmodus-Block an nichts mehr. **254 Stufe A** kann sofort und
allein ausgeliefert werden.

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

## 3b. Der Prioritätentest

Vier Vorgaben des PO, in dieser Reihenfolge: **hohe Antwortqualität**, **alles
funktioniert**, **wenig Latenz**, **kostenlos und so viel wie möglich nutzbar**.
Dazu die Regel: *nur ändern, wenn es einer Kategorie nutzt, ohne einer anderen zu
schaden.*

Jeder Sprint dieser Schiene ist danach durchgerechnet. Was blieb:

| Sprint | Qualität | Funktioniert | Latenz | Kostenlos | Urteil |
|--------|----------|--------------|--------|-----------|--------|
| 249 Eval-Rahmen | mittelbar | **+** | — | — | bleibt |
| 250 Kennzahlen | mittelbar | **+** | **+** messbar | **+** Cache | bleibt |
| 251 Schalter + Kontingent | **+** ehrlich statt erfunden | **+** | **+** kein 25-s-Warten | **+** | bleibt, stärkster Sprint |
| 252 Lage + Wecker | — | **+** | — | — | bleibt, klein |
| 253 Abbruch + Barge-in | — | **+** kein Fremdzustand | **+** | **+** kein verwaister Abruf | bleibt |
| 254 A Satzende | **+** kein Abschneiden | **+** | **+** kein 1100-ms-Warten | — | bleibt, **vorgezogen** |
| 254 B Silero | **+** bei Störgeräusch | ~ Risiko | ~ Inferenz | — | bleibt **opt-in** |
| 256 Feldschutz | — | **+** | — | — | **verkleinert** |
| 257 Embeddings | **+** bei Gleichstand | ~ | **−→0** mit Schranke | — | bleibt **mit Schranke** |
| 258 Werkzeug-Vertrag | **+** Reichweite | ~ | 0 mit S258-12 | 0 mit S258-12 | bleibt **mit Bedingung** |
| 259 Historie | — | **+** | 0 im Speicher | — | **verkleinert** |

Was **nicht** blieb, und warum:

| Gestrichen | Kategorie, in der es geschadet hätte |
|------------|--------------------------------------|
| Sprint 255, Klassifikator fürs Satzende | Latenz (Aufruf pro Transkript-Änderung) und Kontingent — bei einer Regex, die den Fall schon löst |
| Sprint 255, Barge-in | nichts gewonnen: existiert bereits vollständig |
| 256, Aufteilung in drei Bereiche | „alles funktioniert": 250 Felder umziehen, während der akute Verlust seit `16.1.1` abgefangen ist |
| 259, Ring-Puffer in IndexedDB | Latenz und Akku: ein Schreibvorgang je Zug für ein Debug-Werkzeug |
| 259, OTel-Attributnamen | keine Wirkung in allen vier — es gibt keinen Collector und soll keinen geben |
| 257, Embedding bei jedem Zug | Latenz auf dem schnellen Pfad, wo Parser in Mikrosekunden entscheiden |
| 258, zweiter Modellaufruf je Zug | Latenz **und** Kontingent, bei 1.000 Requests am Tag die Hälfte |

Der Prüfstein war in jedem Fall dieselbe Frage: **liegt der Nutzen im Code oder
in der Annahme?** Fünfmal lag er in der Annahme, und der Code konnte es schon.

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

## 6. Sprint 251 — Sicherungsschalter + Kontingent (`16.4.0`)

Drei Fehlschläge in Folge → 60 s ehrliche Absage statt volles Budget. Derselbe
Schalter mit zweitem Auslöser für das **Kontingent** (§18): unter der Schwelle
antwortet das lokale 0,5B, statt in `429` zu laufen. Dazu die zwei Agenten-Reste
aus dem Audit — `identity` ohne Executor, und ein `verify`, das acht Module
selbst machen und der Director nur im Kommentar behauptet — plus drei Funde am
Groq-Pfad, die heute Requests verbrennen.

Details: [`sprints/sprint-251.md`](./sprints/sprint-251.md)

## 7. Sprint 252 — Lage-Entscheidung + Wecker-Nummer (`16.5.0`)

`lageScene` steht hart auf `false`; damit ist `lageSceneOf` unbenutzt und der
CSS-Zweig `.is-lage-scene` tot. **Braucht eine PO-Entscheidung**, weil die
46vh-Grenze der Blackscreen-Fix war. Dazu: `notify_id` speichern statt hashen.

Details: [`sprints/sprint-252.md`](./sprints/sprint-252.md)

## 8. Sprint 253 — Abbruch bis in die Handler + Barge-in (`16.6.0`)

`budget.ts` schneidet nur das Warten ab; der Handler läuft weiter und kann noch
`saveSettings` schreiben, nachdem sein Ergebnis verworfen wurde. Dazu S253-9:
das **bestehende** Barge-in an den Controller hängen — es bricht heute nur die
Stimme ab, nicht die Arbeit.

Details: [`sprints/sprint-253.md`](./sprints/sprint-253.md)

## 9. Sprint 254 — Satzende-Heuristik, dann Silero (`16.7.0`)

Die alte Begründung war falsch: `silenceMsFor` hält bereits dynamisch (220 ms
oder 1100 ms). Der Fehler sitzt in `turnLooksComplete`, wo Länge als
Vollständigkeitsbeleg gilt — „Licht an" wartet 1100 ms, „Erinnere mich morgen
früh um acht" wird nach 220 ms abgeschnitten. **Stufe A** korrigiert das ohne
Modell. **Stufe B** holt Silero nach, opt-in, nur gegen Störgeräusch.

Details: [`sprints/sprint-254.md`](./sprints/sprint-254.md)

## 10. Sprint 255 — **aufgelöst**

Barge-in existiert (`watchBargeIn`, `cutIn`, `BARGE_IGNORE_TTS_MS`), das
semantische Satzende existiert als Regex (`turnLooksComplete`). Der geplante
Klassifikator hätte Latenz und Kontingent gekostet, ohne einen offenen Fall zu
lösen. Rest: S253-9 und 254 Stufe A.

Details: [`sprints/sprint-255.md`](./sprints/sprint-255.md)

## 11. Sprint 256 — Feldschutz + Migrationsschritte (`16.8.0`)

Ein kaputtes Feld soll dieses Feld kosten, nicht den Eintrag — und ein
umbenanntes Feld nicht still seinen Wert. Die geplante Aufteilung in drei
Bereiche ist gestrichen: der akute Datenverlust ist seit `16.1.1` durch
`parkBrokenSettings` abgefangen, und 250 Felder umzuziehen wäre Risiko ohne
Gewinn.

Details: [`sprints/sprint-256.md`](./sprints/sprint-256.md)

## 12. Sprint 257 — Intent-Embeddings (`16.9.0`)

Die Bewertungsschicht wird gelernt statt handgestimmt, aber **nur bei
Gleichstand**. Auf dem schnellen Pfad entscheiden weiter die Parser, damit
„Licht an" nicht langsamer wird. Die Parser bleiben.

Details: [`sprints/sprint-257.md`](./sprints/sprint-257.md)

## 13. Sprint 258 — Werkzeug-Vertrag (`16.10.0`)

Der Vorschlag darf vom Modell kommen, die Ausführung nicht — und das Ganze in
**einem** Modellaufruf, sonst kostet die Reichweite Latenz und Kontingent.

Details: [`sprints/sprint-258.md`](./sprints/sprint-258.md)

## 14. Sprint 259 — Historie im Speicher + Meilenstein `17.0.0`

`latency.ts` hält schon 24 Züge mit Zeiten und Pfad, `trace-store.ts` 200
Traces. Was fehlt, ist das Durchblättern — nicht die Erfassung. Der geplante
IndexedDB-Ring entfällt, weil ein Schreibvorgang je Zug den Normalbetrieb
bremst. Danach Sideload `17.0.0`.

Details: [`sprints/sprint-259.md`](./sprints/sprint-259.md)

---

## 15. Abbruchkriterien

Jeder Sprint hat eine Bedingung, unter der er **nicht** ausgeliefert wird:

| Sprint | Rot, wenn |
|--------|-----------|
| 249 | ein Prompt aus dem alten Korpus fehlt in der neuen Quelle |
| 250 | die Kennzahlen des Vorlaufs lassen sich nicht reproduzieren |
| 251 | der Schalter hält einen gesunden Agenten zurück, oder die Kontingent-Schwelle greift zu früh |
| 252 | der Blackscreen kommt zurück |
| 253 | ein abgebrochener Zug schreibt weiter in den Speicher |
| 254 A | mehr abgeschnittene Sätze **oder** längeres Warten bei Kurzbefehlen |
| 254 B | Start-Bundle wächst, oder Akkuverbrauch im Sprachmodus steigt messbar |
| 256 | eine Migration verliert ein Feld, oder `zod` kostet Startzeit |
| 257 | der Trennschärfe-Test scheitert, Trefferquote sinkt, oder der schnelle Pfad wird langsamer |
| 258 | ein Modellvorschlag erreicht ein Gerät ohne Bestätigung, oder der `none`-Pfad braucht zwei Aufrufe |
| 259 | das Zusammenführen bremst die Antwort |

Zwei Kriterien sind neu und folgen direkt aus den PO-Prioritäten. Bei **254 A**
zählt nicht nur, ob weniger abgeschnitten wird — auch längeres Warten ist ein
Rückschritt, sonst tauscht man ein Ärgernis gegen ein anderes. Bei **257** und
**258** ist die Latenz des jeweiligen Pfads ein hartes Kriterium, gemessen mit
`latencyP95` aus `latency.ts` vorher und nachher.

## 16. PO-Testreihenfolge

Nach **252** die erste APK dieser Schiene (die Lage-Entscheidung ist sichtbar),
nach **254 Stufe A** die zweite (Sprachmodus — und die kann früh kommen, weil
Stufe A an nichts hängt), nach **259** das Meilenstein-Sideload.

Wenn der PO nur **eine** Sache früh auf dem Gerät sehen will, dann **254 Stufe
A**: es ist die einzige Änderung dieser Schiene, die die lauteste Beschwerde
behebt, in Node prüfbar ist und weder Download noch Netz braucht.

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
