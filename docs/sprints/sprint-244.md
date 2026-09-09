# Sprint 244 — Light/Dark Theme + Reel-Transition

**Version:** `15.5.0` (versionCode `150500`)  
**Plan:** [`65-next.md`](../65-next.md) §4  
**Vorbild:** [Instagram Dc_qazGKcQ8](https://www.instagram.com/reel/Dc_qazGKcQ8/)

## Ziel

Erstes echtes Light-Theme neben dem bestehenden Dark-HUD. Modus-Wechsel mit flüssiger Arc/Wipe-Animation (Iron-Man-HUD-Ästhetik), orthogonal zu `hud_accent` (grün/orange).

## Heute vs. Ziel

| Heute | Ziel |
|-------|------|
| Nur `:root` Dark in `index.css` | `[data-theme=light]` Token-Set |
| Kein `ui_theme` Setting | `ui_theme: 'dark' \| 'light' \| 'system'` in `store.ts` |
| Kein Toggle | Switch in Settings → Lage (JarvisSwitch aus 243) |
| Ambient-Orbs fest dunkel | Orbs passen Helligkeit an |

## Lieferumfang

| ID | Task | Datei | Status |
|----|------|-------|--------|
| S244-1 | CSS-Token Light: `--bg`, `--surface`, `--text`, `--accent` | `index.css` | PLAN |
| S244-2 | `ui_theme` in Settings + Persist + Migration | `store.ts`, `SettingsScreen.tsx` | PLAN |
| S244-3 | `data-theme` auf `<html>` oder `#root` | `App.tsx` | PLAN |
| S244-4 | Theme-Transition: radial wipe von Nav-Island, 280 ms | `fx/theme-transition.ts` oder CSS | PLAN |
| S244-5 | `prefers-reduced-motion` → instant swap | CSS | PLAN |
| S244-6 | `prefers-color-scheme` für `system` | `App.tsx` | PLAN |
| S244-7 | Lage/Kugel/Calendar lesbar in Light | `index.css`, Komponenten | PLAN |

## Animation (Reel-Näherung)

1. Tap Theme → radial wipe von unten (Nav-Island) outward
2. 280 ms `--ease-out`
3. Glow-Arc kurz sichtbar während Wipe
4. reduced-motion: kein Wipe

## Abhängigkeit

**Sprint 242** muss shipped sein — PO testet Theme auf stabiler Lage-Fläche.

## Tests

```bash
cd frontend && npm run build
npm run test:prompts
```

Manuell: Dark→Light→System, Chat + Lage + Kalender lesbar, kein Flash-of-unstyled.

## Nicht in 244

- Kalender Reel-Layout → Sprint 245
- PC-Dashboard Light-Polish → optional 245
