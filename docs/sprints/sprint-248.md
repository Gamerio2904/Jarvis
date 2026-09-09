# Sprint 248 — Einstellungs-Suche v2

**Version:** `16.0.0` (versionCode `160000`) — **UI-Meilenstein**  
**Plan:** [`65-next.md`](../65-next.md) §8

## Ziel

Einstellungs-Suche findet Felder, nicht nur Tab-Labels. Synonyme, Tab-Sprung, Feld-Highlight, Vorschläge bei Miss.

## Heute vs. Ziel

| Heute | Ziel |
|-------|------|
| `filterTopics()` nur Tab label/hint + Regex-Aliase | Vollständiger Feld-Index |
| „Fernseher“ teils miss (242 quick-fix) | Synonym-Map + Feld-Treffer |
| Miss → „Nichts zu …“ | „Meinten Sie TV?“ + Vorschläge |
| Tab-Sprung ohne Scroll | Scroll + 2 s Accent-Ring auf Feld |

## Lieferumfang

| ID | Task | Datei | Status |
|----|------|-------|--------|
| S248-1 | `SettingsSearchHit` Typ + Index-Builder | `settings-search-index.ts` | PLAN |
| S248-2 | `SETTINGS_FIELD_INDEX` aus Labels in SettingsScreen | `SettingsScreen.tsx` | PLAN |
| S248-3 | `searchSettings(q)` → Hits mit tab + field | `settings-ia.ts` | PLAN |
| S248-4 | Synonyme: Fernseher→tv, Wecker→alarm, Groq→keys, … | `settings-search-index.ts` | PLAN |
| S248-5 | UI: Treffer → Tab + scrollIntoView + Highlight | `SettingsScreen.tsx` | PLAN |
| S248-6 | Miss-Vorschläge (Fuzzy, max 3) | `settings-ia.ts` | PLAN |
| S248-7 | Tests: Fernseher, Kalender, Groq, Kugel, Löschen | unit tests | PLAN |
| S248-8 | Docs: `09-versioning.md`, CHANGELOG `16.0.0` | docs | PLAN |

## Index-Schema

```typescript
type SettingsSearchHit = {
  tab: SettingsTab
  field: string
  keywords: string[]
  elementId?: string
}
```

## Synonym-Beispiele

| Query | Tab | Feld |
|-------|-----|------|
| fernseher, samsung, tizen | geraete | TV |
| kalender, termin | alltag | Kalender |
| groq, gemini | keys | API-Keys |
| kugel, globus | lage | Weltkugel |
| export, hausstand | daten | Sichern |

## Tests

```bash
cd frontend && npm run build
npm run test:settings-search   # neu
npm run test:prompts
npm run test:rest-final
```

Manuell: 10 Suchbegriffe aus PO-Liste, jedes Mal sichtbares Feld.

## Meilenstein

`16.0.0` = Reel-UI-Schiene abgeschlossen (242–248). Nächste Schiene: siehe `42-planned.md`.
