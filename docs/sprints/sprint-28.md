# Sprint 28 — Local Tools Core (Option A)

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Priorität | **MINOR** — neues nutzbares Fähigkeitsniveau |
| Ziel-Version | **`0.9.0`** |
| Quelle | PO: Option A nach `0.8.4`-Deep-Test; Roadmap Tools |

## Ziel

Jarvis bekommt eine **lokale Tool-Schicht**: Allowlist, Dry-Run/Confirm, erste Tools **Notizen & Todos** (SQLite) — spürbarer Nutzen über Memory/Smalltalk hinaus, ohne Cloud-APIs und ohne Kalender/Mail/Smart-Home.

## Must

| ID | Story | Done wenn |
|----|-------|-----------|
| T1 | **Tool-Runtime v1** — Allowlist, Argument-Schema, Dry-Run, User-Confirm vor Write; Audit-Eintrag lokal | Kein Tool-Write ohne Confirm; False-Claims ohne Tool-Ergebnis verboten |
| T2 | **Tool `notes`** — anlegen / listen / suchen (lokal) | „Notiere: …“ / „Was steht in meinen Notizen zu X?“ funktioniert ehrlich |
| T3 | **Tool `todo`** — anlegen / listen / erledigen (lokal) | „Todo: Milch“ → Confirm → gespeichert; „Offene Todos?“ listet |
| T4 | **Router-Intent `tool`** (oder Sub von `task`) + Policy | Tool-Turns nicht als reiner Smalltalk; Inject bleibt Refuse |
| T5 | **`/hilfe` + Capabilities** nennen Tools (Notizen/Todos, Confirm, lokal) | Nutzer sieht in &lt;10s was neu geht |
| T6 | Version `0.9.0` + Eval `scripts/eval_0_9_0.py` | Suite grün; Health/UI `0.9.0` |

## Should

| ID | Inhalt |
|----|--------|
| T7 | UI: Confirm-Chip / Status „Tool bereit / ausgeführt / abgelehnt“ |
| T8 | Scorecard-Stub: Tool-Confirm-Rate, False-Claim-Rate |
| T9 | Soft-Latenz: Tool-Pfad zeigt Status bevor Modell weiterplappert |

## Won’t

- Kalender/Mail/Smart-Home
- Externe Schreib-APIs / Cloud-Sync
- Phase 2 Auth, NAS, TTS
- Autonome Tool-Ketten ohne Confirm

## Abhängigkeiten

- Sprint 27 / `0.8.5` empfohlen vorher (Persona/Continuity sauber)
- Memory + Router + Clarify aus `0.4`–`0.8` vorhanden

## Architektur-Skizze (v1)

```text
User → Router (tool|task|…) → Policy
     → (optional) Model schlägt Tool-Call vor
     → Runtime: validate → dry-run → Confirm
     → execute lokal (SQLite notes/todos)
     → Reply nur mit Claims aus Tool-Ergebnis
```

## Exit / Abnahme

PO: Notiz + Todo mit Confirm lokal nutzbar; keine Fake-„hab ich notiert“ ohne Tool; `/hilfe` aktuell. Tag **`v0.9.0`**.

## Danach

- **Sprint 29 / `0.9.1`** Tools Hotfix
- **Sprint 30 / `0.9.2`** Tools Polish + Continuity
- Phase 2 / NAS — **PO-Kommando**
