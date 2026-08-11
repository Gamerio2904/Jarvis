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
| Q5 | Soll/Nicht-Soll-Beispiele | P0 | offen | PO wählt aus Agent-Optionen (A/B/C) |

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
| Q14 | NAS | P2 | zurückgestellt | Detailplanung später; **`1.0.0` = NAS 24/7** |
| Q15 | Latenz-Priorität | P1 | entschieden | Qualität > Speed |
| Q16 | Strom/Lautstärke | P2 | zurückgestellt | |
| Q32 | VRAM | P0 | entschieden | Desktop ~12 GB Standard |

## D. Technik-Stack / Produktumfang

| ID | Frage | Prio | Status | Entscheidung |
|----|-------|------|--------|--------------|
| Q17–Q21 | Host/Modell/Backend/UI/Chats | P0/P1 | entschieden | Ollama; ausgewogen; Dev; Web; Mehr-Chat-Zielbild |
| Q33 | UI-Richtung | P1 | entschieden | **Spotify dunkel** + ChatGPT-Layout; Motion light→Update |
| Q35 | Kontext/Gedächtnis | P1 | entschieden | **MVP:** In-Chat + Wiederöffnen. **Später:** maximal gutes Gedächtnis/Kontext |

## E. Agiler Prozess / Versionierung

| ID | Frage | Prio | Status | Entscheidung |
|----|-------|------|--------|--------------|
| Q22–Q24 | Sprint/Review/Freeze | P1/P2 | entschieden | Zielbasiert; schriftlich; mittel |
| Q34 | `0.1.0` / `1.0.0` | P1 | entschieden | **`0.1.0` = MVP**; **`1.0.0` = NAS** |

## F. Spätere Phasen

| ID | Frage | Prio | Status | Entscheidung |
|----|-------|------|--------|--------------|
| Q25–Q29 | VPN/Auth/TTS/App | P2/P3 | zurückgestellt | Phase 2+ später planen |

---

## Empfohlene Klärungsreihenfolge (Rest)

1. **Q5** — Beispiel-Optionen abwählen (A/B/C) → in `07` eintragen  
2. Sprint 0 abschließen → Sprint 1 (`0.1.0`)

## Minimal-Set Sprint 1

- Kernentscheidungen: **done**
- **Q5** empfohlen vor finalem System-Prompt

---

## Entscheidungsprotokoll

| Datum | ID | Entscheidung | Von |
|-------|-----|--------------|-----|
| 2026-08-11 | — | Vision, lokal, Chat-first, Scrum-lite Docs | PO + Agent |
| 2026-08-11 | Persona/Stack/UI | siehe frühere Runden | PO |
| 2026-08-11 | Q34,Q35,Q33 | `0.1.0`=MVP; `1.0.0`=NAS; Memory gestuft max später; Spotify dunkel | PO |
