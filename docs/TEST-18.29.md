# Test 18.29 — Intake, Klärung und Recherche

**Status:** PLAN. Test mit isoliertem Projekt und ohne private Nutzerdaten.

## Intake und Folgefragen

1. Mehrsätzige Bedingung wird im Original erhalten; Anforderungen und
   Annahmen werden getrennt angezeigt.
2. Nur eine entscheidungsrelevante Lücke wird gefragt. Die Antwort ändert
   ausschließlich das passende Feld der angezeigten Idee.
3. `Ja`, `So` oder `Passt` ohne passende offene Frage startet weder Research,
   Export, Portfolio-Commit noch Umsetzung.
4. Projektwechsel/Neustart während einer Rückfrage übernimmt die Antwort
   nicht für die falsche Idee.

## Recherche und Herkunft

| Situation | Erwartung |
|---|---|
| Lokales Wissen reicht | Keine externe Suche |
| Research vorgeschlagen, Nutzer lehnt ab | Kein Netzaufruf; offene Lücke bleibt sichtbar |
| Research ausdrücklich bestätigt | Nur notwendiger Query; Quelle/URL/Status am Ergebnis |
| HTTP 403 oder 429 | Ehrlicher Abbruch, keine Proxy-/Stealth-Umgehung |
| Keine Treffer/Timeout | Kein erfundener Beleg, sichtbarer Leer-/Fehlerstatus |
| Persönlicher Inhalt im Projekt | Nicht automatisch in globales Gedächtnis schreiben |

## Release-Gate

Mit Instrumentierung prüfen: ohne Zustimmung null Research-Calls. Erst nach
grüner Datenschutz- und Regressionsspur `18.29.0` / `182900` setzen.
