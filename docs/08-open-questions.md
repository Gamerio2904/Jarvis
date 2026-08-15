# 08 — Offene Fragen

Kritische Blocker für den aktuellen Stand (`0.13.1` on-device) gibt es **keine**.

**Status:** `offen` · `entschieden` · `zurückgestellt` · `entfallen`

## Übersicht

| Bereich | Status |
|---------|--------|
| Persona inkl. Stil-Beispiele | **entschieden** |
| Architektur | **entschieden** — On-Device Handy, offline nach Download |
| NAS / Docker / Proxy | **entfallen** |
| Samsung-TV | **zurückgestellt** (Parking) |
| Internet-Research | **zurückgestellt** (widerspricht Offline) |
| TTS / `1.0.0` | **zurückgestellt** — PO-Kommando |

## Kurz (historisch entschieden)

- Hardware/Ollama/Web für den alten PC-MVP: **entschieden**, Stack **entfernt**
- Memory: In-Chat + Langzeitgedächtnis lokal: **entschieden** (jetzt IndexedDB)
- `0.1.0` = MVP; `0.13.1` = On-Device aktuell; `0.10`–`0.12` = superseded; `1.0.0` = späterer MAJOR

## Noch offen / bewusst später

| ID | Frage | Status |
|----|-------|--------|
| Q9 | Encryption at-rest? | zurückgestellt |
| — | TTS-Stimme / Natürlichkeit | zurückgestellt (PO) |
| — | Inhalt von `1.0.0` | zurückgestellt (PO) |

## Nächster Schritt

1. Alltag: Sideload `0.13.1`, einmal Modell laden, offline chatten.
2. TTS / `1.0.0` nur auf **PO-Kommando**.
3. Kein NAS-, TV- oder Research-Netz-Sprint ohne neue Entscheidung.

## Entscheidungsprotokoll

| Datum | ID | Entscheidung | Von |
|-------|-----|--------------|-----|
| 2026-08-11 | Workshop 1–5 | Persona, Stack, UI, Versionen, Memory-Stufen | PO |
| 2026-08-11 | Q5 | Stil-Anker gewählt; Variation/Anti-Template Pflicht | PO |
| 2026-08-14 | `0.13` | Jarvis komplett on-device auf dem Handy; NAS/PC-Backend entfernt | PO |
| 2026-08-15 | Docs | Planung auf Offline/`0.13.1` gezogen; NAS/TV/Research-Netz = Parking | PO |
