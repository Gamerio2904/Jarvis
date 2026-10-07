# Sprint 470 — Router-Baseline und Soup-Vergleich

**Version:** `18.32.0` — **PLAN** Must  
**Plan:** [`../101-next.md`](../101-next.md)  
**Voraussetzung:** Sprint 469.

## Ziel

Das bestehende Routing und ein möglicher Soup-Klassifikator werden auf
denselben Prüffällen verglichen. Modellvorschläge beeinflussen keine Aktionen.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S470-1 | Bestehendes Routing messen | Eval-Runner | Treffer, Verwechslungen, Rückfragefälle und falsche ausführbare Routen pro Kategorie ausgeben |
| S470-2 | Soup-Machbarkeit prüfen | Eval-/Build-Doku | Lizenz, Modell, benötigte Python-/GPU-Umgebung, Exportformat und Inferenzoptionen verifizieren |
| S470-3 | Vorschläge im Schattenlauf | Eval-Runner | Modellresultat nur protokollieren; bisheriger Router entscheidet unverändert |
| S470-4 | Release-Gate `18.32.0` | Goldtests und Android-Gerät | Keine erhöhte Rate falscher ausführbarer Aktionen; Qualität, Laufzeit und Offline-/Fehlerverhalten messen |

## Abbruchkriterium

Wenn ein passendes Modell nicht exportierbar, rechtlich unklar oder schlechter
als das bestehende Routing ist, wird kein Modell in die App übernommen.
