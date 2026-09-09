# Sprint 252 — Lage-Entscheidung + Wecker-Nummer

**Version:** `16.5.0` (versionCode `160500`) — **PLAN**
**Plan:** [`68-next.md`](../68-next.md) §7
**Braucht:** eine PO-Entscheidung (S252-1)

## Ziel

Zwei bekannte Reste schließen: der tote Lage-Zweig und die gerechnete
Wecker-Nummer.

## Warum

### Der tote Lage-Zweig

`App.tsx` setzt `const lageScene = false` — hart, ohne Bedingung. Damit ist
`lageSceneOf()` in `layout-probe.ts` für diese Entscheidung unbenutzt, und der
CSS-Zweig `.main.is-lage-scene` in `index.css` kann nie greifen. Auf dem Handy
bleibt die Kugel dadurch auf 46vh.

**Das war Absicht.** Die Begrenzung ist der Blackscreen-Fix aus `15.3.2`/`16.0.0`:
vorher versteckte die Lage-Szene Chat **und** Composer, und die dunkle
Kugel-Canvas (`#050a10`) sah aus wie ein abgestürzter Bildschirm. Der Rest ist
also kein Bug, sondern eine nicht aufgeräumte Abwägung.

Zwei Wege, und die Wahl gehört dem PO:

| Weg | Ergebnis | Risiko |
|-----|----------|--------|
| **A — aufräumen** | `lageScene`, `lageSceneOf` und der CSS-Zweig fliegen raus | keins; Kugel bleibt bei 46vh |
| **B — zurückholen** | Kugel groß, aber Composer **bleibt sichtbar** | Blackscreen kann zurückkommen, wenn die Canvas den Rest überdeckt |

Weg B ist nur sinnvoll mit einer harten Regel: der Composer wird nie versteckt,
egal welche Szene. Dann ist der Bildschirm nie ganz schwarz, und die Kugel darf
den Rest nehmen.

### Die gerechnete Wecker-Nummer

`notifyIdFromKey` ist ein 31-Bit-Hash über die Erinnerungs-Id. Seit dem
Wecker-Fix in `16.1.1` hängt `markFiredByNotifyId` daran: das Ereignis kennt nur
die Nummer und muss die Zeile zurückrechnen. Bei einer Handvoll Erinnerungen ist
eine Kollision astronomisch unwahrscheinlich — aber sie wäre still, und sie
würde die **falsche** Erinnerung schließen.

## Heute vs. Ziel

| Heute | Ziel |
|-------|------|
| `lageScene = false` hart, CSS tot | Entscheidung umgesetzt, kein toter Zweig |
| `notify_id` aus einem Hash gerechnet | in der Zeile gespeichert, eindeutig vergeben |
| `markFiredByNotifyId` sucht über den Hash | sucht über das gespeicherte Feld |

## Lieferumfang

| ID | Task | Datei | Status |
|----|------|-------|--------|
| S252-1 | **PO-Entscheidung** Weg A oder B | — | PLAN |
| S252-2 | Weg A: `lageScene`, `lageSceneOf`, `.is-lage-scene` entfernen | `App.tsx`, `layout-probe.ts`, `index.css` | PLAN |
| S252-3 | Weg B: `lageSceneOf` verdrahten, Composer nie verstecken | `App.tsx`, `index.css` | PLAN |
| S252-4 | Weg B: Test, dass der Composer in jeder Szene sichtbar ist | `scripts/test-qa-16.mjs` | PLAN |
| S252-5 | `notify_id: number` im `Reminder`-Schema | `engine/store.ts` | PLAN |
| S252-6 | Vergabe beim Anlegen, fortlaufend, kollisionsfrei | `engine/reminders.ts` | PLAN |
| S252-7 | Migration: bestehende Zeilen bekommen ihren heutigen Hash als Startwert | `engine/store.ts` | PLAN |
| S252-8 | `markFiredByNotifyId` sucht über das Feld | `engine/reminders.ts` | PLAN |
| S252-9 | Docs: `66-agents-ist.md` §6 nachziehen | docs | PLAN |

## Abbruchkriterium

Bei Weg B: der Blackscreen kommt zurück. Dann sofort auf Weg A. Die Lage groß zu
sehen ist ein Komfort, ein schwarzer Bildschirm ist ein Ausfall.

Bei der Migration: eine bestehende Erinnerung verliert ihren Alarm.

## Tests

```bash
cd frontend
npm run test:turn-e2e         # Frist schließen über das gespeicherte Feld
npm run test:qa-16            # Composer sichtbar (nur Weg B)
npm run test:rest-final
npx tsc -b && npm run lint
```

Manuell auf dem Handy nach der APK: Lage antippen, Kugel drehen, etwas sagen —
der Composer muss erreichbar bleiben. Dann einen Timer stellen, App schließen,
klingeln lassen, App öffnen: **kein** zweites Klingeln.
