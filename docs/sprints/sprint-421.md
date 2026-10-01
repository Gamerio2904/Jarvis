# Sprint 421 — Wahl und Schließen

**Version:** `18.24.0` — **PLAN** Must
**Plan:** [`96-next.md`](../96-next.md) §4 §5
**Voraussetzung:** 420. Rahmen und Muster liegen.

## Ziel

Tipp und Satz merken eine Variante. Der Ablauf gewinnt gegen den Entwurf.
Schließen gibt den Finger an die Stücke zurück.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S421-1 | Wahl | `EntwurfStage.tsx` `entwurf-parse.ts` | Tipp auf den Rahmen oder `Die erste` bis `Die dritte` setzt `pick` und Status `gewählt`. Akzentlinie am gewählten Rahmen, die anderen Deckkraft 0,45. Chat `Entwurf 2. Einkaufsliste.` Zählung von links, auf schmal von oben. Zu hohe Zahl: `Die Zeile gibt es nicht.` |
| S421-2 | Ablauf | `entwurf-parse.ts` | Ablauf `schreibt` bis `läuft`: `Entwirf` zeichnet nichts, Antwort `Erst den Ablauf.` |
| S421-3 | Zu | `EntwurfStage.tsx` | `Entwurf zu` setzt Status `zu` und schließt. `Zeig Sprints`, `Zeig PSP`, `Simuliere Kalender` schließen die Rahmen. Ohne Wahl bleibt die Zeile `offen`. Die Stücke nehmen den Finger an. `Räum den Tisch` trifft die Rahmen nicht |

## Won't

Eine zweite Rückfrage, ein Agentenlauf nach der Wahl.

## Abbruchkriterium

`Die zweite` ohne Rahmen stiehlt einen anderen Satz, oder die Wahl startet `runAgent`.
