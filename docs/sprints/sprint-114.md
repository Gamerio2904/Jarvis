# Sprint 114 — Zwei Gesichter + Tablet flüssig **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** |
| Priorität | nach Hausstand; Tablet-HUD darf früher |
| Ziel-Version | `4.53.0` Leitentscheidung; Reihe `4.54`–`4.65` in [`39-next.md`](../39-next.md) |
| Quelle | PO: Jarvis = Smalltalk + Hauptfunktionen + CarPlay; Friday = Sekretärin (Kalender …); Tablet |
| Voraussetzung | Code `3.19.0`; TTS-Spike männlich [`37-next.md`](../37-next.md) `4.34`; Sideload nach [`38-next.md`](../38-next.md) |
| Plan | [`39-next.md`](../39-next.md) |

## Ziel

Ein Hirn, zwei Gesichter. Jarvis Haupt-KI inkl. Steuer. Friday Sekretärin über `FACE_BY_TOOL` nach der normalen Toolwahl. Lage neben dem Chat. Kein Execute außer Docs.

## Must

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| N1 | Spaltung = Faces, nicht zwei Router | Tabelle in `39-next.md` |
| N2 | Jarvis Haupt + CarPlay; Friday Kalender/Sekretärin | Domain-Tabelle + Gold |
| N3 | Drive schlägt Friday; Name schlägt Domain | Gold am Steuer / `Jarvis, was steht an` |
| N4 | Wake Friday ≠ Freitag | Won’t Freitag |
| N5 | Lage ersetzt Chat nicht | Split-Pane in `4.59` |

## Won’t (dieser Sprint)

Execute-Code, Marvel, zweites Modell, Embeddings, Friday am Steuer, neue APK.
