# 100 — Tischplatte: Planungsmodus-Rework **CODE; Geräte-Gate offen** (`18.28`–`18.31`)

**Bedingung:** Der Planungsmodus soll aus einer Projektidee einen prüfbaren,
interaktiven und exportierbaren Plan machen. Intake, Rückfragen, optionale
Recherche, Simulation, Sprintplanung und Exporte müssen als nachvollziehbarer
Arbeitsgang zusammenhängen, ohne bestehende Projekt-, Ablauf-, Entwurfs- oder
Portfoliofunktionen zu beschädigen.

**Planungsstand:** Die Umsetzung und der Test-Build `18.31.0` liegen vor;
Geräteabnahme und finale Freigabe sind offen. Die ursprünglichen Sprints
**444–466** sind umgesetzt. Die
Versionen `18.26.0` / `18.27.0` sind für die bereits angelegten Notiz- und
Todo-Schienen vorgesehen. Dieser Rework beginnt daher nach deren Release-Gates
mit `18.28.0`. Keine Kalenderdaten werden angenommen.

**Ausgangslage zur Planung:** Die Planung entstand auf Basis von
`18.25.15`; inzwischen enthält der Test-Build `18.31.0` die umgesetzten
Arbeiten aus Sprints 431–466. Der Test-Build ist noch nicht final auf einem
Android-Gerät abgenommen. Sprintnummern 431–443 bleiben belegt.

## 1. Zielbild

Eine Planung ist ein persistiertes Projekt mit eindeutigen Phasen und
Übergängen:

1. **Aufnehmen:** Originalbedingung, Rahmen und Projektbezug bleiben erhalten.
2. **Klären:** Nur offene Entscheidungen, die ein falsches Gateway oder eine
   falsche Umsetzung verursachen würden, führen zu einer Rückfrage.
3. **Recherchieren:** Lokal vorhandenes Wissen zuerst. Externe Recherche nur
   nach klarer Nutzerabsicht oder bestätigtem Vorschlag; Quellen bleiben an
   den Aussagen sichtbar.
4. **Simulieren:** GUI- und Ablauf-Simulation sind getrennte, ausdrücklich
   simulierte Vorschauen ohne beliebige Codeausführung oder reale
   Nebenwirkungen.
5. **Planen:** Ein validierter Projektplan mit Anforderungen, Sprinttoren,
   Lieferumfang, Abhängigkeiten, Abbruchkriterien und Lücken.
6. **Freigeben und exportieren:** Nur nach expliziter Bestätigung; Exporte
   werden verlustfrei aus demselben gespeicherten Plan erzeugt.

`Umsetzen` bleibt vom Bestätigen des Plans getrennt. Es darf nur Sprints mit
Gateway `go` ausführen. Modelltext, Vorschau und Simulation sind keine
ausgeführten oder verifizierten Arbeiten.

## 2. Kritische Prüfung des Vorschlags

| Vorschlag | Entscheidung für Jarvis |
|---|---|
| Mehrstufiger Intake, Klärung, Simulation, WBS und Export | Übernehmen, aber in unabhängig abnehmbare Releases aufteilen |
| Gatekeeper per Schlüsselwort wie „Passt so“ | Nicht als Regex-Sofortfreigabe übernehmen. Bestätigung gilt nur, wenn die App gerade eine konkrete Aktion samt Umfang zur Bestätigung gestellt hat |
| Automatisches Deep Research / Web-Scraping | Nur vorgeschlagen oder ausdrücklich angefordert; vor Netzaufruf klare Zustimmung. Bestehende Research- und Quellenfunktionen wiederverwenden |
| Automatisches Speichern abstrahierter Erkenntnisse im Gedächtnis | Nicht automatisch. Keine Projektinhalte oder Nutzerdaten in allgemeines Gedächtnis schreiben; separate, sichtbare und widerrufbare Zustimmung ist Voraussetzung |
| Playwright-Stealth, Proxy-Rotation und Umgehung von Cloudflare | Ausgeschlossen. Keine Umgehung von Zugriffssperren, Rate-Limits, AGB oder Authentisierung. Bei Blockade stoppen und die Quelle als nicht abrufbar markieren |
| Python, FastAPI, PostgreSQL, Redis, React/Tailwind als Standardstack | Verwerfen: Das ist ein fremdes Preiswachen-Beispiel und passt nicht zur lokalen Capacitor-/TypeScript-App |
| Vom Modell erzeugtes HTML/CSS in einem iframe | Nicht für die erste Umsetzung. Die GUI-Vorschau verwendet deklarative, erlaubte Bausteine wie der vorhandene Entwurf; kein ausführbares HTML, CSS oder JavaScript aus Modellantworten |
| „500 URLs“-Stresstest als verifiziertes Ergebnis | Verwerfen. Workflow-Simulation darf Risiken vorschlagen, aber keine Lastmessung oder Verifikation behaupten, die nicht wirklich ausgeführt wurde |
| Neue Epic/Feature/Task-Datenbank neben `IdeaPlan` | Nicht einführen. `Idea` und `IdeaPlan` bleiben die kanonische Quelle; WBS und Exporte werden daraus abgeleitet |
| `.cursorrules` als garantiert fehlerfreies IDE-Paket | Durch einen IDE-neutralen, überprüfbaren Sprint-Implementierungsleitfaden ersetzen. Keine Garantie, dass ein Agent Code fehlerfrei baut |

## 3. Ist-Zustand und anzupassende Struktur

| Oberfläche / Datei | Ist-Zustand | Geplante Anpassung |
|---|---|---|
| `engine/store.ts` (`Idea`, Settings) | `Idea.plan` speichert den Plan; `plan_phase`, `plan_idea_id` und Jobs liegen zusätzlich in globalen Settings | Planinhalt bleibt an der Idee. Aktive Auswahl und UI-Sicht bleiben flüchtige UI-Referenzen; Übergänge dürfen keinen fremden oder veralteten Plan verändern |
| `engine/idea-plan.ts` | Anforderungen, Entscheidungen, Lücken, Sprints, Lieferumfang, Gates, Abhängigkeiten und Sprint-Prompt sind bereits typisiert | Parser/Validator und stabile IDs stärken; kein paralleles Fremdschema |
| `engine/idea.ts` | Modell füllt Plan als JSON; Provider werden hier direkt und abweichend von der konfigurierten Brain-Reihenfolge angesprochen; Fehler können in stillen Fallbacks enden | Gemeinsame Provider-Policy aus `engine/brain.ts` verwenden, Antwort validieren und Provider-/Parsefehler sichtbar machen |
| `engine/board.ts`, `engine/board-parse.ts` | Research, Projektwahl, Planerstellung, Ansicht, Jobs und Draft-Commands teilen einen großen Dispatcher | Bestehende Parser-/Executor-Grenzen beibehalten, Übergänge explizit testen und Risiken für „Plane“, „Entwirf“, `PSP` und `Sprints` abdecken |
| `ui/Workbench.tsx`, `ui/ScriptStage.tsx` | Eine Werkbank mit Ansichten `sprints`, `psp`, `modules`, `sim`, `research`; PSP/Sprints sind aktuell ein bekannter Verwechslungs-/Regressionstest | PSP zeigt ausschließlich Strukturbaum/Projektgliederung; Sprintansicht ausschließlich Sprintkarten. Fehler- und Leerzustände nicht als leere Erfolgslage darstellen |
| `engine/board-wire.ts` | `sim` ist derzeit ein statisches Drahtgitter, keine Live-App und kein Workflow-Dry-Run | Darauf aufbauend eine klare, deklarative Vorschau und eine getrennte Szenario-Simulation definieren |
| `engine/entwurf.ts`, `entwurf-parse.ts`, `entwurf-muster.ts` | Vorhandene nichtfunktionale App-Entwürfe mit festem Bausteinkatalog | Wiederverwenden, wo möglich; Entwurf bleibt ein eigener Modus und darf nicht versehentlich Plan/Portfolio überschreiben |
| `engine/ablauf.ts`, `ablauf-parse.ts`, `portfolio.ts` | Ablauf führt freigegebene Sprintarbeit aus; `Go` speichert ins Portfolio | Klare Trennung Simulation → Planfreigabe → Umsetzung → Portfolio; Fehler/Abbruch und Wiederaufnahme regressionsprüfen |
| `engine/project-docs.ts` | PSP/Sprints/Projekt werden bereits als JSON exportiert | Exporte um PRD, gültiges Diagramm und Implementierungsleitfaden erweitern; alle aus demselben validierten Plan |

## 4. Verbindliche Architektur- und Produktregeln

1. **Eine Wahrheit:** Projekt und Plan sind `Idea` / `IdeaPlan` in IndexedDB.
   Einstellungen enthalten keinen zweiten Planinhalt.
2. **Wiederverwendung:** Bestehende Brain-, Research-, Memory-Proposal-,
   Projektdatei-, Ablauf-, Portfolio- und Entwurfsfunktionen verwenden. Kein
   neuer Agentenschwarm, Server, Vektorstore oder Datenbank-Stack.
3. **Provider:** Modellaufrufe für Planaufgaben folgen der aktiven Konfiguration
   und Fallback-Policy aus `engine/brain.ts`. Ein lokales Modell oder ein
   Cloud-Key wird nicht als verfügbar angenommen.
4. **Zustand:** Bestätigen, abbrechen, zurückkehren, Projekt wechseln und App
   neu starten dürfen keinen fremden Plan, Job oder Gesprächskontext übernehmen.
   Schreiboperationen sind idempotent, wo sie wiederholt werden können.
5. **Sichere Bestätigung:** Ein generisches „Ja“, „So“ oder „Passt“ bestätigt
   nur die konkret offene Aktion im aktuellen Turn. Es startet weder Recherche
   noch Ausführung, Export oder Speichern ohne passenden Pending-Zustand.
6. **Quellenwahrheit:** Jede externe Aussage erhält Quellenbezug; interne
   Ableitung, Modellvorschlag und echte Quelle bleiben unterscheidbar.
   Unzugängliche, widersprüchliche oder nicht gefundene Quellen bleiben als
   Lücke sichtbar.
7. **Datenschutz:** Keine automatische Übermittlung der gesamten Idee,
   Gesprächshistorie oder Notizen. Research erhält nur den nötigen bestätigten
   Ausschnitt. Projektinhalte werden nicht automatisch ins globale Gedächtnis
   übernommen.
8. **Simulation:** GUI-Vorschauen rendern nur erlaubte Datenstrukturen und
   festgelegte Komponenten. Workflow-Simulationen erzeugen keine Netzwerk-,
   Datei-, Geräte-, Portfolio- oder Gedächtnis-Writes.
9. **Unterscheidbare Belege:** „Modell schlägt vor“, „aus Quelle abgeleitet“,
   „im Code getestet“ und „im Gerät abgenommen“ sind verschiedene Zustände.
   Ein hypothetischer Stressfall ist nie ein Messergebnis.
10. **Rückwärtskompatibilität:** Vorhandene Ideas, Plan-JSON, Hausstand,
    Entwürfe, Sprints, Portfolio und Exporte bleiben lesbar. Änderungen an
    Import/Export bekommen Schema-Versionen und Round-trip-Tests.

## 5. Nicht-Ziele für diese Schiene

- Kein Preis-Crawler, Proxy-Pool, Scraping-Bypass, Webhook-Service oder
  Drittanbieter-Backend aus dem Beispiel.
- Kein beliebiger HTML-/CSS-/JS-Interpreter, iframe-Ausführung oder
  Komponenten-Code, den ein Modell direkt schreibt.
- Keine ungefragte Websuche, Gedächtnisänderung, Dateierstellung oder
  Umsetzung.
- Keine automatische Zeitschätzung, frei erfundenen Versionen oder
  Sprintanzahl mit Kalenderterminen.
- Keine Migration der bestehenden lokalen Daten in eine neue Datenbank.
- Kein Umbau von Notizen, Einkaufslisten, Todos, Raum-Scan oder Portfolio
  außerhalb der erforderlichen Regression und Anbindung.

## 6. Versionen und Sprintfolge

Versionen sind geordnete Freigabestufen, keine Zeitprognose. Jedes Release
erhöht die App-Version erst nach seinem Gold-Gate. Die nächste Arbeit beginnt
erst, wenn der vorherige Release-Gate bestanden ist.

| Version | Sprints | Ergebnis | Gateway |
|---|---:|---|---|
| `18.28.0` (`182800`) | 444–449 | Stabiler Planungsablauf, Plan-/Sprintfenster getrennt, robuste Persistenz und Baseline | PSP/Sprints, Wechsel, Abbruch, Resume und Altplan-Regressionsgrün |
| `18.29.0` (`182900`) | 450–454 | Intake/Klärung und begrenzte, belegbare Recherche | Zustimmung, Provenienz, Konflikte, lokale-only und Fehlerpfade geprüft |
| `18.30.0` (`183000`) | 455–460 | Sichere GUI- und Workflow-Simulation | Vorschau bleibt deklarativ; Dry-Run ohne Side Effects; Hypothesen nicht als Belege |
| `18.31.0` (`183100`) | 461–466 | Validierte WBS und konsistente Exportpakete | Round-trip, Quellen, Dependencies, DoD, Umsetzungsgate und Geräteabnahme grün |

### `18.28.0` — Planungsmodus stabilisieren

| Sprint | Ergebnis | Abhängigkeit |
|---:|---|---|
| [444](./sprints/sprint-444.md) | Fehlerfälle reproduzierbar machen und Gold-Baseline anlegen | — |
| [445](./sprints/sprint-445.md) | Projektgebundenen Session-/Ansichtszustand zuverlässig halten | 444 |
| [446](./sprints/sprint-446.md) | Planung, Entwurf, PSP und Sprints eindeutig routen | 444 |
| [447](./sprints/sprint-447.md) | `IdeaPlan`-JSON validieren und Provider-/Fehlerpfade korrigieren | 444, 445 |
| [448](./sprints/sprint-448.md) | Werkbankzustände trennen; PSP darf keine Sprintliste zeigen | 445–447 |
| [449](./sprints/sprint-449.md) | Regression, Hausstand und Release-Gate `18.28.0` | 444–448 |

### `18.29.0` — Intake und Research

| Sprint | Ergebnis | Abhängigkeit |
|---:|---|---|
| [450](./sprints/sprint-450.md) | Wörtliche Bedingung und Rahmen als stabile Projektquelle | 449 |
| [451](./sprints/sprint-451.md) | Gezielte Klärung mit eindeutigem Pending-/Bestätigungszustand | 450 |
| [452](./sprints/sprint-452.md) | Vorhandene lokale Quellen korrekt zuordnen und Lücken sichtbar halten | 450 |
| [453](./sprints/sprint-453.md) | Externe Recherche nur mit Zustimmung und Quellenprovenienz | 451, 452 |
| [454](./sprints/sprint-454.md) | Quellenwahrheit, Datenschutz, Regression und Release-Gate `18.29.0` | 450–453 |

### `18.30.0` — Simulation

| Sprint | Ergebnis | Abhängigkeit |
|---:|---|---|
| [455](./sprints/sprint-455.md) | Versionierte, deklarative Simulationsdaten | 449 |
| [456](./sprints/sprint-456.md) | SIM-GUI aus erlaubten Komponenten rendern | 455 |
| [457](./sprints/sprint-457.md) | Änderungswünsche als geprüfte Vorschau-Diffs übernehmen | 456 |
| [458](./sprints/sprint-458.md) | Workflow-Dry-Run ohne externe oder persistente Seiteneffekte | 455 |
| [459](./sprints/sprint-459.md) | Simulationsergebnisse und Risiken nachvollziehbar in Planlücken überführen | 453, 457, 458 |
| [460](./sprints/sprint-460.md) | Sicherheits-/Regression-Gate und Release `18.30.0` | 455–459 |

### `18.31.0` — WBS und Export

| Sprint | Ergebnis | Abhängigkeit |
|---:|---|---|
| [461](./sprints/sprint-461.md) | WBS aus dem bestehenden `IdeaPlan` ohne konkurrierendes Schema | 449 |
| [462](./sprints/sprint-462.md) | IDs, Gates, Abhängigkeiten und Abnahmen graphweit validieren | 461 |
| [463](./sprints/sprint-463.md) | PRD und Mermaid-Prozessdiagramm deterministisch erzeugen | 461, 462 |
| [464](./sprints/sprint-464.md) | Versioniertes JSON mit geprüftem Round-trip exportieren/importieren | 461, 462 |
| [465](./sprints/sprint-465.md) | Tool-neutralen Sprint-Implementierungsleitfaden erzeugen | 462 |
| [466](./sprints/sprint-466.md) | End-to-end-Regression und Release-Gate `18.31.0` | 460, 463–465 |

## 7. Endabnahme (Sprint 466)

1. Ein Projekt aus einer natürlichen Bedingung lässt sich anlegen, später
   wieder öffnen und eindeutig fortsetzen. Gesprächswechsel oder App-Neustart
   übernehmen weder falsche Idee noch alten Bestätigungszustand.
2. „Plane das“, „Entwirf eine App“, „Zeig Sprints“, „Zeig PSP“ und
   „Simuliere …“ routen zu unterschiedlichen, erwarteten Flächen.
   **PSP zeigt keine Sprintliste.** Die Sprintansicht zeigt die richtigen
   Sprintdaten der aktiven Idee.
3. Unvollständige Anforderungen erzeugen konkrete, begrenzte Rückfragen.
   Nicht benötigte Rückfragen werden nicht erzwungen; kein Freigabewort allein
   startet eine nicht angezeigte Aktion.
4. Ohne bestätigte Suche werden weder Research-Netzwerkaufrufe noch
   GitHub-Suche ausgeführt. Mit Zustimmung bleiben URLs und Belegtexte
   nachprüfbar; 403, Rate-Limit, Timeout und leere Treffer werden nicht als
   Erfolg ausgegeben.
5. GUI- und Workflow-Simulation sind als Simulation markiert, wiederholbar
   und nebenwirkungsfrei. Modellhypothesen werden nicht als Testergebnis
   ausgegeben. Arbiträrer Modell-Code wird nie ausgeführt.
6. Anforderungen, Plan, Sprints, Aufgaben und Abhängigkeiten haben stabile
   IDs. Leere Ziele, unbekannte Abhängigkeiten, Zyklen, ungültige Gates und
   widersprüchliche Sprintfolgen werden abgefangen und angezeigt.
7. PRD, Diagramm, JSON und Implementierungsleitfaden stammen aus demselben
   Plan. JSON-Import/Export besteht Round-trip- und Versionsprüfungen.
8. Bestehende Plan-, Entwurfs-, Scan-, Ablauf-, Portfolio-, Memory-,
   Einkaufslisten-, Notiz- und Todo-Flows bestehen ihre gezielten
   Regressionstests auf Browser und Android.
9. Die Versionsnummer wird nur nach bestandenem Gate angehoben. APK-Erstellung
   ist ein separater Release-Schritt.

## 8. Manuelle Gold-Spuren

- [`TEST-18.28.md`](./TEST-18.28.md): Projektzustand, Routing, PSP/Sprints,
  Resume und Fehlerzustände.
- [`TEST-18.29.md`](./TEST-18.29.md): Intake, bestätigte Recherche,
  Provenienz, Datenschutz und No-Source-Fall.
- [`TEST-18.30.md`](./TEST-18.30.md): GUI-Diff, Workflow-Dry-Run,
  Seiteneffektfreiheit und klare Kennzeichnung.
- [`TEST-18.31.md`](./TEST-18.31.md): WBS-Validierung, Exporte,
  Round-trip und gesamter Planungsablauf.

## 9. Vorgängerpläne

Die bereits vorhandene Lesbarkeitsplanung
([`tischplatte-plan.md`](./tischplatte-plan.md)) wird in Sprints 448, 450 und
451 als UX-Anforderungen weitergeführt. Sie ist kein eigener zweiter Umbau.
Der alte Fehlerplan [`flaechen-bugs-plan.md`](./flaechen-bugs-plan.md) ist
historisch; seine Sprintnummern 438–443 wurden inzwischen für die
Todo-Schiene vergeben und werden hier nicht wiederverwendet.

## 10. Folgeschiene

Die nächste geplante Fähigkeitsreihe baut nach bestandenem
`18.31.0`-Geräte-/Release-Gate auf dieser Tischplatte auf:
[`101-next.md`](./101-next.md), Sprints 467–482, `18.32.0`–`18.35.0`.
Sie prüft kontrolliert Soup für Routing, Planübersetzung, gezielte
Rückfragen und kurze Sprachantworten; ein Soup-Einbau ist nicht vorab
beschlossen.
