# 16 — Gemini (Spezialist ab `15.1`)

> **Jetzt (`18.10.0`):** **Groq primär** für Chat/Formulierung. **Gemini Spezialist** (Vision, Deep Research/Grounding). TTS stehend: Edge zuerst, Algieba nicht vor Deutsch. Rollback `brain_v2: false` / Gemini-Hauptweg **nicht ziehen**. Siehe [`HISTORISCH.md`](./HISTORISCH.md).

PO 2026-08-15: **Gemini-API**, weil das lokale 0.5B kein ChatGPT-Niveau erreicht.  
PO 2026-08-28: Reihenfolge umgedreht — Gemini **Hauptweg**, nicht Opt-in-Zusatz.  
PO 2026-09-08: Dual Brain — Gemini **entlasten**, nicht entfernen ([`63-next.md`](./63-next.md)).

Key bleibt **dein** Key. Nichts in der APK. Ohne Key: Parser-Tools laufen trotzdem; Smalltalk ist klein oder ehrlich aus.

## Heute (`17.0.0`, Dual Brain seit `15.1`)

Kaskade in `brain-orchestrator.ts` / Settings `brain_primary`:

1. **Groq** — primär für Chat/Formulierung (`brain_primary: 'groq'`)
2. **Gemini** — Spezialist: Vision, Grounding/Deep Research, optional TTS
3. **0,5B Qwen** — wenn beide Clouds tot, Kontingent leer, oder bewusst lokal
4. sonst: Tools ohne Modell

Rollback: `brain_v2: false` → Gemini zuerst wie `13.44`.

Parser wählen Geräte. Das Modell formuliert denselben Tool-Satz in 1–3 Sätzen — Guard streicht neue Zahlen/Orte.

Key Gemini: [aistudio.google.com/apikey](https://aistudio.google.com/apikey)  
Key Groq: [console.groq.com/keys](https://console.groq.com/keys)

## Won’t

- Key in der APK einbacken
- 0,5B als gleichwertiges Hirn verkaufen
- 1,5B/3B on-device
- Research-Netz oder anderes Cloud-Produkt als Gemini + Groq

## Historisch `0.16` — Opt-in

Default war **aus**. Ohne Schalter und Key änderte sich nichts (`0.14.1` on-device). Settings: Toggle + Key + Test. Memory / Todos / TV blieben lokal, vor dem LLM.

### Kaskade (`1.0.0`)

Kein dauerhaft kostenloses Chat-Modell ohne eigenen Key. Ablauf:

1. Bestes Free-Gemini (Flash) bis Kontingent/Überlastung (429, 503, „high demand“)
2. Sofort nächstes schlechteres Gemini (Flash-Lite, 2.0, 1.5) — **kein** englischer Fehler
3. Optional **Groq** (eigener Key, hoher Free-Tier, Llama)

Ungültiger Gemini-Key bricht ab (nicht die ganze Leiter runter). Überlastete Modelle ~12 Min Pause.

Diese Leiter gilt weiter **innerhalb von Gemini**. Die **Produkt**-Reihenfolge ab `6.50` ist Gemini → Groq → 0,5B.
