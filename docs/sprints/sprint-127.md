# Sprint 127 — Parser-Patches nach 6.50-Prompt-Test

**Version:** `6.51.0`  
**Status:** CODE  
**Quelle:** [`46-test-650.md`](../46-test-650.md) · Execute [`46-next.md`](../46-next.md)

## Ziel

Falsche Tools und stumme Naive-Fragen aus dem 6.50-Lauf schließen. Katalog war schon in `6.50`. Kein neues Modell, kein Sideload.

## Must

- Wont: `Überweise 200 Euro` (Unicode vor `ü`), Mail nicht als SMS, Street View / Live-Sat / 112 / Malen / App / Pizza / Foto.
- HUD: `Zeig mir` nicht Ort „mir“; Nachrichten nicht Globus; look-Umgangssprache; Gazetteer nicht Teilstring.
- Help: `Was kannst du?` = Katalog `6.51.0`.
- Split: `Körper an und Zeig London`.
- Fremde Wake-Wörter nicht still Writes starten.

## Won’t

Welt-Geocoder, Street View bauen, 112 anrufen, Auto-Ja im Debug.

## Done when

`test:matrix` lock fails `0 / 29`. Debug Naive/Kaputt ohne Massen-fail bei Tools (`wont` zählt als `refuse`).
