# Sprint 490 — Sync-Gold und Release-Gate

**Version:** `18.37.0` — **PLAN** Must  
**Plan:** [`../102-next.md`](../102-next.md)  
**Voraussetzung:** 487–489.

**Ist im Arbeitsbaum:** Fokussierte Parser-, Sync- und Revisionsprüfungen sowie
ein Android-Debug-Build liefen lokal erfolgreich. Geräteübergreifende
Goldfälle, Wiederholungs-/Abbruchprüfung und Freigabe-Gate sind offen; diese
Version ist weder als Release gebaut noch freigegeben.

## Ziel

Änderungen an Terminen, Aufgaben, Notizen und Hausstanddaten gleichen
wiederholbar ab, ohne gleiche Stände unnötig zu übertragen oder Konflikte zu
verlieren.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S490-1 | Gold | Sync-Eval/Tests | Gleich, älter, neuer, divergent, WLAN-Abbruch, ungültige Nutzlast und Replay als messbare Testfälle. |
| S490-2 | Android | Handy + Tablet | Änderung auf jedem Gerät testen; danach auf beiden derselbe Hash und dieselbe Revision, Konflikt bleibt auf beiden erhalten. |
| S490-3 | Release | APK/Testanleitung | `18.37.0` nur nach automatisiertem Gate und realer Geräteabnahme freigeben. |

## Abbruchkriterium

Ein erfolgreicher Status ohne bestätigte gleiche Revision beider Geräte oder
ein verlorener Konflikt.
