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

---

## Nächster Schritt

1. Sideload `3.0.0` (Code steht; letzter APK `2.2.2`). [`apk.md`](./apk.md).
2. Reihe 3.x **PLAN** [`33-next.md`](./33-next.md) — erste Code-Lieferung `3.0.1` auf PO-Kommando.
3. Wake-Word und „zuhause“ nie bei Gerät komplett aus. Losgehen ohne Ort: nachfragen, nicht raten.

---

## Entscheidungsprotokoll

| Datum | ID | Entscheidung | Von |
|-------|-----|--------------|-----|
| 2026-08-11 | Workshop 1–5 | Persona, Stack, UI, Versionen, Memory-Stufen | PO |
| 2026-08-11 | Q5 | Stil-Anker gewählt; Variation/Anti-Template Pflicht | PO |
| 2026-08-14 | `0.13` | Jarvis komplett on-device auf dem Handy; NAS/PC-Backend entfernt | PO |
| 2026-08-15 | `0.14` | Nichts Neues: bestehendes härten; TV on-device live (`0.14.0`/`0.14.1`) | PO |
| 2026-08-17 | Q40 | Deckenventilator Amazon `B0CGQSNR76`: Default Broadlink RM4 Pro, Codes lokal lernen | PO |
| 2026-08-17 | Q41 | Nach `1.32.1`: **Qualität statt Breite** (`1.33`–`1.40`). Nichts Neues — bestehendes verbessern, erweitern, flüssiger. Intelligenter, besseres Verständnis, besseres CarPlay, besseres Befehlserkennen. | PO |
| 2026-08-18 | Q42 | Filme: IMDb/RT nur über OMDb (RT ohne öffentliche API). Gratis-Streams JustWatch DE; Joyn/ARD nennen, nicht starten. Rabatt-Suche Default aus, keine erfundenen Codes. | PO |
| 2026-08-18 | Q43 | Öffnungszeiten von Läden nur aus OSM `opening_hours`. Fehlt der Tag: ehrlich. Keine erfundenen Stunden. | PO |
| 2026-08-18 | Q44 | Anruf und SMS direkt, aber immer nachfragen. Kein Abheben/Zustellung behaupten. | PO |
| 2026-08-19 | Q46 | WLAN-Steckdosen lokal: Shelly/Tasmota per IP, Tuya/Smart Life nur LAN mit Local Key, keine Tuya-Cloud, kein Tapo | PO |
| 2026-08-20 | Q47 | Welt-Reihe: DWD, Ferien, Kurs, Research, Stimme, Food, Library, Sport, Garten, Himmel, Tiere, Flüge, Recht, Haushalt, Sensoren, Schach. Frei, ehrlich. Zuerst `2.3`–`2.19`, dann `2.7`–`2.23`, in `3.0.0` als `3.1`–`3.17` CODE. [`31-next.md`](./31-next.md) | PO |
| 2026-08-26 | Q48 | Intelligenz zuerst: Katalog + Score-Policy, kein Embedding, 0,5B wählt keine Tools. War Plan `2.3`–`2.6`, umgesetzt als **`3.0.0`**. [`32-intelligence.md`](./32-intelligence.md) | PO |
| 2026-08-26 | Q49 | `3.0.0` = intelligenter als Fokus: Register + Policy + Härten. Welt-Sprints im selben Code. Kein Sideload-APK in diesem Schritt. | PO |
| 2026-08-26 | Q50 | 3.x danach: Reels als Anstoß. Traceroute ehrlich (PC). Tablet-Lage modular aus Reel-3-Screenshots. Telefon nur Haus (Nachfrage, kein 24/7-Fremden-Empfang). Sales-CRM nicht. [`33-next.md`](./33-next.md) | PO |
