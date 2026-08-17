# Android-APK — `1.29.0`

**1.29.0:** Suche mit Links, Fire TV in der App, Icon-GUI, Widget 2×4 mit Mikro, Ventilator über Brücke.

## Download

**APK `1.29.0`:**  
https://github.com/Gamerio2904/Jarvis/raw/cursor/updates-1-29-1-33-3638/releases/Jarvis.apk

- Dateiname: `Jarvis.apk`
- versionName `1.29.0` · versionCode `12900`
- App-ID `local.jarvis.app`

1. Über 1.28.3 installieren (unbekannte Quellen).
2. Research + Gemini an: `Suche nach Kuchenrezepten` — Antwort und Links, kein Badge „empty“.
3. Fire TV testen in der APK — Ergebnis unter dem Knopf.
4. Widget neu legen (2×4), Mikro an/aus.
5. Ventilator: Einstellungen → Haus, Brücke lernen, dann `Ventilator an`.

## Ventilator steuern

Das Handy sendet **kein** 433-MHz. Es braucht eine **Broadlink RM4 Pro** (IR+RF) im **gleichen WLAN** wie das Handy — nicht Gastnetz. RM Mini reicht nicht (nur IR). Eine smarte Steckdose schaltet nur Strom, keine Stufen.

1. RM4 Pro einstecken, Broadlink-App nur zum WLAN-Paaren (danach nicht nötig). Feste IP im Router merken.
2. In Jarvis: **Einstellungen → Haus** → Schalter **Ventilator an**.
3. **Suchen** tippen oder die Brücken-IP eintragen → **Testen**. Die Meldung steht unter den Knöpfen.
4. **Lernen:** nacheinander An, Aus, Stufe 1, Stufe 2, Stufe 3, Licht. Wenn Jarvis „Fernbedienung drücken“ sagt: Original-Fernbedienung auf die RM4 Pro richten und die Taste halten.
5. Im Chat oder per Sprache: `Ventilator an`, `Ventilator aus`, `Stufe 2`, `Ventilator Licht`. Danach kurz `aus` / `schneller` / `langsamer`.

Ohne gelernte Taste oder mit ausgeschaltetem Schalter sagt Jarvis ehrlich Bescheid — kein Fake-Erfolg.
