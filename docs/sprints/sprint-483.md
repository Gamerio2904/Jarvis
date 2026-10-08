# Sprint 483 — Server ausdrücklich starten

**Version:** `18.36.0` — **CODE\*** Must  
**Plan:** [`../102-next.md`](../102-next.md)  
**Voraussetzung:** Baseline `18.31.5` auf Handy und Tablet abgenommen; Sprints 467–482 freigegeben.

**Ist im Arbeitsbaum:** Tabletmodus und Hausstand-Server sind getrennt;
Start, Stopp und Status sind per Chat-Befehl verdrahtet. Lifecycle-,
Berechtigungs- und Geräte-Goldtests sowie das Release-Gate bleiben offen.

## Ziel

`Starte den Server` startet den Tablet-Hausstanddienst; `Stoppe den Server`
beendet ihn sichtbar und zuverlässig. Tabletmodus und Serverstatus sind getrennt.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S483-1 | Intent | `tablet-mode.ts` `tablet-chat.ts` | Befehle starten/stoppen den nativen Dienst, melden dessen echten Zustand und erfinden keinen Erfolg. |
| S483-2 | Lifecycle | `JarvisHausPlugin.java` `JarvisHausService.java` | Start/Stop, WLAN-Wechsel, Permission-Fehler und Prozessende halten Status und Benachrichtigung konsistent. Neustart nur nach ausdrücklicher Opt-in-Einstellung. |
| S483-3 | Tests | Tablet-Parser- und Native-Service-Tests | No-WLAN, Port belegt, Stop, Force-Stop und verweigerter Vordergrunddienst liefern korrekten Status. |

## Abbruchkriterium

Die Oberfläche meldet den Server als aktiv, obwohl der Listener nicht erreichbar
ist, oder der Server startet ohne Nutzeraktion/Opt-in.
