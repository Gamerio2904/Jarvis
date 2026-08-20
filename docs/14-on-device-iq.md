# 14 — On-Device: Latenz, Qualität, Intelligenz (Hebel)

> Doc-Nr. 14 in der Leseliste ist [`14-quality-tv.md`](./14-quality-tv.md) (TV `0.14.1`). Diese Datei sind die Hebel der Live-Qualität. Lieferung: **`2.2.3`** / **`2.2.4`** ([`30-next.md`](./30-next.md)).

Latenz (Threads + Stream) ist in **`2.2.2`** schon **CODE** (historisch `0.13.2`). Nicht neu planen.

## Lieferreihenfolge

| Sprint | Version | Thema | Status |
|--------|---------|-------|--------|
| 46 | `0.13.2` | Stream/Threads (Hang-Fix) | **CODE** — in `2.2.2` |
| [105](./sprints/sprint-105.md) | **`2.2.3`** | Live-Qualität | **IN SPRINT** (früher intern `0.13.3`) |
| [106](./sprints/sprint-106.md) | **`2.2.4`** | Optional 1.5B | **PLANNED** SHOULD (früher intern `0.13.4`) |

Native llama.cpp = **PO**.

---

## Prüfung je Hebel

| Hebel | Version | Latenz | Qualität | Intelligenz | Urteil |
|-------|---------|--------|----------|-------------|--------|
| Mehr Threads | `0.13.2` | + | 0 | 0 | **done** |
| Stream bis EOS | `0.13.2` | + (gefühlt) | 0 | 0 | **done** |
| Persona kürzen, Charakter behalten | `2.2.3` | + (Prefill) | + | 0 | **Must** |
| `repeat_penalty 1.12` | `2.2.3` | 0 | + (weniger Loops) | 0 | **Must** |
| temp 0.55 / top_p 0.85 | — | 0 | − | 0 | **raus** |
| Memory-Recall + Honesty | `2.2.3` | + wenn LLM entfällt | + | 0 | **Must** |
| Siezen-Scrub (Verben) | `2.2.3` | 0 | + | 0 | **Must** |
| Hart nach 3 Sätzen kappen | — | + | − | − | **raus** |
| Pack nur bei Overflow | `2.2.3` | + nur dann | 0 / + | 0 | **Must** |
| Begrüßungs-Canned | — | + | − | − | **raus** |
| Optional 1.5B | `2.2.4` | − nur wenn an | + Tasks | + | **Should, Default aus** |
| Smalltalk-Canned-Router | — | + | − | − | **raus** |
| Task-Nudge nur bei Task | `2.2.4` | 0 | + | + | **Must, nicht Smalltalk** |

Live-Musts (Musik, Wetter-Gate, Uhr/Akku, Einkauf): [`15-live-probe.md`](./15-live-probe.md) / `2.2.3`.
