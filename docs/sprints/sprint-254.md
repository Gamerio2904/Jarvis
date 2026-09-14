# Sprint 254 — Satzende-Heuristik zuerst, VAD danach

**Version:** `16.7.0` — **Stufe A: CODE** (ausgeliefert in `17.0.0`) · **Stufe B: bleibt FREEZE**
**Plan:** [`68-next.md`](../68-next.md) §9 · Upgrade **B** aus [`67-upgrades.md`](../67-upgrades.md)

## Ziel

Das Abschneiden abstellen — mit einer Regex-Korrektur, nicht mit einem Modell.
Silero kommt danach und nur für den Fall, den die Regex nicht lösen kann.

## Warum — die alte Begründung war falsch

Dieser Sprint hieß „VAD statt Stillezähler" und begründete sich mit: „eine feste
Konstante von 1100 ms kann nicht beides". **Das stimmt nicht.** `turn-detect.ts`
hält bereits dynamisch:

```typescript
export function silenceMsFor(text: string, voiceMode = false): number {
  if (turnLooksComplete(text)) return SILENCE_COMPLETE_MS   // 220 ms
  return voiceMode ? SILENCE_HOLD_VOICE_MS : SILENCE_HOLD_MS // 1100 ms
}
```

Es gibt also schon zwei Stufen und schon eine inhaltliche Prüfung. Der Fehler
sitzt **in** dieser Prüfung, und er sitzt in zwei Zeilen:

```typescript
if (words.length >= 6) return true
return t.length >= 24
```

Länge wird mit Vollständigkeit verwechselt. Das dreht das Verhalten in **beide**
Richtungen falsch:

| Äußerung | Wörter | `turnLooksComplete` | Halten | Was passiert |
|----------|--------|---------------------|--------|--------------|
| „Licht an" | 2 | `false` | **1100 ms** | Der häufigste Kurzbefehl wartet am längsten |
| „Erinnere mich morgen früh um acht" | 6 | **`true`** | **220 ms** | Nach 220 ms Pause abgeschickt — „… an den Zahnarzt" fällt weg |

Das ist die Beschwerde „er nimmt meine Sätze abgehackt auf", und es ist
gleichzeitig verlorene Zeit bei kurzen Befehlen. Beides ohne Modell, ohne
Download und ohne Netz behebbar.

Der `INCOMPLETE_TAIL`-Teil der Funktion ist dagegen gut und bleibt: „…und",
„…weil", „…für" verhindern das Abschicken korrekt. Nur die Längenregeln müssen
weg.

## Warum Silero **trotzdem** noch drin ist

Eine Regex auf dem Transkript kann eine Sache nicht: Nebengeräusch von Sprache
unterscheiden. Der Energie-VAD (`createEnergyVad`, Schwelle `0.11`) hält bei
laufendem Fernseher den Zähler offen und beendet ihn beim Lüfter nicht. Das
betrifft auch **Barge-in**, das denselben Energie-VAD benutzt.

Das ist ein echter Gewinn — aber er kostet ~1,8 MB Download und Inferenz pro
Frame. Deshalb: **Stufe A zuerst und allein ausgeliefert**, Stufe B nur bei
Bedarf und opt-in.

## Heute vs. Ziel

| Heute | Ziel |
|-------|------|
| „Licht an" wartet 1100 ms | kurzer, klar vollständiger Befehl geht sofort |
| 6 Wörter gelten als fertiger Satz | Länge sagt nichts über Vollständigkeit |
| Amplitude über Schwelle = „spricht" | opt-in: Sprachwahrscheinlichkeit aus Silero |
| Fernseher hält offen | opt-in: Nicht-Sprache zählt nicht |

## Stufe A — Heuristik (ohne Modell, ohne Download)

| ID | Task | Datei | Status |
|----|------|-------|--------|
| S254-1 | `words.length >= 6` und `t.length >= 24` als Vollständigkeits-Belege **entfernen** | `engine/turn-detect.ts` | CODE |
| S254-2 | Vollständigkeit nur aus Satzzeichen, `isFinal` der STT und fehlendem `INCOMPLETE_TAIL` | `engine/turn-detect.ts` | CODE |
| S254-3 | Kurze, eindeutige Befehle („Licht an") über Parser-Treffer sofort schließen statt 1100 ms | `engine/turn-detect.ts` | CODE |
| S254-4 | Mittelstufe einführen: unklar → ~600 ms statt der Wahl zwischen 220 und 1100 | `engine/turn-detect.ts` | CODE |
| S254-5 | `INCOMPLETE_TAIL` um belegte Fälle aus dem `stt`-Tag (S249-9) erweitern | `engine/turn-detect.ts` | CODE |
| S254-6 | Messung: dieselben 20 Sätze vorher/nachher, abgeschnitten und Wartezeit gezählt | `docs/` | CODE |

**Stufe A wird allein ausgeliefert und gemessen.** Erst wenn die Messung zeigt,
dass Nebengeräusch der verbleibende Grund für Fehlschnitte ist, kommt Stufe B.

## Stufe B — Silero, opt-in (nur bei belegtem Bedarf)

| ID | Task | Datei | Status |
|----|------|-------|--------|
| S254-7 | `onnxruntime-web` lazy; Silero (~1,8 MB) über `quality-pack.ts` nachgeladen | `package.json`, `engine/quality-pack.ts` | FREEZE |
| S254-8 | `PACK_FILES.smart_turn` auf die eine Silero-Datei kürzen (255 entfällt) | `engine/quality-pack.ts` | CODE |
| S254-9 | Bestehenden Schalter `vad_onnx` verdrahten, Default bleibt **aus** | `engine/store.ts` | FREEZE |
| S254-10 | Sprachwahrscheinlichkeit hinter die Schnittstelle von `createEnergyVad` legen | `engine/vad.ts` | FREEZE |
| S254-11 | Barge-in nutzt dieselbe Quelle — ein VAD, nicht zwei | `native/voice.ts` | FREEZE |
| S254-12 | Start-Bundle wächst **nicht**; Rückfallebene auf Energie-VAD | `scripts/` | FREEZE |
| S254-13 | Sprint 174 nach Erfolg von FREEZE auf abgelöst setzen | `docs/sprints/` | FREEZE |

S254-10 ist der Grund, warum Stufe B überhaupt vertretbar ist: `createEnergyVad`
existiert als Schnittstelle, Silero wird dahinter getauscht statt daneben
gebaut. Und S254-11 verhindert, dass zwei VADs gleichzeitig auf dem Mikrofon
laufen — das wäre doppelte CPU-Last für dieselbe Frage.

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

## Ergebnis

### Stufe A, gemessen im Test

`npm run test:turn-detect` hält die Tabelle aus diesem Sprint als Testfälle und
rechnet den Vergleich selbst — die alte Regel steht im Test nachgebaut, damit
das „vorher" nicht in einer Notiz verfällt:

| Zahl | vorher | jetzt |
|------|-------:|------:|
| Wartezeit kurzer Befehle (Mittel aus 5) | 1100 ms | **220 ms** |
| Fehlschnitte bei langen Sätzen (von 5) | 3 | **0** |

Beide Zahlen verbessern sich. Genau das war die Bedingung: eine Verschiebung
von „schneidet ab" zu „wartet lang" wäre ein Tausch, kein Fortschritt.

Drei Stufen statt zwei: `SILENCE_UNSURE_MS = 600` fängt den unklaren Fall auf.
Vorher kostete jede Fehlentscheidung das Maximum in die falsche Richtung, weil
es nur 220 oder 1100 gab.

### Warum kein Parser-Treffer als Beleg dient

S254-3 wollte kurze Befehle „über Parser-Treffer" schließen. So gebaut wäre es
falsch geworden: „Erinnere mich morgen" trifft einen Parser und ist
offensichtlich nicht fertig. Ein Parser-Treffer belegt eine **erkannte
Absicht**, keine **abgeschlossene Äußerung**.

Stattdessen `CLOSED_COMMAND`: Gerät plus Schaltwort, und das Schaltwort steht
am Satzende. Die Grammatik kann nicht weitergehen, also wartet auch nichts.
Eine kleine Liste, aber eine beweisbar richtige.

Ein zweiter Fund derselben Art: ein hängendes Satzende gewinnt jetzt auch
gegen `isFinal`. Die Erkennung meldet „ich brauche noch" durchaus als
abgeschlossen — sie hört ja nichts mehr. Fertig ist der Satz damit nicht.

### Stufe B bleibt im Freeze

Nach der Regel dieses Sprints: „Stufe A wird allein ausgeliefert und gemessen.
Erst wenn die Messung zeigt, dass Nebengeräusch der verbleibende Grund für
Fehlschnitte ist, kommt Stufe B." Diese Messung braucht ein Mikrofon, einen
laufenden Fernseher und ein Gerät — sie steht noch aus. 1,8 MB Download und
Inferenz pro Frame ohne belegten Bedarf wären genau der Tausch, den die
Prioritätenliste verbietet.

S254-8 ist trotzdem umgesetzt, weil es unabhängig davon eine Unwahrheit war:
`PACK_FILES.smart_turn` erwartete `smart_turn_v3.onnx`, eine Datei, die es nie
geben wird. Das Paket meldete dauerhaft „fehlt". Jetzt erwartet es nur Silero.

**Sprint 174 bleibt FREEZE** — sein VAD-Teil ist nicht abgelöst, sondern
weiterhin unbelegt.

## Abbruchkriterium

Für Stufe A: **mehr abgeschnittene Sätze als vorher, oder längere Wartezeit bei
kurzen Befehlen.** Beides ist in derselben Messung sichtbar, und beide Zahlen
müssen sich verbessern — eine Verschiebung von „schneidet ab" zu „wartet lang"
ist kein Fortschritt, sondern ein Tausch.

Für Stufe B zusätzlich: das Start-Bundle wächst, oder der Akkuverbrauch im
Sprachmodus steigt messbar. Stufe B ist opt-in und muss das bleiben, solange
Stufe A den Fall ohne Nebengeräusch allein löst.

## Tests

```bash
cd frontend
npm run test:014              # Sprach-Zeiten
npm run test:turn-detect      # neu: Vollständigkeits-Tabelle als Testfälle
npm run test:rest-final
npx tsc -b && npm run lint
```

Stufe A ist **in Node prüfbar** — `turnLooksComplete` und `silenceMsFor` sind
reine Funktionen auf einem String. Genau deshalb kommt sie zuerst: die Tabelle
oben („Licht an" → sofort, „Erinnere mich morgen früh um acht" → weiter warten)
wird zu Testfällen, ohne dass jemand ein Mikrofon braucht.

Nur Stufe B braucht die Hand: zehn Sätze mit Atempause, zehn schnelle Sätze,
einmal mit laufendem Fernseher — vorher und nachher, dieselben Sätze.
