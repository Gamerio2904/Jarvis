# 23 — Deckenventilator (`1.29`)

PO 2026-08-16: Jarvis soll den **Deckenventilator** steuern — an, aus, Stufe, Licht — per Sprache und Chat, wie den Fernseher.

Reihe davor: [`22-next.md`](./22-next.md) (`1.27`–`1.28`). App jetzt: Sideload **`1.28.2`**.

Status: **PLANNED** — noch kein Code. Umsetzung erst nach Sideload-Abnahme von `1.28.2` und Klärung **Q40** (welche Fernbedienung / Brücke).

## Leitentscheidung

Das Handy spricht **kein 433-MHz-Funk**. Fast alle Deckenventilatoren in DE kommen mit einer Funk-Fernbedienung, nicht mit WLAN. Jarvis braucht deshalb **eine Brücke im selben WLAN**, analog Tizen/ADB beim TV.

| Thema | Entscheidung |
|-------|----------------|
| Geräte | **Ein** Ventilator (Wohnzimmer), wie ein Samsung |
| Kanal | Nur LAN, kein Amazon/Google/Tuya-Cloud-Konto in Jarvis |
| Default-Brücke | **Broadlink RM4 Pro** (IR + 433-MHz-RF, lokal, Codes auf dem Handy) |
| Alternative | Bond Bridge (wenn die Marke auf der Bond-Liste steht) oder lokales WLAN-Modul, falls der Ventilator schon smart ist |
| Confirm | Sofort ausführen, kein Ja/Nein |
| Kill-Switch | `fan_enabled`, ungepaart = ehrliche Meldung, kein Fake-Erfolg |
| Settings | Neues Thema **Haus** (flach, neben Fernseher) |

Ohne Brücke im WLAN kann Jarvis den Ventilator **nicht** bewegen. Eine Smart-Steckdose oder ein Wandschalter ersetzt die Fernbedienung nicht: dann gibt es nur Strom an/aus, **keine** Stufen.

Offen: [`08-open-questions.md`](./08-open-questions.md) **Q40**.

## Reihenfolge

| Version | Inhalt | Warum getrennt | Status |
|---------|--------|----------------|--------|
| **`1.29.0`** | Brücke + Lernen + Chat an/aus/Stufe/Licht | Erstes Hausgerät nach dem TV | **PLANNED** |

Sprint: [`sprint-81`](./sprints/sprint-81.md). Nachzieher als `1.29.1`, falls RF-Lernen hakelig ist.

## Was der Nutzer sieht

Einstellungen → **Haus**:

1. Brücke suchen oder IP eintragen (gleiches WLAN).
2. **Lernen:** nacheinander An, Aus, Stufe 1/2/3, Licht — jeweils die Original-Fernbedienung drücken.
3. **Testen** — Ergebnis direkt unter dem Knopf (wie Fire TV in `1.28.2`).
4. Toggle Ventilator an/aus (Kill-Switch).

Chat / Sprache (Anker `Ventilator`, `Lüfter`, `Deckenventilator`):

| Satz | Aktion |
|------|--------|
| `Ventilator an` / `Lüfter an` | An (letzte Stufe oder Stufe 2, je nach gelerntem Code) |
| `Ventilator aus` | Aus |
| `Stufe 1` / `2` / `3` | Nach Ventilator-Turn oder mit Anker |
| `schneller` / `langsamer` | Relative Stufe, nur nach Ventilator-Turn |
| `Ventilator Licht an` / `aus` | Licht am Ventilator, nicht die Zimmerlampe |

Ohne Anker ist `Licht an` **kein** Ventilator (sonst kollidiert es mit späterem Hauslicht). Follow-up `aus` gilt nur direkt nach einem Ventilator-Turn.

Router: **vor** dem LLM, neben TV. Parser lokal, 0,5B entscheidet das nicht.

## Architektur

```text
Chat / Settings → Haus
    → fan-parse.ts (Anker, Stufe, Licht)
    → fan.ts (enabled? Codes da?)
    → Capacitor-Plugin (Android)
         • Broadlink: UDP lokal, lernen, senden
         • optional Bond: HTTP lokal, Token auf dem Gerät
    → Reply nur aus Plugin-Ergebnis
```

Gelerntes liegt in Settings auf dem Handy (Hex/IDs), **kein** Key in der APK, kein Cloud-Konto.

## Transport (Default und Ausnahmen)

| Ventilator heute | Was Jarvis nutzt | Extra-Hardware |
|------------------|------------------|----------------|
| Funk-Fernbedienung (typisch) | Broadlink RM4 Pro lernt die Tasten | RM4 Pro im WLAN, feste IP sinnvoll |
| Bond-fähige Marke, Bond schon da | Bond Local API | keine weitere |
| Tuya / Smart Life / WiFi-Modul | nur **lokales** Protokoll, Key einmalig auf dem Handy | kein Tuya-Cloud-Login in Jarvis |
| Nur Zugschalter / Wandlicht | nicht machbar für Stufen | Brücke oder smartes Modul nachrüsten |

RM4 **Mini** (nur Infrarot) reicht bei den üblichen Funk-Ventilatoren **nicht**.

## Must (`1.29.0`)

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| F1 | Native Brücke Broadlink (UDP), Codes lokal | Senden ohne Cloud |
| F2 | Settings Haus: IP, lernen, testen, Kill-Switch | Ergebnis sichtbar unter Testen |
| F3 | Chat/Sprache: an, aus, Stufe 1–3, Licht | Sofort, Siezen, kein Confirm |
| F4 | Ungepaart / ausgeschaltet: ehrlich, keine Fake-Claims | Wie TV |
| F5 | Version `1.29.0` + APK | Sideload nach `1.28.2` |

## Should

| ID | Inhalt |
|----|--------|
| F6 | Sommer/Winter (Drehrichtung), wenn die Fernbedienung die Taste hat |
| F7 | `schneller` / `langsamer` als Follow-up |
| F8 | Bond als zweite lokale Backend-Wahl, falls Q40 so ausfällt |
| F9 | Chip `Ventilator an` in den Test-Prompts |

## Won’t

Alexa, Google Home, SmartThings, Tuya-Cloud in der App, Home Assistant als Pflicht-Hub, Matter-Haus, mehrere Ventilatoren, Zimmerlampen, Steckdosen-Zoo, Confirm-Dialog, Play Store, iOS.

## Probe

1. RM4 Pro (oder Bond) im selben WLAN, IP in Jarvis.
2. Lernen: An, Aus, Stufe 2, Licht — Original-Fernbedienung.
3. **Testen** zeigt Erfolg oder klare Absage.
4. `Ventilator an` → läuft. `Stufe 3`. `Ventilator aus`.
5. Kill-Switch aus: Chat sagt, dass der Ventilator aus ist, Motor bleibt.
6. Ohne gelernte Codes: keine Behauptung „habe ich gemacht“.

## Blocker vor dem Bau

**Q40:** Welche Fernbedienung liegt beim Ventilator (Funk/IR), oder ist schon Broadlink / Bond / Tuya / WLAN-Modul da?

Ohne Antwort gilt der Default **Broadlink RM4 Pro**. Wenn nur ein Wandschalter existiert: erst Hardware, dann Code.
