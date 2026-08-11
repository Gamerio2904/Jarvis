# 08 — Offene Fragen

Alles, was die Planung noch **lückig** macht.  
Ziel: kritische Blocker vor Sprint 1 schließen; Rest bewusst terminieren.

**Legende Priorität**

- **P0** — Blocker für Sprint 1
- **P1** — sollte vor/während Sprint 1 klar sein
- **P2** — vor Phase 2/3/4
- **P3** — später / Luxus

**Status:** `offen` · `entschieden` · `zurückgestellt`

---

## A. Produkt & Persona

| ID | Frage | Prio | Status | Entscheidung |
|----|-------|------|--------|--------------|
| Q1–Q4, Q6–Q8, Q30–Q31 | Persona-Kern | P0/P1 | entschieden | siehe `07-persona.md` |
| Q5 | Soll/Nicht-Soll-Beispiele (≥5–10 vom PO) | P0 | offen | PO liefert als Nächstes (Runde 4 Wahl A) |

## B. Privatsphäre & Sicherheit

| ID | Frage | Prio | Status | Entscheidung |
|----|-------|------|--------|--------------|
| Q9 | Encryption at-rest MVP? | P1 | zurückgestellt | |
| Q10 | Ollama-Download? | P1 | entschieden | Ja |
| Q11 | History speichern? | P1 | entschieden | Ja |
| Q12 | Löschen? | P2 | zurückgestellt | Nicht Sprint 1 |

## C. Hardware & Betrieb

| ID | Frage | Prio | Status | Entscheidung |
|----|-------|------|--------|--------------|
| Q13 | Dev-Rechner | P0 | entschieden | Windows, 16 GB, RTX 3060 |
| Q14 | NAS | P2 | zurückgestellt | Phase 2+ später planen |
| Q15 | Latenz-Priorität | P1 | entschieden | Qualität > Speed |
| Q16 | Strom/Lautstärke | P2 | zurückgestellt | Phase 2+ später |
| Q32 | VRAM | P0 | entschieden | **Standard annehmen: Desktop ~12 GB** (Bestätigung am PC optional nachholen) |

## D. Technik-Stack / Produktumfang

| ID | Frage | Prio | Status | Entscheidung |
|----|-------|------|--------|--------------|
| Q17 | Host | P0 | entschieden | Ollama |
| Q18 | Modellklasse | P0 | entschieden | Ausgewogen |
| Q19 | Backend | P1 | entschieden | Dev pragmatisch |
| Q20 | UI-Kanal | P1 | entschieden | Nur Web; Premium-Anspruch |
| Q21 | Chat-Organisation | P1 | entschieden | **Zielbild A:** mehrere Chats + Liste + „Neues Gespräch“; MVP nur **bedingt**/schlank, ausbaufähig |
| Q33 | UI-Richtung | P1 | entschieden | **Farben/Atmosphäre: Spotify**; **Layout/Buttons: ChatGPT-ähnlich**; Motion: MVP light, später GUI-Update premium |
| Q35 | Kontext/Gedächtnis-Umfang MVP vs. später | P1 | offen | PO will starkes Kontext-/Erinnerungsziel — MVP nur bedingt; Grenze schärfen |

## E. Agiler Prozess / Versionierung

| ID | Frage | Prio | Status | Entscheidung |
|----|-------|------|--------|--------------|
| Q22 | Sprint-Länge | P1 | entschieden | Zielbasiert; Zeit egal |
| Q23 | Review | P2 | entschieden | Schriftlich |
| Q24 | Scope-Freeze | P2 | entschieden | Klein ok; groß → neuer Sprint |
| Q34 | Wann ist `0.1.0` / `1.0.0`? | P1 | offen | Versionierungsschema steht (`09`); Startlabel klären |

## F. Spätere Phasen

| ID | Frage | Prio | Status | Entscheidung |
|----|-------|------|--------|--------------|
| Q25–Q29 | VPN/Auth/TTS/App | P2/P3 | zurückgestellt | **Phase 2+ später planen** (PO) |

---

## Empfohlene Klärungsreihenfolge (Rest)

1. **Q5** — PO-Beispiele eintragen  
2. **Q35** — MVP-Grenze Kontext/Gedächtnis  
3. **Q34** — Versions-Startlabels  
4. Dann Sprint-0 abschließen → Sprint 1

## Minimal-Set Sprint 1

- ~~Kern-Persona, Ollama, Web, Persistenz-Richtung, Chat-Org-Zielbild, UI-Richtung, VRAM-Standard~~ **done**
- **Q5** stark empfohlen vor Prompt-Feinschliff  
- **Q35** empfohlen, damit Persistenz/Kontext nicht falsch gebaut wird  
- Q34 kann parallel zur ersten Umsetzung

---

## Entscheidungsprotokoll

| Datum | ID | Entscheidung | Von |
|-------|-----|--------------|-----|
| 2026-08-11 | — | Vision, lokal, Chat-first, Scrum-lite Docs | PO + Agent |
| 2026-08-11 | Persona-Block | Master/Sir, Sie, derb, nur DE, keine harten Tabus | PO |
| 2026-08-11 | Hardware/Stack | Win/16GB/3060; Ollama; History; Qualität>Speed | PO |
| 2026-08-11 | Prozess/UI grob | Ausgewogen; Web; Premium-Anspruch; zielbasierte Sprints | PO |
| 2026-08-11 | Q21,Q32,Q33 | Chat-Liste Zielbild A (MVP bedingt); 12 GB Standard; Spotify-Farben + ChatGPT-Layout; Motion light→Update; Versionierung; Phase 2+ später | PO |
