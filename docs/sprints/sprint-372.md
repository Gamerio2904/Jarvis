# Sprint 372 — Kontakt und Ort ins selbe Knäuel

**Version:** `18.16.0` — **CODE + APK** Should
**Plan:** [`88-next.md`](../88-next.md)
**Voraussetzung:** 370.

## Ziel

`Freundin, Tel …` / `Freundin wohnt in Heilbronn` / `Mama, Mail …` schreiben
durch dasselbe Gate wie Geburtstag. Ein Hop: Person → Tel → Ort → Datum.

## Ist

`places.ts` `upsertMemory` nackt für place/contact/email/alias. Anruf findet
Kontakt über `findContactRow`, Birthday-Pin ist unsichtbar.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S372-1 | Gate | `places.ts` | Contact/place/email-Writes → `writeMemory` mit `extractEntities` (Alias aus 369) |
| S372-2 | Alias-Paar | bestehendes `alias:X` | Bleibt für Tel-Lookup. Zusätzlich Entity-Overlap zum Birthday-Pin |
| S372-3 | Recall-Satz | `personClusterReply` | Nur Extra-Felder, **wenn die Frage sie verlangt** (anrufen/wohnen). Bloße Geburtstagsfrage bleibt Datum+Name |
| S372-4 | Gold | bestehend | `Freundin wohnt in Heilbronn` / `Rufe Mama an` bleiben `maps`. Kein Diebstahl |

## Won’t

Stilles WhatsApp. Kontakt scannen ohne Ja. LLM füllt die Nummer.

## Abbruchkriterium

Anruf ohne Ja. Oder Wohnort-Frage geht an recall statt maps.

## PO-Prüfung

1. Mama-Geburtstag (370), dann `Mama, Tel 0171…` (Ja-Pfad wie heute).
2. `Rufe Mama an` → maps, Nummer aus dem Knäuel.
3. Geburtstagsfrage weiter recall, ein Satz.
