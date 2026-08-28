# Sprint 127 — Parser-Patches nach 6.50-Prompt-Test

**Version:** `6.51.0`  
**Status:** PLAN  
**Quelle:** [`46-test-650.md`](../46-test-650.md) · Execute [`46-next.md`](../46-next.md)

## Ziel

Falsche Tools und stumme Naive-Fragen aus dem 6.50-Lauf schließen. Katalog ist schon in `6.50`. Kein neues Modell, kein Sideload.

## Must

- Wont: `Überweise 200 Euro` (Unicode-`\\b`), Mail nicht als SMS, Street View / Live-Sat.
- HUD: `Zeig mir` nicht Ort „mir“; Nachrichten nicht Globus; look-Umgangssprache.
- Help: `Was kannst du?` = Katalog.
- Split: `Körper an und Zeig London`.
- Fremde Wake-Wörter nicht still Writes starten.

## Won’t

Welt-Geocoder, Street View bauen, 112 anrufen, Auto-Ja im Debug.

## Done when

`test:matrix` Gaps geschlossen oder bewusst als llm belassen. Debug Naive/Kaputt ohne Massen-fail bei Tools.
