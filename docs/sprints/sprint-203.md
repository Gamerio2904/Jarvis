# Sprint 203 — Teach-Parser + Harvest (`11.10.0`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **CODE** Must |
| Ziel-Version | **`11.10.0`** |
| Quelle | [`58-next.md`](../58-next.md) |
| Vorher | 202 Store |

## Ziel

Der Nutzer kann Wissen **bewusst** anlernen. Quelle ist last research, letzte Notiz, letztes Doc oder mitgelieferter Text. Nichts Stilles.

## Must

| ID | Inhalt |
|----|--------|
| H1 | `teach-parse.ts`: `lern das`, `merk dir als Fachwissen X`, `das ist Fachwissen X` |
| H2 | Topic aus der Äußerung (`als Fachwissen Arc-Reactor`) oder Slug aus letzter Research-Query |
| H3 | Harvest-Reihenfolge: expliziter Text → `last_research_json` → last Doc-Excerpt → last Note. Leer → ehrlich fragen |
| H4 | Claims: 1 Satz / Zeile, URLs aus Research-Sources. `user_ok=true` nur nach diesem Intent |
| H5 | Registry-Score + `conflicts.ts`: Zahnarzt+Wochentag = Kalender; Mate = Memory; IR-Lernen = Fan |
| H6 | Reply: `Gelernt: {title}, {n} Sätze.` Kein Marvel |

## Won’t

Stilles Gemini-Sleep. Instagram-ASR. Fine-Tune. Neues `if` in `chat.ts` — Handler über Registry wie `handleDoc`.

## DoD

- [ ] Parser-Gold: Teach vs Memory vs Kalender vs Fan
- [ ] Ohne Quelle: keine leere Pack-Zeile
- [ ] `test:prompts` / `test:014` weiter
