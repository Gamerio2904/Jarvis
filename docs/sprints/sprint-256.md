# Sprint 256 — Einstellungen: Feldschutz und Migrationsschritte

**Version:** `16.8.0` (versionCode `160800`) — **PLAN**, verkleinert
**Plan:** [`68-next.md`](../68-next.md) §11 · Upgrade **G** aus [`67-upgrades.md`](../67-upgrades.md)

## Ziel

Ein kaputtes Feld kostet dieses Feld — nicht die ganze Einrichtung. Und ein
umbenanntes Feld verliert seinen Wert nicht mehr still.

## Was aus diesem Sprint gestrichen wurde

Geplant war die **Aufteilung in drei Bereiche** (`secrets`, `prefs`, `session`)
plus Backup-Umbau. Gegen die vier Prioritäten gerechnet, trägt das nicht:

| Priorität | Wirkung der Aufteilung |
|-----------|------------------------|
| Antwortqualität | keine |
| Alles funktioniert | **Risiko statt Gewinn.** Über 250 Felder umziehen, jedes Lesen und Schreiben in der App anfassen — der akute Datenverlust ist seit `16.1.1` bereits abgefangen |
| Latenz | keine (drei Lesevorgänge statt einem, im Rauschen) |
| Kostenlos / nutzbar | keine |

Der Auslöser war der Datenverlust bei kaputtem JSON. Der ist behoben:
`parkBrokenSettings` in `store.ts` legt korrupte Rohdaten seit `16.1.1` unter
einem `.broken`-Schlüssel ab, statt auf Werk zurückzufallen. Damit ist der
Schaden von „alles weg" auf „einmal neu einrichten, Daten liegen noch da"
gesunken.

Was **bleibt**, sind zwei Dinge, die für sich stehen und klein sind:

- **Feldweiser Rückfall.** Heute ist es alles oder nichts. Ein einzelnes
  kaputtes Feld sollte dieses Feld kosten, nicht den Eintrag. Das ist ein Gewinn
  bei „alles funktioniert", ohne Umzug.
- **Benannte Migrationsschritte.** Es gibt nur `{...DEFAULT_SETTINGS, ...prev}`.
  Wer ein Feld umbenennt, verliert den alten Wert lautlos. Das ist **jetzt**
  wichtiger als vorher, weil die Sprints 249–259 neue Felder anlegen — ohne
  Migrationsschritte ist jeder davon ein stiller Kandidat für Datenverlust.

Die Bereichsaufteilung ist damit nicht verworfen, sondern **Could** ohne Version.
Sie kommt, wenn es einen belegten Anlass gibt — etwa wenn Backups tatsächlich
Sitzungsreste auf ein neues Gerät tragen und das jemandem auffällt.

## Heute vs. Ziel

| Heute | Ziel |
|-------|------|
| kaputtes JSON → alles auf Default (Rohdaten geparkt) | kaputtes **Feld** → dieses Feld auf Default |
| `{...DEFAULT, ...prev}` als Migration | benannte Schritte mit Versionsnummer |
| Umbenennen verliert den Wert still | Umbenennen ist ein Schritt mit Test |

## Lieferumfang

| ID | Task | Datei | Status |
|----|------|-------|--------|
| S256-1 | `zod`-Schema für `Settings`, feldweise validiert | `engine/settings-schema.ts` | PLAN |
| S256-2 | Feldweiser Rückfall auf Default statt Totalverlust | `engine/store.ts` | PLAN |
| S256-3 | Benannte Migrationsschritte mit Versionsnummer | `engine/settings-migrate.ts` | PLAN |
| S256-4 | Tests: jede Migration einzeln, kein Feld verloren | `scripts/test-settings-migrate.mjs` | PLAN |
| S256-5 | `parkBrokenSettings` bleibt als letzte Ebene erhalten | `engine/store.ts` | PLAN |

Fünf Tasks statt acht, kein Umzug. `parkBrokenSettings` wird ausdrücklich
**nicht** ersetzt: der Feldschutz greift bei einem kaputten Feld, das Parken bei
einem kaputten Eintrag. Zwei Ebenen, beide billig.

## Abbruchkriterium

Eine Migration verliert ein Feld. Der Test dafür ist keine Formsache: für jeden
Schritt wird ein echter alter Hausstand eingespielt und Feld für Feld
verglichen.

Zweites Kriterium: die feldweise Prüfung kostet messbar Startzeit. `zod` über
250 Felder bei jedem `loadSettings()` wäre ein Latenzverlust für einen
Robustheitsgewinn — dann wird nur beim **Laden** validiert, nicht bei jedem
Lesen, und das Ergebnis gecacht.

## Tests

```bash
cd frontend
npm run test:settings-migrate # neu, je Schritt ein Fall
npm run test:rest-final
npm run test:qa-16
npx tsc -b && npm run lint
```

Manuell: Hausstand aus `16.1.1` exportieren, in den neuen Stand importieren,
alle Keys und Vorlieben prüfen. Dann ein Feld im JSON absichtlich zerstören —
nur dieses Feld darf auf Default fallen, alles andere muss stehen bleiben.
