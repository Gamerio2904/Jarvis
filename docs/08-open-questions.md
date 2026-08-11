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
| Q1 | Grundton von Jarvis? (locker / butler / frech-direkt / …) | P0 | offen | |
| Q2 | Wie spricht er dich an? (Du, Name, Spitzname) | P0 | offen | |
| Q3 | Formalität 1–5 und Humor-Stil? | P0 | offen | |
| Q4 | Tabus & Grenzen im Smalltalk? | P0 | offen | |
| Q5 | Soll/Nicht-Soll: mindestens 10 Beispiel-Antworten liefern? | P0 | offen | |
| Q6 | Darf Jarvis „Stimmung“ andeuten (guter/schlechter Tag) oder immer neutral-stabil? | P1 | offen | |
| Q7 | Sprache: nur Deutsch, oder DE/EN gemischt? | P1 | offen | |
| Q8 | Jarvis-Erwartung: eher Butler-Vibe oder Kumpel-Assistent? | P0 | offen | |

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

1. **Persona-Block:** Q8 → Q1 → Q2 → Q3 → Q4 → Q5 → Q6 → Q7  
2. **Hardware-Block:** Q13 → Q15 → (Q14 nur grob)  
3. **Stack-Block:** Q17 → Q18 → Q20 → Q11 → Q10 → Q19  
4. **Prozess-Block:** Q22  
5. Rest nach Bedarf

## Minimal-Set zum Start von Sprint 1

Sprint 1 darf starten, wenn **mindestens** entschieden:

- Q1, Q2, Q8 (Ton/Anrede/Vibe)
- Q4 (Tabus grob)
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
