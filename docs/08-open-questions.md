# 08 — Offene Fragen

> **Jetzt:** Code **`9.9.2`**. Sideload **`9.9.2`**. **Hirn:** Gemini (Key) Hauptweg → Groq Backup → 0,5B letzter Fallback. Sprint-1-Blocker geschlossen. Rest-Serie [`54-next.md`](./54-next.md): Gerät 168, Debug `5.12`, LocateAnything `4.77`, Qualität-Could `9.10`. At-rest-Encryption Parking.

Alles, was die Planung noch **lückig** macht.  
Historisch: kritische Blocker vor Sprint 1 schließen; Rest bewusst terminieren.

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
| Phase 2+3 NAS/APK | **superseded** (`0.13` On-Device; [`13-on-device.md`](./13-on-device.md)) |
| Sprint-1-Blocker | **keine offenen P0** |
| Hirn-Kaskade | **entschieden** (`6.50`): Gemini Hauptweg, Groq Backup, 0,5B zuletzt |
| LocateAnything-Gewichte | **PLAN** — Sprint 171–172 [`54-next.md`](./54-next.md) |
| Debug-Hintergrund | **PLAN** `5.12`/`5.17` — Sprint 169–170 |
| Qualität-Could | **PLAN** `9.10` — Sprint 173–177 |
| Globus-Briefing | **CODE** `6.90` — [`48-next.md`](./48-next.md) |

Verbliebene Punkte sind bewusst später oder optional (Encryption, VPN, …). Hausstand-Export ist **CODE**.

---

## A. Produkt & Persona

| ID | Frage | Prio | Status | Entscheidung |
|----|-------|------|--------|--------------|
| Q1–Q4, Q6–Q8, Q30–Q31 | Persona-Kern | P0/P1 | entschieden | `07-persona.md` |
| Q5 | Stil-Beispiele | P0 | entschieden | Optionen gewählt; **grobe Vorgabe**, Anti-Template Pflicht |

## B. Privatsphäre & Sicherheit

| ID | Frage | Prio | Status | Entscheidung |
|----|-------|------|--------|--------------|
| Q9 | Encryption at-rest MVP? | P1 | zurückgestellt | Backup-Datei [`38-next.md`](./38-next.md) User schützt selbst |
| Q10 | Ollama-Download? | P1 | entschieden | Historisch Sprint 1; ab `0.13` wllama |
| Q11 | History speichern? | P1 | entschieden | Ja |
| Q12 | Löschen? | P2 | zurückgestellt | Nicht Sprint 1 |

## C–F. (Kurz)

- Hardware/Ollama/Web/Spotify dunkel/ChatGPT-Layout/Motion light: **entschieden**
- Memory: MVP In-Chat+Reopen; später maximal: **entschieden**
- `0.1.0`=MVP; `0.10.x`=NAS Compose (Parking); `0.11.x`=Samsung-TV; `0.12.0`=NAS-Proxy+APK; `1.0.0`=späterer MAJOR: **entschieden** (PO 2026-08-14)
- Phase 2+3 Detail: **geplant** in [`12-nas-apk.md`](./12-nas-apk.md) / Sprints 34–39

---

## Nächster Schritt

1. Sprint **168** Gerät — [`sprints/sprint-168.md`](./sprints/sprint-168.md) · Serie [`54-next.md`](./54-next.md).
2. Debug Spike **169** → FGS oder Freeze **170**.
3. LocateAnything **171** (3060 am Tisch) → **172**.
4. Qualität-Could **173**–**177** (kein Must).
5. Mail / Cloud-Kalender / Alexa / Play Store / iOS — Parking.
6. Vor Neuinstall: Hausstand exportieren.

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
| 2026-08-26 | Q51 | 3.x danach gebündelt als **`3.18.0`**: Lage, Traceroute, Digest, Härten. Kein Sideload in diesem Schritt. [`33-next.md`](./33-next.md) | PO |
| 2026-08-27 | Q53 | Alltagskette vollständig geplant. WhatsApp still Won’t; `wa.me` nach Ja ok. Taxi Default Anruf. [`36-next.md`](./36-next.md) | PO |
| 2026-08-27 | Q54 | APK-Deinstall löscht On-Device-Daten. Export/Import lokal, kein Jarvis-Cloud. [`38-next.md`](./38-next.md) | PO |
| 2026-08-27 | Q55 | Autokorrektur Schreib+Sprache; Bahn vs Bar nicht per Levenshtein. [`38-next.md`](./38-next.md) | PO |
| 2026-08-27 | Q56 | Zwei Gesichter: Jarvis Default (Work+Smalltalk), Friday weiblich auf Zuruf; ein Register; kein Marvel. [`39-next.md`](./39-next.md) | PO |
| 2026-08-27 | Q57 | Tablet-Lage: Chat bleibt sichtbar; Uhr/Poll/Raster. Screenshots fehlten — Ist aus Code. [`39-next.md`](./39-next.md) | PO |
| 2026-08-28 | Q58 | Gemini ist der **Hauptweg** (Key). Groq Backup. 0,5B reiner letzter Fallback, nie als Claude. Overlay Gemini zuerst. [`16-gemini.md`](./16-gemini.md) · [`45-next.md`](./45-next.md) | PO |
| 2026-08-28 | Q59 | Globus-Ziel: Stadt sagen → GIBS-Satellit → Briefing. [`48-next.md`](./48-next.md) | PO |
| 2026-08-28 | Q60 | Welt-Tour auf der Kugel: `Was ist heute so auf der Welt passiert` — Länder leuchten, Seite, Zoom; Quellen Tagesschau/DW, kein Geheim-Feed. [`48-next.md`](./48-next.md) | PO |
