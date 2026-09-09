# Sprint 251 — Sicherungsschalter + Agenten-Reste

**Version:** `16.4.0` (versionCode `160400`) — **PLAN**
**Plan:** [`68-next.md`](../68-next.md) §6 · Upgrade **H** aus [`67-upgrades.md`](../67-upgrades.md)

## Ziel

Ein dauerhaft kaputter Dienst sagt sofort ehrlich ab, statt bei jeder Frage ins
volle Budget zu laufen. Dazu die zwei Agenten-Reste aus dem Audit für `16.1.x`.

## Warum

Ohne Netz wartet der Nutzer heute bei **jeder** Frage 25 s (Lese-Budget) plus
einen Wiederholversuch, bevor irgendetwas passiert. Das Budget aus `16.1.0` hat
das Hängen begrenzt, aber nicht das Wiederholen des Aussichtslosen.

Die zwei Reste sind klein und stehen sonst ewig:

- **`identity` hat einen Parser, aber keinen Executor.** Heute fängt `chat.ts`
  die Frage vorher ab, also fällt es nicht auf. Wird dieser Weg je umgangen,
  scheitert `runAgent` stumm und die Antwort kommt vom Modell.
- **`verify` ist uneinheitlich.** Acht Module (`tv`, `home`, `pc`, `drive`,
  `app`, `doc`, `memory`, `recall`) rufen `packVerified` selbst auf, die übrigen
  nicht. Der Kommentar über `runDirectorTurn` verspricht
  „preflight → router → execute → **verify** → merge" — einen Schritt, den der
  Director nicht hat. `AgentTrace.phase` kennt `'verify'`, niemand sendet es.

Dazu kommt ein zweiter Auslöser, der bei der Planung von `17.0` aufgefallen ist
und dieselbe Mechanik braucht: **das leere Kontingent.**

## Warum das Kontingent hierher gehört

Groqs Free Tier ist über Raten begrenzt, nicht über ein Monatsbudget, und die
Grenzen gelten pro Organisation: für die Chat-Modelle **1.000 Requests und
200.000 Tokens am Tag** ([`69-modell-grundlagen.md`](../69-modell-grundlagen.md)
§3). Bei rund 2.500 Tokens pro Zug sind das etwa 80 Züge. Das reicht im Alltag,
ist aber nach einem Debug-Nachmittag leer.

Heute läuft Jarvis in diesem Fall in `429` und zeigt `germanQuotaHint()`. Das
lokale 0,5B ist die einzige unbegrenzte Ebene und wäre der richtige Ort — aber
umgeschaltet wird erst **nach** dem Fehler. Groq schickt
`x-ratelimit-remaining-*` in jeder Antwort mit; damit lässt sich vorher
umschalten. Aus „Jarvis sagt ab" wird „Jarvis wird schlichter".

Zwei konkrete Funde am Groq-Pfad, die direkt Kontingent kosten:

- **Kein Skip-Gedächtnis.** `gemini.ts` merkt sich über `markSkip` /
  `gemini_skip_until`, welches Modell gerade nicht geht. `groq.ts` läuft
  `GROQ_MODELS_BEST_FIRST` bei **jedem** Aufruf von vorne durch.
- **Zwei Requests je totem Modell.** `completeGroq` versucht pro Modell erst
  `streamGroq`, dann den Non-Streaming-Aufruf. Ein Modell, das mit `404`
  antwortet, kostet damit zwei Requests — jeden Zug. Steht es an Position 1 der
  Liste, ist das bei 1.000 RPD die Hälfte des Tagesbudgets.
- **Modell-ID prüfen.** `GROQ_MODELS_BEST_FIRST[0]` ist `qwen/qwen3.8-27b`;
  Groqs veröffentlichte Liste führt `qwen/qwen3.6-27b`. Falls die ID nicht
  existiert, greift genau der Fall oben. Nachsehen, nicht raten — und die
  Assertion in `test-gemini-fallback.mjs` zieht mit.
- **Zwei Gründe, warum das keiner gemerkt hat.** Erstens ist
  `scripts/test-gemini-fallback.mjs` das **einzige** Testskript ohne Eintrag in
  `package.json` — es läuft in keinem dokumentierten Ablauf. Zweitens würde es
  auch dann nichts finden: die Zeile lautet
  `assert.equal(GROQ_MODELS_BEST_FIRST[0], 'qwen/qwen3.8-27b')` und prüft die
  Konstante gegen sich selbst. So ein Test bemerkt eine *Änderung*, nie einen
  falschen Wert. Beides gehört behoben, und das zweite ist das wichtigere.

## Heute vs. Ziel

| Heute | Ziel |
|-------|------|
| kaputter Dienst: jedes Mal 25 s + Retry | 3 Fehlschläge → 60 s sofortige Absage |
| `identity` ohne Executor | trivialer Executor, kein Agent ohne |
| `verify` in 8 von 60 Modulen, Director-Kommentar lügt | entweder Director-Schritt oder ehrlicher Kommentar |
| leeres Kontingent → `429` und Absage | vor der Grenze auf das lokale Modell |
| totes Groq-Modell kostet 2 Requests pro Zug | einmal gemerkt, dann übersprungen |

## Lieferumfang

| ID | Task | Datei | Status |
|----|------|-------|--------|
| S251-1 | Fehlschlag-Zähler je Agent, Rücksetzen bei Erfolg | `agents/breaker.ts` | PLAN |
| S251-2 | Halbmond: nach 60 s **ein** Versuch, dann offen oder zu | `agents/breaker.ts` | PLAN |
| S251-3 | Einhängen in `agentDispatch` vor dem Budget | `agents/bus.ts` | PLAN |
| S251-4 | Absage-Text: „… ist gerade nicht erreichbar", kein stiller Fall ans Modell für `write`/`device` | `director.ts` | PLAN |
| S251-5 | `identity`-Executor (canned, wie `chat.ts` heute antwortet) | `agents/execute-map.ts` | PLAN |
| S251-6 | `verify` entscheiden: Director-Schritt für `device`/`write`, oder Kommentar + `phase`-Typ bereinigen | `director.ts`, `agents/types.ts` | PLAN |
| S251-7 | Trace zeigt den Schalter-Zustand im Debug-Bogen | `agents/trace-store.ts` | PLAN |
| S251-8 | Tests | `scripts/test-agents-robust.mjs` | PLAN |
| S251-9 | `x-ratelimit-remaining-*` lesen und ablegen | `engine/groq.ts`, `engine/quota.ts` | PLAN |
| S251-10 | Kontingent-Auslöser: unter Schwelle → lokales 0,5B statt Cloud | `engine/llm.ts` | PLAN |
| S251-11 | Skip-Gedächtnis für Groq wie `markSkip` bei Gemini | `engine/groq.ts` | PLAN |
| S251-12 | Bei `404` kein zweiter Non-Streaming-Versuch aufs selbe Modell | `engine/groq.ts` | PLAN |
| S251-13 | Modell-IDs gegen Groqs Liste prüfen, Assertion nachziehen | `engine/cloud-errors.ts`, `scripts/test-gemini-fallback.mjs` | PLAN |
| S251-14 | `germanQuotaHint()`: „hoher Free-Tier" streichen — 1.000 RPD ist nicht hoch | `engine/cloud-errors.ts` | PLAN |
| S251-15 | Restkontingent im Debug-Bogen sichtbar | `ui/DebugPanel.tsx` | PLAN |
| S251-16 | `test:gemini-fallback` in `package.json` eintragen — läuft heute nie | `package.json` | PLAN |
| S251-17 | Modell-Liste gegen eine geprüfte Referenzliste stellen, nicht gegen sich selbst | `scripts/test-gemini-fallback.mjs` | PLAN |

## Schalter-Regel

```text
zu       →  3 Fehlschläge in Folge
offen    →  sofortige Absage, 60 s
halb     →  nach 60 s genau ein Versuch
           Erfolg → Zähler auf 0, zu
           Fehler → wieder 60 s offen
```

Zwanzig Zeilen, kein Framework. Ein Erfolg löscht die Geschichte vollständig —
ein Dienst, der wieder läuft, soll nicht nachtragend behandelt werden.

## Kontingent-Regel

Derselbe Schalter, anderer Auslöser. Kein zweiter Mechanismus:

```text
Antwort von Groq  →  x-ratelimit-remaining-{requests,tokens} ablegen
knapp             →  Cloud überspringen, lokales 0,5B antwortet
leer / 429        →  Cloud bis zum Reset (retry-after) übersprungen
Reset             →  Cloud wieder normal
```

„Knapp" ist eine Reserve, keine Null — wer bis zur letzten Anfrage wartet,
verliert den Zug, in dem er es merkt. Die Schwelle gehört in die Einstellungen,
nicht in eine Konstante, denn sie hängt am Nutzungsprofil.

Wichtig für den Ton: Das lokale Modell ist schlechter, nicht kaputt. Der Nutzer
soll das **wissen** („Ich antworte gerade offline, das Tageslimit ist fast
leer"), aber keine Absage bekommen. Ein leeres Kontingent ist kein Fehler,
sondern ein erwarteter Zustand des Free Tiers.

## Abbruchkriterium

Der Schalter hält einen **gesunden** Agenten zurück. Das wäre schlimmer als das
Problem: lieber dreimal 25 s warten als eine Funktion, die grundlos absagt.

Zweites Kriterium für die Kontingent-Hälfte: die Umschaltung greift **zu früh**.
Wer das Free Tier nie ausnutzt, verschenkt Qualität an einer Reserve, die nie
gebraucht wird. Gegenprobe ist die gemessene Cloud-Quote über einen normalen
Tag.

## Tests

```bash
cd frontend
npm run test:agents-robust    # Schalter: zu, halb, Rücksetzen
npm run test:turn-e2e         # Absage statt Modell-Fallback
npm run test:gemini-fallback  # Groq: Skip-Gedächtnis, Modell-IDs
npm run eval:report           # Trefferquote unverändert
npx tsc -b && npm run lint
```

Neu abzudecken: drei Fehlschläge schließen, der vierte Aufruf wartet **nicht**,
nach 60 s gibt es genau einen Versuch, ein Erfolg setzt zurück, und `identity`
ist kein Sonderfall mehr in `test:agents-robust`.

Für das Kontingent: ein `404` auf das erste Modell kostet **einen** Request statt
zwei, ein übersprungenes Modell wird beim nächsten Zug nicht erneut versucht,
und unter der Schwelle antwortet das lokale Modell, ohne dass ein Fehlertext
erscheint.
