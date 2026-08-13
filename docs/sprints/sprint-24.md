# Sprint 24 — Edge & Reply Polish

| Feld | Wert |
|------|------|
| Status | **READY FOR REVIEW** |
| Priorität | **Should** — nach kritischem Hotfix `0.8.1` |
| Ziel-Version | **`0.8.2`** |
| Quelle | Restpunkte Deep-Test `0.8.0` + Nachzieher Capabilities/Canned/Forget |

## Ziel

Die **weichen Edge- und Reply-Lücken** schließen: Capabilities auch bei kurzen Fragen, weniger Canned bei Begrüßungen, klarere Forget-/Soft-Reject-Acks, restliches Duzen in Live-Replies.

## Must

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| E1 | **Capabilities-Varianten** — nicht nur `Was kannst du alles?` / `/hilfe`, auch `Was kannst du?`, `Was geht?`, `Fähigkeiten` | Deterministische Karte, kein Smalltalk-Waffle |
| E2 | **Begrüßungs-Canned drosseln** — `Guten Morgen` / `Hallo` / `Hey` nicht auf reines `SAFE_SMALLTALK` | Chaos-Begrüßungen inhaltlich oder Jarvis-Greeting; Canned-Quote ≤ Deep-Test-Niveau |
| E3 | **Forget-Ack-Wording** — nach Vergiss-Op klar „weg/raus/gelöscht“ (Jarvis-Ton) | Eval-Needle trifft; Nutzer erkennt Erfolg |
| E4 | **Residual-Duzen Live** — Retry/Nudge wenn Reply noch `*st Sie` / `magst Sie` / `dein` enthält | Stichprobe Deep-Test-Prompts ohne Verb-Stumpf-Duzen |
| E5 | **Soft-Reject UX** — nach Soft-Confirm: „Nein / nicht merken“ löscht oder markiert den Soft-Eintrag, kurze Bestätigung | Kein Crash; Memory enthält Pref nicht mehr (oder expires) |
| E6 | Version `0.8.2` + Eval `scripts/eval_0_8_2.py` | Suite grün; Health/UI `0.8.2` |

## Should

| ID | Inhalt |
|----|--------|
| E7 | Latency-Metrik nur LLM-Turns (Eggs/Deterministik aus p50 raus) — für ehrliche Soft-Latenz-Aussage |
| E8 | Clarify-Spacing / Typo-Guards bei Memory-Clarify (Rest aus Sprint 21 D9) |
| E9 | Chaos-Nachzug: Canned-Rate, Capabilities-Kurzformen, Soft-Reject in Eval |

## Won’t

- Delight-Persist / Audit-UI / Scorecard-Dashboards (→ Sprint 25)
- Neue Tools, Phase 2, TTS, NAS
- Neues MINOR-Fähigkeitsniveau

## Abhängigkeiten

- Sprint 23 / `0.8.1` (Normalize + soften_duzen) empfohlen vorher — sonst E4/E5 auf kaputtem Fundament

## Exit / Abnahme

PO: Kurze Capability-Fragen treffen Karte; Begrüßungen seltener Canned; Forget/Soft-Reject klar. Tag **`v0.8.2`**.

## Danach

- Sprint **25** / `0.8.3` — Ops-/Carry-over Shoulds
