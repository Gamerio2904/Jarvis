# Sprint 263 — Bilder im Chat, nur auf Verlangen

**Version:** `17.4.0` — **PLAN** Must
**Plan:** [`70-next.md`](../70-next.md)
**Voraussetzung:** Sprint **261**

## Ziel

Wenn jemand ein Bild verlangt, erscheint ein Bild mit Quelle. Sonst keins.

## Warum nicht „immer Bilder“

Bilder ohne Verlangen kosten Datenvolumen, Akku und Aufmerksamkeit. Die
Prioritätenliste verbietet Latenz und Kosten ohne Nutzen. Deshalb ein
**Verlangen-Parser**, kein Auto-Illustrieren jeder Antwort.

## Was ein Verlangen ist

| Satz | Block |
|------|-------|
| `zeig mir ein bild von der elbe` | image, Suche/Wiki-Thumbnail |
| `wie sieht das wappen von bayern münchen aus` | image |
| `mach ein foto` / Kamera | bestehender `eye.ts`-Pfad, zusätzlich Preview-Block der Aufnahme |
| `erkläre photosynthese` | **kein** Bild |
| Wetter | Icon nur wenn `zeig … wetterkarte` / `radar`, nicht bei `wie wird das wetter` |

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S263-1 | Parser | `engine/image-parse.ts` **neu** | `zeig(?:e)?(?:\s+mir)?(?:\s+(?:ein\|mal))? \s+(?:bild\|foto\|wappen\|karte) \s+(?:von\|vom\|der\|des)? \s+(.+)`. Rückgabe `{ q, kind:'photo'\|'crest'\|'map' }` |
| S263-2 | Quelle Wiki | `engine/image-fetch.ts` **neu** | Wikimedia: `https://en.wikipedia.org/api/rest_v1/page/summary/{encode}` → `thumbnail.source`. User-Agent wie `sport.ts`. Kein Treffer → ehrlicher Text, **kein** Platzhalter-Stock |
| S263-3 | Wappen | `sport.ts` / OpenLigaDB | Team-Objekte haben oft `teamIconUrl`. Nur bei `kind==='crest'` oder explizit „Wappen“. URL https prüfen |
| S263-4 | Kamera | `eye.ts` + Chat | Nach Aufnahme `blocks:[{ kind:'image', src: blob-or-data, alt:'Aufnahme', source:'Kamera' }]`. Nicht die Datei in IndexedDB duplizieren wenn schon Eye-Meta existiert — `src` darf eine bereits gespeicherte Object-URL sein, die der Chat schon kennt |
| S263-5 | Agent | `parse-catalog.ts` | Neuer Agent `show` **oder** Erweiterung `search`/`sport`. Bevorzugt **kein** neuer Katalog-Eintrag: `image-parse` in `search` (extra 0.1) plus HUD-Skip `bild\|foto\|wappen`. Ein neuer Agent nur wenn Konflikte mit `hud`/`eye` in `eval:separability` steigen |
| S263-6 | Sicherheit | `ChatBlocks.tsx` | `src` muss `https:` oder `blob:` sein. `http:` und `javascript:` verwerfen. `referrerPolicy="no-referrer"` |
| S263-7 | Korpus | `eval/corpus.ts` | `Zeig mir ein Bild der Elbe` → gewählter Agent. `Zeig mir London` bleibt `hud` (Kugel, kein Bild). Das ist die Trennlinie |

## Won’t

- Gemini-Bildgenerator (Kontingent, Wasserzeichen, keine Quelle).
- Unsplash-Keys, Bing-Image-Search-Keys.
- Bilder in jeder Research-Antwort.

## Abbruchkriterium

Ein Bild ohne Parser-Treffer. Oder `Zeig mir London` wird ein Foto statt Kugel.

## Manuell

```
Zeig mir ein Bild der Elbe
```

Quelle unter dem Bild sichtbar. Ohne Netz: „Kein Bild geladen“, keine graue Lüge.
