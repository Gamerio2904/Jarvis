# Sprint 369 — Familien-Aliase (Mama = Mutter)

**Version:** `18.16.0` — **PLAN** Must
**Plan:** [`88-next.md`](../88-next.md)
**Voraussetzung:** main `18.15.0`. Kein neuer Agent.

## Ziel

Dieselbe Person hat **eine** synonyme Gruppe. Wer „Mama“ einträgt, ist für
Retrieve und Gate auch „Mutter“ / „Mother“. Ohne extra Lehrsatz.

## Ist

`memory-alias.ts` `ALIAS_GROUPS`: wlan, japan, zahnarzt, döner.
`places-parse.ts` kennt mama/mutter als Rel-Wort für **Wohnort/Tel**, nicht
für Birthday-Retrieve. `expandBlob` / `aliasQueries` / `extractEntities`
sehen die Familie nicht.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S369-1 | Gruppen | `memory-alias.ts` | Enge Paare: `mama/mutter/mother`, `papa/vater/father`, `oma/großmutter`, `opa/großvater`. Optional `freundin` allein (schon Rel). Kein passwort/essen als Anker |
| S369-2 | Expand | `expandBlob` `aliasQueries` `extractEntities` | Automatisch über bestehende Helfer. Test: `aliasQueries('meine Mutter')` enthält `mama` |
| S369-3 | Aspekt | `memory-layer.ts` / `memory-block.ts` | Birthday-Pin (`life`) gilt als Treffer, wenn die Frage PEOPLE_ASK + Alias der Person ist |
| S369-4 | Gold-Vorlauf | `test-memory-10` / Alias-Test | Kein neues GOLD_EXPECT-Key noch (das ist 371). Nur Alias-Unit |

## Won’t

LLM-Schätzung „das ist wohl die Mutter“. Offene Synonyme (Chef, Bro) in
dieser Sprint-Zahl — Bro bleibt Maps-Rel wie heute.

## Abbruchkriterium

`pickRoute('Fernseher an')` ändert sich. Oder „Mutter“ matcht fremde Pins
ohne Alias (zu breit).

## PO-Prüfung

1. Nach Execute 370/371: siehe 371.
2. In 369 allein: Unit „Mutter“ ↔ „mama“.
