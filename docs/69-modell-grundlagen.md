# 69 — Modell-Grundlagen: was davon Jarvis betrifft

> Referenz, kein Sprint. Grundlage ist die PO-Research vom `17.0`-Planungsstand,
> korrigiert und auf den Code in `16.1.1` bezogen. Zweck: begründen, warum die
> Sprints 249–259 so geschnitten sind — und welche Ideen aus der Research bei
> **diesem** Projekt nichts bringen.

Die Leitentscheidung bleibt: **Parser wählen Geräte, das Modell formuliert.**
Nichts in diesem Dokument gibt einem Modell die Hand am Fernseher.

---

## 0. Die eine Unterscheidung, die alles ordnet

Jeder Punkt unten fällt in genau eine von zwei Spalten. Wer sie verwechselt,
plant Arbeit ein, die dieses Projekt nicht leisten kann.

| Trainingszeit | Inferenzzeit |
|---------------|--------------|
| Pre-Training, SFT, RLHF, DPO | Prompt, Retrieval, Sampling, Decoding |
| ändert Gewichte | ändert **kein** Gewicht |
| braucht GPUs, Daten, Wochen | braucht einen HTTP-Aufruf |
| für Jarvis **nicht verfügbar** | Jarvis' gesamter Hebel |

Jarvis hat keine Trainingsstrecke, keine GPU und keinen Datensatz in der
Größenordnung. Alles, was dieses Projekt an einem Modell verbessern kann,
passiert rechts. Das ist keine Einschränkung, die man beheben sollte — es ist
die Arbeitsteilung, die ein Assistent auf einem Handy ohnehin haben will.

---

## 1. Korrekturen an der Research

### 1.1 Test-Time-Reasoning ist **kein** Reinforcement Learning zur Laufzeit

Das ist der Fehler mit den größten Folgen, weil er zu falscher Planung führt.

**Behauptung:** Ein Reasoning-Modell „lernt" beim Nachdenken, es betreibe RL zur
Laufzeit.

**Richtig:** Zur Inferenz ändert sich **kein einziges Gewicht**. Was tatsächlich
passiert: das Modell gibt mehr Tokens aus, bevor es antwortet — Zwischenschritte,
Verwerfen, neu ansetzen. Man kauft Qualität mit *Tokens*, nicht mit Lernen. Das
RL fand beim **Training** statt und hat dem Modell beigebracht, diese Tokens
sinnvoll zu nutzen.

**Für Jarvis:** Die Unterscheidung ist der Unterschied zwischen einer Aufgabe,
die unmöglich ist (RL), und einer, die 20 Zeilen kostet (mehrfach sampeln, siehe
[`sprint-257`](./sprints/sprint-257.md) §Rückfallebene). Zusätzlich: mehr Tokens
sind bei 200.000 Tokens am Tag (§3) direkt bezahlt. „Länger nachdenken lassen"
ist hier keine freie Verbesserung.

### 1.2 `König − Mann + Frau = Königin` ist ein schlechtes Beispiel

**Behauptung:** Embeddings rechnen mit Bedeutung, belegt durch die Analogie.

**Richtig:** Der Befund stammt aus `word2vec` (2013) und ist seither
weitgehend relativiert. Er funktioniert nur, wenn man die drei Eingabewörter
von der Suche nach dem nächsten Nachbarn **ausschließt** — sonst kommt meist
`König` selbst heraus. Moderne kontextuelle Embeddings zerlegen sich ohnehin
nicht so sauber in Richtungen.

**Für Jarvis:** Die interessante Eigenschaft ist eine völlig andere und viel
langweiligere: **liegen Äußerungen derselben Absicht näher beieinander als
Äußerungen verschiedener Absicht?** Nur das entscheidet, ob Sprint 257
funktioniert. Deshalb steht dort jetzt ein Trennschärfe-Test *vor* der
Verdrahtung — nicht die Hoffnung, dass „Embeddings Bedeutung verstehen".

### 1.3 Self-Attention: `Value` ist nicht „der Inhalt des Tokens"

**Behauptung:** `Query` und `Key` finden zusammen, `Value` ist der Inhalt.

**Richtig:** Alle drei sind **gelernte Projektionen** derselben Eingabe. `Value`
ist nicht der Inhalt des Tokens, sondern *was dieses Token zum Ergebnis
beiträgt, wenn es beachtet wird*. Zwei weitere Auslassungen, die für die Praxis
zählen:

- **Mehrere Köpfe.** Attention läuft parallel in vielen Köpfen. Viele davon
  machen keine „Bedeutung", sondern Buchführung: Position, Klammern, Bezug auf
  das vorige Vorkommen.
- **Es ist eine gewichtete Summe, kein Auswählen.** Das Bild „das Modell schaut
  auf die wichtigen Wörter" führt in die Irre; jedes Token trägt bei, nur
  unterschiedlich stark.

**Für Jarvis:** Praktisch folgt daraus vor allem, dass die **Reihenfolge im
Prompt** zählt und dass sehr lange Kontexte in der Mitte an Wirkung verlieren.
Das stützt den Prompt-Schnitt in `prompt-split.ts`: Statisches nach vorne,
Wechselndes nach hinten.

### 1.4 Nächstes **Token**, nicht nächstes Wort

Kleine Korrektur mit realer Folge: die Einheit ist das Token, nicht das Wort.
Bei BPE zerfallen deutsche Komposita in Teile — `Wohnzimmerlampe` ist kein
Token, sondern mehrere. Deutsche Texte kosten für denselben Inhalt spürbar mehr
Tokens als englische.

**Für Jarvis:** Betrifft **nur** den Modellpfad. Die 60 Parser arbeiten mit
regulären Ausdrücken auf dem Rohtext und kennen keine Tokens — für die
deterministische Bahn ist Tokenisierung vollständig gleichgültig. Wo sie zählt,
zählt sie doppelt: als Kosten (§3) und als Grund für die Sprachaufteilung (§2).

### 1.5 SFT bringt Form, nicht Wissen

Die Research stellt SFT als „dem Modell Fragen und Antworten beibringen" dar.
Genauer: SFT prägt vor allem **Format, Ton und Gehorsam gegenüber
Anweisungen**. Faktenwissen stammt aus dem Pre-Training und lässt sich per
Fine-Tuning nur unzuverlässig nachrüsten — es wird gern flüssig und falsch
wiedergegeben.

**Für Jarvis:** Das ist genau die Begründung für `knowledge-block.ts`. Wissen
gehört in den Kontext, nicht in Gewichte. Der bestehende Weg — abrufen, mit
Quelle in den Prompt legen, nur Belegtes behaupten — ist nicht die
Behelfslösung, sondern der richtige.

### 1.6 RLHF und DPO sind nicht dasselbe

RLHF: Präferenzdaten sammeln → **Reward-Modell** trainieren → Policy dagegen
optimieren (PPO). DPO spart das Reward-Modell und optimiert direkt auf
Präferenzpaaren. DPO ist deutlich einfacher und heute in offenen Projekten der
Normalfall.

**Für Jarvis:** Beides Trainingszeit, beides nicht verfügbar. Aber der
*Rohstoff* ist verfügbar und wird gerade gebaut: **Präferenzdaten sind der
Eval-Korpus.** „Diese Äußerung soll auf diesen Agenten zeigen" ist ein
Präferenzpaar. Sprints 249/250 legen damit genau das an, was ein Training
bräuchte — und was hier schon ohne Training den Nutzen bringt.

---

## 2. Interne Sprache: Deutsch oder Englisch?

Die Frage kam aus §1.4 — wenn Deutsch mehr Tokens kostet und Modelle
überwiegend englisch trainiert sind, wäre ein englischer System-Prompt dann
nicht besser?

**Antwort: teils, nach Funktion getrennt — und die Belege sind schwächer, als
die Frage vermuten lässt.**

### 2.1 Was die Forschung sagt

Der Konsens heißt *selective pre-translation*: nicht ganz oder gar nicht,
sondern nach Bestandteil.

| Befund | Quelle |
|--------|--------|
| Struktur- und Formatanweisungen werden auf Englisch zuverlässiger befolgt | MEGA-Benchmark; mehrere Prompting-Studien |
| Für **Ton und Förmlichkeit** ist die Zielsprache besser | dieselben |
| **Beispiele in der falschen Sprache kosten 15–20 % Genauigkeit** | Shi et al.; Selective-Pre-Translation-Arbeiten |
| Vollübersetzung schneidet schlechter ab als selektive | arXiv 2502.09331 |
| Der Effekt ist **modellabhängig** und bei Hochressourcen-Sprachen klein | arXiv 2507.22923 |

Der letzte Punkt ist der Dämpfer: Deutsch ist eine Hochressourcen-Sprache. Der
große Gewinn tritt bei schwach vertretenen Sprachen auf. Und dieselbe Arbeit
findet, dass Llama-3.1-8B mit englischen Prompts besser fährt, während andere
Modelle mit übersetzten Anweisungen besser werden. Es gibt hier **keine
allgemeingültige Antwort**, nur eine messbare.

### 2.2 Entscheidung

| Bestandteil | Sprache | Begründung |
|-------------|---------|------------|
| Persona, Ton, Siezen, Beispielantworten | **Deutsch, unverändert** | Es sind faktisch Few-Shot-Beispiele; Übersetzen kostet 15–20 %. Das Siezen wird **gezeigt**, nicht beschrieben |
| Werkzeug-Beschreibungen, JSON-Schema, Feldnamen, Intent-Labels, Klassifikator-Prompts | **Englisch** | Erreicht nie den Nutzer; Struktur-Anweisungen sitzen auf Englisch fester |
| Code-Kommentare, `docs/` | **Deutsch, unverändert** | Eigentumsfrage, keine Modellfrage. Kostet viel, bringt funktional null |

**Der Grund, warum das billig ist:** Diese Aufteilung braucht **keine
Migration**. Die Persona bleibt, wie sie ist. Alles Maschinenseitige entsteht in
[`sprint-258`](./sprints/sprint-258.md) ohnehin neu — es muss nur von Anfang an
englisch geschrieben werden. Kein Umbau, nur eine Regel für Neues.

### 2.3 Das Risiko, das gegen mehr Englisch spricht

Ein englischer Persona-Text provoziert **Sprachwechsel** in der Ausgabe. Bei
einem Textchat wäre das ein Schönheitsfehler. Hier läuft TTS: ein englischer
Satz wird mit deutscher Stimme vorgelesen oder wechselt die Stimme. Das ist ein
sichtbarer Fehler mit Ansage — und der Grund, die Persona nicht anzutasten,
selbst wenn eine Messung ein kleines Plus zeigt.

### 2.4 Offen, und ab Sprint 250 messbar

Ob sich sogar die Persona lohnt, ist keine Glaubensfrage, sobald die Eval steht.
Als A/B in [`sprint-250`](./sprints/sprint-250.md) aufgenommen: derselbe Korpus,
deutscher gegen englischen Anweisungsblock, gemessen an Trefferquote,
Rückfrage-Quote, Prompt-Tokens und Sprachtreue der Ausgabe. Vorher wird nichts
umgestellt.

---

## 3. Kostenlos ja, unendlich nein

Die zweite PO-Frage. Die Antwort betrifft die Architektur, nicht nur die
Rechnung.

**Kostenlos: ja.** Kein Zahlungsmittel nötig, kein Monatsbudget.
**Unendlich: nein** — und war es nie. Das Free Tier ist über *Raten* begrenzt,
und die Grenzen gelten **pro Organisation, nicht pro Schlüssel**. Mehrere Keys
bringen nichts.

| Modell | RPM | Requests/Tag | Tokens/Tag |
|--------|-----|--------------|------------|
| `qwen3-27b`, `gpt-oss-20b`, `gpt-oss-120b` | 30 | **1.000** | 200.000 |
| `llama-3.3-70b-versatile` | 30 | 1.000 | 100.000 |
| `llama-3.1-8b-instant` | 30 | **14.400** | 500.000 |
| `groq/compound-mini` | 30 | **250** | — |
| `whisper-large-v3` / `-turbo` | 20 | 2.000 | — |

Stand Planungszeitpunkt; Groq ändert die Tabelle ohne Ankündigung. Maßgeblich
ist immer die eigene Konsole.

### 3.1 Was zuerst reißt

Nicht die Requests, sondern die **Tages-Tokens**. Bei rund 2.500 Tokens pro Zug
erlauben 200.000 TPD etwa **80 Züge am Tag**. Für einen einzelnen Nutzer reicht
das; ein Debug-Nachmittag mit hundert Prompts ist dagegen der ganze Tag.

Das lokale 0,5B (`qwen2.5-0.5b-instruct`) ist die einzige wirklich unbegrenzte
Ebene. Es ist damit nicht nur Notnagel, sondern die Antwort auf ein leeres
Kontingent — vorausgesetzt, die Umschaltung passiert *vor* dem Fehler.

### 3.2 Drei Folgen für die Planung

**Prompt-Caching zählt doppelt.** Gecachte Eingabe-Tokens zählen **nicht** auf
die Rate-Limits an. Der Prompt-Schnitt in `prompt-split.ts` spart also nicht nur
Latenz, er kauft Kontingent. Deshalb ist die Cache-Messung in Sprint 250 eine
Kennzahl und keine Fußnote.

**Der Sicherungsschalter braucht einen zweiten Auslöser.**
[`sprint-251`](./sprints/sprint-251.md) zählt Fehlschläge. Groq schickt in jeder
Antwort `x-ratelimit-remaining-*`. Diese Werte zu lesen und bei knappem
Kontingent auf das lokale Modell zu gehen, ist dieselbe Mechanik mit anderem
Auslöser — und der Unterschied zwischen „Jarvis wird langsamer" und „Jarvis
sagt ab".

**Mehrfach-Sampling wird teuer.** Drei Stimmen statt einer heißt dreifaches
Kontingent an dieser Stelle. Zwei Auflagen, beide in Sprint 257 eingetragen:
nur ausführen, wenn die gemessene Rückfrage-Quote klein genug ist, dass sich das
rechnet — und die Entscheidung auf `llama-3.1-8b-instant` legen. Das hat
**14.400 statt 1.000** Requests am Tag, und „welcher dieser zwei Agenten" ist
eine triviale Aufgabe. Das große Kontingent bleibt den Antworten.

---

## 4. Was aus der Research bewusst **nicht** übernommen wird

| Idee | Warum nicht |
|------|-------------|
| Fine-Tuning / SFT auf eigenen Daten | Keine Trainingsstrecke, keine GPU. Und §1.5: es bringt Form, nicht Wissen — Form ist hier nicht das Problem |
| RLHF oder DPO | Trainingszeit. Der Rohstoff (Präferenzpaare) wird als Eval-Korpus trotzdem angelegt |
| Reasoning-Modus („länger nachdenken lassen") | Bezahlt in Tokens, die laut §3 knapp sind. Bei einem Sprachassistenten kostet es zusätzlich das, was am meisten zählt: Antwortzeit |
| Eigene Embeddings trainieren | `multilingual-e5-small` von der Stange reicht für Intent-Trennung. Trainieren wäre Trainingszeit |
| Spekulatives Decoding | Betrifft den Anbieter, nicht den Client. Nichts, was dieses Projekt beeinflussen kann |
| Größeres lokales Modell statt 0,5B | Bindet RAM im WebView und verlängert den Kaltstart. Das lokale Modell ist Rückfallebene, nicht Hauptweg |

---

## 5. Woran die Sprints hängen

| Grundlage | Sprint | Was daraus wird |
|-----------|--------|-----------------|
| §1.2 Trennschärfe statt Analogie | **257** | Messung *vor* der Verdrahtung |
| §1.3 Prompt-Reihenfolge, lange Kontexte | 250 | Cache-Trefferquote als Kennzahl |
| §1.4 Tokens ≠ Wörter | 250, §2 | Prompt-Tokens messen; Sprachaufteilung |
| §1.5 Wissen in den Kontext | — | Bestätigt `knowledge-block.ts`, kein Umbau |
| §1.6 Präferenzdaten | **249/250** | Der Eval-Korpus *ist* der Datensatz |
| §1.1 Sampling statt RL | 257 | Mehrfach-Sampling als Rückfallebene |
| §3 Kontingent | **251** | Kontingent-Auslöser am Sicherungsschalter |
| §2 Sprache | 250, 258 | A/B messen; Neues maschinenseitig englisch |
