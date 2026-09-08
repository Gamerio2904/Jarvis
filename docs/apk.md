# Android-APK — Sideload `15.1.0`

App-Code **`15.1.0`**. Sideload-APK **`15.1.0`**. LocateAnything-Gewichte nicht in der APK.

**Hirn (ab 15.1):** **Groq primär** (Key in Einstellungen). **Gemini Spezialist** (Vision, Deep Research/Grounding, optional TTS). Lokales 0,5B nur Fallback. Rollback: `brain_v2: false` → Gemini zuerst wie `13.44`.

**Agenten-Netzwerk:** Director + 60 Domänen-Agenten, Curator für Memory-Writes, Agenten-Karte in Lage (`body_view=agents`). Rollback: `agent_network_v2: false` → flaches `routeRegistry`.

**Deinstall** (andere Signatur): WebView-Daten weg. Vor Neuinstall Hausstand exportieren.

**15.1.0:** Agenten-Netzwerk (228–235) + Dual Brain (236–237): `brain-orchestrator`, micro-clarify/merge/research-lite, Debug-Export mit `agent_traces` / `brain_slots`.

**13.44.0:** Sprachmodus: TV-Stimme aus dem Mic, Autokorrektur (`fanseher` / `t v`), 1–2 Sätze, eine TTS-Lane. Kein Whisper, kein Piper-ONNX.

**13.31.7:** Download-Button Liquid-Fill (Hausstand/Debug).

**13.31.6:** Navigation-Island, gleitender Tab-Kreis (Chat/Lage/Hören/Kalender/Mehr).

**13.31.5:** PC per QR koppeln.

## Download

**Fertige APK `15.1.0`:**  
https://github.com/Gamerio2904/Jarvis/raw/main/releases/Jarvis.apk

- Dateiname: `Jarvis.apk`
- versionName `15.1.0` · versionCode `150100`
- App-ID `local.jarvis.app`

1. Über die vorherige Sideload-APK installieren (oder nach Hausstand-Export neu).
2. **Groq-Key** unter Einstellungen → API-Keys (Smalltalk primär). **Gemini-Key** für Vision/Deep Research.
3. Tests: Einstellungen → Tests oder siehe [`TEST-15.1.0.md`](./TEST-15.1.0.md).

## Build lokal

```bash
./build-apk.sh
```

Ausgabe: `releases/Jarvis.apk`, `frontend/dist-apk/jarvis-debug.apk`.
