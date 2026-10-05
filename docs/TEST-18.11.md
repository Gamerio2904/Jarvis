# TEST 18.11 — Koch, Gewürze, Quellen zu

Nach Execute von [`84-next.md`](./84-next.md). App-Code **`18.11.4`**.
Sideload bleibt **`18.10.0`** bis eine 18.11-APK gebaut wird.

## 1. Quellen unter jeder Nachricht

`Suche im Internet nach einem guten Carbonara-Rezept` (Research, kein Koch).

Erwartung: Badge **„N Quellen“**, Liste zu. Antippen zeigt URLs.
Dasselbe nach News.

## 2. Gewürze merken

Foto-Knopf: Gewürzregal. `Merke dir meine Gewürze.`

Erwartung: nur sichere Namen. `Welche Gewürze habe ich?` dieselbe Liste.
Pfeffer nicht doppelt als black pepper. Zweites merke ersetzt.
`Merke dir dazu noch Thymian` hängt an. `Vergiss meine Gewürze` → leer.

## 3. Bestätigung vor dem Rezept

Foto: Eier, Nudeln. `Was kann ich damit kochen?`

Erwartung: „Ich sehe: … Stimmt das?“ Noch **kein** Gericht.
`Ohne Nudeln` streicht. `Ja` startet die Suche.

## 4. Rezept vom Vorrat

Nach Ja:

- Zeiten nur aus JSON-LD oder Wiki-Zahl, sonst „Quelle nennt keine Zeit.“
- [Wikibooks Carbonara](https://de.wikibooks.org/wiki/Kochbuch/_Spaghetti_alla_carbonara) darf **keine** 15/45-Minuten erfinden
- Zutaten: Bild / Regal / fehlt extra
- Schritte 1…n aus der Quelle
- Quellen-Badge zu
- Pin nur Salz/Pfeffer: genau die
- Parmesan fehlt: „Auf die Liste?“ ohne Ja → Liste unverändert

## 5. Abgrenzung

| Satz | Agent |
|------|-------|
| `Zutaten von Nutella` | food |
| `Suche im Internet nach Carbonara-Rezept` | research |
| `Was bedeutet Waschschüssel 40?` | haushalt |
| `Mach ein Foto` | wont |
| `Was kann ich aus dem Foto kochen` | cook |

## 6. Ehrlichkeit

Kein Gemini → kein Rezept aus dem Kopf. Ohne Foto → Foto-Knopf.
Kein Öl unterstellen, das weder Bild noch Pin zeigt.
