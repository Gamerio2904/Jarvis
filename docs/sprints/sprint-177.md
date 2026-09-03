# Sprint 177 — Rest-Gold (`9.10.9`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** |
| Ziel-Version | `9.10.9` |
| Quelle | [`54-next.md`](../54-next.md) · 168–176 |
| Vorher | 168 DoD (PO). 170 und 172 Freeze oder CODE. Could 174–176 je GO/NO-GO |

## Ziel

Serie schließen. Default-App verhält sich wie **`9.9.2`**, plus was wirklich GO hatte (opt-in). Rest Freeze. Parking bleibt Parking. Kein neues Could ohne neuen Sprint.

## Must

| ID | Inhalt |
|----|--------|
| G1 | Tabelle: 168 Gerät, 170 Debug, 172 Sehen, 174–176 Could — CODE / Freeze / PO |
| G2 | Debug-Export: TTFT, First-Audio, Pfad (ohne PII). P95, nicht nur Mittel |
| G3 | L1-Smalltalk-Cache nur wenn 54-next das noch Could nennt **und** Uhr/Wetter/Retrieve ausgeschlossen |
| G4 | `test:014`, `test:prompts`, `tsc -b` grün |
| G5 | Sideload nur mit Hausstand, nur wenn sich Nutzer-Verhalten außerhalb Default geändert hat |

## Won’t

Neue Modelle. Play Store. iOS. Marvel. Encryption-at-rest. Mail/Alexa.

## DoD

- [ ] `54-next.md` Bau-Tabelle auf CODE oder Freeze
- [ ] `42-planned.md` Pull-Reihenfolge: Parking, keine offenen Must außer 3060-Warten
