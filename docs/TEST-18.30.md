# Test 18.30 — Sichere Simulation

**Status:** PLAN. Store vor/nach jedem Dry-Run vergleichen.

## SIM-GUI

1. Standardkomponenten aus gültigem Datenmodell rendern; unbekannte
   Komponententypen sichtbar ablehnen.
2. Modelltext mit `<script>`, Eventhandlern, iframe oder ausführbarem CSS
   wird als Text behandelt oder abgewiesen; er läuft nicht.
3. UI-Änderung wird als Diff vor Apply gezeigt. Ablehnen und Undo lassen den
   vorherigen Zustand unverändert.
4. Vorschau ist sichtbar als Mockup markiert und öffnet keine echte
   Gerätefunktion.

## SIM-WORKFLOW

1. Hauptpfad, Timeout, fehlende Eingabe und widersprüchliche Zustände werden
   als Szenarien mit Vorbedingungen und erwarteten Folgen ausgegeben.
2. IndexedDB, Settings, Portfolio, Memory, Netzwerk und Native-Plugins bleiben
   während des Dry-Runs unverändert/unaufgerufen.
3. Modellhypothese, Recherchebeleg und tatsächlich ausgeführter Test sind
   klar verschiedene Evidenztypen.
4. Finding wird erst nach Zustimmung einer Anforderung/Lücke zugeordnet; kein
   Szenario macht einen Sprint automatisch `go`.

## Release-Gate

Automatisierte Side-effect- und Injection-Tests sowie manuelle Android-
Abnahme müssen grün sein, bevor `18.30.0` / `183000` freigegeben wird.
