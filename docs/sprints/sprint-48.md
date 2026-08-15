# Sprint 48 — TV verbinden & steuern (`0.14.1`)

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | **MUST** — geparktes `0.11` in der APK live |
| Ziel-Version | **`0.14.1`** |
| Quelle | PO 2026-08-15: Fernseher-Steuerung und Connecten sollen funktionieren |
| Voraussetzung | Sprint 47 / `0.14.0` (Parser/Routing sitzt) |

## Ziel

Ein Samsung-Tizen-TV im selben WLAN: **suchen, koppeln, testen**, dann per Chat **an/aus, Lautstärke, Mute, HDMI**. Kein neues Produkt — das alte TV-Soll, on-device.

## Must

| ID | Story | Done wenn |
|----|-------|-----------|
| V1 | **Native Brücke** — Capacitor/Android: WOL (UDP), Tizen-WS (8001/8002), Token auf dem Gerät | WebView allein reicht nicht; Keys gehen |
| V2 | **Suchen** — Settings listet Tizen-Geräte | PO wählt den Wohnzimmer-TV |
| V3 | **Koppeln** — Button + Hinweis „am TV erlauben“ | Token bleibt nach App-Neustart |
| V4 | **Testen** — harmloser Key oder Status; Ergebnis in UI | erreichbar ja/nein, ehrlich |
| V5 | **Chat** — „Fernseher an/aus“, „lauter/leiser/stumm“, „HDMI 2“; Anker `Fernseher`/`TV` | Sofort, kein Confirm |
| V6 | **Kill-Switch + Ehrlichkeit** — `tv_enabled` aus oder ungepaart → keine Keys, keine Fake-Claims | Live |
| V7 | Follow-up „lauter“ nur nach TV-Turn; WOL-Misserfolg klar | Analog `0.11.1` |
| V8 | Version `0.14.1` | Tag **`v0.14.1`** |

## Should

| ID | Inhalt |
|----|--------|
| V9 | MAC für WOL in Settings sichtbar/editierbar |
| V10 | HDMI-Synonyme (hdmi 1, Quelle 2) |
| V11 | Gastnetz/AP-Isolation → verständlicher Fehler |

## Won’t

- SmartThings-Cloud
- Apps (Netflix, YouTube)
- Mehrere TVs
- Fire TV / Alexa
- Confirm-Dialog

## Architektur

```text
Settings / Chat
    → tv.ts (Parser, Anker, enabled?)
    → Capacitor-Plugin
         suchen | pair | wol | key
    → Reply nur aus Plugin-Ergebnis
```

## Exit / Abnahme

PO am eigenen Tizen: suchen → koppeln → Test → aus der APK an, aus, Vol, HDMI. Ohne Haken am TV kein Erfolg. Reihe `0.14` zu, wenn das sitzt.

## Danach

Nachzieher als `0.14.2` falls nötig. TTS / `1.0.0` — **PO-Kommando**.
