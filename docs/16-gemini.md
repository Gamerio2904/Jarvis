# 16 — Gemini Opt-in (`0.16`)

PO 2026-08-15: **Gemini-API**, weil das lokale 0.5B kein ChatGPT-Niveau erreicht.

Default bleibt **aus**. Ohne Schalter und Key ändert sich nichts (`0.14.1` on-device).

## Soll

- Settings: Toggle + API-Key (Google AI Studio) + Test
- An = Smalltalk über **Google Gemini Flash** (Free-Tier, Limits)
- Banner: Chat geht ins Netz
- Memory / Todos / TV bleiben lokal, vor dem LLM
- Key nur auf dem Gerät (localStorage), nicht in Health-Logs
- Lokales Modell optional, wenn Gemini konfiguriert ist

## Kaskade (`1.0.0`)

Kein dauerhaft kostenloses Chat-Modell ohne eigenen Key. Ablauf:

1. Bestes Free-Gemini (Flash) bis Kontingent/Überlastung (429, 503, „high demand“)
2. Sofort nächstes schlechteres Gemini (Flash-Lite, 2.0, 1.5) — **kein** englischer Fehler
3. Optional **Groq** (eigener Key, `console.groq.com/keys`, hoher Free-Tier, Llama)

Ungültiger Gemini-Key bricht ab (nicht die ganze Leiter runter). Überlastete Modelle ~12 Min Pause.

## Won’t

- Key in der APK einbacken
- Gemini ohne Opt-in
- Research-Netz, TTS, anderes Cloud-Produkt als Gemini + optional Groq

Key Gemini: [aistudio.google.com/apikey](https://aistudio.google.com/apikey)  
Key Groq: [console.groq.com/keys](https://console.groq.com/keys)
