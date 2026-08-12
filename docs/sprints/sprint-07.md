# Sprint 07 — GUI Polish (Post-0.3.0)

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Ziel-Version | **`0.3.1`** |
| Quelle | Deep-Test / Review-Findings zu Sprint 6 (`0.3.0`) |

## Ziel

Premium-Motion wirkt **klarer und ruhiger**: Gradient/Focus/Backdrop spürbar, Chat-Wechsel ohne Anim-Flash-Sturm, Sidebar nicht voller Test-Müll.

## Must

| ID | Fix | Done wenn |
|----|-----|-----------|
| P1 | Ambient-Gradient sichtbarer (Opacity anheben, Spotify-Grün) | In Desktop-Screenshot klar erkennbar, nicht aufdringlich |
| P2 | Composer-Focus stärker (Lift + Border/Shadow) | Fokuszustand ohne Hinsehen-Test erkennbar |
| P3 | Mobile-Backdrop dunkler | Drawer klar modal |
| P4 | Chat-Wechsel: Historie **nicht** alle Bubbles neu animieren; nur neue Messages | Wechsel wirkt soft, nicht flashy |
| P5 | Streaming-Caret stabil sichtbar während Tokens | Deep-Check: Caret während Stream |
| P6 | Version `0.3.1` (API + UI) | Health `version == 0.3.1` |

## Should

| ID | Inhalt |
|----|--------|
| P7 | Dev-/Test-Hilfe: viele leere/Smoke-Chats leicht aufräumen (Bulk-Löschen optional oder Doku „alte Testchats löschen“) |
| P8 | Leerer Zustand zentriert & immer sichtbar bei 0 Messages |

## Won’t

- Gedächtnis / Intelligence-Features (`0.4.0+`)
- Settings-Overhaul / Delight-Pack (eigene Sprints)
- Layout-Neudesign

## Exit

Live Desktop + Mobile: P1–P5 spürbar besser als `0.3.0`. Nach PO-OK: Tag **`v0.3.1`**.
