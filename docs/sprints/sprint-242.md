# Sprint 242 — Lage-Handy Hotfix + Quick Fixes

**Version:** `15.3.2` (versionCode `150302`)  
**Plan:** [`65-next.md`](../65-next.md) §2  
**Basis:** `15.3.1` (Blackscreen sessionStorage-Fix)

## Ziel

PO-Blocker aus Screenshots sofort beheben: Lage auf dem Handy darf keinen schwarzen Vollbild-Screen mehr erzeugen; Composer und Chat bleiben bedienbar. Nebenbei: Einstellungs-Suche „Fernseher“, Globe Niederlande, Chat-Padding.

## Screenshot ↔ Fix

| Symptom | Ursache | Fix |
|---------|---------|-----|
| Lage-Tap → Blackscreen | `lageScene` versteckt `messages` + `composer-wrap` (`App.tsx`) | Handy: chat-first — Lage als Panel über Chat, Composer immer sichtbar |
| „Fernseher“ → nichts | `filterTopics()` matcht `/tv/` nicht `fernseher` | Aliase in `settings-ia.ts` |
| „Niederlande auf Kugel“ | Chat-Fly-to/Pin fehlt trotz Gazetteer | `globe-countries.ts` + `last_globe_focus` |
| Research abgeschnitten | Floating Composer überlappt Bubble | `padding-bottom` auf `.messages` |

## Lieferumfang

| ID | Task | Datei | Status |
|----|------|-------|--------|
| S242-1 | Handy chat-first: `lageScene` nur Tablet/Wide | `App.tsx`, `layout-probe.ts` | CODE |
| S242-2 | Composer nie aus bei Dock `lage` auf Phone | `App.tsx` | CODE |
| S242-3 | `.messages` padding-bottom = composer height | `index.css`, `App.tsx` | CODE |
| S242-4 | Suche: `fernseh|samsung|tizen`, `kalender|termin`, `timer|wecker` | `settings-ia.ts` | CODE |
| S242-5 | Globe: NL-Pin aus Chat „zeig auf Globus“ | `globe-geo.ts`, `hud-parse.ts`, `store.ts` | CODE |
| S242-6 | Gold: `layout-probe.ts` + `test:rest-final` version `15.3.2` | tests | CODE |
| S242-7 | APK `releases/Jarvis.apk`, `apk.md`, CHANGELOG | docs | CODE |

## Code-Hinweis (heute)

```typescript
// App.tsx — Problem
const lageScene = lageOn && !lageWide
// → messages hidden={lageScene}, composer !lageScene
```

**Ziel:** Phone (`!lageWide`): `lageScene = false` immer; Lage-Panel via `is-lage` CSS, nicht Vollbild-Hide.

## Tests

```bash
cd frontend && npm run build
npm run test:prompts
npm run test:rest-final
```

**PO-Handy:**
1. App start → Chat sichtbar (nicht schwarz)
2. Lage-Tap → Kugel + Composer unten
3. Einstellungen → „Fernseher“ → Tab Geräte
4. Chat: „Wo ist Niederlande?“ → „Zeig auf Globus“ → Pin sichtbar

## Nicht in 242

- Reel-Schalter → Sprint 243
- Light/Dark Theme → Sprint 244
- Kalender Reel → Sprint 245
- Sprachmodus STT/TTS → Sprint 246
