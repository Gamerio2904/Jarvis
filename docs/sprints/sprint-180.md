# Sprint 180 — FGS Native-Härte (`9.10.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Ziel-Version | in Sideload **`9.10.0`** |
| Quelle | [`55-next.md`](../55-next.md) · [`sprint-170.md`](./sprint-170.md) |
| Vorher | 170 FGS existiert. Intensiv-Lesen: Tap, WakeLock, Lifecycle |

## Ziel

Debug-FGS nicht den Sprachmodus öffnen, WakeLock nicht unbegrenzt, WebView-Lifecycle nicht aus `onPause`/`onStop` mit `onResume` verbiegen.

## Must

| ID | Inhalt | Stand |
|----|--------|-------|
| N1 | Notify-Tap = Launch-Intent, kein `jarvis://voice` | `JarvisDebugService.note` |
| N2 | WakeLock `acquire(30 * 60 * 1000L)` | `holdCpu` |
| N3 | `keepWebViewIfDebug` nur `resumeTimers()` | `MainActivity` |
| N4 | Regression in `test:rest-final` | Java-Source-Asserts |

## Won’t

OEM-Akku (→ **183**). Lauf ohne offene APK. Wake-FGS als Debug.

## DoD

- [x] `test:rest-final` grün
- [ ] Gerät: Tap öffnet Chat, nicht Stimme (PO **178**)
