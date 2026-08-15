# 16 — Gemini Opt-in (`0.16.0`)

PO 2026-08-15: **Gemini-API**, weil das lokale 0.5B kein ChatGPT-Niveau erreicht.

Default bleibt **aus**. Ohne Schalter und Key ändert sich nichts (`0.14.1` on-device).

## Soll

- Settings: Toggle + API-Key (Google AI Studio) + Test
- An = Smalltalk über **Google Gemini Flash** (Free-Tier, Limits)
- Banner: Chat geht ins Netz
- Memory / Todos / TV bleiben lokal, vor dem LLM
- Key nur auf dem Gerät (localStorage), nicht in Health-Logs
- Lokales Modell optional, wenn Gemini konfiguriert ist

## Won’t

- Key in der APK einbacken
- Gemini ohne Opt-in
- Research-Netz, TTS, anderes Cloud-Produkt

Key: [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
