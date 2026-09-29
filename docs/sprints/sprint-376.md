# Sprint 376 — Last-Step als Absicht + Korrektur spielt nach

**Version:** `18.16.0` — **CODE + APK** Should
**Plan:** [`88-next.md`](../88-next.md)
**Voraussetzung:** 368 Miss-Log. `last_step_*` in Settings.

## Ziel

1. Follow-up kennt **worüber** geredet wurde (Wetter/Timer/Person), nicht
   nur 120 Zeichen Rohtext.
2. „Nein, das war der Timer“ nach einem Miss führt denselben **Nutzer-Satz**
   noch einmal durch `timer` — nicht nur die Timer-Liste.

## Ist

`weatherLast` ist extra verdrahtet. Working Memory ist Textstummel.
`parse-miss.ts` speichert Misses; Korrektur-Gold listet Timer.
`expectedAgentFromCorrection` setzt Telemetrie.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S376-1 | Absicht | Settings oder Working | Nach jedem Director-Hit: `{ domain: lastTool, title, utterance }` cap 1. `rewriteFollowUp` liest domain, nicht nur Regex |
| S376-2 | Replay | `director.ts` / `parse-miss.ts` | Wenn Korrektur-Satz einen Agenten nennt **und** `lastNone` existiert: `runPicked(id, lastNone)` statt nur list. Ja-Gate bleibt für Write/Device |
| S376-3 | Gold | `Nein, das war der Timer` | Darf `timer` bleiben. Execute: nach Miss „Hol die Nachrichten“ fälschlich, Korrektur Timer → Timer-Handlung oder ehrliche Nachfrage „welchen Timer?“ |
| S376-4 | TEST | [`TEST-18.16.md`](../TEST-18.16.md) | Barge-in unberührt (18.15 Abort). Kein zweiter Agent |

## Won’t

Gewichte. Korrektur ändert ONNX. Replay startet SMS ohne Ja.

## Abbruchkriterium

Korrektur führt den **falschen** Agenten aus. Oder lastNone überlebt den
nächsten unbeteiligten Smalltalk und zündet spät.

## PO-Prüfung

1. Undeutlich, Jarvis nimmt Wecker, Nutzer: „Nein, das war der Timer“ →
   Timer, nicht nur Liste wenn ein Satz zum Stellen da war.
2. „Fernseher an“ nach Korrektur wartet weiter auf Ja.
