# 103 — Projektplanung robuster und nachvollziehbar machen **PLAN** (`18.39`–`18.41`)

**Zweck:** Die vorhandene Planung aus IdeaPlan, Tischplatte, PSP, Vorschau und
Projektdateien zu einem nachvollziehbaren Projektablauf ausbauen. Die Folge
ergänzt die noch offenen Sprints 467–494; sie ersetzt sie nicht und beginnt
erst nach den Geräte- und Release-Gates bis einschließlich `18.38.0`.

**Planungsstand:** Inhalte 495–502 sind im Arbeitsbaum weitgehend
implementiert (Backlog, Relationen, Timeline, Risiken/Status, Revisions-Diff,
Projektdatei-Migration v2 und Planvorschlags-Bestätigung). Die Folge bleibt
als Release dennoch **PLAN**, bis Geräte-/Release-Gates inklusive `18.38.0`
und die Endabnahme `18.39.0`–`18.41.0` bestanden sind.

## 1. Befund aus dem aktuellen Planungsmodus

- `IdeaPlan` hat Anforderungen, Entscheidungen, Lücken, Sprints,
  typisierte Sprintrelationen, Backlog, Risiken/Statusupdates, Belege,
  GUI-Simulation und bis zu zehn gespeicherte Revisionen.
- Die Planvalidierung prüft IDs, Sprintreferenzen, Abhängigkeitsschleifen,
  Relationstypen, Backlog-Referenzen und Gate-Bedingungen.
  Projektdateien unterstützen Schema-Version 1 und 2 mit Migration; PRD, PSP,
  Sprintliste, Diagramm und Leitfaden können exportiert werden.
- Die Tischplatte zeigt Sprints, PSP, Quellen, Backlog, Abhängigkeiten,
  Timeline, Risiken/Status, Revisionen, Vorschau und Probelauf. Exportaktionen
  bleiben bis zum Go gesperrt. Revisionen können wiederhergestellt und als
  Diff sichtbar verglichen werden.
- Offene Restpunkte liegen vor allem bei End-to-End-Gates: vollständige
  Accessibility-/Offline-Abnahme, große Datenmengen auf Zielgeräten,
  Konflikt-/Migrations-Gold über alle Pfade und die finale Freigabeprüfung.
- Im aktuellen Modell heißen gleichförmig nummerierte Einheiten „Sprints“,
  auch wenn sie nicht zeitlich begrenzt sind. Das sollte nicht durch
  verpflichtende agile Zeremonien oder Schätzpunkte verkompliziert werden.

## 2. Übernommene Muster und Grenzen

- OpenProject trennt Hierarchie von funktionalen und zeitlichen Relationen
  und zeigt Arbeit sowohl in Boards als auch in anderen Projektansichten.
  Übernommen werden klare Relationstypen und eine visuelle Abhängigkeitsansicht,
  nicht ein zweites Work-Package-System.
  Quelle: [Relationen und Hierarchien](https://www.openproject.org/docs/user-guide/work-packages/work-package-relations-hierarchies/),
  [Agile Boards](https://www.openproject.org/docs/user-guide/agile-boards/).
- Plane macht Projekte, Cycles, Zeitbezüge und Abhängigkeiten sichtbar.
  Übernommen werden optionale Zeitboxen und gut erkennbare Blockaden, nicht
  zwingende Datumsplanung oder Teamkonten.
  Quelle: [Projects](https://docs.plane.so/core-concepts/projects/overview),
  [Cycles](https://docs.plane.so/core-concepts/cycles),
  [Task dependencies](https://docs.plane.so/core-concepts/issues/timeline-dependency).
- Taiga trennt Backlog-User-Stories, Sprint-Zuordnung und Tasks. Übernommen
  wird die klare Unterscheidung zwischen ungeplantem Kandidaten und
  eingeplantem Lieferumfang; Punkte und Burndown bleiben optional.
  Quelle: [User Stories und Tasks](https://taiga.pm/user-stories-and-tasks/),
  [Sprints](https://taiga.pm/working-with-sprints-2/).
- AppFlowy dokumentiert Roadmap-Status, Milestones und Themenansichten offen.
  Übernommen werden sichtbare Status und nachverfolgbare Änderungen, ohne Jarvis
  an Cloud, fremde Konten oder deren Datenmodell zu binden.
  Quelle: [Roadmap](https://docs.appflowy.io/docs/appflowy/roadmap).

## 3. Geplante Releases und Abhängigkeiten

| Zielversion | Sprints | Schwerpunkt | Freigabe |
|---|---:|---|---|
| `18.39.0` | 495–497 | Backlog, Abhängigkeiten, optionale Zeitplanung | Modellmigration und Planungs-Gold; keine stillen Datumsverschiebungen |
| `18.40.0` | 498–500 | Status/Risiken, Provenienz, Revision-Diff | Updates bleiben nachvollziehbar; Wiederherstellen und Konflikte verlieren keine Daten |
| `18.41.0` | 501–502 | Import/Export, Gesamtintegration | Roundtrip, Migration, Accessibility und Offline-/Fehlerpfade bestehen |

Die Sprints dürfen nur auf den bestehenden `IdeaPlan`- und
Projektdateipfaden aufbauen. Änderungen an Schema oder Exportformat müssen
rückwärtskompatibel migrieren oder mit einer klaren, verlustfreien Fehlermeldung
abbrechen. Ein Planungsmodell darf bestehende Geräte-Sync-Gates nicht umgehen.

## 4. Gemeinsame Qualitätsregeln

1. Projektwunsch, Anforderung, Sprintziel, Aufgabe und Abnahmekriterium bleiben
   getrennte, referenzierbare Aussagen.
2. Keine Änderung am gespeicherten Plan allein durch Vorschau, Sortierung,
   Filter oder KI-Vorschlag. Änderungen sind explizite Nutzeraktionen mit
   Validierung und Undo.
3. Unbekannte/ungültige IDs, Schema-Versionen, Relationstypen oder
   Datumswerte werden sichtbar abgelehnt; es gibt keine stillen Defaults bei
   sicherheits- oder planungsrelevanten Daten.
4. Zeitplanung, Schätzungen, Verantwortliche und Status-Updates sind optional
   und lokal. Nicht gesetzte Werte bedeuten „nicht festgelegt“, nicht Null,
   „heute“ oder „jemandem zugewiesen“.
5. Recherchebelege müssen Quelle, Abrufzeit und betroffene Anforderung
   unterscheiden; Hypothesen werden nie als verifizierte Fakten ausgegeben.
6. Import/Export erhält Nutzertext und unbekannte Erweiterungen oder meldet
   ausdrücklich, wenn ein Format nicht verlustfrei verarbeitet werden kann.
7. Jede sichtbare Planung funktioniert ohne Netz und mit Tastatur/Screenreader;
   lange Listen, Fehler und leere Zustände bleiben bedienbar.

## 5. Nicht-Ziele

- Kein zweiter Projektstore, kein neuer Router und kein obligatorischer
  Scrum-Prozess.
- Keine verpflichtenden Story Points, Burndown, Teamzuweisung, Cloud,
  Kollaboration oder Projektserver.
- Keine automatisch verschobenen Termine, Sprint-Gates oder Inhalte.
- Keine Ausführung von Modell-generierten Skripten oder beliebigem
  HTML/JavaScript in Vorschauen.
- Keine Freigabe durch bloßen Build oder Unit-Test statt Geräte-/Release-Gate.

Details und Sprintkriterien: [`sprints/README.md`](./sprints/README.md) und
[`sprint-495.md`](./sprints/sprint-495.md) bis
[`sprint-502.md`](./sprints/sprint-502.md).
