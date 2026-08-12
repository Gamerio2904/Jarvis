# Sprint 14 — Delight & Settings

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Ziel-Version | **`0.7.0`** |
| Quelle | [`11-delight-and-settings.md`](../11-delight-and-settings.md) |

## Ziel

Jarvis bekommt **dosierte Begeisterung** (Momente, Jokes, Sound, Easter Eggs) und ein **flaches Settings-Panel** — abschaltbar, local-first, ohne Verschachtelungstiefe.

## Must

| ID | Story | Done wenn |
|----|-------|-----------|
| D1 | **Flaches Settings-Panel** — eine Seite, ≤7 Abschnitte, 1 Ebene | PO findet Easter-Egg-Liste in &lt;10s; keine Nested-Menüs |
| D2 | **Jarvis-Momente** — selten, Cap/Tag, Toggle | An/Aus wirkt; max. 1–2/Tag |
| D3 | **Inside Jokes** — aus Memory-Pins, Intent-sensitiv, Toggle + Frequenz | Kein Witz bei ernstem Intent; löschbar |
| D4 | **UI-Sounds** — Send/Receive/Error, Master-Toggle + 2–3 Lautstärken | Default dezent/aus laut PO; stummbar |
| D5 | **Easter-Egg-Commands** — z.B. `/protokoll`, `/mission`, `/kante` — **Liste in Settings** | Eggs durch Guards; keine Shell/Netz |
| D6 | Version `0.7.0` | Health + UI |

## Should

| ID | Inhalt |
|----|--------|
| D7 | Abschnitte: Allgemein, Modell, Gedächtnis, Delight, Sound, Easter Eggs, Forschung |
| D8 | Danger-Zone getrennt (Memory löschen) mit Bestätigung |

## Won’t

- Neue Intelligence-Kernfeatures (liegen in Sprints 8–13)
- Tiefe Settings-Hierarchie / Advanced-JSON-UI als Primärweg
- Lautes Arcade-Sound

## Abhängigkeiten

- `0.4.0`+ Gedächtnis (für Jokes); ideal nach Memory-Patches (Sprints 9–11)
- Ideal nach Router/Research (Sprints 12–13), damit Settings Research-Toggle aufnehmen kann

## Exit

PO: Settings flach nutzbar; Delight spürbar aber abschaltbar; Eggs dokumentiert in UI. Tag **`v0.7.0`**.
