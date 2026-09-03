# Sprint 193 — Test-Tor Memory Gerät (`10.51.0`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** / PO |
| Ziel-Version | **`10.51.0`** |
| Quelle | [`56-next.md`](../56-next.md) §10 · Debug [`44-next.md`](../44-next.md) |
| Vorher | Sprint 192 Parser-Gold |

## Ziel

Auf **einem** Gerät die Gold-Fragen G1–G6 sprechen/tippen. Vier Phasen des Debug-Laufs. Schriftlich rot/grün.

## Must

| ID | Inhalt |
|----|--------|
| T1 | Hausstand vorher. Sideload nur wenn `10.50` in einer APK liegt — sonst Emulator+Parser reicht nicht als Erfolgssatz für Mic |
| T2 | Gruppe Memory-10 im Debug oder Kopierprompts |
| T3 | Kein „geht“ ohne Gerät-Protokoll für Stimme; Parser-Gold bleibt 192 |

## Won’t

Remote-PO als Ersatz. Auto-Ja. e5 in der Sideload ohne 195-GO.

## DoD

- [ ] Gerät-Protokoll G1–G6
- [ ] Wie 178: rot → Patch-Sprint, nicht vertuschen
