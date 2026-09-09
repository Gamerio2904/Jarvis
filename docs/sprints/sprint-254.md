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
| S254-2 | Silero VAD (~1,8 MB ONNX) als Asset, erst beim ersten Sprachmodus geholt | `public/onnx/` | PLAN |
| S254-3 | `vad.ts`: Frames à 30 ms → Sprachwahrscheinlichkeit | `engine/vad.ts` | PLAN |
| S254-4 | `turn-detect.ts` nutzt die Wahrscheinlichkeit statt der Amplitude | `engine/turn-detect.ts` | PLAN |
| S254-5 | Dynamisches Halten: 400 ms nach klarem Ende, bis 1800 ms bei Unsicherheit | `engine/turn-detect.ts` | PLAN |
| S254-6 | Rückfallebene auf `SILENCE_HOLD_VOICE_MS`, wenn das Modell fehlt | `engine/turn-detect.ts` | PLAN |
| S254-7 | Bundle-Prüfung: Start-Bundle wächst **nicht** | `scripts/` | PLAN |
| S254-8 | Messung: Aufnahmen vorher/nachher, abgeschnittene Sätze zählen | `docs/` | PLAN |
| S254-9 | Bestehenden Schalter `vad_onnx` aus Sprint 174 verdrahten, keinen neuen anlegen | `engine/store.ts` | PLAN |
| S254-10 | Über `quality-pack.ts` laden; `PACK_FILES.smart_turn` auf die eine Silero-Datei kürzen | `engine/quality-pack.ts` | PLAN |
| S254-11 | Sprint 174 nach Erfolg von FREEZE auf abgelöst setzen | `docs/sprints/` | PLAN |

## Referenz

[`snakers4/silero-vad`](https://github.com/snakers4/silero-vad) (MIT), als ONNX
in `onnxruntime-web`. Läuft im WebView, kein Server, keine Cloud — passt zur
Leitentscheidung „Hirn = Handy".

## Dieser Sprint kehrt ein NO-GO um

Genau das steht schon einmal geplant und **abgelehnt** da:
[`sprint-174.md`](./sprint-174.md) („Silero-VAD + Smart Turn ONNX", **FREEZE**,
Votum „NO-GO bundeln"). Das ist keine Doppelplanung, aber es verpflichtet: wer
eine dokumentierte Ablehnung umdreht, muss sagen, was sich geändert hat.

| Grund für das NO-GO in 174 | Stand heute |
|----------------------------|-------------|
| „keine Endpunkt-Messung mit Modell" | Behoben durch 249/250. Eine Messung gibt es jetzt, und S254-8 nutzt sie |
| „keine ~10 MB in der APK" | **Steht weiter.** Deshalb S254-2: Silero allein (~1,8 MB), nachgeladen statt gebündelt, und S254-7 prüft das Start-Bundle |
| Smart Turn zusätzlich | **Nicht in diesem Sprint.** Das semantische Satzende kommt in 255 als Klassifikator, nicht als zweites ONNX-Modell |

Drei Konsequenzen für den Lieferumfang:

- **Die Einstellung existiert schon.** 174 hat `vad_onnx` als Wunsch-Schalter
  angelegt (V3, „**CODE**, Default aus"). Der Schalter steht heute in
  `store.ts` (Default `false`) und ist in `SettingsScreen.tsx` bedienbar. Dieser
  Sprint verdrahtet ihn, er erfindet keinen neuen — und der Default bleibt aus,
  bis S254-8 eine Verbesserung belegt.
- **Der Lademechanismus existiert auch.** `quality-pack.ts` ist genau dafür
  gebaut: vier Could-Pakete (`smart_turn`, `piper`, `kokoro`, `e5`), je mit
  Wunsch-Einstellung, Datei-Prüfung und ehrlichem Text für „gewünscht, aber
  Datei fehlt". `smart_turn` erwartet `/onnx/silero_vad.onnx` und
  `/onnx/smart_turn_v3.onnx`. Dieser Sprint hängt sich **dort** ein — kein
  zweites Asset-Verzeichnis, kein zweiter Statuspfad. Da 255 das semantische
  Ende ohne `smart_turn_v3.onnx` löst, muss `PACK_FILES.smart_turn` auf die
  eine Datei reduziert werden, sonst meldet das Paket dauerhaft „fehlt".
- **174 wird nach dem Erfolg geschlossen**, nicht offen gelassen. Sonst steht
  dieselbe Idee doppelt in der Liste, einmal als FREEZE und einmal als CODE.

Verwandt und weiter eingefroren: [`sprint-175.md`](./sprint-175.md) (Piper
offline TTS) und [`sprint-176.md`](./sprint-176.md) (Kokoro + e5-Rerank). Beide
bleiben unberührt; dieser Sprint holt **nur** das VAD aus dem Freeze.

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
