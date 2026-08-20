# Sprint 47 — On-Device Qualität (`0.13.3`)

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Priorität | **MUST** |
| Ziel-Version | **`0.13.3`** |
| Quelle | [`14-on-device-iq.md`](../14-on-device-iq.md) |

## Ziel

0.5B **ehrlicher und jarvis-treuer**, ohne tot zu klingen und ohne extra Wartezeit.

## Must

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| Q1 | Persona kompakt, Charakter bleibt (frech, Humor, DE, Siezen, kurz, kein Helpdesk) | kürzer als `0.13.1`, Ton-Anker noch da |
| Q2 | `repeat_penalty 1.12`; **temp 0.7 / top_p 0.88 bleiben** | weniger Loops, gleiche Lebendigkeit |
| Q3 | Memory-Recall breiter + Honesty | Pref-Fragen nur Store oder „weiß ich nicht“ |
| Q4 | Siezen-Scrub ohne `willst Sie` / `*st Sie` | Probe ohne Broken-Siezen |
| Q5 | Pack nur bei Prompt > `n_ctx` | sonst 8 Turns + alle Pins wie bisher |
| Q6 | Version `0.13.3` | UI/Health/Changelog |

## Won’t (Nebenwirkung)

- temp 0.55 / top_p 0.85 (tötet Variation)
- Hart nach 3 Sätzen kappen (schneidet gute Antworten)
- Begrüßungs-Canned (Template-Bot)
- 1.5B, Research, TV

## Exit / Abnahme

PO: Ton lebendig; Prefs ohne Halluzination; Siezen sauber; Smalltalk nicht langsamer. Tag **`v0.13.3`**.

## Danach

Sprint 48 / `0.13.4` optionales 1.5B.
