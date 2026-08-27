# 10 — Intelligence Capabilities (Ausarbeitung)

Ziel: Jarvis wird **professioneller und scharfsinniger**, ohne die Local-first- / Privacy-Linie zu brechen.  
Umsetzung erfolgt **gestuft** über Versionen/Sprints — nicht alles auf einmal.

### Live `1.33.0` (Code)

Suche: Quellen zuerst, Absage wird ersetzt wenn Links da sind. Produkte: Idealo/Geizhals, € nur aus Snippets. Router wie `1.32.1` plus `Öffnen CarPlay` → Fahrmodus. `pickHeard` scored ohne Drive-`inMode`-Raten.

Härten bis `2.2`: [`28-next.md`](./28-next.md), [`30-next.md`](./30-next.md).  
**`3.0.0` CODE:** Register + Score-Policy [`32-intelligence.md`](./32-intelligence.md). Welt `3.1`–`3.17` mitgeliefert [`31-next.md`](./31-next.md).  
**`3.18.0` CODE:** Follow-up, „und“, Parser-Score, Tablet-Lage, Traceroute, Digest [`33-next.md`](./33-next.md).  
**`3.19.0` CODE:** Sprachmodus ein Thread, Kalender-Fenster, Debug [`34-next.md`](./34-next.md).  
**`4.0`–`4.53` CODE:** Weltlage, Alltagskette, Algieba/HUD, Hausstand, Friday+Lage-Split.  
**`4.66` PLAN:** Körper-Schema [`40-next.md`](./40-next.md).  
**`4.76` PLAN:** LocateAnything am PC [`41-next.md`](./41-next.md).  
**`5.0` PLAN:** Weltkugel in der Lage [`43-next.md`](./43-next.md).

### Live `1.32.1` (Code)

Router-Reihenfolge in `chat.ts`: help → ordinal → TV → Fan → Drive → Maps → Memory → Einkauf → … → LLM.  
Zwei Befehle an „und“ (genau zwei Teile). `pickHeard` nimmt den ersten Parser (Drive mit `inMode=true`). Voice-History Gemini `-16`, lokal `-4`. Fahrmodus: OSRM, Cue-Phasen, Replan setzt Cue-Gedächtnis zurück.

Nächste Schärfe: [`28-next.md`](./28-next.md) `1.33`–`1.40` — Parser/STT, Antworten, Fahrmodus, Phrasen. Lokal 0,5B denkt nicht plötzlich besser.

### Live `1.24.0` (Code)

Router-Reihenfolge in `chat.ts`: help → ordinal → TV → Maps → Memory → Einkauf → Geburtstag → Zuhause → Los → Tageslage → Kalender → Wecker → Timer → Erinnerung → Tools → Auge → Wetter → Chatsuche → LLM.  
Zwei Befehle an „und“. Letzter Schritt inkl. „das zweite“. Memory-Block lokal = Gemini. Personenorte, Nummer, Maps-Modus, Einkauf, Losgehen, JS-Zaun Zuhause, Auge (Gemini), lokale Chatsuche.

### Reihe `1.16`–`1.24` — [`19-next.md`](./19-next.md) · [`20-next.md`](./20-next.md)

| Version | Intelligenz | Status |
|---------|-------------|--------|
| `1.14` | Letztes Tool; zwei Dinge; ein Name; Titel; Suche ehrlich | **CODE** |
| `1.15` | Personen↔Orte; Route in Google Maps | **CODE** |
| `1.16`–`1.18` | Liste, Losgehen (Ort am Termin + Route), Zuhause | **CODE** |
| `1.19`–`1.20` | Eine Tageslage; Auge nur Gemini | **CODE** |
| `1.21`–`1.24` | Nummer, Maps-Modus, Geburtstag, Serie, Widget, das zweite, Chatsuche | **CODE** |
| `1.33`–`1.40` | Qualität: Suche/Preise, Antworten, Fahrmodus, Phrasen, Flüssigkeit, Gedächtnis, Stimme | **CODE** [`28-next.md`](./28-next.md) |
| `3.0` | Register, Parse vor Execute, Score-Policy | **CODE** [`32-intelligence.md`](./32-intelligence.md) |
| `3.1`–`3.17` | DWD bis Schach | **CODE** in `3.0.0` [`31-next.md`](./31-next.md) |

Lokal 0,5B denkt nicht plötzlich besser. Schärfe = Router + Speicher + ehrliche Tools.

Router `3.0.0`: Register statt If-Kette, Parse vor Execute, Score-Policy — [`32-intelligence.md`](./32-intelligence.md).

## Sprint- & Versions-Mapping (verbindlich)

| Stufe | Version | Sprint | Inhalt | Status |
|-------|---------|--------|--------|--------|
| 1 | **`0.4.0`** | [08](./sprints/sprint-08.md) | Langzeitgedächtnis v1, Summary, Kontextkompression | **READY FOR REVIEW** |
| 1a | **`0.4.1`** | [09](./sprints/sprint-09.md) | Memory Must-Fixes | **READY FOR REVIEW** |
| 1b | **`0.4.2`** | [10](./sprints/sprint-10.md) | Memory Polish (Parser, Split, TTL, UI-Filter) | **READY FOR REVIEW** |
| 1c | **`0.4.3`** | [11](./sprints/sprint-11.md) | Memory Hotfix (Clause-Split, Recall, Pref) | **READY FOR REVIEW** |
| 2 | **`0.5.0`** | [12](./sprints/sprint-12.md) | Intent-Router (merk/recall/forget/clarify), Routing, Scores | **READY FOR REVIEW** |
| 2a | **`0.5.1`** | [13](./sprints/sprint-13.md) | Router Hotfix (Inject/Task/Weak-Write/Fallbacks) | **READY FOR REVIEW** |
| 2b | **`0.5.2`** | [14](./sprints/sprint-14.md) | Router Polish (Patterns, Live-Scorecard) | **READY FOR REVIEW** |
| 3 | **`0.6.0`** | [15](./sprints/sprint-15.md) | Internet-Research (opt-in, zitiert) | **READY FOR REVIEW** |
| 3a | **`0.6.1`** | [16](./sprints/sprint-16.md) | Research Hotfix (Query-PII/Noise, Settings) | **READY FOR REVIEW** |
| 3b | **`0.6.2`** | [17](./sprints/sprint-17.md) | Research Polish (Persona, Dual-Provider) | **READY FOR REVIEW** |
| 4 | **`0.7.0`** | [18](./sprints/sprint-18.md) | Delight + Settings ([`11`](./11-delight-and-settings.md)) | **READY FOR REVIEW** |
| 5 | **`0.9.0`** | [28](./sprints/sprint-28.md) | Local Tools Core (Notes/Todos, Confirm) | **READY FOR REVIEW** |
| 5a | **`0.9.1`** | [29](./sprints/sprint-29.md) | Tools Hotfix | **READY FOR REVIEW** |
| 5b | **`0.9.2`** | [30](./sprints/sprint-30.md) | Tools Polish & Continuity | **READY FOR REVIEW** |
| 5c | **`0.9.3`** | [31](./sprints/sprint-31.md) | Memory Quality Hotfix | **PLANNED** |
| 5d | **`0.9.4`** | [32](./sprints/sprint-32.md) | Assist Continuity & Siezen | **PLANNED** |
| 5e | **`0.9.5`** | [33](./sprints/sprint-33.md) | Tools Hygiene & Confirm-UX | **PLANNED** |
| 6 | **`3.0.0`** | [106](./sprints/sprint-106.md) | Register + Score-Policy; Welt `3.1`–`3.17` | **CODE** |

```text
Sprint 8  0.4.0 Memory
Sprint 9  0.4.1 Must-Fixes
Sprint 10 0.4.2 Polish
Sprint 11 0.4.3 Hotfix
Sprint 12 0.5.0 Router (+ Memory-Intent)
Sprint 13 0.5.1 Router Hotfix (prio)
Sprint 14 0.5.2 Router Polish (Should)
Sprint 15 0.6.0 Research
Sprint 16 0.6.1 Research Hotfix (prio)
Sprint 17 0.6.2 Research Polish (Should)
Sprint 18 0.7.0 Delight
```

---

## Prioritätsreihenfolge

Gleiche Reihenfolge wie oben (Sprint-Nummer = Lieferreihenfolge). Details in den Sprint-Dateien.

---

## 1) Langzeitgedächtnis

### Zweck
Fakten und Vorlieben **über Sessions und Chats hinweg** behalten — dosiert, korrigierbar, lokal.

### Datenmodell (v1, einfach)
| Feld | Beispiel |
|------|----------|
| `key` | `lieblingsessen` |
| `value` | `Döner` |
| `category` | `pref` \| `fact` \| `open_loop` \| `boundary` |
| `confidence` | 0–1 (`explicit` hoch, Soft-Harvest niedriger / „unsicher“) |
| `source_conversation_id` | UUID |
| `updated_at` | ISO |
| `expires_at` | optional ISO — TTL vor allem für Soft-Harvest (`0.4.2`) |

Persistenz: SQLite-Tabelle `memory_items` (kein Cloud).

### Schreiben
- Explizit: „Merk dir …“ / „Vergiss …“ → hohe Confidence, kein TTL (oder sehr lang)
- Implizit / Soft-Harvest (vorsichtig): nur klare Pref-Muster; **niedrige Confidence („unsicher“)** + **TTL** (`0.4.2`); UI kann löschen/filtern
- Nie speichern: Secrets/Passwörter, One-Off-Quatsch, Inject-Inhalte

### Widerspruch / Korrektur
- Muster „nicht X, sondern Y“ / „X war falsch, Y stimmt“: alten Wert **ersetzen** (gleicher Key) und **kurz nachfragen** zur Bestätigung
- v1-Heuristik + saubere Values: Sprint 10 / `0.4.2`
- Volle Policy über `memory.clarify`: Sprint 12 / `0.5.0` (Doc §4.1)

### Lesen
- Top-N relevante Items zum User-Turn (Keyword/Overlap v1; später Embeddings optional)
- Abgelaufene TTL-Items und sehr unsichere Soft-Pins nicht (oder nur selten) injizieren
- In System-/Context-Block als kurze Bullet-Liste, **nicht** als Essay

### UI
- Liste „Was Jarvis über mich weiß“ (ab `0.4.0`)
- **Filter nach Kategorie** `pref` / `fact` / `boundary` (+ optional `open_loop`) — Sprint 10 / `0.4.2`
- Unsichere Soft-Harvest-Einträge visuell markieren (Confidence / „unsicher“)

### Abnahme
- Chat A: „Lieblingsfarbe petrolgrün“ → Chat B (neu): Frage danach → korrekter Recall
- „Vergiss Lieblingsfarbe“ → kein Recall mehr
- Soft-Harvest verfällt oder fällt unter Retrieve-Schwelle nach TTL
- Persona/Guards bleiben grün

### Risiken
- Falsche Fakten → UI-Korrektur Pflicht
- Memory-Spam → Limits + Confidence + TTL + Kategorie-Filter

---

## 2) Gesprächszusammenfassung

### Zweck
Lange Chats behalten den roten Faden, auch wenn Roh-Turns gekürzt werden.

### Mechanik
- Pro Conversation: `summary_text` + `summary_upto_message_id`
- Refresh wenn: +N neue Turns **oder** Idle **oder** Kontextbudget eng
- Summary-Prompt: kurz, faktisch, deutsch, kein Stil-Ersatz für Jarvis

### Inhalt der Summary
- Thema / Ziel
- Wichtige Fakten aus diesem Chat
- Offene Fragen / To-dos
- Ton-Notizen nur wenn nötig (z.B. „Nutzer will kurze Antworten“)

### Abnahme
- 30+ Turns Smalltalk → nach Truncation trotzdem Bezug auf frühes Detail
- Summary selbst erscheint **nicht** als User-sichtbare Bubble (intern)

---

## 3) Kontextkompression (Context Packing)

### Zweck
Statt naiv „letzte N Messages“: **maximales Signal pro Token**.

### Pack-Reihenfolge (Budget von oben)
1. Persona (fix)
2. Guard-/Anti-Hijack-Kurzregeln (fix)
3. Langzeitgedächtnis-Pins (klein)
4. Chat-Summary
5. Letzte K Roh-Turns (immer die neuesten vollständig)
6. Optional: Tool-Ergebnisse

### Regeln
- Hartes Token-/Zeichenbudget aus Settings
- Nie Summary **statt** der letzten User-Message
- Bei Konflikt: neueste User-Aussage > alter Memory-Fakt (mit Nachfragen)

### Abnahme
- Eval: gleicher Prompt mit Packer vs. naive Truncation → bessere Faktentreue
- Keine Latenz-Explosion (Summary async/periodisch)

---

## 4) Intent-Router

### Zweck
Vor der Antwort grob erkennen, **welche Art Turn** vorliegt — dann andere Prompt-/Tool-Policy.

### Intent-Klassen (v1)
| Intent | Beispiel | Policy |
|--------|----------|--------|
| `smalltalk` | „Hey, wie geht’s?“ | Persona-first, kurz |
| `memory` | „Merk dir …“ / „Was mag ich?“ | Memory-Tools (+ Subklassen, §4.1) |
| `helpdesk_trap` | „Wie kann ich … helfen“-Bait | Anti-Boilerplate |
| `inject` | Jailbreak / Zwangstoken | Guards hart |
| `task` | „Plan mir …“ / strukturierte Hilfe | etwas längere, klare Antwort ohne Tip-Listen-Manie |
| `research` | „Was ist der Stand zu …?“ | nur wenn Research-Tool an |
| `settings` | Easter-Egg / Modus | lokale Commands |

### Umsetzung
- Leichtgewicht: Regex/Heuristik + kleines Klassifikations-Prompt (oder gleiches Modell mit JSON-Intent)
- Router **entscheidet Policy**, ersetzt nicht die Persona

### Abnahme
- Gold-Set ~30 Prompts → Intent-Accuracy dokumentiert
- Falscher Research-Intent ohne Opt-in → kein Netzaufruf

---

## 4.1) Memory-Intent (Erweiterung, geplant mit `0.5.0`)

> Unabhängig von Memory-Patches `0.4.1`/`0.4.2`: der **Router** macht Memory-Turns bewusst steuerbar.  
> Sprint: [12](./sprints/sprint-12.md) · Version **`0.5.0`**.

### Zweck
`memory` ist kein einzelner Eimer. **merk / recall / forget** (plus clarify) brauchen **sauber getrennte** Pfade und **eigene Reply-Policies** — sonst kollidieren Guards (Helpdesk-Boilerplate) mit ehrlichen Merk-Acks, und das Modell „notiert“ verbal ohne Persistenz.

### Subklassen (Must trennen)
| Subklasse | Trigger (Beispiele) | Reply-Policy (verbindlich) |
|-----------|---------------------|----------------------------|
| `memory.write` (merk) | „Merk dir …“, „Kannst du dir merken …“, klare Pref-Aussage | Write **vor** Reply; Ack 1 Satz Jarvis-Ton; bei Boilerplate → **Retry/Nudge**, **kein Helpdesk-Fallback** (`SAFE_NO_HELPDESK` / „Gerne!“-Canned verboten) |
| `memory.recall` | „Wie heißt mein Hund?“, „Was mag ich?“ | Nur relevante Pins; kurze faktische Antwort; kein Memory-Dump; kein Helpdesk-Canned |
| `memory.forget` | „Vergiss …“, „Vergiss alles“, „Lösch die Erinnerung an …“ | Delete/Clear ausführen; bestätigen was weg ist; alte Pins nicht erneut injizieren |
| `memory.clarify` | „nicht X, sondern Y“, Widerspruch zu gespeichertem Wert | Alten Wert **ersetzen**; **kurz nachfragen** („Pizza statt Döner — so merken?“); nie parallel X+Y als Wahrheit |

### Reply-Policy-Regel (alle `memory.*`)
- Eigene Nudges / Sampling / Guard-Verhalten laut Policy-Map
- **Kein Helpdesk-Fallback** als Endzustand bei Memory-Turns (Boilerplate → regenerieren oder Memory-sichere Canned-Ack, nicht Support-Sprech)
- Claims in der Reply müssen zum Tool-Ergebnis passen (kein False-Confirm)

### Contradiction-Handling (Teil von `memory.clarify`)
```text
„Mein Lieblingsessen ist nicht Döner, sondern Pizza.“
  → detect contradict (key=lieblingsessen)
  → upsert value=Pizza (Confidence hoch)
  → Reply: kurz bestätigen + 1 Rückfrage
```

### Pipeline (Soll)
```text
User-Msg
  → Intent-Router → memory.write | memory.recall | memory.forget | memory.clarify
  → Policy-Map (Nudge / Guard ohne Helpdesk-Fallback / Retrieve-Schärfe)
  → Memory-Tools
  → LLM mit dosiertem Context
  → Reply nur mit Claims, die zum Tool-Ergebnis passen
```

### Abgrenzung zu `0.4.x`
| Version | Was |
|---------|-----|
| `0.4.0` | Memory v1 (Store, Summary, Pack) |
| `0.4.1` | Bugs: False-Confirm, Aussetzer, Vergiss-alles |
| `0.4.2` | Polish: Parser, Split, Retrieve, Summary, UI-Filter, Soft-Harvest TTL/Confidence; Widerspruchs-Heuristik v1 |
| `0.4.3` | Hotfix: Clause-Split, Recall-Stabilität, Pref ohne „mein“ |
| `0.5.0` | **Router: merk/recall/forget/clarify getrennt + Reply-Policy ohne Helpdesk-Fallback** |
| `0.5.1` | Hotfix: Inject/Task, Weak-Write, Non-Memory-Fallbacks |
| `0.5.2` | Polish: Router-Patterns, Live-Scorecard, Routing-Ehrlichkeit |
| `0.6.0` | Research opt-in, Citations, Audit |
| `0.6.1` | Hotfix: Query-PII/Noise, Topic-Extraktion, Settings-Hygiene |
| `0.6.2` | Polish: Research-Persona, Dual-Provider/DDG, Scorecard |

### Abnahme (zusätzlich zu Router-Gold-Set)
- Gold-Set trennt merk vs recall vs forget zuverlässig
- `write`-Turn speichert und bestätigt ehrlich; **nie** Helpdesk-Canned als Final
- `forget` / `forget-all` spiegeln Store-Zustand
- Contradiction: Wert ersetzt + kurze Nachfrage in der Reply
- `recall` ohne Ambient-Leak bei Smalltalk-Fehlklassifikation
- Eval: Intent-Accuracy Memory-Subklassen + `0.4.x`-Memory-Cases grün

---

## 5) Besseres Model-Routing

### Zweck
Qualität wo nötig, Tempo wo möglich — auf der RTX-3060-Klasse.

### Policy (Vorschlag)
| Situation | Modell |
|-----------|--------|
| Smalltalk / kurz | Default `qwen2.5:7b` (oder schnelleres Fallback) |
| Memory-Extrakt / Summary | 7b, niedriger Sampling |
| Schwere Task / Research-Synthese | optional größeres Modell falls installiert |
| Fallback | `3b` + UI-Warnung (schon vorhanden) |

### Settings
- `model_default`, `model_fallback`, `model_heavy` (optional)
- `routing_mode`: `auto` \| `always_default` \| `always_heavy`

### Abnahme
- Auto-Routing wählbar; Health zeigt aktives Modell
- Kein stiller Cloud-Fallback

---

## 6) Qualitäts-Eval + Persona-Scores

### Zweck
Regressionen an Charakter & Intelligenz **messbar** machen — nicht nur Bauchgefühl.

### Scorecard (0–100 oder 0–1)
| Dimension | Misst |
|-----------|--------|
| `persona_tone` | Jarvis-Ton, kein Helpdesk |
| `siezen` | kein Duzen-Leak |
| `anti_inject` | Zwangstokens/Jailbreaks |
| `brevity` | messenger-kurz |
| `memory_recall` | Fakten treffen |
| `anti_list` | keine Coach-Listen |
| `german` | Sprache |

### Mechanik
- Feste Prompt-Suite + automatische Checks (Regex/Guards) + optional LLM-as-judge lokal
- CI/Script: Fail bei Score unter Schwelle oder bei Must-Fail-Cases
- Trend über Versionen in `docs/` oder Script-Output

### Abnahme
- `eval` liefert Scorebericht; `0.4.0+` darf Persona-Score nicht unter Baseline `0.2.2` fallen

---

## 7) Verlässliche Internet-Research („100 % verlässlich“ = Engineering-Ziel)

> Ehrlich: Kein System ist epistemisch 100 % wahr.  
> **Produktziel:** Research ist **nachvollziehbar, zitiert, wiederholbar, opt-in, lokal orchestriert** — Fehler werden sichtbar, nicht vertuscht.

### Nicht-Ziele
- Heimliches Cloud-LLM als Denker
- Antworten ohne Quellen
- Scraping ohne Transparenz

### Architektur
```text
User fragt (Intent=research, Opt-in an)
  → Query normalisieren
  → Retrieval über erlaubte Quellen/Provider (allowlist)
  → Roh-Snippets + URLs + Zeitstempel speichern
  → Lokal: Synthese nur aus Snippets (citation-required)
  → Antwort: Kernaussage + Quellenliste + Unsicherheitsmarker
  → bei Widerspruch: „Quellen widersprechen sich“ statt Fantasie
```

### Verlässlichkeits-Garantien (DoD)
| Garantie | Bedeutung |
|----------|-----------|
| Opt-in | Default aus; klarer Toggle in Einstellungen |
| Citations | Jede faktische Claim stützbar durch URL/Snippet |
| No-source → refuse | Keine Behauptung ohne Beleg |
| Allowlist | Nur konfigurierte Provider/Domains |
| Audit-Log | Query, Zeit, Quellen lokal einsehbar |
| Reproducible pack | Gespeicherte Snippets für denselben Turn |
| Timeout/Fail soft | Netz down → klare Meldung, kein Halluzinationsfüllen |
| Privacy | Keine Chat-History an Suchprovider außer der Query (minimiert) |

### UI
- Badge „Mit Quellen“ an der Antwort
- Quellen aufklappbar (flach, keine Nested-Hölle)
- Button „Nur lokal / ohne Netz“

### Abnahme
- Eval-Set mit bekannten Fakten + absichtlich unbeantwortbaren Fragen
- Unbeantwortbar → „keine verlässliche Quelle“ statt Raten
- Mit Netz-Off → kein Research-Pfad

### Versionierung
Sprint **15** → **`0.6.0`** ([`sprints/sprint-15.md`](./sprints/sprint-15.md)), nach Memory + Router (+ empfohlen 0.5.1).

---

## 5) Local Tools (Option A)

### Zweck
Neben Memory/Research **handlungsfähige**, lokale Persistenz: Notizen und Todos — mit **Confirm vor Write**, ohne Cloud-APIs.

### Abgrenzung
| Geht in `0.9.x` | Geht **nicht** |
|-----------------|----------------|
| Tool-Runtime (Allowlist, Schema, Dry-Run, Confirm, Audit) | Mail / Fire TV / Alexa in `0.9.x` |
| `notes` + `todo` (SQLite) | Cloud-Kalender-OAuth; TV erst `0.11` |
| Router/`/hilfe` Integration | Autonome Multi-Tool-Ketten ohne Confirm |
| False-Confirm-Guards | Secrets speichern |

Memory („Merk dir …“) bleibt Fakten-Gedächtnis; Tools sind **explizite Arbeitslisten**.

### Versionierung
| Version | Sprint | Inhalt |
|---------|--------|--------|
| **`0.9.0`** | [28](./sprints/sprint-28.md) | Runtime + Notes + Todos |
| **`0.9.1`** | [29](./sprints/sprint-29.md) | Hotfix |
| **`0.9.2`** | [30](./sprints/sprint-30.md) | Polish / Continuity |
| **`0.9.3`** | [31](./sprints/sprint-31.md) | Memory Quality |
| **`0.9.4`** | [32](./sprints/sprint-32.md) | Assist Continuity |
| **`0.9.5`** | [33](./sprints/sprint-33.md) | Tools Hygiene |

NAS/APK: **`0.10.x`** ([`12-nas-apk.md`](./12-nas-apk.md)). Samsung-TV: **`0.11.x`** (Sprints 40–42).

Vorher empfohlen: **`0.8.5`** Persona/Continuity ([27](./sprints/sprint-27.md)).

---

## Abhängigkeiten untereinander

```text
Gedächtnis + Summary + Compression     →  0.4.0  (Sprint 8)
        ↓
… (Router / Research / Delight / Assist 0.5–0.8) …
        ↓
Persona & Continuity Hotfix           →  0.8.5  (Sprint 27)
        ↓
Local Tools Core                       →  0.9.0  (Sprint 28)
        ↓
Tools Hotfix                           →  0.9.1  (Sprint 29)
        ↓
Tools Polish                           →  0.9.2  (Sprint 30)
        ↓
Memory Quality Hotfix                 →  0.9.3  (Sprint 31)
        ↓
Assist Continuity & Siezen             →  0.9.4  (Sprint 32)
        ↓
Tools Hygiene & Confirm-UX             →  0.9.5  (Sprint 33)
        ↓
NAS Core + APK                         →  0.10.0–0.10.5  (Sprints 34–39)
        ↓
Samsung TV                             →  0.11.0–0.11.2  (Sprints 40–42)
```