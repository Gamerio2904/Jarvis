# Sprint 245 — Kalender Reel-UI + Workflow

**Version:** `15.6.0` (versionCode `150600`)  
**Plan:** [`65-next.md`](../65-next.md) §5  
**Vorbild:** [Instagram Dcv8J2OknIz](https://www.instagram.com/reel/Dcv8J2OknIz/)

## Ziel

Kalender visuell und workflow-seitig an Reel-Vorbild anpassen: große Tage, Swipe-Monat, FAB „Termin“, Tages-Sheet statt Inline-Formular.

## Heute vs. Ziel

| Schritt | Heute | Neu |
|---------|-------|-----|
| Termin anlegen | Form unten, Button „Anlegen“ | FAB → Bottom-Sheet → Speichern |
| Monat wechseln | Pfeile | + Touch-Swipe auf `.cal-grid` |
| Heute markieren | grüner Rand | Ring + Dot bei Terminen |
| Erinnerungen | separate Liste | Badge im Tages-Sheet |
| Jahr-Ansicht | Mini-Grids | Vollbreite + Heatmap-Dots |

## Lieferumfang

| ID | Task | Datei | Status |
|----|------|-------|--------|
| S245-1 | Monats-Swipe (pointer/touch auf Grid) | `Calendar.tsx` | CODE |
| S245-2 | FAB „＋ Termin“ fix unten rechts über Nav | `Calendar.tsx`, `index.css` | CODE |
| S245-3 | Tages-Sheet: Titel, Uhrzeit, Speichern | `Calendar.tsx` | CODE |
| S245-4 | Sticky Wochenleiste; heute = Ring | `index.css` `.cal-*` | CODE |
| S245-5 | Termin-Dot + Titel-Vorschau in Zelle | `Calendar.tsx` | CODE |
| S245-6 | Sprache: `calendar-parse.ts` + Bestätigungs-Chip | `calendar-parse.ts`, Chat | CODE |
| S245-7 | Haptic auf Native (Capacitor) bei Speichern | optional | CODE |
| S245-8 | Jahr-Heatmap | `Calendar.tsx` | CODE |

## UI-Details (Reel)

- Große quadratische Tageszellen (aspect-ratio 1)
- Aktiver Monat: fetter Titel, Swipe-Hint
- FAB: Neon-Grün, Schatten/Glow wie Nav-Island
- Sheet: glassmorphism, über Keyboard sicher

## Tests

```bash
cd frontend && npm run build
npm run test:prompts
```

Manuell: Termin anlegen, Swipe Monat, Sprache „Termin morgen 15 Uhr Zahnarzt“, zurück zu Chat.

## Nicht in 245

- Einstellungs-Suche v2 → Sprint 248
- Cloud-Kalender Sync → Parking
