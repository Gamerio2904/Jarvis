# Sprint 128 — Live-Split + Identität ohne Hirn

**Version:** `6.52.0` (mitgeliefert in `6.60.0`)  
**Status:** CODE (in App `6.60.0`)  
**Quelle:** [`47-next.md`](../47-next.md) · Rest aus [`46-next.md`](../46-next.md)

## Ziel

Doppelbefehle wie `Körper an und Zeig London` treffen im Router dasselbe wie im Chat. Naive „Bist du ChatGPT?“ braucht kein Modell.

## Must

- `pickRoute` splittet Tool-Sätze; nackter Lexikon-Ort nach `und` wird `Zeig Ort`.
- Canned Identität: ChatGPT / KI / Wie heißt du. `Wer bist du?` bleibt Memory.
- CI und Debug-Katalog auf `hud` / `identity`.

## Won’t

Welt-Geocoder. Marvel. 1,5B.

## Done when

`Körper an und Zeig London` → `hud`. `Bist du ChatGPT?` → `identity` ohne Key.
