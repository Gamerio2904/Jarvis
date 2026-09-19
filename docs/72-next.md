# 72 — Ideen halten **CODE** (`18.2`)

Ausgangspunkt: Code `18.0.8`. Anlass ist eine Gemini-Skizze *Project
Architect / Idea Curator*: Jarvis soll Ideen sortieren und den Überblick
behalten.

Die Leitentscheidung bleibt: **Parser wählen, ein Agent pro Zug, das Modell
formuliert nur auf Zuruf.** Kein Sprint hier gibt einem Modell die Regie über
andere Agenten oder eine zweite Datenbank.

**Der Sprintplan ist eine Vorlage.** Jarvis füllt sie aus. Er darf Zeilen
ergänzen und Custom-Sprints anlegen, wenn die Idee das braucht. Er führt
den Plan nicht aus und schreibt keine Dateien nach `docs/sprints/`.

Sprints **272–281** sind **CODE** in `18.1.0`. **282** bleibt Freeze in
[`71-audit.md`](./71-audit.md). Diese Schiene beginnt bei **283**.
**288–290** sind Karten-Reste in [`73-next.md`](./73-next.md).

---

## 0. Was die Skizze will — und was wir davon nehmen

Die Aufnahmen zeigen einen englisch benannten Agenten als Herzstück:
Ideen bewerten (RICE/ICE), selbst Meilensteine und Tickets schreiben,
wöchentlich nachhaken. Notion oder Obsidian daneben.

Der Bedarf darunter: *Ich habe Ideen, sie verlaufen, ich will sie
wiederfinden, und ich will daraus einen Plan — in der Form, die Jarvis
schon für sich selbst nutzt.*

Jarvis hat Notizen, Todos, Erinnerungen, Director, Curator. Neu ist der
**Typ Idee** plus **ein Sprintplan-Schema**. Das Schema kommt aus dem
Code (285), nicht aus dem Modell. Das Modell füllt Felder (286) und darf
Custom-Sprints anhängen (286/287).

---

## 1. Die Vorlage (hart, nicht verhandelbar)

Jedes ausgefüllte Plan-Objekt folgt **genau** diesen drei Kern-Sprints.
Titel der Kerne sind fest. Inhalt (Ziel, Lieferumfang, Won’t, Abbruch,
Manuell) füllt Jarvis.

```
# {Idee.title} — PLAN

Sprint 1 — Kern     was zuerst wahr sein muss
Sprint 2 — Härten   Abgrenzung, Tests, was schiefgehen darf
Sprint 3 — Probe    woran man es merkt (ein bis drei Sätze zum Ausprobieren)
```

Jede Karte hat dieselben Felder wie ein Jarvis-Sprint:

| Feld | Pflicht | Inhalt |
|------|---------|--------|
| `n` | ja | `1` / `2` / `3` oder `C1` / `C2` / … |
| `kind` | ja | `core` oder `custom` |
| `title` | ja | Kern: fest (`Kern`, `Härten`, `Probe`). Custom: frei, deutsch |
| `ziel` | ja | Ein kurzer Absatz. Leer nur wenn `entfällt: {grund}` |
| `lieferumfang` | ja | Liste `{ id, task, anleitung }`. Darf leer sein, wenn entfällt |
| `wont` | ja | Liste, mindestens ein Satz oder `—` |
| `abbruch` | ja | Ein Satz |
| `manuell` | nein | Probe-Sätze, vor allem Sprint 3 |

**Ergänzen (erlaubt, ohne neues Sprint-Objekt):** zusätzliche Zeilen in
`lieferumfang` eines Kern-Sprints. Beispiel: Kern bekommt nicht nur
„Parser“, sondern auch „Hausstand-Zähler“.

**Custom-Sprint (erlaubt, neues Objekt `kind: 'custom'`):** nur wenn die
Arbeit in 1–3 nicht passt. Typische Gründe, die Jarvis nennen **muss**
im `ziel`: Gerät, Sideload, Parser-Konflikt mit einem bestehenden
Agenten, Risiko/Widerspruch, Erinnerung/Auftrag. Nummer `C1`, `C2`, …
hinter Sprint 3. Kein Custom darf die Kerne ersetzen.

**Entfällt:** ein Kern-Sprint darf leer bleiben, wenn die Idee ihn nicht
braucht. Dann `ziel = "entfällt: …"` und leerer Lieferumfang. Die Karte
bleibt stehen, damit die Vorlage erkennbar ist.

Das Schema liegt in `engine/idea-plan.ts` (Sprint 285). Das Modell
erfindet **keine** anderen Feldnamen, keine RICE-Spalte, keine Daten,
keine Version `18.x` der App.

---

## 2. Was gut ist / was nicht

| Wunsch | Urteil | Wohin |
|--------|--------|-------|
| Idee bewusst festhalten | **Ja** | 283 |
| Überblick | **Ja** | 284 |
| Feste Sprint-Vorlage, Jarvis füllt | **Ja** | 285 + 286 |
| Zeilen ergänzen, Custom-Sprints wenn nötig | **Ja** | 286, 287 |
| Erinnerung an Idee oder Sprint, nach Auftrag | **Ja** | 287 |
| Architect als Herzstück / LLM-Organizer | **Won’t** | — |
| RICE/ICE, Notion, Auto-Roadmap, stille Tickets | **Won’t** | — |
| Plan selbst ausführen (Coder, Research starten) | **Won’t** | — |
| `docs/sprints/sprint-NNN.md` ins Repo schreiben | **Won’t** | Plan lebt an der Idee im Hausstand |

---

## 3. Was schon existiert — wiederverwenden

| Baustein | Datei | Rolle in `18.2` |
|----------|-------|-----------------|
| Notiz / Todo | `tools-parse.ts`, `store.ts` | Nicht umbiegen. Todo aus einem Plan-Schritt nur nach Ja (287) |
| Erinnerung | `remind-parse.ts` | 287, `REL_UNIT` plus `wochen?` |
| Director / Katalog | `director.ts`, `parse-catalog.ts` | Ein Parser-Agent `idea` |
| Werkzeug-Vertrag | `tool-contract.ts` | 286 liefert JSON am Schema, nicht freien Fließtext als Wahrheit |
| Hausstand | `backup.ts` | `ideas` inklusive `plan` |
| Chat-Liste | `persistLastList` | 284 |

Kein Overlay, keine zweite Lage-Sicht. Katalog-Id `idea`, UI deutsch.

---

## 4. Schnitt — Sprints 283–287

| Version | Sprint | Thema | Priorität |
|---------|--------|-------|-----------|
| `18.2.0` | [283](./sprints/sprint-283.md) | Idee festhalten (Store + Parser + Hausstand) | Must |
| `18.2.1` | [284](./sprints/sprint-284.md) | Überblick: Liste, Parken, Erledigt | Must |
| `18.2.2` | [285](./sprints/sprint-285.md) | Vorlage im Code, leerer Plan sichtbar | Must |
| `18.2.3` | [286](./sprints/sprint-286.md) | Plan auf Zuruf füllen, Custom erlaubt | Should |
| `18.2.4` | [287](./sprints/sprint-287.md) | Ergänzen, Custom nach Satz, Erinnerung | Should |

Kette: **283 → 284 → 285**. 286 braucht 285 (Schema). 287 braucht 285;
Füllen (286) ist keine harte Voraussetzung für ein handgeschriebenes
Custom, aber die Vorlage muss stehen.

---

## 5. Gegen die PO-Prioritäten

| Sprint | Qualität | Funktion | Latenz | Free |
|--------|----------|----------|--------|------|
| 283 | Idee bleibt Idee | Festhalten | Parser | lokal |
| 284 | Überblick ohne Halluzination | Liste | Parser | lokal |
| 285 | Vorlage fest, nicht vom Modell | leerer Plan lesbar | 0 Tokens | lokal |
| 286 | Plan in Jarvis-Form, Custom begründet | auf Zuruf | **ein** Cloud-Zug | ein Request |
| 287 | Nachziehen ohne Neu-Generieren | Parser + optional ein Zug | Parser oder ein Zug | lokal / ein Request |

283–285 sind der Gewinn ohne Kontingent. 286 darf das Kontingent nur
anfassen, wenn jemand „mach einen Sprintplan“ (oder gleichwertig) sagt.

---

## 6. Won’t (hart)

- Katalog-Agent `architect` / `organizer` / `meta`, der andere Agenten startet.
- RICE, ICE, Auto-Score, Quartalsplan, Gantt, erfundene Daten.
- Notion, Obsidian, mem0, zweite Datei neben dem Hausstand.
- Plan still beim Festhalten oder Listen erzeugen.
- Plan als `docs/sprints/*.md` ins Git schreiben.
- Research/Coder still aus einem gefüllten Plan anstoßen.
- Custom-Sprint ohne Begründung im `ziel`.
- Englische Rollen in der UI.

---

## 7. Abbruchkriterien

- Ein zweiter LLM-Organizer steht im Katalog.
- „Notiz Milch“ wird eine Idee.
- Ein Plan entsteht ohne Zuruf.
- Jarvis startet Research oder legt Todos an, nur weil ein Plan existiert.
- Ein Custom-Sprint hat kein `ziel` mit Grund.
- Das Modell liefert andere Felder als das Schema — und der Code nimmt sie an.
- RICE/ICE oder eine App-Version `18.x` in einem Ideen-Plan.
- Hausstand ohne `ideas` / ohne `plan`-Feld, nachdem 285 CODE ist.

Index: [`sprints/README.md`](./sprints/README.md) · Versionen:
[`09-versioning.md`](./09-versioning.md) · Vorherige Schiene:
[`71-audit.md`](./71-audit.md) · Organizer-Won’t:
[`70-next.md`](./70-next.md) §0b · Karten-Reste:
[`73-next.md`](./73-next.md) · Watchliste danach:
[`74-next.md`](./74-next.md) · Körper/Wissen:
[`75-next.md`](./75-next.md)
