# Android-APK — Sideload `10.60.1`

App-Code und Sideload stehen auf **`10.60.1`** (Kugel-Zoom, Bundesliga-Tabelle, Storyline-Parser). LocateAnything-Gewichte nicht in der APK.

**Hirn:** Overlay **Gemini zuerst**. Einstellungen → Cloud: Gemini-Key (Toggle an). Groq Backup. Lokales 0,5B nur letzter Fallback — nicht nötig für Timer, Kugel, Wetter.

**Deinstall** (andere Signatur): WebView-Daten weg — Keys, Nummern, Erinnerungen. Hausstand-Export ist **CODE** ([`38-next.md`](./38-next.md)): vor Neuinstall Einstellungen → Hausstand → Exportieren. GGUF ebenfalls neu laden.

**Vor dem Überspielen:** Hausstand exportieren.

**10.60.1:** Fly-to Tokio (GPS überschreibt Stadt nicht). Küstenlinien dünner. Bundesliga = OpenLigaDB-Tabelle (Platz, Punkte, Tore). Research bei Vergleich/Erklärung. Hotel+Kosten nicht mehr als Wetter-Ort. HTML-Entities in Quellen.

**10.60.0:** Schema/Gate/Retrieve 2/Graph/Gold/Experience. Tests-Reiter: Memory-10 + Storylines. 195 e5 Freeze. Gerät-Protokoll G1–G6 bleibt Sprint **193** PO.

## Download

**Fertige APK `10.60.1`:**  
https://github.com/Gamerio2904/Jarvis/raw/cursor/plan-10-semantic-memory-7d74/releases/Jarvis.apk

Datei im Repo: `releases/Jarvis.apk`.

- Dateiname: `Jarvis.apk`
- versionName `10.60.1` · versionCode `106001`
- App-ID `local.jarvis.app`

1. Über die vorherige Sideload-APK installieren (oder nach Hausstand-Export neu).
2. App öffnen → **Gemini-Key eintragen** (oder Fertig — Tools ohne Modell).
3. Optional Groq. 0,5B nur Backup.
4. Tests: Einstellungen → Tests → Storylines oben, Memory-10 darunter.
