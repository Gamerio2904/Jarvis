# Sprint 259 — Historie im Speicher + Meilenstein `17.0.0`

**Version:** `17.0.0` (versionCode `170000`) — **PLAN**, **Meilenstein**, verkleinert
**Plan:** [`68-next.md`](../68-next.md) §14 · Upgrade **F** aus [`67-upgrades.md`](../67-upgrades.md)
**Voraussetzung:** Sprints **249–258**

## Ziel

Ein Fehler von vorhin lässt sich zeigen. Und die Schiene wird als `17.0.0`
ausgeliefert.

## Was aus diesem Sprint gestrichen wurde

Geplant war ein **Ring-Puffer der letzten 50 Züge in IndexedDB** plus
Umbenennung auf die GenAI-Konventionen von OpenTelemetry. Beides fällt weg oder
schrumpft, und zwar aus zwei Gründen.

**Erstens gibt es die Hälfte schon.** `engine/latency.ts` hält bereits einen
Ring-Log über 24 Züge mit Pfad (`parser` / `gemini` / `groq` / `local`), Zeit bis
zum ersten Token, Zeit bis zum ersten Ton, Gesamtzeit — und rechnet `latencyP95`
selbst. `agents/trace-store.ts` hält die Traces auf 200 gedeckelt mit Zugnummer.
Was fehlte, war nicht die Erfassung, sondern das **Durchblättern**.

**Zweitens kostet IndexedDB pro Zug Latenz und Akku.** Ein Schreibvorgang je Zug
auf die Platte ist genau die Art Nebenwirkung, die dieser Planung
widerspricht — ein Debug-Werkzeug, das den Normalbetrieb verlangsamt, bezahlt
Qualität mit Latenz. Und `addResearchAudit` hat in `16.1.1` gezeigt, wohin
unbegrenzte Protokolle auf der Platte führen.

Also: **im Speicher bleiben, auf Anforderung exportieren.** Die Historie
überlebt keinen Neustart — das ist der Preis, und er ist vertretbar, weil ein
Fehlerbericht ohnehin in derselben Sitzung entsteht („er hat gerade Unsinn
geredet"). Für den Fall „gestern Abend" bleibt der Export, den der Nutzer
auslöst.

Die OTel-Umbenennung entfällt ganz: sie bringt Anschlussfähigkeit an einen
Collector, den es hier nicht gibt und nicht geben soll („kein Server"). Etiketten
zu ändern, ohne dass etwas daran hängt, ist Aufwand ohne Wirkung in allen vier
Kategorien.

## Heute vs. Ziel

| Heute | Ziel |
|-------|------|
| `latency.ts` 24 Züge, `trace-store.ts` 200 Traces — beides unsichtbar | eine Ansicht, die beides durchblättert |
| Debug-Export nur für den aktuellen Zug | Export über die Historie der Sitzung |
| Traces und Zeiten getrennt | ein Zug zeigt Route, Agenten und Zeiten zusammen |

## Lieferumfang

| ID | Task | Datei | Status |
|----|------|-------|--------|
| S259-1 | `latency.ts` von 24 auf ~50 Züge, Zug-ID mit `trace-store` teilen | `engine/latency.ts` | PLAN |
| S259-2 | Traces und Zeiten je Zug zusammenführen, im Speicher | `agents/trace-store.ts` | PLAN |
| S259-3 | Kein Schreiben im Zug — Zusammenführen erst nach der Antwort | `agents/trace-store.ts` | PLAN |
| S259-4 | Debug-Export über die Sitzungs-Historie, vom Nutzer ausgelöst | `engine/debug-export.ts` | PLAN |
| S259-5 | Lage-Ansicht: letzte Züge durchblättern | `ui/lage/AgentTree.tsx` | PLAN |
| S259-6 | Kontingent-Stand je Zug mitschreiben (aus S251-9) | `engine/latency.ts` | PLAN |
| S259-7 | Docs: `66-agents-ist.md` §4 neu, CHANGELOG `17.0.0` | docs | PLAN |
| S259-8 | Meilenstein: APK `17.0.0`, versionCode `170000` | `package.json`, `store.ts` | PLAN |

S259-6 ist neu und ergibt sich aus 251: wenn der Kontingent-Stand pro Zug
mitläuft, ist im Nachhinein erklärbar, warum eine Antwort vom lokalen Modell
kam. Ohne diese Zahl wirkt der Wechsel wie ein Fehler.

## Meilenstein `17.0.0`

`17.0.0` bedeutet: **Jarvis kann sich selbst messen und lässt sich
unterbrechen.**

| Was `16.1.1` nicht konnte | Wo es dazukam |
|---------------------------|---------------|
| Routing messen statt raten | 249, 250 |
| Kaputte Dienste abschalten | 251 |
| Leeres Kontingent überleben statt abzusagen | 251 |
| Einen Zug wirklich abbrechen | 253 |
| Sätze nicht mehr abschneiden | 254 |
| Ein kaputtes Feld nicht auf alle ausweiten | 256 |
| Bei Gleichstand entscheiden statt zurückfragen | 257 |
| Zusammengesetzte Sätze ausführen | 258 |
| Einen Fehler von vorhin zeigen | 259 |

## Abbruchkriterium

**Das Zusammenführen bremst die Antwort.** Telemetrie darf nie im Weg stehen;
S259-3 ist deshalb Bedingung, nicht Reihenfolge-Empfehlung.

Zweites Kriterium: der Speicherverbrauch wächst über den Deckel. 50 Züge mit
Traces sind ein paar hundert Kilobyte — wenn daraus Megabyte werden, ist zu viel
je Zug drin.

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
