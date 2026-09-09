# Sprint 243 — Reel-Schalter (JarvisSwitch)

**Version:** `15.4.0` (versionCode `150400`)  
**Plan:** [`65-next.md`](../65-next.md) §3  
**Vorbild:** [Instagram DclotjJkrDF](https://www.instagram.com/reel/DclotjJkrDF/)

## Ziel

Alle Klickboxen (native Checkboxen) in Einstellungen und Debug durch einen einheitlichen animierten Schalter ersetzen — Track, Thumb, Accent-Glow wenn aktiv.

## Heute vs. Ziel

| Heute | Ziel |
|-------|------|
| 26× `<input type="checkbox">` in `SettingsScreen.tsx` | `<JarvisSwitch>` |
| 1× Checkbox in `DebugPanel.tsx` | gleiche Komponente |
| `.settings-toggle` CSS | Track 44×24 px, Thumb 200 ms ease, Glow |

## Lieferumfang

| ID | Task | Datei | Status |
|----|------|-------|--------|
| S243-1 | `JarvisSwitch.tsx` — props: `checked`, `onChange`, `label`, `disabled` | `ui/JarvisSwitch.tsx` | CODE |
| S243-2 | CSS: `[role=switch]`, Accent-Glow, `prefers-reduced-motion` | `index.css` | CODE |
| S243-3 | `SettingsScreen.tsx` — alle Booleans migrieren | `SettingsScreen.tsx` | CODE |
| S243-4 | `DebugPanel.tsx` Checkbox → Switch | `DebugPanel.tsx` | CODE |
| S243-5 | `hud_force` Sonderfall: Switch + `setLageSession` | `SettingsScreen.tsx` | CODE |
| S243-6 | HUD-Modul-Grid Checkboxen (falls vorhanden) | `Lage.tsx` / HUD | CODE |
| S243-7 | a11y: `aria-checked`, Space/Enter, Focus-Ring | `JarvisSwitch.tsx` | CODE |

## Akzeptanz

- Keine native Checkbox mehr in Settings/Debug
- Keyboard bedienbar
- `prefers-reduced-motion`: instant Toggle ohne Slide
- Visuell nah am Reel: dunkler Track, grüner Thumb-Glow wenn an

## Tests

```bash
cd frontend && npm run build
npm run test:prompts
```

Manuell: 5 Switches toggeln, Hausstand-Export-Warnung lesbar, kein Layout-Sprung.

## Nicht in 243

- Theme-Animation → Sprint 244
- Kalender → Sprint 245
