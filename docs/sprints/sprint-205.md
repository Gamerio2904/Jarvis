# Sprint 205 — Deep Research + Teach-Offer (`11.30.0`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **CODE** Must |
| Ziel-Version | **`11.30.0`** |
| Quelle | [`58-next.md`](../58-next.md) |
| Vorher | 204 Retrieve (Offer kann 203 schon speichern; Deep macht die Ernte besser) |

## Ziel

„Recherchiere tief / entwirf / systematisch“ nutzt **mehrere** Queries und bietet danach an, das Ergebnis zu lehren. Weiterhin ein Loop in `chat.ts`, kein zweiter Agent.

## Must

| ID | Inhalt |
|----|--------|
| D1 | `isDeepResearch` in `research-parse.ts`: tief / deep research / entwirf / Papers / systematisch. Bloßes „recherchier Benzinpreis“ bleibt normal |
| D2 | `fillDeepResearchLinks`: 3–5 Queries (Roh, Constraint, Vergleich, arxiv/wikipedia, DE Stand der Technik) |
| D3 | Bestehenden Gemini-Search-Pass nutzen. Deep darf `maxOutputTokens` 1200, nicht 8k-Essay |
| D4 | `guardResearchReply` bleibt: Zahlen nur aus Snippets |
| D5 | Nach Quellen: Pending `teach_offer` — „Soll ich das als Fachwissen «…» merken?“ `ja` / `lern das` → 203 |
| D6 | Kein stiller Write. Research-Opt-in / Offer „ja bitte“ (Suche aus) unverändert |

## Won’t

6–12 h Background. FGS-Crawl. Instagram. Multi-Agent. Neues `if (deep)` außerhalb Parser/fill — Deep setzt `wantSearch` über `isLiveLookup`/`isDeepResearch`, der Loop bleibt.

## DoD

- [ ] Unit: Deep-Query-Liste ≥ 3, normaler Live-Lookup bleibt 1–2
- [ ] Offer speichert nicht ohne Ja
- [ ] `test:014` Research-Fälle weiter
