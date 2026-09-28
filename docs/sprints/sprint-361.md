# Sprint 361 — Retrieve: Encoder nur Rerank

**Version:** `18.15.0` — **PLAN** Must
**Plan:** [`87-next.md`](../87-next.md)
**Voraussetzung:** main `18.14.2`. Sprint 195 Freeze bleibt für die **APK**.

## Ziel

Recall sortiert Treffer ehrlich. Token+RRF bleibt der Default. Ein Encoder
darf **nur** die Reihenfolge der Retrieve-Hits ändern — nie den Router,
nie ein Gerät.

## Ist

`retrieve.ts`: linearer Scan, Token+RRF. `applyE5Rerank` bricht ab, sobald
das Paket fehlt **oder** gibt die Hits unverändert zurück, auch wenn
`qualityPack('e5').ready`. `pickRoute` / `route-pick.ts` importieren e5 nicht
(so halten). Datei `/onnx/e5-small.onnx` liegt nicht in der Sideload.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S361-1 | Identität fehlt | `retrieve.ts` `applyE5Rerank` | Pack aus oder Datei fehlt → Hits unverändert, deutscher Grund in Settings bleibt (`quality-pack.ts`) |
| S361-2 | Rerank nur Hits | `retrieve.ts` | Wenn `e5_rerank` an **und** Datei da: Cosine auf die **schon geholten** Top-N (Cap 6). Kein Index, kein HNSW, kein Qdrant |
| S361-3 | Router-Zaun | `route-pick.ts` `policy.ts` | Kein Import von `retrieve.ts` / `quality-pack` e5. Test: `pickRoute('Fernseher an') === 'tv'` ohne Encoder |
| S361-4 | Gold | `test:014` / Memory-Gold | G2/G3 bleiben grün **ohne** Encoder. Mit Encoder: höchstens bessere Reihenfolge, nie anderer Agent |
| S361-5 | APK | `quality-pack.ts` | Datei **nicht** in die Default-Sideload. 195 Freeze. Tauwetter nur wenn 368 Gold-Rot **schriftlich** |

## Won’t

e5 in `pickRoute`. Encoder in der APK ohne Messung. Qwen-Embed / Jina / BGE
als zweiter Encoder. Training. `retrieve` entscheidet Tools.

## Abbruchkriterium

`pickRoute` liest Embeddings. Oder die Sideload enthält `e5-small.onnx`
ohne Gold-Rot. Oder ohne Datei ändert sich die Trefferliste.

## PO-Prüfung

1. Schalter e5 aus: Recall wie heute.
2. Schalter an, Datei fehlt: Satz „e5-small fehlt. Retrieve bleibt Keyword-RRF“.
3. „Fernseher an“ bleibt `tv`, mit und ohne Schalter.
