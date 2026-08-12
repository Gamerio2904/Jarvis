# 10 — Intelligence Capabilities (Ausarbeitung)

Ziel: Jarvis wird **professioneller und scharfsinniger**, ohne die Local-first- / Privacy-Linie zu brechen.  
Umsetzung erfolgt **gestuft** über Versionen/Sprints — nicht alles auf einmal.

## Sprint- & Versions-Mapping (verbindlich)

| Stufe | Version | Sprint | Inhalt | Status |
|-------|---------|--------|--------|--------|
| 1 | **`0.4.0`** | [08](./sprints/sprint-08.md) | Langzeitgedächtnis v1, Gesprächszusammenfassung, Kontextkompression | **READY FOR REVIEW** |
| 2 | **`0.5.0`** | [09](./sprints/sprint-09.md) | Intent-Router, Model-Routing, Persona-/Quality-Scores | **PLANNED** |
| 3 | **`0.6.0`** | [10](./sprints/sprint-10.md) | Verlässliche Internet-Research (opt-in, zitiert) | **PLANNED** |

Delight/Settings folgen danach als **`0.7.0`** / Sprint 11 ([`11`](./11-delight-and-settings.md), [`sprint-11`](./sprints/sprint-11.md)).

```text
0.3.1 Polish → 0.4.0 Memory → 0.5.0 Router/Routing/Scores → 0.6.0 Research → 0.7.0 Delight/Settings (Sprint 11)
```

---

## Prioritätsreihenfolge

| Stufe | Version | Inhalt |
|-------|---------|--------|
| 1 | `0.4.0` | Langzeitgedächtnis v1, Gesprächszusammenfassung, Kontextkompression |
| 2 | `0.5.0` | Intent-Router, besseres Model-Routing, Qualitäts-Eval + Persona-Scores |
| 3 | `0.6.0` | Verlässliche Internet-Research (Tool, opt-in) |

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
| `confidence` | 0–1 |
| `source_conversation_id` | UUID |
| `updated_at` | ISO |

Persistenz: SQLite-Tabelle `memory_items` (kein Cloud).

### Schreiben
- Explizit: „Merk dir …“ / „Vergiss …“
- Implizit (vorsichtig): Extraktor nach Turn, nur klare Fakten, PO kann in UI löschen
- Nie speichern: Secrets/Passwörter, One-Off-Quatsch, Inject-Inhalte

### Lesen
- Top-N relevante Items zum User-Turn (Keyword/Overlap v1; später Embeddings optional)
- In System-/Context-Block als kurze Bullet-Liste, **nicht** als Essay

### Abnahme
- Chat A: „Lieblingsfarbe petrolgrün“ → Chat B (neu): Frage danach → korrekter Recall
- „Vergiss Lieblingsfarbe“ → kein Recall mehr
- Persona/Guards bleiben grün

### Risiken
- Falsche Fakten → UI-Korrektur Pflicht
- Memory-Spam → Limits + Confidence + Kategorien

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
| `memory` | „Merk dir …“ / „Was mag ich?“ | Memory-Tools |
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
Sprint **10** → **`0.6.0`** ([`sprints/sprint-10.md`](./sprints/sprint-10.md)), nach Memory + Router.

---

## Abhängigkeiten untereinander

```text
Gedächtnis + Summary + Compression     →  0.4.0  (Sprint 8)
        ↓
Intent-Router + Model-Routing + Scores →  0.5.0  (Sprint 9)
        ↓
Internet-Research (opt-in)             →  0.6.0  (Sprint 10)
        ↓
Delight + flaches Settings             →  0.7.0  (Doc 11)
```