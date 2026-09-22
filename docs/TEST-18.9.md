# TEST 18.9 — Recover + Hirn

Nach Execute von [`80-next.md`](./80-next.md). Sideload **`18.9.0`**,
versionCode `180900`. `18.5` nicht parallel.

## 1. Ansage

Netz aus oder Tagesschau-Mock tot. `Nachrichten`.

Erwartung: Satz mit **geht nicht** und **versuche** oder ehrliche Absage.
Keine erfundenen Schlagzeilen.

## 2. Zweite Methode trifft

Erste Quelle 503, zweite 200 (Dev-Mock). Reply nennt die **zweite** Quelle.

## 3. Write bleibt einmal

`Termin morgen 15 Uhr Zahnarzt` während News-Recover läuft: **ein** Termin.

## 4. OMDb ohne Key

Key leer. Film auf die Liste. **Publikum —** / keine erfundene Prozentzahl.

## 5. Gold + Auto-Debug

`GOLD_EXPECT`-Keys = `TEST_PROMPTS`. Probe **13** Spuren, kein Pack „Recover“.
Happy-Path (`Nachrichten`, `Zeig Erdbeben`, Termin) läuft in Spur **Lauf**.
Wechsel 503→200 nur im Skript `test-recover.mjs`, nicht im Auto-Debug.

Vorher: [`TEST-18.8.md`](./TEST-18.8.md).
