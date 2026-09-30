# Sprint 399 — Codec

**Version:** `18.21.0` — **PLAN** Must
**Plan:** [`93-next.md`](../93-next.md)
**Voraussetzung:** 398.

## Ziel

Hin und zurück ohne Kamera. Präfix `jarvis-xfer:v1`. Ein Stück pro Code,
höchstens sechs. Was nicht passt, kommt als Namensliste zurück, nicht als
halber Code.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S399-1 | Packen | `xfer-codec.ts` | Id, Index, Anzahl, Dateiname, Mime, Bytes, Kopierzeilen. Fehlerkorrektur Q. Ein fremdes Präfix, auch `jarvis-pc:v1`, ergibt null |
| S399-2 | Grenze | derselbe | Fixture: kleine Textdatei passt. Eine Datei über dem Budget ergibt `too_big` mit Namen. Sieben Stücke gibt es nicht |
| S399-3 | Test | `test-xfer.mjs` | Packen, auseinandernehmen, wieder gleich. Ein fehlendes Stück ist unvollständig, der Knopf-Entscheid bleibt falsch |

## Won't

QR-Pixel, IndexedDB, Chat-Bild.

## Abbruchkriterium

Ein PC-Payload wird als Übertrag gelesen, oder eine zu große Datei wird still gekürzt.
