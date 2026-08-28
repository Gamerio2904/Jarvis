# Sprint 130 — Sideload `6.60`

**Version:** `6.60.0`  
**Status:** CODE  
**Quelle:** [`47-next.md`](../47-next.md) · [`apk.md`](../apk.md)

## Ziel

Handy bekommt denselben Stand wie der Code: Bühne, Globus, Gemini zuerst, Parser `6.51`, Split/Identität/Overlay. Kein Play Store.

## Must

- App-Version `6.60.0`, Android `versionName`/`versionCode` aus `package.json`.
- `releases/Jarvis.apk` (debug-signiert wie die bisherigen Sideloads).
- Docs: Sideload `6.60.0`, Deinstall löscht Keys — erst Hausstand.

## Won’t

Release-Keystore neu erfinden wenn der Debug-Key der Hausstand ist. LocateAnything-GGUF. iOS.

## Done when

APK existiert, versionName `6.60.0`, Browser-Abnahme der 128/129-Prompts grün.
