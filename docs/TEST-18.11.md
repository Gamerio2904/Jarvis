# TEST 18.11 — Koch, Gewürze, Quellen zu

Nach Execute von [`84-next.md`](./84-next.md). Ziel-Code **`18.11.4`**.
Bis dahin ist diese Datei das Abnahmeblatt, kein Ist-Stand.

## 1. Quellen unter jeder Nachricht

`Suche im Internet nach einem guten Carbonara-Rezept` (Research, kein Koch).

Erwartung: Antworttext ohne offene Linkliste. Badge „Quellen“ / Status.
Antippen zeigt `[1]`-URLs. Zuklappen verbirgt sie. Dasselbe nach News.

## 2. Gewürze merken

Foto-Knopf: Gewürzregal. `Merke dir meine Gewürze.`

Erwartung: nur sichtbare Namen. Unsichere Gläser nicht in der Liste.
`Welche Gewürze habe ich?` dieselbe Liste.
Zweites merke ersetzt. `Merke dir dazu noch Thymian` hängt an.
`Vergiss meine Gewürze` → leer, kein Raten.

## 3. Rezept vom Vorrat

Foto-Knopf: Eier, Nudeln, was sonst da ist. `Was kann ich damit kochen?`

Erwartung:

- Zubereitungszeit und Gesamtzeit **oder** „Quelle nennt keine Zeit“
- Zutaten: Bild / Gewürzregal / fehlt extra
- Schritte 1…n ausführlich
- Quellen unter der Nachricht zu, aufklappbar
- Kein Gericht, wenn die Suche nichts zitiert

Pin nur Salz und Pfeffer: genau die, angesagt.

## 4. Abgrenzung

| Satz | Agent |
|------|-------|
| `Zutaten von Nutella` | food |
| `Suche im Internet nach Carbonara-Rezept` | research |
| `Was bedeutet Waschschüssel 40?` / Wäsche kochen | haushalt |
| `Mach ein Foto` | wont |
| `Was kann ich aus dem Foto kochen` | cook |

## 5. Ehrlichkeit

Flugmodus / kein Gemini: Foto geht nicht, kein Rezept aus dem Kopf.
Ohne Foto: Foto-Knopf, kein Schrank raten.
