# Sprint 254 — VAD statt Stillezähler (Stufe 1)

**Version:** `16.7.0` (versionCode `160700`) — **PLAN**
**Plan:** [`68-next.md`](../68-next.md) §9 · Upgrade **B** Stufe 1 aus [`67-upgrades.md`](../67-upgrades.md)

## Ziel

Jarvis erkennt, **ob** gesprochen wird, statt eine feste Stille abzuzählen.

## Warum

`turn-detect.ts` wartet `SILENCE_HOLD_VOICE_MS = 1100` ab. Eine Konstante kann
nicht beides: wer mitten im Satz Luft holt, wird abgeschnitten; wer schnell
spricht, wartet unnötig. Das ist die Beschwerde „er nimmt meine Sätze abgehackt
auf" — und sie ist noch offen. In `16.0.x` wurden die **TTS**-Zeiten korrigiert
(Erstchunk `1800 ms`), am Zuhören hat sich nichts geändert.

Der Abstand zu Astra und zum Realtime-Modus von ChatGPT liegt hier, nicht in der
Modellgröße. Beide erkennen Sprache statt Lautstärke.

Eine Amplitudenschwelle verwechselt außerdem Nebengeräusch mit Sprache: der
laufende Fernseher hält den Zähler offen, das Lüftergeräusch beendet ihn nicht.

## Heute vs. Ziel

| Heute | Ziel |
|-------|------|
| Amplitude über Schwelle = „spricht" | Sprachwahrscheinlichkeit aus Silero VAD |
| feste 1100 ms Stille | Halten dynamisch, kurz bei klarem Ende, lang bei Atempause |
| Fernseher hält offen | Nicht-Sprache zählt nicht als Sprache |
| keine Rückfallebene | ONNX lädt nicht → heutige Konstante |

## Lieferumfang

| ID | Task | Datei | Status |
|----|------|-------|--------|
| S254-1 | `onnxruntime-web` als Abhängigkeit, WASM lazy | `package.json`, `vite.config.ts` | PLAN |
| S254-2 | Silero VAD (~1,8 MB ONNX) als Asset, erst beim ersten Sprachmodus geholt | `public/vad/` | PLAN |
| S254-3 | `vad.ts`: Frames à 30 ms → Sprachwahrscheinlichkeit | `engine/vad.ts` | PLAN |
| S254-4 | `turn-detect.ts` nutzt die Wahrscheinlichkeit statt der Amplitude | `engine/turn-detect.ts` | PLAN |
| S254-5 | Dynamisches Halten: 400 ms nach klarem Ende, bis 1800 ms bei Unsicherheit | `engine/turn-detect.ts` | PLAN |
| S254-6 | Rückfallebene auf `SILENCE_HOLD_VOICE_MS`, wenn das Modell fehlt | `engine/turn-detect.ts` | PLAN |
| S254-7 | Bundle-Prüfung: Start-Bundle wächst **nicht** | `scripts/` | PLAN |
| S254-8 | Messung: Aufnahmen vorher/nachher, abgeschnittene Sätze zählen | `docs/` | PLAN |

## Referenz

[`snakers4/silero-vad`](https://github.com/snakers4/silero-vad) (MIT), als ONNX
in `onnxruntime-web`. Läuft im WebView, kein Server, keine Cloud — passt zur
Leitentscheidung „Hirn = Handy".

## Abbruchkriterium

Mehr abgeschnittene Sätze als mit der Konstante. Dann taugt die Schwelle nicht
und der Sprint bleibt offen — lieber ein bekanntes Ärgernis als ein neues.

Zweites Kriterium: das Start-Bundle wächst. Das Modell gehört hinter einen
`import()`, wie das WASM des lokalen Modells seit `16.1.0`.

## Tests

```bash
cd frontend
npm run test:014              # Sprach-Zeiten
npm run test:rest-final
npx tsc -b && npm run lint
```

Manuell, weil Audio sich schlecht in Node prüfen lässt: zehn Sätze mit Atempause
in der Mitte („Erinnere mich … morgen früh an den Zahnarzt"), zehn schnelle
Sätze, einmal mit laufendem Fernseher im Hintergrund. Gezählt wird, wie oft
abgeschnitten wurde — vorher und nachher, dieselben Sätze.
