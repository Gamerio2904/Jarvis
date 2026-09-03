# 57 — Memory-10 Intensiv-Befund + nächste Sprints **PLAN**

PO 2026-09-03: Execute 187–194 liegt in Code **`10.60.0`**. Diese Datei ist der **ehrliche** Lauf danach — Parser, Gold, Chat, Settings. Kein Execute.

**App-Stand:** Code **`10.60.0`**. Sideload **`10.60.0`**. 195 **FREEZE**. 193 Gerät **PO**. Hirn Gemini → Groq → 0,5B. Parser zuerst. Plan [`56-next.md`](./56-next.md) **CODE**.

Probe: `npm run test:memory-10-intens` (Audit, kein Gate). Gold: `test:memory-10`. Chat/Settings: Vite `10.60.0`.

---

## Intensiv-Befund

### Geht

| Fläche | Nachweis |
|--------|----------|
| Gold G1–G6 synthetisch | `test:memory-10` grün, **ohne e5** |
| Live G1 Write+Recall | Chat: `Ich trinke gerne Mate.` → *Gemerkt: Mate.* Frage `Was trinke ich?` → *Sie trinken Mate.* (Memory-Tool, nicht Retrieve) |
| Live G2 Write+Recall | `Merk dir: FritzBox-Passwort ist Blau12` → Gemerkt. `Was ist mein WLAN-Passwort?` → *Pin: FritzBox-Passwort ist Blau12.* Recall-Tool + Alias |
| Live G3 Write-Pfad | `Merk dir: Ich will 2027 nach Tokyo.` → `key=notiz`, `kind=goal`, Entities japan/tokyo. Retrieve trifft Tokyo |
| G5 ohne Messages | Goal-Filter: Pref (Döner/Pizza) nicht als Reise. `formatRecallReply` *Nichts Belegtes* |
| Tense | `War ich in Japan?` filtert Future-Goal. `Welche Reisen plane ich?` lässt Past-Event weg |
| Gate | IGNORE Dump/Smalltalk/Nudeln-ohne-Merk/identisch. STORE neu. REVISE neuer Wert gleicher Key. Contradiction `kein Döner mehr` löscht live (nicht Gate-REVISE) |
| 1-Hop | max 2 Nachbarn, Top 6 |
| Prune | `name` bleibt. `not_useful` fliegt zuerst bei Cap 80 |
| Utility | `Das stimmt nicht` / `falsch gemerkt` |
| e5 | Default aus, `applyE5Rerank` Identität, nie `pickRoute` |
| Settings Tests | Gruppe **Memory-10** G1–G6 Kopierprompts |
| Settings Daten | Leerzustand; nach Write: Mate `pref`/`getränk`, FritzBox `fact` + wlan/wifi/fritzbox/router, Key `notiz` |
| Regression | `test:014`, `test:rest-final`, `test:alltag`, `test:prompts` grün |
| Typecheck / Lint | `tsc -b`; oxlint ohne Error (alte Warnings) |

### Geht nicht

| Fläche | Warum | Sprint |
|--------|--------|--------|
| **G5 live** | Ohne Reise-Pin antwortet Recall *Gespräch: Welche Reisen plane ich?* — Echo der User-Zeile aus Messages, Chip *Gedächtnis*. Unit-Gold hat keine Messages, deshalb grün | **197** Must |
| **Alias zu breit** | Gruppe enthält `passwort` / `essen` / `termin`/`arzt`. Bank-Passwort wird WLAN; Pizza wird Döner-Treffer; Hausarzt-Termin wird Zahnarzt-Gruppe | **196** Must |
| **memoryBlock ignoriert Memory-Hits** | `hits.filter(h => h.store !== 'memory')`. Retrieve 2 läuft im Hirn-Pfad, die Pins landen nicht im Prompt. Alias-WLAN ohne Recall-Tool = *Nichts erfinden* obwohl Retrieve Blau12 hat | **198** Must |
| **parent_key immer `reise`** | Jedes `kind=goal` (`Ich will ein neues Auto`) hängt an `reise` | **199** Should |
| **`Mag ich Döner?` ohne Hirn** | Kein Memory-/Recall-Parser. Ohne Gemini/Groq/0,5B: *Kein Hirn bereit.* G1 geht nur weil `Was trinke ich?` ein Memory-Tool ist | **201** Should |
| **Ohne `Merk dir` kein Goal-Write** | `Ich will 2027 nach Tokyo.` ist kein `isMemoryWrite`. Plan-Probe 16 ohne Merk gilt nicht. Parser-first, kein stilles Harvest | Won’t stilles Harvest; Copy hat Merk — ok |
| **Gerät / Mic / Sideload** | Kein Handy-Protokoll. APK weiter `9.10.0`. `Gerät nicht bereit` in der Web-UI | **193** PO |
| **G4 Copy vs Gate** | Gold testet Gate-REVISE. Live `kein Döner mehr` ist Contradiction-**Delete**. Beides macht den alten Wert weg; die Copy-Gruppe behauptet REVISE | **200** Docs/Gold |

### Besser (nicht heimlich in `10.60`)

Gold muss den **Live-Pfad** messen: `parseMemoryFacts` → Key `notiz`, Retrieve mit User-Messages, `formatRecallReply`. Sonst bleibt G5 ein Lab-Grün.

Hirn-Pfad und Recall-Tool müssen dieselbe Wahrheit sehen. Heute sieht nur das Recall-Tool Retrieve-2-Memory.

195 bleibt Freeze: G2/G3 brauchen kein e5. Alias-Rot ist Lexikon, nicht Encoder.

---

## Live-Chat (Vite `10.60.0`, kein Key)

| Prompt | Antwort | Urteil |
|--------|---------|--------|
| Ich trinke gerne Mate. | Gemerkt: Mate. | geht |
| Merk dir: FritzBox-Passwort ist Blau12 | Gemerkt: FritzBox-Passwort ist Blau12. | geht |
| Was trinke ich? | Sie trinken Mate. | geht |
| Was ist mein WLAN-Passwort? | Pin: FritzBox-Passwort ist Blau12. | geht |
| Welche Reisen plane ich? | Gespräch: Welche Reisen plane ich? + Gedächtnis | **rot** — Echo |
| Mag ich Döner? | Kein Hirn bereit. Gemini-Key … | **rot** ohne Parser |

---

## Geplante Sprints

Reihenfolge = Lieferreihenfolge. Could blockiert Must nicht. 195 nicht antauen.

| Sprint | Version | Thema | Must? | Stand |
|--------|---------|-------|-------|-------|
| **196** | `10.61.0` | Alias-Lexikon: `passwort`/`essen`/`termin` keine Gruppenanker | Must | **PLAN** |
| **197** | `10.62.0` | Recall leer: kein Gespräch-Echo der Frage (G5 live) | Must | **PLAN** |
| **198** | `10.63.0` | `memoryBlock` nutzt Retrieve-Memory-Hits | Must | **PLAN** |
| **199** | `10.64.0` | `parent_key` nur bei Reise-Goals | Should | **PLAN** |
| **200** | `10.65.0` | Gold = Live-Pfad (`test:memory-10` + Intensiv-Rots als Gate) | Should | **PLAN** |
| **201** | `10.66.0` | `Mag ich …?` Parser → Recall/Memory ohne Hirn | Should | **PLAN** |
| **193** | Gerät | Memory-Tor G1–G6 auf dem Handy | PO | bleibt |
| **195** | `10.70.0` | e5-Rerank | Could | **FREEZE** |

Sprint-Dateien: [`sprint-196.md`](./sprints/sprint-196.md)–[`sprint-201.md`](./sprints/sprint-201.md).

### Won’t

Qdrant, Qwen-Embed, e5 als Router, stilles Gemini-Sleep, Goal-Write ohne Merk/Parser, APK-Gewichte, Play Store. 195 nicht „weil Intensiv rot“ — die Roten sind Lexikon/Prompt/Echo.

---

## Abnahme dieser Datei

- [x] Geht / Geht nicht / Besser mit Nachweis (Parser + Chat).
- [x] Sprints 196–201 plus 193/195.
- [x] Kein Execute in diesem Dokument-Sprint.

Index: [`42-planned.md`](./42-planned.md). Execute-Ist: [`56-next.md`](./56-next.md).
