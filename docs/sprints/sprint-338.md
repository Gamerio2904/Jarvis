# Sprint 338 — Post, Telefonbuch, WhatsApp-Antwort

**Version:** `18.9.7` — **CODE** Must
**Plan:** [`81-next.md`](../81-next.md)
**Voraussetzung:** 337 / `18.9.6`.

## Ziel

E-Mail lesen, Telefonbuch scannen, WhatsApps beantworten — ehrlich.
Kein stilles WhatsApp, kein 64. Katalog-Agent, nicht parallel zu `18.5`.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S338-1 | Telefonbuch | `JarvisDevicePlugin` `scanContacts` | `READ_CONTACTS`, nach Ja, lokal `contact` |
| S338-2 | E-Mail lesen | `JarvisMail` IMAP | App-Passwort unter Keys, nie normales Passwort im Chat |
| S338-3 | E-Mail schreiben | `mailto` | nach Ja Entwurf, nie „ist gesendet“ |
| S338-4 | WhatsApp Eingang | `JarvisInboxService` | NotificationListener, RemoteInput nach Ja |
| S338-5 | Gold | `TEST_PROMPTS` / `GOLD_EXPECT` | `Schreib mir eine E-Mail` → maps. Sweep-Won’t: `Mach ein Foto` |
| S338-6 | PO | [`TEST-18.9.md`](../TEST-18.9.md) §9 | Gerät nach Execute |

## Won’t

Stilles WhatsApp. Accessibility. SMTP. Gmail-OAuth. Business-API. 18.5.

## Abbruchkriterium

Parser behauptet „gesendet“ ohne Beobachtung. Oder Gold-Keys ≠ TEST_PROMPTS.
