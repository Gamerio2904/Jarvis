# Sprint 398 — Parser Übertrag

**Version:** `18.21.0` — **PLAN** Must
**Plan:** [`93-next.md`](../93-next.md)
**Voraussetzung:** keine. Nicht mit dem PC-QR mergen.

## Ziel

Die Sätze aus dem Plan werden `xfer`. Datei-Lesen, PC-Koppeln und normaler
Chat bleiben, wo sie sind.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S398-1 | Parser | `xfer-parse.ts` | `Übertrage das fürs Tablet`, `fürs Handy`, `Mach den QR-Code`, `Mach den QR Code`. `Zum Kopieren:` und `als Anhang in der Nachricht:` nehmen den Text nach dem Doppelpunkt, eine Zeile pro Feld, höchstens 8, je 200 Zeichen |
| S398-2 | Agent | `parse-catalog.ts` `execute-map.ts` `executor-ids.ts` `meta.ts` | `xfer`, Abteilung Alltag, ein Satz. Noch keine Bytes, Antwort ehrlich „noch kein Code“, sobald der Parser greift — erst 401 zeigt den Code |
| S398-3 | Konflikte | `conflicts.ts` | Übertrag vor `doc` und vor `pc`. `PC QR scannen` bleibt `pc`. Nacktes „QR“ ohne Übertrag-Satz bleibt, wo es ist |

## Won't

Codec, Bild, Knopf.

## Abbruchkriterium

`PC QR scannen` oder `Lies die PDF` landet auf `xfer`.
