# Sprint 428 — Wahl und Schließen

**Version:** `18.25.0` — **PLAN** Must
**Plan:** [`97-next.md`](../97-next.md) §4 §5
**Voraussetzung:** 427. Rahmen und Muster liegen.

## Ziel

Tipp und Satz merken eine Variante. Ablauf und Scan gewinnen gegen den Entwurf.
Schließen gibt den Finger an die Stücke zurück.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S428-1 | Wahl | `EntwurfStage.tsx` `entwurf-parse.ts` | Tipp auf den Rahmen oder `Die erste` bis `Die dritte` setzt `pick` und Status `gewählt`. Akzentlinie am gewählten Rahmen, die anderen Deckkraft 0,45. Chat `Entwurf 2. Einkaufsliste.` Zählung von links, auf schmal von oben. Zu hohe Zahl: `Die Zeile gibt es nicht.` |
| S428-2 | Vorrang | `entwurf-parse.ts` | Ablauf `schreibt` bis `läuft`: `Entwirf` zeichnet nichts, Antwort `Erst den Ablauf.` Scan `live` oder `model`: Antwort `Erst den Scan.` |
| S428-3 | Zu | `EntwurfStage.tsx` | `Entwurf zu` setzt Status `zu` und schließt. `Zeig Sprints`, `Zeig PSP`, `Simuliere Kalender`, `Scanne den Raum` und `Scanne den Apfel` schließen die Rahmen. Ohne Wahl bleibt die Zeile `offen`. Die Stücke nehmen den Finger an. `Räum den Tisch` trifft die Rahmen nicht |

## Won't

Eine zweite Rückfrage, ein Agentenlauf nach der Wahl.

## Abbruchkriterium

`Die zweite` ohne Rahmen stiehlt einen anderen Satz, oder die Wahl startet `runAgent`.
