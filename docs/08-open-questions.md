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
| Q2 | Wie spricht er dich an? | P0 | entschieden | Wechselnd „Master“ u. Ä. (genaue Varianten: Q30) |
| Q3 | Formalität und Humor? | P0 | entschieden | Formalität 3–4; Humor deftig/frech + trocken |
| Q4 | Tabus & Grenzen im Smalltalk? | P0 | entschieden | Keine harten inhaltlichen Tabus; Anti-KI-Stilregeln bleiben |
| Q5 | Soll/Nicht-Soll: ≥10 Beispiel-Antworten? | P0 | offen | Noch ausstehend (Abnahme-Qualität) |
| Q6 | Tagesstimmung andeuten? | P1 | entschieden | Ja, leicht / dosiert |
| Q7 | Sprache? | P1 | entschieden | Nur Deutsch |
| Q8 | Jarvis-Erwartung / Vibe? | P0 | entschieden | Kumpel-Assistent + frech-direkt (mit „Master“-Anrede) |
| Q30 | Welche Anrede-Varianten außer „Master“? Wann wechseln? | P0 | offen | Aus Runde 1 entstanden |
| Q31 | Duzen bei „Master“ — immer „du“, oder manchmal „Ihr“/kein Du? | P1 | offen | Aus Runde 1 entstanden |

## B. Privatsphäre & Sicherheit

| ID | Frage | Prio | Status | Entscheidung |
|----|-------|------|--------|--------------|
| Q9 | Reicht „kein Cloud-LLM + nur du hast Zugang“, oder brauchst du Verschlüsselung at-rest schon im MVP? | P1 | offen | |
| Q10 | Dürfen Modell-Gewichte von Hugging Face/Ollama-Library geladen werden (einmaliger Download), oder gibt es eine strengere Offline-Policy? | P1 | offen | |
| Q11 | Chat-History: speichern zwischen Sessions schon im MVP oder nur live im RAM/Session? | P1 | offen | |
| Q12 | Löschkonzept: alles manuell löschbar — gewünscht ab wann? | P2 | offen | |

## C. Hardware & Betrieb

| ID | Frage | Prio | Status | Entscheidung |
|----|-------|------|--------|--------------|
| Q13 | Entwicklungsrechner: OS, RAM, GPU (welche / wie viel VRAM) / nur CPU? | P0 | offen | |
| Q14 | NAS-/24/7-Zielgerät: schon vorhanden? Specs? | P2 | offen | |
| Q15 | Akzeptable Antwortlatenz im MVP? (z.B. <3s / <8s / „egal solange lokal“) | P1 | offen | |
| Q16 | Strom-/Lautstärke-Constraints am Heimgerät? | P2 | offen | |

## D. Technik-Stack (Sprint 1)

| ID | Frage | Prio | Status | Entscheidung |
|----|-------|------|--------|--------------|
| Q17 | Modell-Host-Präferenz? (Vorschlag zum Entscheiden: Ollama als Default-Kandidat) | P0 | offen | |
| Q18 | Grobe Modellklasse? (kleiner/schnell vs. größer/besser — abhängig von Q13) | P0 | offen | |
| Q19 | Backend-Sprache/-Framework-Präferenz? (sonst entscheidet Dev pragmatisch) | P1 | offen | |
| Q20 | UI: reine Web-App reicht bestätigt? (kein Telegram o.Ä. im MVP) | P1 | offen | |
| Q21 | Conversation-ID / „neues Gespräch“-Button im MVP gewünscht? | P1 | offen | |

## E. Agiler Prozess

| ID | Frage | Prio | Status | Entscheidung |
|----|-------|------|--------|--------------|
| Q22 | Sprint-Länge 1 Woche ok, oder lieber zielbasierte Mini-Sprints? | P1 | offen | |
| Q23 | Review-Ritual: schriftliches Feedback reicht, oder gemeinsame Live-Session? | P2 | offen | |
| Q24 | Wie streng Scope-Freeze pro Sprint? (Default: streng, außer Blocker) | P2 | offen | |

## F. Spätere Phasen (nicht Sprint-1-Blocker)

| ID | Frage | Prio | Status | Entscheidung |
|----|-------|------|--------|--------------|
| Q25 | Fernzugriff Phase 2: VPN-Tool-Präferenz (z.B. Tailscale) oder egal? | P2 | offen | |
| Q26 | Auth: Passwort, Magic Link lokal, mTLS, … — Präferenz? | P2 | offen | |
| Q27 | TTS später: lieber lokale Stimme (privat) oder Cloud-TTS akzeptabel? | P2 | offen | |
| Q28 | Spracheingabe nach TTS — ja/nein/vielleicht? | P3 | offen | |
| Q29 | Native App jemals ein Muss, oder Web+VPN dauerhaft ok? | P3 | offen | |

---

## Empfohlene Klärungsreihenfolge (Workshop)

1. ~~**Persona-Kern:** Q8 → Q1 → Q2 → Q3 → Q4 → Q6 → Q7~~ **done**
2. **Persona-Feinschliff:** Q30 → Q31 → (Q5 Beispiele später/parallel)
3. **Hardware-Block:** Q13 → Q15 → (Q14 nur grob)
4. **Privatsphäre-Block:** Q9 → Q10 → Q11 → (Q12)
5. **Stack-Block:** Q17 → Q18 → Q20 → Q19 → Q21
6. **Prozess-Block:** Q22 → (Q23/Q24)
7. Rest Phase 2+ nach Bedarf

## Minimal-Set zum Start von Sprint 1

Sprint 1 darf starten, wenn **mindestens** entschieden:

- ~~Q1, Q2, Q8, Q4~~ **done**
- Q30 (Anrede-Varianten grob)
- Q13 (Hardware)
- Q17, Q18 (Host + Modellklasse)
- Q11 (History-Verhalten MVP)
- Q20 (UI-Kanal MVP)

Beispiele (Q5) können parallel in Sprint 1 nachgezogen werden, sind aber für Abnahme stark empfohlen ASAP.

---

## Entscheidungsprotokoll

Wenn etwas entschieden ist: Zeile auf `entschieden` setzen und Kurzentscheid in die Spalte + ggf. ins passende Doc (`07`, `02`, `06`) übernehmen.

| Datum | ID | Entscheidung | Von |
|-------|-----|--------------|-----|
| 2026-08-11 | — | Vision, lokal Variante 3, Chat-first, TTS später, Scrum-lite Docs angelegt | PO + Agent |
| 2026-08-11 | Q1,Q3,Q6,Q7,Q8 | Kumpel+frech; warm+trocken; Formalität 3–4; Humor deftig+trocken; Stimmung leicht; nur DE | PO |
| 2026-08-11 | Q2,Q4 | Anrede „Master“ u. Ä.; keine harten Tabus | PO |
