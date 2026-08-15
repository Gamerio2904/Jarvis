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
| Q32 | Jarvis über Alexa einkaufen lassen? | P3 | entschieden | **Nein.** Amazon-Cloud, keine lokale Kauf-API. Parking. Siehe Entscheidungsprotokoll. |
| Q33 | Jarvis auf Echo Show 5 (3. Gen.) / Amazon-Bildschirm? | P3 | entschieden | **Nein.** Keine APK-Laufzeit, kein Jarvis-Display. Parking. Siehe Entscheidungsprotokoll. |
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

1. PO-Review Sprint 8–18 (`0.4.0`–`0.7.0`) → Tags bei OK
2. Danach: Sprint 31–33 (`0.9.3`–`0.9.5`), dann `0.10.x` NAS+APK, dann `0.11.x` TV
3. Parallel ok: Tags/Reviews `0.1.0`–`0.3.1`

---

## Entscheidungsprotokoll

| Datum | ID | Entscheidung | Von |
|-------|-----|--------------|-----|
| 2026-08-11 | Workshop 1–5 | Persona, Stack, UI, Versionen, Memory-Stufen | PO |
| 2026-08-11 | Q5 | Stil-Anker gewählt; Variation/Anti-Template Pflicht | PO |
| 2026-08-14 | `0.13` | Jarvis komplett on-device auf dem Handy; NAS/PC-Backend entfernt | PO |
| 2026-08-15 | Q32 | **Kein Alexa-Kauf.** Jarvis löst keine Bestellungen über Echo/Alexa/Fire TV aus. Amazon gibt Dritten keine lokale „kauf X“-API; Shopping Actions nur in zertifizierten Cloud-Skills mit Amazon-Account. Das bricht Privat-by-design und riskiert Fehlkäufe. Alexa/Fire-TV-Tools bleiben Parking (`S7.8`). Lokaler Ersatz: Einkaufsliste als Todo. Chat lehnt Alexa-Kauf ehrlich ab. | PO-Frage + Agent |
| 2026-08-15 | Q33 | **Kein Echo Show.** Jarvis läuft nicht auf Echo Show 5 (3. Gen., Rechteck, Alexa). Das Gerät ist ein Amazon-Smart-Display (Alexa/Fire-OS bzw. Vega OS), keine allgemeine Android-APK-Laufzeit. Sideload der Capacitor-App ist offiziell nicht vorgesehen; 3. Gen. (MT8169B, 5,5″ 960×480) ist geschlossen. Das ~470-MB-On-Device-Modell passt dort weder vom OS noch von RAM/Speicher. Dinge auf dem Amazon-Bildschirm anzeigen ginge nur über einen Cloud-Alexa-Skill (APL) — nicht lokal, nicht Jarvis-UI. **Werksreset, Aufschrauben, Knacken oder Code-Upload sind kein unterstützter Weg** und werden nicht dokumentiert: Reset setzt nur Alexa zurück. Bleibt Parking mit Q32/`S7.8`. Chat lehnt Echo-Show-/Bildschirm-Fragen ehrlich ab. | PO-Frage + Agent |
