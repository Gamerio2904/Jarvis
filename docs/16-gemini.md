# 16 — Gemini (Hauptweg)

> **Jetzt:** Code **`10.60.0`**. Sideload **`9.10.0`**. Gemini mit Key ist der **normale Weg**. Groq ist Backup. Das lokale 0,5B ist **reiner letzter Fallback**, nie ChatGPT/Claude. Overlay: „Gemini zuerst“.

PO 2026-08-15: **Gemini-API**, weil das lokale 0.5B kein ChatGPT-Niveau erreicht.  
PO 2026-08-28: Reihenfolge umgedreht — Gemini **Hauptweg**, nicht Opt-in-Zusatz.

Key bleibt **dein** Key. Nichts in der APK. Ohne Key: Parser-Tools laufen trotzdem; Smalltalk ist klein oder ehrlich aus.

## Heute (`6.50`+, Overlay `6.53` in `6.60`)

Kaskade in `pickBrain` (`brain-pick.ts`):

1. **Gemini** — Settings → Cloud: Toggle **an** + API-Key (`geminiReady` / `isGeminiConfigured`)
2. **Groq** — eigener Key (`console.groq.com/keys`), wenn Gemini fehlt oder ausfällt
3. **0,5B Qwen** — nur wenn beide Clouds tot oder bewusst lokal geladen
4. sonst: Tools ohne Modell (Overlay „Fertig — Tools ohne Modell“)

Overlay-Reihenfolge: Gemini-Key eintragen → Fertig ohne Download → 0,5B zuletzt („nur Backup“).

Parser wählen Geräte. Gemini darf denselben Tool-Satz in 1–3 Sätzen sagen — Guard streicht neue Zahlen/Orte. Banner: Chat geht zu Google, wenn Gemini an ist.

Key Gemini: [aistudio.google.com/apikey](https://aistudio.google.com/apikey)  
Key Groq: [console.groq.com/keys](https://console.groq.com/keys)

## Won’t

- Key in der APK einbacken
- 0,5B oder Groq als gleichwertiges Hirn verkaufen
- 1,5B/3B on-device
- Research-Netz, TTS, anderes Cloud-Produkt als Gemini + optional Groq

## Historisch `0.16` — Opt-in

Default war **aus**. Ohne Schalter und Key änderte sich nichts (`0.14.1` on-device). Settings: Toggle + Key + Test. Memory / Todos / TV blieben lokal, vor dem LLM.

### Kaskade (`1.0.0`)

Kein dauerhaft kostenloses Chat-Modell ohne eigenen Key. Ablauf:

1. Bestes Free-Gemini (Flash) bis Kontingent/Überlastung (429, 503, „high demand“)
2. Sofort nächstes schlechteres Gemini (Flash-Lite, 2.0, 1.5) — **kein** englischer Fehler
3. Optional **Groq** (eigener Key, hoher Free-Tier, Llama)

Ungültiger Gemini-Key bricht ab (nicht die ganze Leiter runter). Überlastete Modelle ~12 Min Pause.

Diese Leiter gilt weiter **innerhalb von Gemini**. Die **Produkt**-Reihenfolge ab `6.50` ist Gemini → Groq → 0,5B.
