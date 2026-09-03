# 14 — Update `0.14`: Bestehendes härten + TV live

> Historisch Sprint 47–48. **Jetzt:** Code **`10.60.0`**. Sideload **`9.10.0`**. Hirn Gemini zuerst ([`16-gemini.md`](./16-gemini.md)). TV bleibt nativ in der APK.

PO 2026-08-15: **Nichts Neues** (für *diese* Etappe). Kein größeres Modell, kein Research, kein TTS, keine neuen Tool-Typen.  
Ziel damals: was schon da ist, **schneller, klüger, zuverlässiger** — und die **geparkte Fernseher-Steuerung** wirklich verbinden und bedienen.

Status: **CODE** in Sideload `0.14.1` (Sprint 47+48 zusammen), mitgeliefert in `6.60.0`.

Basis: On-Device `0.13.2` ([`13-on-device.md`](./13-on-device.md)).

## Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Scope | Nur vorhandene Fähigkeiten verbessern |
| Modell | Damals Qwen2.5 0.5B Instruct Q4. **Heute:** Gemini Hauptweg, 0,5B Backup. |
| TV | Bestehendes `0.11`-Soll, jetzt **nativ in der APK** (kein Python, keine NAS) |
| Geräte | Ein Samsung-Tizen im selben WLAN |
| Confirm TV | Sofort ausführen (wie `0.11.0`) |
| Danach | `0.14.1` nur für Nachzieher; `1.0.0` / TTS weiter PO |

## Zwei Lieferstufen

| Version | Sprint | Inhalt |
|---------|--------|--------|
| **`0.14.0`** | [47](./sprints/sprint-47.md) | Latenz, Antwortqualität, Intelligenz der bestehenden Engine |
| **`0.14.1`** | [48](./sprints/sprint-48.md) | TV suchen, koppeln, testen, steuern (an/aus/vol/mute/HDMI) |

Qualität zuerst: ein langsames oder wirres Chat-Modell macht TV-Phrasen unbrauchbar.

## A) Latenz (bestehendes)

Heute: Prompt-Eval auf WASM ist der Flaschenhals; `n_threads: 1` und langes Persona waren der `0.13.1`-Hänger. `0.13.2` streamt schon.

| Hebel | Warum | Nicht |
|-------|--------|--------|
| Modell warm halten | Kein Reload pro Nachricht | Neues Modell laden |
| Kurzer Prompt / `cache_prompt` | Weniger Prefill | `n_ctx` aufblasen |
| Threads / Batch feinjustieren | Handy-CPU ausnutzen | GPU-Cloud |
| Deterministische Pfade vor dem LLM | Memory/Tools/TV ohne 0.5B | Alles durchs Modell jagen |
| Frühes Stop / weniger max_tokens wo genug | Kürzere Generierung | Längere Essays |

Abnahme: „Hallo Jarvis“ zeigt das erste Wort spürbar früher als `0.13.2`; kein endloses Tippen.

## B) Antwortqualität & Intelligenz (bestehendes)

Das 0.5B bleibt schwach — Intelligenz kommt aus **Routing und ehrlichen lokalen Pfaden**, nicht aus einem neuen Netz.

| Hebel | Ist (`0.13.2`) | Soll (`0.14.0`) |
|-------|----------------|-----------------|
| Memory | Name/Trinken/Essen, grobe Regex | Mehr natürliche Phrasen, Multi-Fact, ehrliches „weiß ich nicht“ |
| Tools | Strikte `todo:` / `notiz:` | Alltagsformulierungen, Follow-up „erledige das erste“ |
| Guards | Siezen/Inject grob | Weniger Duzen-Leak, keine Fake-„habe ich gemacht“-Claims |
| Chat | Kurzes Persona, 4 Turns | Stabiler Ton, weniger Waffle, Follow-up hält die Spur |
| UI-Ehrlichkeit | „Ollama: online“ | On-Device-Status, kein Server-Vokabular |

Kein neues Intent-Framework, kein Research-Netz, keine Kalender/Mail.

## C) Fernseher (bestehendes, bisher geparkt)

WebView kann **kein UDP-WOL**. Deshalb nativ in der APK:

```text
Chat / Settings
    → TypeScript-Parser (Fernseher/TV + Anker)
    → Capacitor-Plugin (Android)
         • SSDP / Port-Scan 8001/8002
         • Pairing-Token auf dem Gerät
         • WOL Magic-Packet (UDP)
         • Tizen-Keys (WS 8001/8002)
```

Soll (unverändert zu `0.11`):

- Settings: suchen, koppeln (Haken am TV), testen, Name, Host, MAC, Toggle
- Chat: „Fernseher an/aus“, „lauter/leiser/stumm“, „auf HDMI 2“
- Kill-Switch `tv_enabled`; ungepaart = ehrliche Meldung
- Follow-up „lauter“ nur nach TV-Turn
- Kein Fake-Erfolg ohne Tool-Ergebnis

Won’t: SmartThings, Apps, Multi-TV, Fire TV, Alexa.

## Won’t in `0.14.x`

- Größeres oder anderes LLM
- Internet-Research, TTS, NAS, Docker
- Play Store, iOS, Multi-User
- Neue Tool-Familien (Mail, Kalender, Licht)
- Neue Delight-Mechaniken über das Vorhandene hinaus

## Abnahme der Reihe

1. Chat fühlt sich schneller und treffsicherer an als `0.13.2` (gleiche Features).
2. PO: TV im WLAN suchen → koppeln → Test → aus der App an/aus/Vol/HDMI.
3. Ohne Kopplung kein Key, mit Kill-Switch aus keine Keys.
