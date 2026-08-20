# Sprint 104 — Uhrzeit, Ort, Auto-Research (`2.2.0`)

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | **MUST** |
| Ziel-Version | **`2.2.0`** |
| Quelle | PO-Screenshots: Uhr, Lage, BIP, Tabelle |
| Voraussetzung | `2.1.1` |
| Plan | [`30-next.md`](../30-next.md) |

## Ziel

Gerätzeit und GPS nutzen. Live-Fakten mit Gemini selbst suchen, statt Wissenslücken vorzulesen.

## Must

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| P1 | Uhrzeit vom Gerät | `Wie spät ist es?` nennt die Handy-Uhr |
| P2 | Standort ohne Wohnort-Raten | `weißt du wo ich bin` → GPS oder Freigabe |
| P3 | BIP / aktuelle Zahlen | `isLiveLookup` trifft, Suche läuft ohne das Wort suche |
| P4 | Wissenslücke | „keine verifizierten Zahlen“ / „kein Systemzugriff“ → nochmal Netz |
| P5 | Tabelle als Text | keine Absage „Format“, Zahlen nur aus Treffern |
| P6 | Sideload `2.2.0` | versionCode 20200 |
| P7 | Testprompts kopieren (`2.2.1`) | Einstellungen → Tests, ein Klick |
| P8 | Tests raus aus der APK (`2.2.2`) | Keine Kopierfelder in Settings |

## Probe

`Wie spät ist es?` · `Wo bin ich?` · `Was ist der BIP in Deutschland` · Tabelle-Frage · `Wetter heute` bleibt Open-Meteo. Ab `2.2.3`: `Guten Morgen` ist Begrüßung, kein Wetter-Brief und kein Einkauf.

## Won’t

BIP erfinden, Ingersheim raten, Tuya-Cloud, Tapo, Apple CarPlay.
