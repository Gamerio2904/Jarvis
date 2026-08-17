# 23 — Alltag 1.29 (Suche, Fire TV, GUI, Widget, Ventilator)

PO 2026-08-17: Screenshot-Suche ist leer, Fire TV behauptet „nur in der Android-App“ obwohl die APK offen ist, GUI soll schlichter (Icons, runder Mic), Widget 2×4 mit Sprache an/aus, Deckenventilator steuern ([Amazon B0CGQSNR76](https://www.amazon.de/dp/B0CGQSNR76)).

Reihe davor: [`22-next.md`](./22-next.md). App vorher: Sideload **`1.28.3`**.

Eine Sideload-Stufe, wie `1.24.0`.

## Reihenfolge

| Version | Inhalt | Status |
|---------|--------|--------|
| **`1.29.0`** | Suche + Fire TV + GUI-Icons + Widget 2×4 + Ventilator | **CODE** |

Sprint: [`sprint-81.md`](./sprints/sprint-81.md).

## Suche (Screenshot)

„Suche nach Kuchenrezepten“ lieferte das Canned „Netz hat nicht geantwortet“ plus Badge **empty** und „keine Links“, obwohl Gemini gelaufen ist.

| ID | Fix |
|----|-----|
| R1 | Gemini-Text **behalten**, wenn Text da ist — nicht durch Canned ersetzen |
| R2 | Quellen aus Grounding, Markdown-URLs, DuckDuckGo, Wikipedia |
| R3 | Badge nie das Wort `empty`; Query ohne führenden Punkt |
| R4 | Composer: Textfeld volle Breite, Buttons darunter — kein senkrechtes „Nachricht an Jarvis“ |

## Fire TV

`'fireKey' in plugin` ist bei Capacitor-Proxys falsch → immer „nur in der Android-App“. In der APK: Plugin aufrufen. Browser: ehrliche Absage.

## GUI

Weniger Text, mehr Icons. Mic **rund**. Foto / Senden als Icon-Knöpfe. Topbar: Zahnrad statt „Einstellungen“.

## Widget

2 Zellen hoch, 4 breit. Nächster Termin, Wetterzeile, **Mikro an/aus** (Wake-Word), Tippen öffnet Jarvis.

## Ventilator

Amazon-ASIN `B0CGQSNR76`. Handy spricht kein 433-MHz. Default: **Broadlink RM4 Pro** im WLAN, Original-Fernbedienung lernen. Chat: `Ventilator an/aus`, `Stufe 1–3`, `Ventilator Licht`. Ungepaart = ehrlich. Kill-Switch `fan_enabled`.

Ohne Brücke bewegt sich der Motor nicht. Eine Steckdose ersetzt keine Stufen.

## Probe

1. Research an, Gemini an: `Suche nach Kuchenrezepten` → Antwort **und** klickbare Links, kein Badge „empty“.
2. Composer: Platzhalter eine Zeile, Mic rund.
3. Fire TV testen in der APK: Ergebnis unter dem Knopf, nicht „nur in der Android-App“.
4. Widget neu legen (2×4), Mikro umschalten.
5. Haus: Brücke IP, lernen, `Ventilator an`.

## Won’t

Alexa, Tuya-Cloud, Play Store, iOS, mehrere Ventilatoren, Zimmerlampen.
