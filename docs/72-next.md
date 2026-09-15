# 72 — Ideen halten **PLAN** (`18.2`)

Ausgangspunkt: Code `18.0.7`. Anlass ist keine Lücke im Schach oder in der
Lage, sondern eine Gemini-Skizze *Project Architect / Idea Curator*: Jarvis
soll Ideen sortieren und den Überblick behalten.

Die Leitentscheidung bleibt: **Parser wählen, ein Agent pro Zug, das Modell
formuliert nur auf Zuruf.** Kein Sprint hier gibt einem Modell die Regie über
andere Agenten, eine zweite Datenbank oder eine selbst gebaute Roadmap.

Sprints **272–282** sind vergeben — Audit-Reste in
[`71-audit.md`](./71-audit.md) §4. Diese Schiene beginnt bei **283**.

---

## 0. Was die Skizze will

Die Aufnahmen zeigen einen englisch benannten Agenten als **Herzstück**:
Ideen einsammeln, bewerten (RICE/ICE), über Domänen hinweg zuordnen,
selbst Meilensteine und Tickets schreiben, wöchentlich nachhaken, auf
Wunsch den Anwalt des Teufels spielen. Dahinter sitzen oft Notion oder
Obsidian als zweites Gedächtnis und ein Netz aus Coder-/Research-Rollen.

Der **Bedarf** darunter ist echt und deutsch: *Ich habe Ideen, sie
verlaufen, ich will sie wiederfinden, und manchmal will ich Widerspruch
oder den einen nächsten Schritt.* Das ist kein Organizer-Problem. Das ist
eine **Liste mit Absicht**, plus zwei optionale Denk-Hilfen auf Zuruf.

Jarvis hat die Teile schon: Notizen, Todos, Erinnerungen, Memory-Gate,
Teach-Packs, Research, Director, Curator. Neu ist nur der **Typ Idee** —
nicht still, nicht Fachwissen, nicht Einkauf — und die Sätze, die ihn
treffen.

---

## 1. Was gut ist

| Wunsch | Warum das zu Jarvis passt | Wohin |
|--------|---------------------------|--------|
| „Idee X“ bewusst festhalten | Wie Notiz, aber mit Titel und Status. Kein stilles Mitschreiben | **283** |
| Überblick: was liegt | Chat-Liste, lokal, Hausstand nimmt sie mit | **284** |
| Erinnern, wenn etwas liegt — **nach Auftrag** | Erinnerungen (Sprint 52) existieren. `in N Wochen` fehlt noch | **285** |
| Widerspruch auf Zuruf | Ein Hirn-Zug, deutsch, kurz. Qualität ohne Dauerfeuer | **286** |
| Ein nächster Schritt auf Zuruf | Ein Satz, optional ein Todo nach Ja. Kein Planer | **287** |

Das trifft die PO-Achsen: die Antwort wird nützlicher, die Funktion bleibt
lokal und kostenlos, Latenz entsteht nur wenn jemand widersprechen oder
den nächsten Schritt **verlangt**.

---

## 2. Was nicht gut ist

| Vorschlag aus der Skizze | Urteil | Warum |
|--------------------------|--------|-------|
| *Project Architect* / *Idea Curator* als Herzstück | **Won’t** | Englische Rollen-Namen, fünfter Organizer. Director und Curator existieren ([`66-agents-ist.md`](./66-agents-ist.md) §1b, [`70-next.md`](./70-next.md) §0b) |
| RICE / ICE als Produkt | **Won’t** | Scores ohne Marktdaten sind Theater. Jarvis bewertet keine Ideen, er hält sie |
| Notion / Obsidian als zweite DB | **Won’t** | Zweites Gedächtnis driftet. Hausstand + IndexedDB sind die eine Quelle |
| Auto-Roadmap, Meilensteine, Quartalsplan | **Won’t** | Halluzinierte Termine. Kalender bleibt Kalender |
| Stille Tickets an Coder / Research | **Won’t** | Ein Agent pro Zug. Research nur auf Zuruf, Coder gibt es nicht |
| Querschnitt-Matcher über Domänen | **Won’t** | Embedding-Router ist Freeze. Falsche Verknüpfungen kosten Vertrauen |
| Wöchentliches Nachhaken ohne Auftrag | **Won’t** | Unerbetene Pings. Erinnerung nur nach Satz |
| Ideen still aus jedem Chat ernten | **Won’t** | Teach ist bewusst (`lern das`). Memory-Gate bleibt für Vorlieben |
| LLM wählt, welcher Agent eine Idee „weiterbaut“ | **Won’t** | Genau der Organizer, den §0b verbietet |

Gut ist der **Nutzerwille**. Schlecht ist, daraus ein zweites Produkt zu
machen.

---

## 3. Was schon existiert — wiederverwenden

| Baustein | Datei | Rolle in `18.2` |
|----------|-------|-----------------|
| Notiz | `tools-parse.ts` `note_create` / `note_list`, `store.addNote` | **Nicht** umbiegen. „Notiz Milch“ bleibt Notiz |
| Todo | `tools-parse.ts`, `store.addTodo` | 287 darf **nach Ja** ein Todo anlegen, nie still |
| Erinnerung | `remind-parse.ts`, `store.addReminder` | 285 hängt `idea_id` an den Titel oder an `args`, erweitert `REL_UNIT` um Wochen |
| Memory / Curator | `memory-parse.ts`, `agents/curator.ts` | Unangetastet. Idee ≠ Vorliebe |
| Teach / Pack | `knowledge.ts`, Sprint 203 | Unangetastet. Idee ≠ Fachwissen |
| Research | `research-parse.ts` | Nur wenn 286/287 explizit „recherchier“ hören |
| Director / Katalog | `director.ts`, `parse-catalog.ts` | Ein neuer Parser-Agent `idea`, `autonomy: 'parser'` |
| Hausstand | `backup.ts` | Neue Store-Tabelle `ideas` mitexportieren |
| Chat-Liste | `persistLastList` in `tools.ts` | 284 listet wie Todos |

Kein neues Overlay, keine zweite Lage-Sicht, kein englischer Agentenname
in der UI. Katalog-Id darf `idea` heißen, Antworten bleiben deutsch.

---

## 4. Schnitt — Sprints 283–287

| Version | Sprint | Thema | Priorität |
|---------|--------|-------|-----------|
| `18.2.0` | [283](./sprints/sprint-283.md) | Idee festhalten (Store + Parser + Hausstand) | Must |
| `18.2.1` | [284](./sprints/sprint-284.md) | Überblick: Liste, Parken, Erledigt | Must |
| `18.2.2` | [285](./sprints/sprint-285.md) | Erinnerung an eine Idee, nur auf Auftrag | Should |
| `18.2.3` | [286](./sprints/sprint-286.md) | Widerspruch auf Zuruf (ein Hirn-Zug) | Should |
| `18.2.4` | [287](./sprints/sprint-287.md) | Ein nächster Schritt auf Zuruf | Should |

Kette: **283 → 284**. 285/286/287 brauchen 283 (eine Idee muss existieren)
und 284 (Auswahl per Nummer aus der letzten Liste). 286 und 287 sind frei
zueinander. 285 ist frei von 286/287.

Kein Meilenstein-Sprint. `18.2.4` ist das Ende der Schiene.

---

## 5. Gegen die PO-Prioritäten

Vorgaben unverändert: hohe Antwortqualität, alles funktioniert, wenig
Latenz, kostenlos und viel nutzbar — nur ändern, wenn Nutzen ohne Verlust.

| Sprint | Qualität | Funktion | Latenz | Free |
|--------|----------|----------|--------|------|
| 283 | Idee bleibt Idee, nicht Notiz | Festhalten und Wiederfinden | Parser, 0 Tokens | lokal |
| 284 | Überblick ohne Halluzination | Liste / Parken / Weg | Parser | lokal |
| 285 | Nachhaken nur nach Satz | nutzt AlarmManager | wie Erinnerung | unverändert |
| 286 | ehrlicher Widerspruch statt Lob | auf Zuruf | **ein** Cloud-Zug | ein Request |
| 287 | ein Schritt, kein Roman | auf Zuruf, Todo nur nach Ja | **ein** Cloud-Zug | ein Request |

283 und 284 sind der Gewinn. 286 und 287 dürfen das Kontingent nur
anfassen, wenn der Satz sie verlangt — sonst bleiben sie stumm.

---

## 6. Won’t (hart)

- Katalog-Agent `architect` / `curator` / `organizer` / `meta` mit
  `promptSlice`, der andere Agenten startet.
- RICE, ICE, MoSCoW, Auto-Score, „Priorität 72/100“.
- Notion, Obsidian, mem0, zweite JSON-Datei neben dem Hausstand.
- Auto-Roadmap, Meilensteine, Gantt, Quartalsplan.
- Stille Weitergabe an Research, Coder oder den Curator.
- Querschnitt-Matcher, Embedding-Cluster, „passt zu deiner anderen Idee“.
- Wöchentlicher Digest oder Notification ohne Auftrag.
- Englische Rollen in der UI (*Project Architect*, *Idea Curator*).
- Ideen aus jedem Chat still ernten.
- Neues Overlay oder eine zweite Körper-Sicht nur für Ideen.

---

## 7. Abbruchkriterien

- Ein zweiter LLM-Organizer steht im Katalog.
- „Notiz Milch“ oder „Todo Milch“ wird eine Idee.
- Eine Idee erscheint, die niemand festgehalten hat.
- Jarvis schreibt von allein eine Roadmap oder ein Ticket.
- Eine Erinnerung an eine Idee kommt, ohne dass jemand sie bestellt hat.
- 286 oder 287 laufen ohne Zuruf (beim Festhalten oder beim Listen).
- Hausstand-Export ohne `ideas`, nachdem 283 CODE ist.
- RICE/ICE-Zahlen in einer Antwort.

Index: [`sprints/README.md`](./sprints/README.md) · Versionen:
[`09-versioning.md`](./09-versioning.md) · Vorherige Schiene:
[`71-audit.md`](./71-audit.md) · Organizer-Won’t:
[`70-next.md`](./70-next.md) §0b
