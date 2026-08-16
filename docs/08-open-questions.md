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
| Phase 2+3 NAS/APK | **geplant** (`0.10.x`) |
| Sprint-1-Blocker | **keine offenen P0** |

Verbliebene Punkte sind bewusst später oder optional (Encryption, Löschen, VPN, …).  
**Q40** (Ventilator-Brücke) blockiert den Bau von `1.29.0`, nicht den Alltag mit `1.28.2`.

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
- `0.1.0`=MVP; `0.10.x`=NAS Compose (Parking); `0.11.x`=Samsung-TV; `0.12.0`=NAS-Proxy+APK; `1.0.0`=späterer MAJOR: **entschieden** (PO 2026-08-14)
- Phase 2+3 Detail: **geplant** in [`12-nas-apk.md`](./12-nas-apk.md) / Sprints 34–39

## G. Hausgeräte

| ID | Frage | Prio | Status | Entscheidung |
|----|-------|------|--------|--------------|
| Q40 | Womit spricht der Deckenventilator? Funk-Fernbedienung, IR, Broadlink, Bond, Tuya, nur Wandschalter? | P2 | offen | Default für `1.29.0`: **Broadlink RM4 Pro** im WLAN, Codes lokal. Ohne Brücke keine Stufen. [`23-next.md`](./23-next.md) |

---

## Nächster Schritt

1. Sideload `1.28.2`. Fire TV: IP unter Info → Netzwerk, Test unter dem Knopf.
2. Für den Ventilator: Q40 beantworten oder RM4 Pro ins WLAN legen — dann `1.29.0` ([`23-next.md`](./23-next.md)).
3. Wake-Word und „zuhause“ nie bei Gerät komplett aus.

---

## Entscheidungsprotokoll

| Datum | ID | Entscheidung | Von |
|-------|-----|--------------|-----|
| 2026-08-11 | Workshop 1–5 | Persona, Stack, UI, Versionen, Memory-Stufen | PO |
| 2026-08-11 | Q5 | Stil-Anker gewählt; Variation/Anti-Template Pflicht | PO |
| 2026-08-14 | `0.13` | Jarvis komplett on-device auf dem Handy; NAS/PC-Backend entfernt | PO |
| 2026-08-15 | `0.14` | Nichts Neues: bestehendes härten; TV on-device live (`0.14.0`/`0.14.1`) | PO |
| 2026-08-16 | Q40 | Deckenventilator geplant (`1.29.0`); Default Broadlink RM4 Pro, Transport offen | PO |
