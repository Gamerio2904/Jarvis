# Sprint 47 — On-Device Qualität (`0.13.3`)

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Priorität | **MUST** — 0.5B braucht kurze Regeln + ehrliches Memory |
| Ziel-Version | **`0.13.3`** |
| Quelle | [`14-on-device-iq.md`](../14-on-device-iq.md); Carry Memory-Honesty aus Sprint 31 |

## Ziel

Jarvis **klingt** nach Jarvis und **rät nicht**. Latenz-Fixes aus `0.13.2` bleiben.

## Must

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| Q1 | Persona komprimiert (~8 Regeln), kein langer Essay-Prompt | Systemprompt klar kürzer |
| Q2 | Sampling: temp 0.55, top_p 0.85, repeat_penalty 1.12 | weniger Loops/Floskeln |
| Q3 | Memory-Recall breiter + Honesty (kein Pref erfinden) | „Was mag ich?“ nur Store oder „weiß ich nicht“ |
| Q4 | Siezen-Scrub ohne `willst Sie` / `*st Sie` | Probe-Set ohne Broken-Siezen |
| Q5 | Hartes Kappen nach 3 Sätzen | messenger-kurz |
| Q6 | Pack nur wenn Budget eng: letzte 4 Turns / Top-4 Pins **sonst 8 Turns / alle Pins** | lange Chats halten den Faden, Prefill nur bei Druck |
| Q7 | Version `0.13.3` | UI/Health/Changelog |

## Should

| ID | Inhalt |
|----|--------|
| Q8 | Canned-Bank mit 3–5 Varianten (Hey/Danke) — bewusst Template-Risiko, PO-Abnahme |
| Q9 | Frontend-Smoke für Recall/Honesty/Siezen |

## Won’t

- 1.5B-Modell
- Research im Netz
- Python-Eval-Suiten der `0.9.x`-Ära als Pflicht

## Exit / Abnahme

PO: Ton sitzt; Pref-Fragen halluzinieren nicht; Siezen nicht kaputt. Tag **`v0.13.3`**.

## Danach

Sprint 48 / `0.13.4` optionales 1.5B.
