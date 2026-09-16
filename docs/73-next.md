# 73 — Karte und CarPlay nach `18.0.8`

Ausgangspunkt: Code `18.0.8`. Anlass waren Screenshots: „Zeig mir das auf
der Karte“ blieb im Chat, Kiew zeigte London-Text, Standort auf
„weißt du auch wo?“ erfand Reisen, CarPlay-Karte wirkte ruckelig.

**In `18.0.8` CODE:** Lage öffnet sich aus dem Befehlsteil des Satzes
(`show_map`, Anapher aus dem Chat, Nominatim wenn der Gazetteer den Ort
nicht kennt). Pin-Text muss zum Pin-Namen passen. CarPlay folgt
heading-up mit gedämpfter Kamera, solange die Karte folgt.

Sprints **272–282** bleiben Audit-Reste in [`71-audit.md`](./71-audit.md).
**283–287** bleiben Ideen halten in [`72-next.md`](./72-next.md). Diese
Datei hält nur, was nach dem Karten-Nachzug noch offen ist.

---

## 1. Geliefert in `18.0.8`

| Befund | Ursache | Jetzt |
|--------|---------|-------|
| „Ah sehr schön. Zeig mir das auf der Karte“ öffnete nichts | `parseHudIntent` brauchte `^zeig` und den ganzen Satz ≤ 80 | `commandClause` nimmt den Befehl; `show_map`; Länge 120 |
| LLM sagte „öffnet sich … Bibione“, Lage blieb zu | Modell ohne `tool:'hud'` | Parser öffnet die Kugel selbst (`flyAsked` / `flyPlace`) |
| Kiew-Pin mit London-Text | `last_globe_brief` unabhängig vom Pin-Namen | `pinLineFor` / `briefFitsPlace` |
| „weißt du auch wo?“ | LOCATE verlangte „wo ich bin“ | `LOCATE_FOLLOW` |
| CarPlay nord-oben, Sprünge | Kamera ohne Heading, hartes Lerp | heading-up um dich, `1-exp(-dt/120)`, mehr Kacheln |
| „öffne Karte“ startete den Fahr-Tab ohne Fahrmodus | `TAB_MAP` ohne `inMode` | nur im Fahrmodus; sonst Lage-Kugel |

---

## 2. Noch PLAN (288–290)

Keine Einzeldateien — wie 272–282 in 71.

| Version | Sprint | Thema | Priorität |
|---------|--------|-------|-----------|
| `18.0.9` | 288 | Unbekannter Ort ohne Netz: ehrliche Absage, Kugel trotzdem auf | Should |
| `18.0.9` | 289 | Mikrofon-Absage im Chat, nicht still | Should |
| `18.1.2` | 290 | Overlay-Zurück und Gesprächswechsel nicht in denselben Zug | Could |

Ketten: 288 frei. 289 frei. 290 nach beobachtetem Fehlgriff, nicht spekulativ.

**Won’t:** Apple Maps, 3D-Gebäude, weltweiter zweiter Gazetteer neben Nominatim,
Stockfish-WASM (266 bleibt liegen), fünfter LLM-Organizer.

---

## 3. Abbruch

- Ein Pin zeigt den Brief eines anderen Orts.
- „Zeig mir das auf der Karte“ nach einem Ortsnamen im Chat öffnet die
  Kugel nicht.
- Sideload-Link verspricht eine Version, die nicht in `releases/Jarvis.apk`
  liegt.

Index: [`sprints/README.md`](./sprints/README.md) · Vorher:
[`72-next.md`](./72-next.md) · Audit: [`71-audit.md`](./71-audit.md)
