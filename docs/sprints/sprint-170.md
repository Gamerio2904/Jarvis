# Sprint 170 — Debug FGS v2 (`5.17`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Ziel-Version | `5.17.0` in App `9.10.0` |
| Quelle | [`54-next.md`](../54-next.md) · Sprint 169 Votum **GO v2** |
| Vorher | **169** GO |

## Ziel

Foreground-Service „Jarvis testet…“ plus CPU-WakeLock plus WebView-Keep-alive, damit Home den Lauf nicht killt. App **schließen** bleibt tot.

## Must (GO)

| ID | Inhalt | Stand |
|----|--------|-------|
| F1 | FGS nur für den Debug-Lauf, Text deutsch | `JarvisDebugService` Notification **73**, Kanal `jarvis_debug`, nicht Wake **71** |
| F2 | Stop/Ende → Service aus, `setKeepScreenOn(false)` | `debug-session` finally + Notify-Stop `debugStop` |
| F3 | Kein zweites Hirn, kein Wake-Word-Missbrauch | `specialUse`, nicht microphone |
| F4 | Kill der App = Lauf tot | `START_NOT_STICKY`; `restore()` unterbricht |
| F5 | Sideload mit Hausstand, Version nicht unter `9.9.2` | Sideload `9.10.0` |

## Won’t

Lauf ohne offene APK. Auto-Ja. Zweiter permanenter FGS. iOS. Wake-Dienst als Debug.

## Dateien

- `frontend/native/voice/JarvisDebugService.java`
- `JarvisVoicePlugin` `startDebugFg` / `stopDebugFg` / `debugFgStatus` / `emitDebugStop`
- `MainActivity.keepWebViewIfDebug` (`resumeTimers` / `onResume` bei Home)
- `debug-session.ts` koppelt Start/Stop
- `apply-native-tv.mjs` kopiert Service + Manifest `FOREGROUND_SERVICE_SPECIAL_USE`

## DoD

- [x] 169-Votum umgesetzt (Service)
- [ ] Home-Test auf dem physischen Gerät nach Sideload
- [x] `test:014` / `tsc -b` / `test:rest-final` grün
