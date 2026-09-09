# Sprint 256 — Einstellungen aufteilen

**Version:** `16.9.0` (versionCode `160900`) — **PLAN**
**Plan:** [`68-next.md`](../68-next.md) §11 · Upgrade **G** aus [`67-upgrades.md`](../67-upgrades.md)

## Ziel

Ein kaputtes Feld kostet dieses Feld — nicht die ganze Einrichtung. Und ein
umbenanntes Feld verliert seinen Wert nicht mehr still.

## Warum

`Settings` ist ein Objekt mit über 250 Feldern in **einem** localStorage-Eintrag.
`saveSettings(patch)` liest alles, mischt, schreibt alles zurück. Daraus folgen
drei Dinge:

- **Jedes Feld hat dasselbe Risiko.** Der Gemini-Key liegt neben `hud_view`. Bis
  `16.1.0` setzte ein einzelnes falsches Zeichen die komplette Einrichtung auf
  Werk zurück — der Fix parkt die Rohdaten jetzt zur Seite, aber die Ursache
  (alles oder nichts) steht noch.
- **Es gibt keine Migrationsschritte.** Nur `{...DEFAULT_SETTINGS, ...prev}`. Wer
  ein Feld umbenennt, verliert den alten Wert lautlos: das alte Feld ist nicht
  mehr im Default, das neue hat noch keinen Wert.
- **Das Backup nimmt alles mit.** Auch `hud_view` und andere Sitzungsreste, die
  auf einem neuen Gerät nichts zu suchen haben.

## Heute vs. Ziel

| Heute | Ziel |
|-------|------|
| ein Eintrag, 250+ Felder | drei Bereiche: `secrets`, `prefs`, `session` |
| kaputtes JSON → alles auf Default (Rohdaten geparkt) | kaputtes **Feld** → dieses Feld auf Default |
| `{...DEFAULT, ...prev}` als Migration | benannte Schritte `v13 → v14` |
| Backup nimmt alles | Backup nimmt `prefs` + `secrets` |

## Lieferumfang

| ID | Task | Datei | Status |
|----|------|-------|--------|
| S256-1 | `zod`-Schema für die drei Bereiche | `engine/settings-schema.ts` | PLAN |
| S256-2 | Feldweiser Rückfall auf Default statt Totalverlust | `engine/store.ts` | PLAN |
| S256-3 | Benannte Migrationsschritte mit Versionsnummer | `engine/settings-migrate.ts` | PLAN |
| S256-4 | Aufteilen: `secrets` (Keys), `prefs` (Wahl), `session` (flüchtig) | `engine/store.ts` | PLAN |
| S256-5 | Migration der bestehenden Einträge auf die Bereiche | `engine/settings-migrate.ts` | PLAN |
| S256-6 | Backup nimmt nur `prefs` + `secrets` | `engine/backup.ts` | PLAN |
| S256-7 | `session` überlebt keinen Neustart (bewusst) | `engine/store.ts` | PLAN |
| S256-8 | Tests: jede Migration einzeln, kein Feld verloren | `scripts/test-settings-migrate.mjs` | PLAN |

## Bereiche

| Bereich | Beispiel | Backup | Lebensdauer |
|---------|----------|--------|-------------|
| `secrets` | Groq-Key, Gemini-Key, Spotify-Token | ja | bis der Nutzer sie ändert |
| `prefs` | Stimme, Theme, TV-Adresse, Heimatort | ja | dauerhaft |
| `session` | `hud_view`, `hud_force`, `last_place`, `last_step_tool` | nein | bis zum Neustart |

Die Trennung ist der eigentliche Gewinn: erst wenn `session` als flüchtig
markiert ist, kann ein Backup sauber sein.

## Abbruchkriterium

Eine Migration verliert ein Feld. Der Test dafür ist keine Formsache: für jeden
Schritt wird ein echter alter Hausstand eingespielt und Feld für Feld
verglichen.

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
nur dieses Feld darf auf Default fallen.
