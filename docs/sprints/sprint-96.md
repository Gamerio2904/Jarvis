# Sprint 96 — CarPlay ehrlich + Alltag am Steuer (`1.43.0`)

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | **MUST** |
| Ziel-Version | **`1.43.0`** |
| Quelle | PO-Screenshot: CarPlay-Lügen, Overlay nicht offen; Restweg, POI, Arbeit, System, Akku, Anruf, SMS |
| Voraussetzung | `1.42.0` |
| Plan | [`28-next.md`](../28-next.md) |

## Ziel

Fahrmodus intern und ehrlich. Overlay wechselt. Restweg aus der Route. Nächster POI ohne erfundene Stunden. Arbeit/Freundin/Zuhause aus dem Speicher. Gerät anstoßen ohne heimliche Schalter. Anruf und SMS nur System-UI.

## Must

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| C1 | Nacktes `Carplay` öffnet Fahrmodus, kein Apple-Märchen | Parser vor LLM |
| C2 | `Öffne das overlay` wechselt den Spotify-Tab | Immer wechseln |
| C3 | `Wie weit noch` spricht Restweg oder fragt | Live-Route |
| C4 | `nächste Apotheke` / POI → OSM + Fahrmodus | Keine Öffnungszeiten |
| C5 | Arbeit/Freundin/Zuhause merken und fahren | Nicht „Arbeit“ geocoden |
| C6 | Akku, Netz, Taschenlampe; WLAN/BT/DND nur Seite | Kein Schalter-Flip |
| C7 | Anruf-Wählhilfe, SMS-Entwurf | Nie verbunden/gesendet |
| C8 | Version `1.43.0` Sideload | versionCode 14300 |

## Probe

`Carplay` → Fahrmodus intern. `Öffne das overlay` → Spotify. Mit Route: `Wie weit noch`. `nächste Apotheke`. `Fahr zur Arbeit` nach `Ich arbeite in …`. `Wie voll ist der Akku`. `Ruf mal die Freundin`. SMS: Chip/Entwurf, selbst senden.

## Won’t

Apple CarPlay, heimlich WLAN umlegen, SMS im Hintergrund senden, erfundene Ziele/Musik/Öffnungszeiten.
