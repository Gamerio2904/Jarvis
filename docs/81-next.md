# 81 — Post, Telefonbuch, WhatsApp (Code `18.9.7` + Nachzieher `18.9.8`)

Deep Research und Leitentscheidung. Nicht parallel zu `18.5`.
Kein stilles WhatsApp, kein Accessibility, keine Business-API,
kein fünfter LLM-Organizer, kein 64. Katalog-Agent.

## 0. Ist vor dieser Etappe

| Kanal | Code | Lücke |
|-------|------|--------|
| SMS / Anruf | `maps` nach Ja, Funk-Beobachtung | nur Nummern aus dem **Gedächtnis** |
| WhatsApp raus | `wa.me` nach Ja, Nutzer sendet | kein Eingang, keine Antwort auf eine Meldung |
| E-Mail | `wont` „E-Mail schreibe ich nicht“ | kein Lesen, kein Entwurf |
| Telefonbuch | — | nur „Mama, Tel …“ von Hand |

Won’t, die **halten**: stilles Senden (kein Chat-Link, keine Meldung),
Apple CarPlay, Play Store, Accessibility-Tippen, Meta Cloud API.

## 1. Warum nicht die naheliegenden APIs

| Idee | Warum nicht |
|------|-------------|
| WhatsApp Business Cloud | braucht Firmenkonto, Meta-Cloud, nicht on-device |
| Accessibility / UI-Automator | genau das „stille WhatsApp“ aus HELP / S29.5 |
| Gmail-OAuth-App | Google-Cloud-Projekt, Refresh-Token, nicht der Key-Stil der App |
| JavaMail-AAR | extra Abhängigkeit, APK-Gewicht, gleicher IMAP-Weg |
| AccountManager / GET_ACCOUNTS | liest alle Konten, ohne dass der Nutzer ein Passwort setzt |

## 2. Drei ehrliche Wege

### Telefonbuch

Android `ContactsContract` + `READ_CONTACTS`. Erst **Ja**, dann Scan.
Name + Nummer (und Mail, wenn die Zeile eine hat) landen lokal als
`contact` / `email`. Der Scan liest `Phone` und `Email` aus
`ContactsContract` und legt die Mail an den Anzeigenamen. Schon liegende
Nummern bleiben. Von Hand: „Mama, Mail name@…“ wie „Mama, Tel …“.
„Zeig meine Kontakte“ listet Nummern und Adressen, nicht Orte.
Web: ehrlich aus.

### E-Mail

Lesen: IMAP über App-Passwort (Gmail/Outlook/GMX/Web.de, Host sonst frei).
Key liegt unter Einstellungen wie Groq — nicht im Chat.
Schreiben: nach Ja `mailto:`-Entwurf. Senden tun Sie. Nie „ist gesendet“
ohne beobachteten SMTP-Code (SMTP bleibt Won’t in `18.9.7`).
Ohne IMAP: ehrlich „kein Zugang“, optional die letzte Gmail-Meldung
wenn der Nutzer den Benachrichtigungszugriff erlaubt hat.

### WhatsApp beantworten

1. **Neue Nachricht raus** bleibt `wa.me` nach Ja (unverändert ehrlich).
2. **Eingang / Antwort** nur über `NotificationListenerService`:
   sichtbare WhatsApp-Meldung, `RemoteInput` nach Ja.
   Kein Tipp in die App, kein „ist gesendet“ ohne `send()`-Erfolg.
3. Keine offene Meldung → Chat-Link, Senden tun Sie.

## 3. Architektur

Kein neuer Katalog-Agent. `maps` bleibt der Leute-Kanal.

```text
parseContactsScan / parseMailIntent / parseWaInbox
  → parse-catalog maps
  → handlePlaces
  → JarvisDevice (Scan, IMAP, mailto)
  → JarvisInboxService (Meldungen lesen / antworten)
```

Pending-JSON wie SMS: `contacts_confirm`, `mail_confirm`, `mail_to_ask`,
`mail_body_ask`, `wa_inbox_reply`. Ein Ja = ein Schritt.

## 4. Won’t in dieser Etappe

Stilles WhatsApp. SMTP-Senden. Gmail-OAuth. Accessibility.
E-Mail-Anhänge. WhatsApp-Medien. iOS. Cloud-Kalender-Sync.

## 4b. Gedächtnis-Kern (gleicher Zug)

Alle Agenten lesen denselben Core (`memory-core.ts`: `memoryBlock`,
`retrieve`, `memoryAspect`, `rememberCitedResearch`). Kein 5. Hirn,
kein e5 in `pickRoute`.

Aspekte: Name, Ort, Leute (Kontakt/Mail), Pref, Grenze, Recherche,
Arbeit, Leben, Ziel, Wissen. Drive/Leave lösen Ort und Leute über
`memoryAspect`, nicht über eine zweite Liste.

Erfolgreiche Suche mit URL landet als `research` — **eine Quelle,
ein Key** (`research:<frage>:<host>`), Entities aus der Frage,
14 Tage, origin tool, bis zu drei Quellen. Ohne URL nichts merken.
Lookup hebt nur passende Recherche-Pins, nicht den ganzen Bestand.
„Was weißt du über mich“ nennt Gelerntes mit Quelle.

## 5. Gerät-PO

1. „Kontakte scannen“ → Nachfrage → Ja → Recht → Anzahl übernommen.
2. Ohne IMAP: „Lies meine E-Mails“ nennt den fehlenden Zugang.
3. Mit App-Passwort: ungelesene Betreffzeilen, Quelle IMAP.
4. „Schreib mir eine E-Mail“ fragt An wen, nicht Won’t.
5. Entwurf nach Ja öffnet die Mail-App — Jarvis behauptet kein Senden.
6. „Was steht auf WhatsApp“ ohne Meldungsrecht: ehrlich + Einstellungen.
7. Antwort nach Ja über die Meldung oder Chat-Link. Nie „ist gesendet“.
