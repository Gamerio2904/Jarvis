# 88 — Personen-Knäuel + Gedächtnis **CODE** (`18.16.0`)

PO: Jarvis soll klüger und menschlicher wirken, **ohne** zweites Hirn und
ohne Schwarm. Kern: alles, was zu **einer Person** gehört (Geburtstag,
Tel, Ort, Alias), hängt zusammen. Nach „Mama hat am 3. März Geburtstag“
reicht „Wer ist meine Mutter und wann hat sie Geburtstag“ — ohne denselben
Satz nochmal zu sagen.

Grundlage: Sideload **`18.15.0`**. **Dieses Dokument ist nach Execute CODE.**
Sprints **369–376**. App-Code **`18.16.0`**. Sideload bleibt **`18.15.0`** bis APK.

Andere Drafts bleiben getrennt: Koch `#149`, Kamera-Wahl `#151`, Clips `#152`,
Experte `#153`, Docs-Stand `#156`, Abbruch-Hotfix `#158` (`18.15.1`).

## 0. Ist (Diagnose)

| Stelle | Heute (`18.15.0`) | Folge |
|--------|-------------------|--------|
| Geburtstag schreiben | `birthday.ts` → `upsertMemory(key=mama, value=3.3., category=birthday)` **ohne** Gate, ohne `entities`, ohne `related_ids`. Extra: Reminder `Geburtstag Mama` | Pin und Erinnerung sind zwei Inseln |
| Alias | `ALIAS_GROUPS` in `memory-alias.ts`: WLAN/Japan/Zahnarzt/Döner. **Kein** mama/mutter/mother | „Mutter“ trifft den Pin `mama` nicht |
| Recall-Frage | `recall-parse.ts`: „was weißt du über …“, nicht „wer ist meine Mutter“, nicht „wann hat sie Geburtstag“ | Kombinierte Frage fällt ins **LLM**, ohne Merge |
| Aspekt | `category: birthday` → `life`, Kontakt → `people` | `pinsForAsk` holt Birthday nicht über PEOPLE_ASK |
| Maps-Kontakt | `places.ts` schreibt Tel/Ort/Mail nackt `upsertMemory` | Tel und Geburtstag teilen keinen Graph |
| Begrüßung | `greeting.ts`: „Guten Morgen. Ich höre.“ | Kein Termin, kein Timer, kein letzter Zug |
| Sleep | `tickSleepMemory`: nur Namens-Regex, **Return wenn Gemini-Key da**, alle 12 min | Fast tot auf dem PO-Handy |
| Arbeitsgedächtnis | 8 Zeilen à 120 Zeichen Rohtext | „und morgen?“ nur beim Wetter verdrahtet |
| Korrektur | `parse-miss.ts` loggt; „Nein, das war der Timer“ listet Timer, spielt den Miss **nicht** nach | Derselbe Miss jeden Tag |
| Episode | `digest` nur auf Zuruf | Kein „gestern: Zahnarzt, Mama-Geburtstag“ |

Gold heute: `Mama hat am 3. März Geburtstag` → `birthday`. **Kein** Gold für
die Nachfrage Mutter/Geburtstag.

## 1. Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Person | Eine synonyme Gruppe **ist** die Person. Mama = Mutter = Mother. Kein extra Satz „Mama ist meine Mutter“ nötig |
| Schreiben | Geburtstag (dann Kontakt/Ort) durch `writeMemory` / Gate, mit `entities` und Nachbarn |
| Lesen | Ein **Recall**-Zug, ein Satz, nur zitierte Speicher. Kein zweiter Agent, kein LLM-Raten eines Namens |
| Name | Wenn nur „Mama“ steht: so antworten. Keinen bürgerlichen Namen erfinden |
| Datum | Nur aus Birthday-Pin oder Reminder-Titel. Kein Kalender-Klischee, kein „bestimmt bald“ |
| Rest | Begrüßung, Episode, Sleep, Last-Step, Korrektur-Replay — nach dem Knäuel, gleiche Honesty |
| Router | Parser. Embedding nie in `pickRoute`. Groq formuliert höchstens Micro-Merge des Recall-Satzes |
| Schwarm | **Kein** Organizer. Parallel nur Lesen **in** Recall (Memory+Reminder), ein Satz |

## 2. Warum nicht die naheliegenden Ideen

| Idee | Warum nicht |
|------|-------------|
| LLM schließt „Mutter = Mama“ | Unbelegt, wenn jemand wirklich zwei Personen meint. Synonym-Gruppe ist die Regel, sichtbar im Code |
| Neuer Agent `family` | Recall + Birthday reichen. 64. Agent ohne Sweep wäre Diebstahl |
| Knowledge-Pack für Leute | Packs sind Fachwissen mit URL. Personen sind Pins |
| Fine-Tune / Schwarm | Sideload, Honesty, Kontingent |
| Begrüßung mit erfundenem „gut geschlafen“ | Kein Beleg |
| Sleep schreibt jedes Arbeitsgedächtnis | Gate ignoriert Smalltalk/Mahlzeiten extra; Gemini-Key darf Sleep **nicht** abschalten |

## 3. Architektur

```text
„Mama hat am 3. März Geburtstag“
  → birthday-Parser
  → writeMemory(key=mama, category=birthday, entities={mama,mutter,mother})
  → Reminder „Geburtstag Mama“ (wie heute)
  → Nachbarn linken, wenn Tel/Ort schon da

„Wer ist meine Mutter und wann hat sie Geburtstag“
  → recall-Parser (Thema: mutter → Alias-Gruppe)
  → retrieve + expandHops + Reminder-Titel
  → personClusterReply: ein Satz, nur Belege
  → optional Micro-Merge (Ton), groundMicroMerge (keine neue Tat)
```

## 4. Sprints (`18.16.0`)

Harte Kette: **369 → 370 → 371** (Must, Personen-Knäuel).
**372** nach 370 (Kontakt in denselben Graph).
**373–376** nach 369, parallel möglich; 376 nutzt Miss-Log aus 368.

| Sprint | Thema | Rolle |
|--------|--------|--------|
| [369](./sprints/sprint-369.md) | Familien-Aliase Mama/Mutter, Papa/Vater, … | Must CODE |
| [370](./sprints/sprint-370.md) | Geburtstag schreibt durch `writeMemory` | Must CODE |
| [371](./sprints/sprint-371.md) | Recall: wer/wann Geburtstag, ein Cluster-Satz | Must CODE |
| [372](./sprints/sprint-372.md) | Kontakt/Ort/Mail durch dasselbe Gate | Should CODE |
| [373](./sprints/sprint-373.md) | Begrüßung aus Stand (Termin/Timer/letzter Zug) | Should CODE |
| [374](./sprints/sprint-374.md) | Episode-Karte nach Sitzung, mit Ablauf | Should CODE |
| [375](./sprints/sprint-375.md) | Sleep: Prefs/Ort durch Gate, auch mit Gemini-Key | Should CODE |
| [376](./sprints/sprint-376.md) | Last-Step als Absicht + Korrektur spielt Miss nach | Should CODE |

## 5. Gold / TEST (nach Execute)

Pflicht (371):

- Eintrag: `Mama hat am 3. März Geburtstag` → `birthday`
- Frage: `Wer ist meine Mutter und wann hat sie Geburtstag` → `recall`
- Frage: `Wann hat Mama Geburtstag` → `recall` oder `birthday` (ein Agent, dokumentiert)
- Antwort nennt **Mama** und **3. März** (oder `3.3.`), **kein** erfundenes „Ingrid“
- Ohne Eintrag: ehrlich „Nichts Belegtes“, kein Raten

Weitere Chips: Papa/Vater analog; `Freundin, Tel …` dann `Ruf die Freundin an` bleibt `maps`.

## 6. Won’t

Kein LLM-Schwarm. Kein 5. Organizer. e5 nicht in `pickRoute`. Kein bürgerlicher
Name ohne Pin. Kein „Live“. 0,5B bleibt Fallback ohne Messung. Andere Drafts
nicht mergen. Kalender-Event „Samstag Geburtstag Jakob 18 Uhr“ bleibt
`calendar` (Termin), nicht stiller Birthday-Pin — außer der Nutzer sagt
ausdrücklich „hat Geburtstag am …“.

## 7. Abbruch

Recall erfindet eine Verwandtschaft, die nicht in `ALIAS_GROUPS` und nicht
im Speicher steht. Oder Geburtstag umgeht weiter das Gate. Oder Begrüßung
behauptet eine Laune. Oder ein zweiter Domänen-Agent im selben Zug.

Landet in App-Code **`18.16.0`**. Sideload **`18.15.0`** bis APK.
Test: [`TEST-18.16.md`](./TEST-18.16.md).
