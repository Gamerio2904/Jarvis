# 14 — On-Device: Latenz, Qualität, Intelligenz

Quelle: Ist-Stand `0.13.1` (wllama WASM, **Qwen2.5-0.5B Q4**, `n_threads: 1`, kein Stream).  
Kein Cloud-LLM. Reihenfolge: **Latenz → Qualität → Intelligenz**.  
Filter: kein Hebel, der ein anderes Ziel unnötig verschlechtert.

## Diagnose

| Hebel | Ist | Wirkung |
|-------|-----|---------|
| Threads | `n_threads: 1` | Handy-CPU ungenutzt |
| Stream | `stream: false` | ganze Antwort erst am Ende |
| Kontext | Persona + alle Pins + 8 Turns in `n_ctx: 1024` | Prefill; bei Overflow leidet die Persona |
| Modell | 0.5B Q4 | Intelligenz-Decke |

Memory/Tools umgehen das LLM schon.

## Lieferreihenfolge

| Sprint | Version | Thema | Nebenwirkung |
|--------|---------|-------|--------------|
| [46](./sprints/sprint-46.md) | **`0.13.2`** | Latenz | **CODE** — keine (gleicher Prompt, gleiches Sampling) |
| [47](./sprints/sprint-47.md) | **`0.13.3`** | Qualität | **keine Latenz-Strafe**; Ton bleibt lebendig (kein Temp-Schnitt, kein Hart-Kappen, kein Canned) |
| [48](./sprints/sprint-48.md) | **`0.13.4`** | Intelligenz | Default **unverändert**; nur Toggle „scharf“ = langsamer + klüger |

Native llama.cpp = **`0.14.0`** (PO).

---

## Prüfung je Hebel

| Hebel | Sprint | Latenz | Qualität | Intelligenz | Urteil |
|-------|--------|--------|----------|-------------|--------|
| Mehr Threads | 46 | + | 0 | 0 | **Must** |
| Stream bis EOS | 46 | + (gefühlt) | 0 | 0 | **Must** |
| Persona kürzen, Charakter behalten | 47 | + (Prefill) | + (0.5B folgt kurzen Regeln) | 0 | **Must** |
| `repeat_penalty 1.12` | 47 | 0 | + (weniger Loops) | 0 | **Must** |
| temp 0.55 / top_p 0.85 | — | 0 | − (toter, templatehafter) | 0 | **raus** |
| Memory-Recall + Honesty | 47 | + wenn LLM entfällt | + (kein Raten) | 0 | **Must** |
| Siezen-Scrub (Verben) | 47 | 0 | + (kein `willst Sie`) | 0 | **Must** |
| Hart nach 3 Sätzen kappen | — | + | − (mittendrin abschneiden) | − | **raus** |
| Pack nur bei Overflow | 47 | + nur dann | 0 / + (Persona bleibt im Fenster) | 0 | **Must** |
| Begrüßungs-Canned | — | + | − (Template-Bot) | − | **raus** |
| Optional 1.5B | 48 | − nur wenn an | + Tasks | + | **Must, Default aus** |
| Smalltalk-Canned-Router | — | + | − | − | **raus** |
| Task-Nudge nur bei Task | 48 | 0 | + Struktur | + | **Must, nicht Smalltalk** |

---

## 1) Latenz (`0.13.2`) — ohne Qualitätsverlust

Gleiches GGUF, gleiches Sampling (`temp 0.7`, `top_p 0.88`, `max_tokens 96`), gleicher Prompt (Persona, 8 Turns, alle Pins).

| ID | Update |
|----|--------|
| L1 | `n_threads` = `min(4, hardwareConcurrency − 1)` (Floor 2) |
| L2 | Token-Stream bis EOS |
| L3 | Version `0.13.2` |

---

## 2) Qualität (`0.13.3`) — Live zuerst, dann 0.5B

Live-Probe: [`15-live-probe.md`](./15-live-probe.md)

| ID | Update |
|----|--------|
| L1 | Kein Spotify-Modal, kein False-Confirm „ich öffne die Musik“ |
| L2 | „Was steht an“ / „Was kommt heute?“ ohne Wetter |
| L3 | Wetter nur bei Wetterfrage + Standort |
| L4–L7 | Ort-Parse, kein München-Default, Kauf≠Film, Termin≠Ort, Recall ohne Müll |
| L8–L9 | Uhr und Akku **live** vom Gerät |
| L10 | „Guten Morgen“ nicht auf die Einkaufsliste |
| L11–L14 | Should: Tabelle, BIP-Zahl, Ticker, Hilfe ohne Spotify-Claim |
| Q1–Q5 | Persona kompakt, repeat_penalty, Honesty, Siezen, Pack-bei-Overflow |
| Q6 | Version `0.13.3` |

Raus: Spotify bauen, Wetter an Briefings, temp-Schnitt, Hart-Kappen, Canned.

---

## 3) Intelligenz (`0.13.4`) — Default ohne Latenzverlust

| ID | Update |
|----|--------|
| I1 | Toggle **scharf** = Qwen2.5-1.5B-Instruct Q4 (~1,1 GB). Default bleibt 0.5B |
| I2 | Task-Nudge nur bei Task-Intent (1 Ziel, max 3 Schritte) |
| I3 | OOM/fehlendes 1.5B → Fallback 0.5B |
| I4 | Version `0.13.4` |

Raus: automatischer Modellwechsel, Smalltalk über Canned routen.

---

## Nicht in 46–48

| Thema | Wohin |
|-------|--------|
| Native llama.cpp / GPU | `0.14.0` |
| TTS | PO |
| Samsung-TV, NAS, Play Store | Parking |
