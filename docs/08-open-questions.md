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
| Q30 | Anrede-Varianten / Frequenz? | P0 | entschieden | Nur Master + Sir; selten + situativ |
| Q31 | Duzen / Siezen / ohne Pronomen? | P1 | entschieden | Meist ohne Du-Pronomen; wenn nötig **Sie** |

## B. Privatsphäre & Sicherheit

| ID | Frage | Prio | Status | Entscheidung |
|----|-------|------|--------|--------------|
| Q9 | Verschlüsselung at-rest schon im MVP? | P1 | zurückgestellt | Vorerst nur-du-Zugang + kein Cloud-LLM |
| Q10 | Modell-Download (Ollama) erlaubt? | P1 | entschieden | Ja |
| Q11 | Chat-History zwischen Sessions? | P1 | entschieden | Ja, speichern |
| Q12 | Löschkonzept für gespeicherte Chats? | P2 | zurückgestellt | **Nicht Sprint 1** — später nachziehen |

## C. Hardware & Betrieb

| ID | Frage | Prio | Status | Entscheidung |
|----|-------|------|--------|--------------|
| Q13 | Entwicklungsrechner Specs? | P0 | entschieden | Windows, 16 GB RAM, NVIDIA RTX 3060 |
| Q14 | NAS-/24/7-Zielgerät? | P2 | offen | |
| Q15 | Antwortlatenz / Priorität? | P1 | entschieden | Qualität > Speed; trotzdem so schnell wie möglich |
| Q16 | Strom-/Lautstärke-Constraints? | P2 | offen | |
| Q32 | RTX 3060 Desktop vs Laptop / VRAM? | P0 | vorläufig | **Vermutlich Desktop (~12 GB)** — PO unsicher, Bestätigung offen |

## D. Technik-Stack (Sprint 1)

| ID | Frage | Prio | Status | Entscheidung |
|----|-------|------|--------|--------------|
| Q17 | Modell-Host? | P0 | entschieden | Ollama (Default) |
| Q18 | Modellklasse MVP? | P0 | entschieden | **Ausgewogen** |
| Q19 | Backend-Präferenz? | P1 | entschieden | Dev entscheidet pragmatisch |
| Q20 | UI-Kanal? | P1 | entschieden | **Nur Web-App**; Gesamtprojekt: premium/smooth UI-Standard |
| Q21 | „Neues Gespräch“ / Chat-Organisation? | P1 | offen | PO will Vor-/Nachteile — Entscheidung Runde 4 |
| Q33 | UI-Richtung / Look-Referenzen für Premium-Web-UI? | P1 | offen | Aus Runde 3 (hohe GUI-Ansprüche) |

## E. Agiler Prozess

| ID | Frage | Prio | Status | Entscheidung |
|----|-------|------|--------|--------------|
| Q22 | Sprint-Länge? | P1 | entschieden | Zielbasiert; **Zeit spielt keine Rolle** |
| Q23 | Review-Ritual? | P2 | entschieden | Schriftliches Feedback reicht |
| Q24 | Scope-Freeze? | P2 | entschieden | Mittel: kleine Extras ok; Größeres → neuer Sprint/Backlog |

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

1. ~~Persona / Hardware grob / Ollama / Prozess~~ weitgehend **done**
2. **Jetzt:** Q21 (nach Erklärung) → Q32 bestätigen → Q33 UI-Richtung → Q5 Beispiele
3. Danach Phase-2+-Fragen (Q14, Q25–Q29) oder Sprint 1 starten, wenn Minimal-Set steht

## Minimal-Set zum Start von Sprint 1

- ~~Q1–Q4, Q8, Q11, Q17, Q18, Q20, Q30~~ **done**
- **Q21** (Chat-Organisation) — empfohlen vor Persistenz-UI
- **Q32** bestätigen (VRAM) — Modellwahl absichern
- Q33 kann parallel laufen (UI-Feinschliff über Sprints)

---

## Entscheidungsprotokoll

| Datum | ID | Entscheidung | Von |
|-------|-----|--------------|-----|
| 2026-08-11 | — | Vision, lokal Variante 3, Chat-first, TTS später, Scrum-lite Docs | PO + Agent |
| 2026-08-11 | Q1–Q4,Q6–Q8,Q30,Q31 | Persona-Kern + Anrede Master/Sir, Sie, derb, nur DE | PO |
| 2026-08-11 | Q9–Q11,Q13,Q15,Q17 | Security vorerst einfach; History an; Win/16GB/3060; Qualität>Speed; Ollama | PO |
| 2026-08-11 | Q12,Q18–Q20,Q22–Q24 | Löschen später; Modell ausgewogen; nur Web + Premium-UI-Anspruch; Backend egal; zielbasierte Sprints; Review schriftlich; Freeze mittel | PO |
| 2026-08-11 | Q32 | Vorläufig Desktop ~12 GB, Bestätigung offen | PO |
