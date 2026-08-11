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
| Q1 | Grundton von Jarvis? | P0 | entschieden | Trocken-humorig + warm/freundlich; Vibe = Kumpel + frech-direkt |
| Q2 | Wie spricht er dich an? | P0 | entschieden | „Master“ + „Sir“; selten & situativ |
| Q3 | Formalität und Humor? | P0 | entschieden | Formalität 3–4; Humor deftig/frech + trocken; derb erlaubt |
| Q4 | Tabus & Grenzen im Smalltalk? | P0 | entschieden | Keine harten inhaltlichen Tabus; Anti-KI-Stilregeln bleiben |
| Q5 | Soll/Nicht-Soll: ≥10 Beispiel-Antworten? | P0 | offen | Noch ausstehend (Abnahme-Qualität) |
| Q6 | Tagesstimmung andeuten? | P1 | entschieden | Ja, leicht / dosiert |
| Q7 | Sprache? | P1 | entschieden | Nur Deutsch |
| Q8 | Jarvis-Erwartung / Vibe? | P0 | entschieden | Kumpel-Assistent + frech-direkt (mit Master/Sir) |
| Q30 | Welche Anrede-Varianten außer „Master“? Wann wechseln? | P0 | entschieden | Nur Master + Sir; selten + situativ (Respekt/Ironie) |
| Q31 | Duzen / Siezen / ohne Pronomen? | P1 | entschieden | Meist ohne Du-Pronomen; wenn nötig **Sie** |

## B. Privatsphäre & Sicherheit

| ID | Frage | Prio | Status | Entscheidung |
|----|-------|------|--------|--------------|
| Q9 | Verschlüsselung at-rest schon im MVP? | P1 | zurückgestellt | Vorerst: kein Cloud-LLM + nur-du-Zugang reicht; Encryption später neu bewerten |
| Q10 | Modell-Download (Ollama/HF) erlaubt? | P1 | entschieden | Ja — Ollama-Weg ok |
| Q11 | Chat-History zwischen Sessions? | P1 | entschieden | Ja, speichern |
| Q12 | Löschkonzept für gespeicherte Chats? | P1 | offen | Durch Q11 wichtiger geworden |

## C. Hardware & Betrieb

| ID | Frage | Prio | Status | Entscheidung |
|----|-------|------|--------|--------------|
| Q13 | Entwicklungsrechner Specs? | P0 | entschieden | Windows, 16 GB RAM, NVIDIA RTX 3060 (VRAM: Q32) |
| Q14 | NAS-/24/7-Zielgerät? | P2 | offen | |
| Q15 | Antwortlatenz / Priorität? | P1 | entschieden | So schnell wie möglich, aber **Qualität wichtiger**; Speed später optimieren |
| Q16 | Strom-/Lautstärke-Constraints? | P2 | offen | |
| Q32 | RTX 3060: Laptop (≈6 GB) oder Desktop (≈12 GB VRAM)? | P0 | offen | Aus Runde 2 — kritisch für Modellgröße |

## D. Technik-Stack (Sprint 1)

| ID | Frage | Prio | Status | Entscheidung |
|----|-------|------|--------|--------------|
| Q17 | Modell-Host-Präferenz? | P0 | entschieden | **Ollama** als Default, bis klar bessere Alternative |
| Q18 | Grobe Modellklasse? | P0 | offen | Hängt an Q32 + Qualitätsfokus |
| Q19 | Backend-Sprache/-Framework-Präferenz? | P1 | offen | sonst entscheidet Dev pragmatisch |
| Q20 | UI: reine Web-App reicht? | P1 | offen | |
| Q21 | „Neues Gespräch“-Button im MVP? | P1 | offen | durch Persistenz relevanter |

## E. Agiler Prozess

| ID | Frage | Prio | Status | Entscheidung |
|----|-------|------|--------|--------------|
| Q22 | Sprint-Länge? | P1 | offen | |
| Q23 | Review-Ritual? | P2 | offen | |
| Q24 | Scope-Freeze-Strenge? | P2 | offen | |

## F. Spätere Phasen (nicht Sprint-1-Blocker)

| ID | Frage | Prio | Status | Entscheidung |
|----|-------|------|--------|--------------|
| Q25 | Fernzugriff Phase 2: VPN-Präferenz? | P2 | offen | |
| Q26 | Auth-Präferenz? | P2 | offen | |
| Q27 | TTS später: lokal vs. Cloud? | P2 | offen | |
| Q28 | Spracheingabe nach TTS? | P3 | offen | |
| Q29 | Native App jemals Muss? | P3 | offen | |

---

## Empfohlene Klärungsreihenfolge (Workshop)

1. ~~Persona-Kern~~ **done**
2. ~~Persona-Feinschliff Q30/Q31~~ **done**
3. ~~Hardware grob + Privatsphäre Q9–Q11~~ **done** (Q32 VRAM noch offen)
4. **Jetzt:** Q32 → Q18 → Q20 → Q21 → Q12 → Q19 → Q22
5. Q5 Beispiele parallel/ASAP
6. Rest Phase 2+ nach Bedarf

## Minimal-Set zum Start von Sprint 1

Sprint 1 darf starten, wenn **mindestens** entschieden:

- ~~Q1, Q2, Q8, Q4, Q30~~ **done**
- ~~Q11, Q17~~ **done**
- **Q32** (VRAM / 3060-Typ)
- **Q18** (Modellklasse)
- **Q20** (UI-Kanal MVP)

Beispiele (Q5) parallel möglich; Löschen (Q12) und „Neues Gespräch“ (Q21) wegen Persistenz stark empfohlen vor/im Sprint 1.

---

## Entscheidungsprotokoll

| Datum | ID | Entscheidung | Von |
|-------|-----|--------------|-----|
| 2026-08-11 | — | Vision, lokal Variante 3, Chat-first, TTS später, Scrum-lite Docs angelegt | PO + Agent |
| 2026-08-11 | Q1,Q3,Q6,Q7,Q8 | Kumpel+frech; warm+trocken; Formalität 3–4; Humor deftig+trocken; Stimmung leicht; nur DE | PO |
| 2026-08-11 | Q2,Q4 | Anrede Master u. Ä.; keine harten Tabus | PO |
| 2026-08-11 | Q30,Q31 | Nur Master+Sir; selten/situativ; meist ohne Du, sonst Sie; derb ok | PO |
| 2026-08-11 | Q9–Q11,Q13,Q15,Q17 | Security vorerst A; Ollama-Download ok; History speichern; Win/16GB/3060; Qualität>Speed; Ollama Default | PO |
