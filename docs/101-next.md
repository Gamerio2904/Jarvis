# 101 — Ultron: kontrollierter Einsatz von Soup **PLAN** (`18.32`–`18.35`)

**Bedingung:** Ultron soll gesprochene Befehle zuverlässiger verstehen,
Planungswünsche passend in Plan, GUI und Projektdateien übersetzen, fehlende
Angaben gezielt klären und beim Sprechen kürzer und natürlicher antworten.
Soup soll dafür als mögliches Werkzeug geprüft werden, nicht als vorab
beschlossene Laufzeit-Abhängigkeit.

**Planungsstand:** Sprints **467–482**, aufgeteilt in vier
Release-Gates `18.32.0`–`18.35.0`. Die Gerätebasis `18.31.5` ist laut
Nutzerabnahme erfüllt; die nachfolgenden Geräte-/Release-Gates bleiben
weiterhin Voraussetzung für eine Freigabe. Unit-Tests oder ein Test-Build
allein ersetzen sie nicht.

**Ist-Stand im Arbeitsbaum (Code-Vorbereitung, keine Release-Abnahme):**

| Sprints | Im Code vorhanden und geprüft | Noch offen |
|---|---|---|
| 467–470 | Der Eval-Runner misst 530 Routingfälle; aktuelle Trefferquote 100 %, Rückfragequote 0 % und aktuell 0 falsche schreibende/Geräte-Routen. Explizite Mehrdeutigkeiten mit `oder` werden bei passendem Parser-Kandidaten nicht ausgeführt; Governance prüft Labels, Datenschutzmuster, Varianten und Familien-Splits. Datenschutztreffer werden aus dem Trainingssplit ausgeschlossen; der verbleibende Korpus wird sauber in Train/Test geteilt. | Vollständige kuratierte Verwechslungs-Goldfälle, dokumentierte Soup-/Shadow-Auswertung und Android-Laufzeitmessung. Der neue Messwert falscher ausführbarer Routen hat keine historische Baseline. |
| 471–474 | Planvalidator und Import-/Exporttests prüfen Planstruktur und Anforderungen-/Sprintreferenzen. Planvorschläge werden zunächst als Pending abgelegt und erst nach expliziter Bestätigung übernommen; Verwerfen/Ablauf/ungültige Vorschläge überschreiben keinen gespeicherten Plan. | Vollständiger Wunsch→Klärung→Vorschau→Bestätigung→Export-E2E über Browser/Android-Gate und abschließende Release-Abnahme fehlen. |
| 475–478 | Eine fehlende Erinnerungszeit wird gespeichert, auf dieselbe Unterhaltung gebunden, nach 15 Minuten verworfen, bei Abbruch entfernt und über Chat mit einer Zeitantwort fortgesetzt. | Pflichtfeld-Inventar und Goldabdeckung anderer Aktionen, Kontext-/Konfliktfälle sowie Datenschutz- und Android-Neustart-Gate fehlen. |
| 479–482 | TTS-Faktenprüfung vor Kürzung und Regressionstest für Faktenwahrung sind vorhanden. | Natürlichkeitsvergleich, hörbare Goldfälle, Messung auf Zielgeräten, Latenz-/Speicherwerte und durchgängiges Release-Gate fehlen. |

Die gezielten Routing-, Governance-, Plan-, Projektdatei-, Voice-Fact- und
Reminder-Follow-up-Tests bestehen. `eval:report` bestätigt 100 % Routingtreffer
auf 530 vorhandenen Korpusfällen; der Bericht zeigt für den noch nicht historisch
erfassten Messwert „Falsche ausführbare Route“ bewusst keine erfundene
Grundlinie. `tsc:scripts` meldet weiterhin Fehler in bestehenden
Test-/GUI-Skripten; der Produktionsbuild und die übrigen Release-Gates sind
separat zu prüfen. Soup bleibt ohne geprüften Modell-/Lizenz-/Gerätenachweis
außerhalb der App. Kein Gate `18.32.0`–`18.35.0` ist freigegeben.

## 1. Zielbild und Reihenfolge

1. **Befehle erkennen:** Aus Spracheingaben die passende bereits vorhandene
   Ultron-Funktion auswählen. Bei Unsicherheit bleibt die Eingabe ungeroutet
   oder Ultron fragt nach.
2. **Planung übersetzen:** Einen natürlichen Planungswunsch in geprüfte
   `IdeaPlan`-Daten und eine sichere Vorschau überführen. PSP/WBS, GUI und
   Exportdateien werden weiterhin aus dem gespeicherten Plan erzeugt.
3. **Fehlendes klären:** Erst passenden, aktuellen Gesprächskontext nutzen.
   Nur eindeutige und zulässige Informationen dürfen eine Rückfrage ersetzen;
   sonst wird genau die fehlende Pflichtangabe erfragt.
4. **Sprache kürzen:** Eine separate kurze Sprachfassung aus bereits
   vorhandenen Fakten bilden. Zahlen, Namen, Zeiten, Status und Unsicherheit
   dürfen dabei nicht verändert oder erfunden werden.

Die Bereiche werden in dieser Reihenfolge gebaut, weil zuverlässiges Routing
und explizite Bestätigungsgrenzen Voraussetzung für die späteren Fähigkeiten
sind. Jeder Bereich bekommt einen eigenen Vergleich und ein eigenes
Release-Gate.

## 2. Soup-Entscheidung und gemeinsame Schutzregeln

- Soup wird zuerst außerhalb der Android-App für Datensatzaufbereitung,
  Training und Auswertung geprüft. Es wird weder als App-Abhängigkeit noch als
  Cloud-Dienst vorausgesetzt.
- Vor einem Training werden Modelllizenz, Soup-Version, Python-/GPU-Annahmen,
  Exportformat und mögliche Laufzeit auf den tatsächlich unterstützten
  Geräten geprüft. Ein Export ist nicht automatisch mit Ultrons
  On-Device-Laufzeit kompatibel.
- Automatisch erzeugte Formulierungen erben nur dann ein Ziel-Label, wenn es
  aus einer bestehenden, geprüften Regel abgeleitet wurde. Widersprüche und
  uneindeutige Beispiele werden ausgesondert und sichtbar gemacht.
- Prüfdaten werden vor Trainingsbeginn getrennt. Nahezu gleiche Varianten
  eines Beispiels dürfen nicht zugleich in Trainings- und Prüfdaten landen.
- Keine privaten Chatverläufe, Notizen, Matrikelnummern oder persönlichen
  Inhalte werden automatisch gesammelt oder zum Training hochgeladen.
- Modellvorschläge lösen keine Aktion aus. Bestehende Parser, Validatoren,
  Berechtigungen und Bestätigungen bleiben maßgeblich.
- Es gibt einen Vergleichsmodus ohne Nutzereinfluss, messbare Rückfallpfade
  und die Möglichkeit, den Modellvorschlag vollständig abzuschalten.
- Besteht ein Modell ein Gate nicht oder passt das Format nicht zur App, wird
  die Funktion ohne Soup mit der vorhandenen Lösung ausgeliefert. Training ist
  kein Selbstzweck.

## 3. Technische Leitplanken für Jarvis/Ultron

Vor Umsetzung wird die jeweils aktuelle Implementierung neu geprüft. Als
Anknüpfungspunkte dienen die bestehenden Router-/Katalog-/Eval-Pfade
(`engine/route-pick.ts`, `engine/agents/parse-catalog.ts`,
`engine/eval/route-eval.ts`), Plan- und Simulationspfade
(`engine/idea.ts`, `engine/idea-plan.ts`, `engine/idea-simulation.ts`,
`engine/project-docs.ts`) sowie Rückfrage-, Gesprächs- und Sprachpfade.
Dateinamen sind kein Auftrag, diese Module unverändert auszubauen: Es gilt
jeweils die vorhandene Codestruktur zum Zeitpunkt des Sprints.

1. Kein zweiter Router, keine zweite Plan-Datenbank und keine parallele
   Modell-Wahrheit neben der vorhandenen Engine.
2. Trainierte Ausgaben werden auf ein enges, versioniertes Format begrenzt
   (z. B. bekannte Intent-ID oder erlaubte Planfelder), anschließend
   deterministisch validiert und erst als Vorschlag angezeigt.
3. Die aktive Brain-/Provider-Policy bleibt bestehen. Soup-Training ersetzt
   nicht Gemini oder ein anderes konfiguriertes Hauptmodell.
4. Persönlicher Recall bleibt an bestehende, lokale und vom Nutzer
   veranlasste Quellen gebunden; Training speichert keine individuellen
   Fakten in Modellgewichten.
5. Antwortformatierung ist von Aktion und Faktenabruf getrennt. Ein
   Sprachmodell darf keine fehlende Todo-, Termin- oder Notiz-Information
   ergänzen.

## 4. Versionen und Sprintfolge

Versionen sind aufeinanderfolgende Freigabestufen, keine Kalenderprognose.
Die App-Version steigt erst nach erfolgreichem automatisiertem und manuellem
Gate für die jeweilige Stufe. Die nächste Stufe beginnt erst nach Abnahme der
vorherigen.

| Version | Sprints | Ergebnis | Freigabebedingung |
|---|---:|---|---|
| `18.32.0` (`183200`) | 467–470 | Intent-Routing mit geprüften Daten und Soup-Vergleich | Keine Verschlechterung beim geschützten Routing; keine zusätzliche falsche Aktion; Laufzeit auf Zielgerät gemessen |
| `18.33.0` (`183300`) | 471–474 | Geprüfte Übersetzung von Planwunsch zu Vorschau und Export | Schema/Validierung grün; ungültige Vorschläge verändern keinen gespeicherten Plan oder Export |
| `18.34.0` (`183400`) | 475–478 | Kontextsensitives, gezieltes Nachfragen statt Raten | Pflichtangaben werden nicht erfunden; nur eindeutige und erlaubte Quelle kann Rückfrage ersetzen |
| `18.35.0` (`183500`) | 479–482 | Kürzere, natürliche Sprache und Gesamtintegration | Fakten bleiben unverändert; Sprachqualität und Latenz auf Gerät abgenommen |

### `18.32.0` — Sprachbefehle

| Sprint | Ergebnis | Abhängigkeit |
|---:|---|---|
| [467](./sprints/sprint-467.md) | Intent-Kategorien, Grenzen und Goldfälle festlegen | 466 / 18.31.5 Gate |
| [468](./sprints/sprint-468.md) | Geprüfte, nicht private Ausgangsdaten erzeugen | 467 |
| [469](./sprints/sprint-469.md) | Formulierungsvarianten, Datensatzprüfung und Trennung erzeugen | 468 |
| [470](./sprints/sprint-470.md) | Ist-Verhalten messen und Soup im Vergleich bewerten | 469 |

### `18.33.0` — Planungswunsch zu GUI und Dateien

| Sprint | Ergebnis | Abhängigkeit |
|---:|---|---|
| [471](./sprints/sprint-471.md) | Eingabe sicher auf vorhandene Planfelder abbilden | 470 |
| [472](./sprints/sprint-472.md) | Nur erlaubte GUI-Bausteine als Vorschau übernehmen | 471 |
| [473](./sprints/sprint-473.md) | Validierten Plan konsistent in Exporte überführen | 472 |
| [474](./sprints/sprint-474.md) | Planungsgold, Vergleich und Release-Gate | 471–473 |

### `18.34.0` — Fehlende Angaben

| Sprint | Ergebnis | Abhängigkeit |
|---:|---|---|
| [475](./sprints/sprint-475.md) | Pflichtangaben je Aktion festlegen | 474 |
| [476](./sprints/sprint-476.md) | Eindeutigen Gesprächs- und lokalen Kontext prüfen | 475 |
| [477](./sprints/sprint-477.md) | Gezielte Rückfrage sicher fortsetzen oder abbrechen | 476 |
| [478](./sprints/sprint-478.md) | Nicht-Raten-, Datenschutz- und Release-Gate | 475–477 |

### `18.35.0` — Kurze und natürliche Sprachantworten

| Sprint | Ergebnis | Abhängigkeit |
|---:|---|---|
| [479](./sprints/sprint-479.md) | Sprachfassung von Chat-Antwort unterscheiden | 478 |
| [480](./sprints/sprint-480.md) | Fakten vor Kürzung und Umformulierung schützen | 479 |
| [481](./sprints/sprint-481.md) | Natürlichkeit, Verständlichkeit und Rückfall testen | 480 |
| [482](./sprints/sprint-482.md) | Gemeinsame Regression und Release-Gate `18.35.0` | 470, 474, 478, 481 |

## 5. Gemeinsame Abnahme

1. Jeder Soup-Datensatz ist versioniert und hat Herkunft, erlaubten Zweck,
   Label-Regel und getrennte Train-/Prüfzuordnung; private Nutzerdaten sind
   ausgeschlossen.
2. Für jedes Modell gibt es einen reproduzierbaren Vergleich mit dem
   vorhandenen Verhalten auf festgehaltenen Prüffällen.
3. Routing darf die Zahl falscher ausführbarer Aktionen gegenüber der
   bestehenden Lösung nicht erhöhen. Bei unsicherer Zuordnung wird gefragt
   oder der bisherige sichere Weg genutzt.
4. Ungültige Modellantworten, unbekannte Felder und Modell-/Netzfehler werden
   sichtbar gemeldet; sie werden nicht als Erfolg gespeichert.
5. Planungsvorschläge durchlaufen denselben IdeaPlan-Validator wie andere
   Pläne. Nur erlaubte Komponenten werden angezeigt; Export stammt aus dem
   validierten gespeicherten Plan.
6. Bei Erinnerungen und anderen Aktionen fehlen Pflichtangaben nie still:
   eine vorhandene Information wird nur bei eindeutigem Treffer und passendem
   Kontext genutzt, sonst fragt Ultron nach.
7. Sprachfassungen verändern keine Namen, Zahlen, Datum/Uhrzeit,
   Fälligkeitsstatus, Listeninhalt, Quellenlage oder Unsicherheitsmarkierung.
8. Abschließende Freigabe umfasst Browser- und Android-Geräteabnahme,
   Rückfallverhalten, Reaktionszeit und Regression der bestehenden
   Einkaufs-, Todo-, Notiz-, Kalender-, Planungs- und Chat-Flows.

## 6. Nicht-Ziele

- Kein Training auf persönlichen Nutzerdaten oder heimlicher Upload von
  Gesprächsverläufen.
- Kein Ersatz des Haupt-LLM und keine pauschale Behauptung, ein kleines
  Modell sei schneller oder besser, bevor es gemessen wurde.
- Keine Modellaktion ohne bestehende Parser-, Validierungs-,
  Bestätigungs- und Berechtigungsgrenzen.
- Keine frei ausführbaren UI-Dateien, HTML, CSS, JavaScript oder Agenten-Skripte
  aus Modellantworten.
- Keine automatische Änderung an App-Version oder APK vor bestandenem Gate.
- Kein verbindlicher Soup-Einbau, falls Export, Lizenz, Laufzeit,
  Datenschutz oder Qualitätsmessung nicht passt.
