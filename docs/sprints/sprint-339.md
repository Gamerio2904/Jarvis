# Sprint 339 — Plan 81 Lücken: Mail im Scan, Liste, IMAP-Test

**Version:** `18.9.8` — **CODE** Must
**Plan:** [`81-next.md`](../81-next.md)
**Voraussetzung:** 338 / `18.9.7`.

## Ziel

Was in 338 geplant und im Gerät noch fehlte: Mail aus dem
Telefonbuch, IMAP-Testen, „Mama, Mail …“, „Zeig meine Kontakte“.
Kein stilles WhatsApp, kein 64. Katalog-Agent, nicht parallel zu `18.5`.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S339-1 | Mail im Scan | `JarvisDevicePlugin.emitContacts` | `Email.CONTENT_URI` auf die Telefonzeile, sonst eigene Zeile |
| S339-2 | Alltag + Chat | `applyScannedContacts` | Nummer und Mail getrennt merken, schon liegende Nummern bleiben |
| S339-3 | IMAP Testen | Settings Keys | wie Groq: Postfach erreichen, nichts senden |
| S339-4 | Von Hand | `parseEmailStore` | `Mama, Mail name@gmx.de` → `email` |
| S339-5 | Liste | `parseContactsList` | `Zeig meine Kontakte` listet Nummer und Mail, kein Ort-Pfad |
| S339-6 | Gold | `TEST_PROMPTS` / `GOLD_EXPECT` | zwei neue Sätze, Keys = Prompts. Probe bleibt 13 |

## Won’t

Stilles WhatsApp. SMTP. Gmail-OAuth. Accessibility. 18.5. 64. Agent.

## Abbruchkriterium

Parser behauptet „gesendet“ ohne Beobachtung. Oder Gold-Keys ≠ TEST_PROMPTS.
