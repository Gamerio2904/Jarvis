# Sprint 259 — Telemetrie + Meilenstein `17.0.0`

**Version:** `17.0.0` (versionCode `170000`) — **PLAN**, **Meilenstein**
**Plan:** [`68-next.md`](../68-next.md) §14 · Upgrade **F** aus [`67-upgrades.md`](../67-upgrades.md)
**Voraussetzung:** Sprints **249–258**

## Ziel

Ein Fehler von gestern lässt sich zeigen. Und die Schiene wird als `17.0.0`
ausgeliefert.

## Warum

`agents/trace-store.ts` hält die Traces eines Zugs im Speicher — seit `16.1.0`
mit Zugnummer und auf 200 gedeckelt, aber weiterhin flüchtig. Sie überleben
keinen Neustart. Wenn der PO morgens sagt „gestern Abend hat er Unsinn geredet",
gibt es nichts zu sehen.

Genau dieses Loch hat die ganze `16.1.x`-Runde teuer gemacht: die Fehlerberichte
kamen als Screenshots und Videos, weil die App selbst nichts festhält.

## Heute vs. Ziel

| Heute | Ziel |
|-------|------|
| Traces nur im Speicher, ein Zug | Ring-Puffer der letzten ~50 Züge in IndexedDB |
| eigene Attributnamen | GenAI-Konventionen von OpenTelemetry |
| Debug-Export nur für den aktuellen Zug | Export über die Historie |
| kein Deckel auf der Platte | Ring-Puffer, feste Obergrenze |

## Lieferumfang

| ID | Task | Datei | Status |
|----|------|-------|--------|
| S259-1 | `agent_traces` als Store, Ring-Puffer 50 Züge | `engine/store.ts` | PLAN |
| S259-2 | Attribute nach GenAI-Konventionen benennen | `agents/trace-store.ts` | PLAN |
| S259-3 | Schreiben ohne den Zug zu bremsen (nach der Antwort) | `agents/trace-store.ts` | PLAN |
| S259-4 | Debug-Export über die Historie, nicht nur den aktuellen Zug | `engine/debug-export.ts` | PLAN |
| S259-5 | Ältesten Zug verdrängen, harte Obergrenze | `engine/store.ts` | PLAN |
| S259-6 | Lage-Ansicht: letzte Züge durchblättern | `ui/lage/AgentTree.tsx` | PLAN |
| S259-7 | Docs: `66-agents-ist.md` §4 neu, CHANGELOG `17.0.0` | docs | PLAN |
| S259-8 | Meilenstein: APK `17.0.0`, versionCode `170000` | `package.json`, `store.ts` | PLAN |

## Attributnamen

Die GenAI-Konventionen von OpenTelemetry, auch ohne Collector:

| Heute | Nachher |
|-------|---------|
| `model` | `gen_ai.request.model` |
| `tokens` | `gen_ai.usage.input_tokens` / `output_tokens` |
| `phase` | `gen_ai.operation.name` |

Der Nutzen ist nicht das Etikett, sondern die Anschlussfähigkeit: ein späterer
Export läuft ohne Umbau, und der Debug-Bogen ist mit dem vergleichbar, was in
der Industrie üblich ist.

## Meilenstein `17.0.0`

`17.0.0` bedeutet: **Jarvis kann sich selbst messen und lässt sich
unterbrechen.**

| Was `16.1.1` nicht konnte | Wo es dazukam |
|---------------------------|---------------|
| Routing messen statt raten | 249, 250 |
| Kaputte Dienste abschalten | 251 |
| Einen Zug wirklich abbrechen | 253 |
| Sprache erkennen statt Stille zählen | 254, 255 |
| Einstellungen migrieren ohne Verlust | 256 |
| Router lernen statt stimmen | 257 |
| Werkzeuge vorschlagen lassen | 258 |
| Einen Fehler von gestern zeigen | 259 |

## Abbruchkriterium

Der Ring-Puffer wächst über seine Grenze. Ein Debug-Werkzeug, das die Platte
füllt, ist schlimmer als keins — dieselbe Lehre wie bei den
Forschungs-Protokollen in `16.1.1`.

Zweites Kriterium: das Schreiben bremst die Antwort. Telemetrie darf nie im
Weg stehen.

## Tests

```bash
cd frontend
npm run eval:report           # Endstand der Schiene, gegen 16.1.1
npm run test:turn-e2e
npm run test:agents-robust
npm run test:rest-final
npx tsc -b && npm run lint
./build-apk.sh                # versionCode 170000
```

Vor dem Sideload: alle 17+ Skripte und die Eval grün, `versionName 17.0.0` im
gebauten APK verifiziert, PO-Checkliste `TEST-17.0.0.md` abgearbeitet.
