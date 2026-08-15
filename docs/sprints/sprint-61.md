# Sprint 61 — Wake-Word (`1.11.0`)

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Priorität | **SHOULD** |
| Ziel-Version | **`1.11.0`** |
| Quelle | PO 2026-08-15 |

## Must

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| K1 | Opt-in in den Einstellungen: „Auf Jarvis hören“ | Default aus |
| K2 | Wort „Jarvis“ startet den Sprachmodus | Kein Mitschnitt der Umgebung |
| K3 | Handy an, Bildschirm darf aus sein: Vordergrund-Dienst mit sichtbarer Leiste | Nutzer sieht, dass das Mikro an ist |
| K4 | Gerät komplett aus: unmöglich — in der UI so schreiben | Keine falsche Erwartung |
| K5 | Version `1.11.0` + APK | Sideload |

## Probe

1. Opt-in an → Bildschirm aus → „Jarvis“ → Sprachmodus (oder ehrliche Absage, wenn der OEM das Mikro killt).
2. Opt-in aus → kein Dauer-Mikro.
3. Akku-Hinweis in den Einstellungen.

## Won’t

Gerät ohne Strom, Alexa/Google-Zuverlässigkeit, Hotword ohne sichtbaren Dienst, Aufnahme speichern.
