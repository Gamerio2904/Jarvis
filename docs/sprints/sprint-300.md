# Sprint 300 — Körper-Wissen härten

**Version:** `18.4.3` — **CODE** Must
**Plan:** [`75-next.md`](../75-next.md)
**Voraussetzung:** Sprints **297–299**

## Ziel

Agenten-Karte und Classic-Körper erzählen dieselbe Lage. Motion bleibt
im Budget. Probe ist drei Sätze.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S300-1 | Eine Wahrheit | `Lage.tsx` | `body_view=agents` und `classic` lesen denselben Retrieve (Packs + Trace). AgentTree darf unter dem gewählten Agenten bis zu 3 Pack-Zeilen zeigen (label + erstes Claim), nicht den ganzen Cap-24 |
| S300-2 | Motion | Canvas | Neue Wissen-Kanten: Reduce = statisch, Hidden = Pause, `MOTION_FPS` 30. Keine zweite rAF-Schleife |
| S300-3 | Konflikte | | Organ-Tap kein Gerät. `knowledge: true` stiehlt Tanke nicht. Watchliste-Parser (18.3) unberührt |
| S300-4 | Tests | `test-body-13.mjs`, `test-knowledge-11.mjs`, `test-film-taste.mjs` unberührt | Gold K1–K5 aus 60 bleiben. Plus: Classic zeigt Katalog-Agent. Fuel ohne Pack. 1-Hop nur über `links` |
| S300-5 | PO | nur bei CODE | Kein `TEST-18.4.md`, solange Sideload `18.1.2` |

## Won’t

- Neue Graph-Lib.
- LLM-Organizer.
- Sideload-Version in Docs auf `18.4` ohne APK.

## Abbruchkriterium

Zwei Sichten zeigen verschiedene Packs zum selben Satz. Oder Reduce
lässt Wissen-Kanten weiter animieren. Oder ein Doc behauptet Sideload
`18.4` bei APK `18.1.2`.

## Manuell

```
Lern das als Fachwissen Lichtbogen: Palladium ist knapp.
Was steht bei uns zum Lichtbogen?
Tanke in der Nähe
```

Körper Classic und Agenten-Karte: Pack Lichtbogen sichtbar. Tanke ohne
Pack-Satz. Reduced-motion: Karte steht, keine Ken-Burns-ähnliche Loop
auf Synapsen.
