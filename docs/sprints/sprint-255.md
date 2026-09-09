# Sprint 255 — Semantisches Satzende + Barge-in

**Version:** `16.8.0` (versionCode `160800`) — **PLAN**
**Plan:** [`68-next.md`](../68-next.md) §10 · Upgrade **B** Stufe 2 aus [`67-upgrades.md`](../67-upgrades.md)
**Voraussetzung:** Sprint **253** (Abbruch) und **254** (VAD)

## Ziel

Jarvis erkennt, ob der Satz **inhaltlich** fertig ist — und lässt sich mitten in
der Antwort unterbrechen.

## Warum

Stufe 1 (Sprint 254) erkennt, *ob* gesprochen wird. Sie erkennt nicht, ob der
Satz zu Ende ist. „Erinnere mich in fünf …" ist nach 1,5 s Stille nicht fertig,
egal wie sicher das VAD ist, dass gerade niemand spricht. Umgekehrt ist „Licht
aus" nach 300 ms fertig und jedes weitere Warten ist verlorene Zeit.

Barge-in ist die zweite Hälfte desselben Gefühls: ein Assistent, den man nicht
unterbrechen kann, zwingt zum Zuhören. Technisch braucht das den Durchstich aus
Sprint **253** — sonst bricht man nur die Stimme ab, während der Zug im
Hintergrund weiterläuft und am Ende Zustand schreibt.

## Heute vs. Ziel

| Heute | Ziel |
|-------|------|
| Stille = Satzende | Stille **plus** inhaltliche Prüfung |
| „Erinnere mich in fünf …" wird abgeschickt | wartet weiter, weil unvollständig |
| „Licht aus" wartet 1100 ms | geht nach ~300 ms |
| Reden schneidet die TTS ab, der Zug läuft weiter | Reden bricht Stimme **und** Zug ab |

## Lieferumfang

| ID | Task | Datei | Status |
|----|------|-------|--------|
| S255-1 | Label-Set aus dem Eval-Korpus: vollständig / unvollständig | `engine/eval/corpus.ts` | PLAN |
| S255-2 | Klassifikator Satzende, klein und lokal | `engine/turn-end.ts` | PLAN |
| S255-3 | Verrechnung: VAD-Stille × Satzende-Sicherheit → Halten | `engine/turn-detect.ts` | PLAN |
| S255-4 | Barge-in: Sprache während der Ausgabe bricht TTS ab | `engine/edge-tts.ts`, `ui/VoiceMode.tsx` | PLAN |
| S255-5 | Barge-in bricht den laufenden Zug ab (nutzt 253) | `director.ts` | PLAN |
| S255-6 | Eigene Stimme zählt nicht als Unterbrechung | `engine/turn-detect.ts` | PLAN |
| S255-7 | Rückfallebene: ohne Klassifikator gilt Stufe 1 | `engine/turn-detect.ts` | PLAN |
| S255-8 | Tests + Messung | `scripts/`, docs | PLAN |

## Referenz

Der Turn-Detector der [LiveKit Agents](https://github.com/livekit/agents)
(Apache-2.0) als Vorbild für Stufe 2 — dort entscheidet ein kleines Modell auf
dem Transkript-Präfix, nicht auf dem Audio.

## Abbruchkriterium

**Barge-in schneidet die eigene Frage ab.** Wenn der Lautsprecher die eigene
Ausgabe als Unterbrechung erkennt, redet sich Jarvis selbst tot. S255-6 ist
deshalb kein Komfort, sondern Bedingung.

Zweites Kriterium: unvollständige Sätze werden häufiger abgeschickt als nach
Sprint 254.

## Tests

```bash
cd frontend
npm run test:014
npm run test:turn-e2e         # Abbruch schreibt keinen Zustand
npm run eval:report
npx tsc -b && npm run lint
```

Manuell: dieselben zwanzig Sätze wie in Sprint 254, plus zehn Unterbrechungen
mitten in der Antwort. Gezählt wird, ob Jarvis stoppt, ob er den alten Zug
verwirft, und ob er auf sich selbst hereinfällt.
