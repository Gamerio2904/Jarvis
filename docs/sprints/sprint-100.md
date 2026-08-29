# Sprint 100 — PC live (`1.47.0`)

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | **MUST** |
| Ziel-Version | **`1.47.0`** |
| Quelle | PO: Desktop-Anwendung, live mit dem PC (FIFA, Bildschirm, Maus, Züge, Ordner) |
| Voraussetzung | `1.46.0` |
| Plan | [`28-next.md`](../28-next.md) |

## Ziel

Jarvis steuert den Windows-PC über eine lokale App. Echter Screenshot, echte Maus, echte Starts. Nichts erfinden, wenn die App nicht läuft.

## Must

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| P1 | `JarvisPC.bat` Fenster + Token + LAN | Ohne App: ehrliche Absage |
| P2 | `FIFA starten` sucht Startmenü/EA | Nicht gefunden = so sagen |
| P3 | Bildschirm im Chat, Klick/Maus | Screenshot echt |
| P4 | Ordner unter Benutzerprofil, Löschen nach Ja | Kein stilles Löschen |
| P5 | Sideload `1.47.0` | versionCode 14700 |
| P6 | Kopierfelder IP/Token/Prompts (`1.47.1`) | Ein Klick |

## Probe

`desktop/JarvisPC.bat`. Einstellungen → PC. `PC testen`. `FIFA starten`. `Was siehst du auf dem PC`. `klick Mitte`. `Zeig Ordner Downloads`.

## Won’t

NAS/Python-Backend wiederbeleben, beliebige PowerShell vom Handy, Dateien außerhalb des Benutzerordners, behaupten der Bildschirm sei gelesen ohne JPEG.
