# Sprint 120 — Debug-Lauf (Kategorien, Sequenz, Export) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | vor Körper-Execute, damit Live-Spuren schickbar sind; ohne Sideload |
| Ziel-Version | `5.11.0` (Research `5.12`–`5.13`, Bau `5.14`+) |
| Quelle | PO: Debug-Fenster, Mehrfachwahl, neues Gespräch, Download mit Ausführung |
| Plan | [`44-next.md`](../44-next.md) |
| Baut auf | Debug **CODE** `3.19.0` [`34-next.md`](../34-next.md) |

## Ziel

Einstellungen → Debug: Klickboxen aller Themen, eingebettete Prompts, Start in einem **neuen** Chat, warten, nächster Prompt. Download JSON+TXT mit Route/Tool/Verdict. Hintergrund nur wenn Spike es hergibt, sonst App offen.

## Must

| ID | Inhalt |
|----|--------|
| D1 | Mehrere Kategorien, nicht nur ein Select |
| D2 | Neues Gespräch, Alltagschat bleibt |
| D3 | Prompts inkl. neuer Welt/Face-Gruppen fest im Code |
| D4 | Export mit Soll/Ist und `tool_status`, kein Auto-Ja |
| D5 | Research Hintergrund vor Service; Writes-Warnung |

## Won’t (dieser Sprint)

Sideload. Cloud-Upload. Auto-Ja bei Anruf/SMS/Taxi. Hausstand-Import im Lauf. `5.0` Weltkugel überschreiben.
