# Sprint 494 — Zwei-Bildschirm-Gold und Release-Gate

**Version:** `18.38.0` — **PLAN** Must  
**Plan:** [`../102-next.md`](../102-next.md)  
**Voraussetzung:** 491–493.

## Ziel

Automatischer Hausstand-Abgleich und gezieltes Öffnen der Planung/Sprints
bestehen einen Ende-zu-Ende-Test auf echten Geräten.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S494-1 | Geräte-Gold | Testanleitung | Einmal koppeln, `Starte den Server`, Verbindung, gleicher Versionsstand, Terminänderung auf beiden Seiten, WLAN-Ausfall und Wiederkehr prüfen. |
| S494-2 | Fenster-Gold | Tablet + Handy | Planung auf Tablet, Sprints des gleichen Projekts auf Handy; Mismatch, fehlendes Pairing und unbekannte Fläche blockieren. |
| S494-3 | Sicherheitsfreigabe | Release-Dokumente | Logs auf Secrets prüfen, Pairing widerrufen, Restore/Konflikt testen; APK erst danach als `18.38.0` freigeben. |

## Abbruchkriterium

Kein Release bei Datenverlust, unverschlüsseltem Verkehr, unbestätigter
Fernsteuerung, Versionsmismatch oder falscher Erfolgsantwort.
