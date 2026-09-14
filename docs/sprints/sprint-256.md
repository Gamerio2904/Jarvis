# Sprint 256 — Einstellungen: Feldschutz und Migrationsschritte

**Version:** `16.8.0` (versionCode `160800`) — **CODE**, verkleinert (ausgeliefert in `17.0.0`)
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
| S256-1 | Schema für `Settings`, feldweise validiert — **von Hand statt `zod`** | `engine/settings-schema.ts` | CODE |
| S256-2 | Feldweiser Rückfall auf Default statt Totalverlust | `engine/store.ts` | CODE |
| S256-3 | Benannte Migrationsschritte mit `settings_rev` | `engine/settings-migrate.ts` | CODE |
| S256-4 | Tests: jede Migration einzeln, kein Feld verloren | `scripts/test-settings-migrate.mjs` | CODE |
| S256-5 | `parkBrokenSettings` bleibt als letzte Ebene erhalten | `engine/store.ts` | CODE |

Fünf Tasks statt acht, kein Umzug. `parkBrokenSettings` wird ausdrücklich
**nicht** ersetzt: der Feldschutz greift bei einem kaputten Feld, das Parken bei
einem kaputten Eintrag. Zwei Ebenen, beide billig.

## Ergebnis

**`zod` ist nicht eingezogen.** Das Abbruchkriterium unten nennt die Startzeit,
und die Rechnung geht nicht auf: alle 156 Felder sind flach — Text, Zahl,
Wahrheitswert, sieben mit festem Wertevorrat. Was `zod` dafür kann, sind
dreißig Zeilen in `settings-schema.ts`; was es kostet, ist ein Paket im Bundle
für einen Aufruf je `loadSettings()`. Die Prüfung läuft jetzt genau dort: beim
Laden, nicht bei jedem Lesen.

Über `typeof` hinaus prüft sie den **Wertevorrat** der sieben Auswahlfelder
(`hud_view`, `ui_theme`, `hud_accent`, `drive_speak`, `presence_role`,
`body_view`, `brain_primary`). Das war die eigentliche Lücke: ein
`hud_view: 'kugel'` aus einer alten Fassung ist eine gültige Zeichenkette und
hätte die Oberfläche leer gelassen — genau die Art Fehler, die als „Blackscreen"
gemeldet wird.

Unbekannte Schlüssel bleiben **erhalten** statt weggeworfen zu werden. Wer eine
ältere APK einspielt und danach wieder die neue, findet seine Felder wieder.
Absichtlich entfernte Felder räumt stattdessen ein Migrationsschritt weg — das
ist der Unterschied zwischen „kenne ich nicht" und „soll weg".

Der erste Schritt (`001-tote-felder-entfernen`) ist kein Platzhalter, sondern
ein echter Fund: `routing_mode` und `brain_gemini_roles_tts` standen seit dem
Umbau auf die Agenten-Auswahl bzw. `brain_primary` ohne einen einzigen
Lesezugriff im Datensatz. `renameField` liegt getestet daneben, damit der
nächste Umzug eines Feldes kein Datenverlust ist: ein gesetztes Zielfeld
gewinnt, ein fehlendes Altfeld legt kein leeres Neufeld an, `false` wird als
Wert behandelt und nicht als Nichts.

`settings_rev` merkt sich den Stand. Ein **höherer** Stand als der eigene wird
nicht zurückgedreht — sonst liefe die Migration nach einem Downgrade ein
zweites Mal.

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

`test:settings-migrate` spielt einen vollständigen Hausstand ein — für **jedes**
der 156 Felder ein vom Default abweichender Wert — und vergleicht nach dem Laden
Feld für Feld. Ein verlorenes Feld nennt der Fehler beim Namen. Danach wird
derselbe Hausstand mit sechs kaputten Feldern geladen: nur diese sechs dürfen
fallen, Gemini-Key und Nachbarfelder müssen stehen bleiben.

Manuell: Hausstand aus `16.1.1` exportieren, in den neuen Stand importieren,
alle Keys und Vorlieben prüfen. Dann ein Feld im JSON absichtlich zerstören —
nur dieses Feld darf auf Default fallen, alles andere muss stehen bleiben.
