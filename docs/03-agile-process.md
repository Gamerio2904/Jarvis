# 03 — Agiler Prozess (Scrum-lite)

Jarvis wird **agil** geplant. Klassisches Scrum für große Teams wird auf ein **Scrum-lite** für Solo-Produkt + AI-Umsetzung zugeschnitten.

> **Jetzt:** Code **`9.10.0`**. Sideload **`9.10.0`**. Hirn Gemini zuerst. Sprints numerisch in [`sprints/README.md`](./sprints/README.md). Nächste Schiene [`55-next.md`](./55-next.md).

## Rollen

| Rolle | Wer | Verantwortung |
|-------|-----|----------------|
| **Product Owner (PO)** | Du | Vision, Prioritäten, Abnahme, Persona-Entscheidungen |
| **Developer** | Cursor-Agent (+ du nach Bedarf) | Umsetzung, technische Vorschläge, Increment liefern |
| **Scrum Master (leicht)** | Gemeinsam / Agent erinnert | Prozess einhalten, Blocker sichtbar machen — keine Bürokratie |

Es gibt kein separates Stakeholder-Gremium: **du bist der einzige Nutzer und Entscheider.**

## Artefakte

| Artefakt | Wo | Zweck |
|----------|-----|--------|
| Product Backlog | `05-product-backlog.md` | Alle Ideen/Stories, priorisiert |
| Sprint Backlog | je Sprint in `06` / später `docs/sprints/` | Was in diesem Sprint wirklich gebaut wird |
| Increment | laufender Code-Stand | Nutzbares Teilergebnis (z.B. lokaler Chat) |
| Definition of Ready (DoR) | unten | Wann eine Story „sprintfähig“ ist |
| Definition of Done (DoD) | unten | Wann etwas „fertig“ ist |
| Versionierung | `09-versioning.md` | SemVer-artig; Sprint-Ziel ↔ Version; Patches als Zwischenversionen |

## Sprint-Rahmen (entschieden)

| Parameter | Default | Anmerkung |
|-----------|---------|-----------|
| Sprint-Länge | **Zielbasiert** — Zeit spielt keine Rolle | Sprint endet bei Ziel-Erreichung / Review, nicht wegen Kalender |
| Sprint-Ziel | 1 klarer Satz | z.B. „Lokaler Smalltalk mit Persona läuft im Browser“ |
| Planning | Start jedes Sprints | Stories schneiden, Risiken benennen |
| Daily | entfällt / asynchron | Kurzer Status bei jeder Arbeitssession |
| Review | Ende Sprint | **Schriftliches Feedback** vom PO reicht |
| Retro | kurz, schriftlich | 3 Bullets behalten / ändern |
| Scope-Freeze | **Mittel** | Kleine Ergänzungen ok, wenn Sprint-Ziel nicht leidet; größere Ideen → **neuer Sprint** / Backlog |

**Kalender-Deadlines** sind kein Steuerungsmittel. Qualität und Zielklarheit schon.

## Ablauf eines Sprints

1. **Planning:** Ziel wählen, Stories aus Backlog ziehen (DoR erfüllen).
2. **Build:** Agent setzt um, committe/pusht in sinnvollen Schritten.
3. **Review:** Du führst den Abnahmetest (bei MVP: Smalltalk-Gefühl).
4. **Retro:** 1 Prozess-Verbesserung für den nächsten Sprint.
5. **Backlog pflegen:** Neue Erkenntnisse → Stories anpassen/priorisieren.
6. **Version taggen:** Ziel-Version laut `09-versioning.md` (MINOR bei Sprint-Ziel, PATCH bei Nachziehern).

## Definition of Ready (DoR)

Eine Story darf in den Sprint, wenn:

- [ ] Nutzen in einem Satz klar ist („Damit ich …“)
- [ ] Akzeptanzkriterien formuliert sind
- [ ] Architektur-Konflikt ausgeschlossen ist (passt zu lokal/privat)
- [ ] Offene Blocker benannt oder geklärt sind
- [ ] Abschätzbar ist (klein genug für einen Sprint oder klar geschnitten)

## Definition of Done (DoD)

Eine Story ist done, wenn:

- [ ] Funktioniert lokal wie beschrieben
- [ ] Passt zu Privatsphäre-Regeln (kein unerwünschter Cloud-Abfluss fürs Denken)
- [ ] Kurz getestet (happy path + 1 typischer Fehlerfall, soweit sinnvoll)
- [ ] Für den PO nachvollziehbar dokumentiert oder demonstrierbar
- [ ] Commit auf dem Arbeitsbranch; relevante Planung bei Bedarf aktualisiert
- [ ] Versionierung beachtet (Sprint-Ziel-Version bzw. Patch dokumentiert/getaggt wenn Abnahme ok)

**Zusätzlich für Gesprächs-Stories:**  
Du (PO) hast mindestens einmal live gechattet und das **Charakter-Gefühl** abgenommen.

## Priorisierung

Wir priorisieren nach:

1. **Lernen über Charakter** (fühlt sich Jarvis richtig an?)
2. **Lokale Lauffähigkeit**
3. **Privater Zugang vom Alltag (Handy)**
4. **Betrieb 24/7**
5. **Komfort (TTS, Tools, Gedächtnis)**

MoSCoW im Backlog:

- **Must** — ohne geht der Sprint/MVP nicht
- **Should** — wichtig, aber verschiebbar
- **Could** — nice-to-have
- **Won’t** — bewusst nicht in diesem Horizont

## Umgang mit Scope-Creep

- **Kleine Ergänzungen** im laufenden Sprint: ok, wenn das Sprint-Ziel nicht leidet.
- **Größere Ideen:** ins Product Backlog und als **neuer Sprint** planen — nicht „mal eben“ mitnehmen.
- Ausnahme: Blocker-Fix, ohne den das Sprint-Ziel unmöglich ist.

## Dokumentationsregel

- Planung lebt unter `docs/`.
- Keine parallelen „Wahrheiten“: Roadmap, Backlog und offene Fragen aktuell halten.
- Technik-README im Repo-Root bleibt kurz und verweist hierher.
