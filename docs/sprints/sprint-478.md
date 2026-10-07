# Sprint 478 — Nicht-Raten- und Release-Gate `18.34.0`

**Version:** `18.34.0` — **PLAN** Must  
**Plan:** [`../101-next.md`](../101-next.md)  
**Voraussetzung:** Sprints 475–477.

## Ziel

Ultron schließt fehlende Angaben nur aus einer eindeutigen, erlaubten Quelle
und fragt sonst nach; das Verhalten ist gegen Datenschutz- und
Regressionfälle geprüft.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S478-1 | Unsicherheits-Gold | Rückfrage-/Recall-Tests | Fehlende, doppelte und widersprüchliche Angaben testen |
| S478-2 | Seiteneffekt-Gold | Tool- und Datenschutztests | Vor vollständigen Pflichtangaben keine Aktion, Netzsuche oder Memory-Writes |
| S478-3 | Modellvergleich | Eval-Bericht | Falls Soup getestet wird, nur Rückfrage-/Feldvorschläge vergleichen; Aktion bleibt regelgebunden |
| S478-4 | Release-Gate `18.34.0` | Android-Geräteabnahme | Folgeantwort, Abbruch und App-Neustart auf dem Gerät prüfen |

## Abbruchkriterium

Bei einem geratenen Pflichtfeld, Cross-Conversation-Übergriff oder
ungefragtem Seiteneffekt bleibt das Gate offen.
