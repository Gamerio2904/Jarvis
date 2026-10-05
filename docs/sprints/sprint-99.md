# Sprint 99 — Anruf und SMS mit Nachfrage (`1.46.0`)

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | **MUST** |
| Ziel-Version | **`1.46.0`** |
| Quelle | PO: Bro anrufen direkt; Nachricht senden, aber mit Nachfragen |
| Voraussetzung | `1.45.0` |
| Plan | [`28-next.md`](../28-next.md) |

## Ziel

Bestehende Kontakte (Bro, Freundin, Mama, …) wirklich anrufen und SMS senden. Immer erst nachfragen. Kein Abheben/Zustellung erfinden.

## Must

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| K1 | `Bro anrufen` → Nachfrage, dann ACTION_CALL | Nie ohne „ja“ |
| K2 | Nachricht/SMS → Text vorlesen, dann senden | Ohne Text nachfragen |
| K3 | Ohne Nummer: Tel erfragen, dann trotzdem Nachfrage | Wie bisher speichern |
| K4 | Version `1.46.0` Sideload | versionCode 14600 |

## Probe

`Bro, Tel …`. `Bro anrufen` → „Soll ich anrufen?“ → `Ja`. `Nachricht an Bro ich bin da` → „Senden?“ → `Ja`. `Nein` bricht ab.

## Won’t

Stilles Senden, „verbunden“/„zugestellt“ behaupten, Apple-Anrufe, WhatsApp.
