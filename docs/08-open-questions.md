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

## Übersicht

| Bereich | Status |
|---------|--------|
| Persona inkl. Stil-Beispiele (Q5) | **entschieden** |
| Architektur / Stack / UI / Versionen | **entschieden** |
| Phase 2+ Detail | **zurückgestellt** (später planen) |
| Sprint-1-Blocker | **keine offenen P0** |

Verbliebene Punkte sind bewusst später oder optional (Encryption, Löschen, VPN, …).

---

## A. Produkt & Persona

| ID | Frage | Prio | Status | Entscheidung |
|----|-------|------|--------|--------------|
| Q1–Q4, Q6–Q8, Q30–Q31 | Persona-Kern | P0/P1 | entschieden | `07-persona.md` |
| Q5 | Stil-Beispiele | P0 | entschieden | Optionen gewählt; **grobe Vorgabe**, Anti-Template Pflicht |

## B. Privatsphäre & Sicherheit

| ID | Frage | Prio | Status | Entscheidung |
|----|-------|------|--------|--------------|
| Q9 | Encryption at-rest MVP? | P1 | zurückgestellt | |
| Q10 | Ollama-Download? | P1 | entschieden | Ja |
| Q11 | History speichern? | P1 | entschieden | Ja |
| Q12 | Löschen? | P2 | zurückgestellt | Nicht Sprint 1 |

## C–F. (Kurz)

- Hardware/Ollama/Web/Spotify dunkel/ChatGPT-Layout/Motion light: **entschieden**
- Memory: MVP In-Chat+Reopen; später maximal: **entschieden**
- `0.1.0`=MVP, `1.0.0`=NAS: **entschieden**
- Phase 2+ (Q14, Q16, Q25–Q29): **zurückgestellt**

---

## Nächster Schritt

1. PO-Review **Sprint 2 / `0.1.1`** (Smoke + Smalltalk auf 7b ideal)  
2. Tag `v0.1.1` bei OK  
3. Danach Sprint 3 / `0.2.0`

---

## Entscheidungsprotokoll

| Datum | ID | Entscheidung | Von |
|-------|-----|--------------|-----|
| 2026-08-11 | Workshop 1–5 | Persona, Stack, UI, Versionen, Memory-Stufen | PO |
| 2026-08-11 | Q5 | Stil-Anker gewählt; Variation/Anti-Template Pflicht | PO |
