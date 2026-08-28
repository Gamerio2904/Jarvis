# Sprint 129 — Overlay: Gemini zuerst

**Version:** `6.53.0` (mitgeliefert in `6.60.0`)  
**Status:** CODE (in App `6.60.0`)  
**Quelle:** [`47-next.md`](../47-next.md) · [`45-next.md`](../45-next.md)

## Ziel

Erststart schiebt nicht das 0,5B-Modell als Hauptweg. Gemini-Key zuerst, Groq Backup, lokales Modell letzter Knopf. Tools ohne Hirn nutzbar (Fertig).

## Must

- Overlay-Titel und Primärknopf: Gemini.
- Fertig ohne Download; Dismissal bleibt (Settings-Flag).
- 0,5B als Backup beschriftet.
- Hinweis Hausstand vor Neuinstall.

## Won’t

Auto-Download. Overlay überspringen wenn Gemini-Key schon da (bleibt).

## Done when

Ohne Key: Overlay bietet Gemini und Fertig, Download ist nicht der erste Knopf.
