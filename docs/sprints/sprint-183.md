# Sprint 183 — OEM-Akku / Hersteller-Killer **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** |
| Ziel-Version | nach PO **178**; Patch nur wenn das Gerät den FGS killt |
| Quelle | [`55-next.md`](../55-next.md) |
| Vorher | 170/180 FGS CODE. 178 Gerät-Protokoll |

## Ziel

Wenn Xiaomi/Samsung/… den Debug-Lauf trotz FGS killen: ehrliches Banner plus Hersteller-Schritte. Kein Fake-Always-On.

## Must

| ID | Inhalt |
|----|--------|
| O1 | Repro: Home 30 s auf dem OEM-Gerät |
| O2 | Satz im Debug-Start, wenn der Lauf tot ist |
| O3 | Kein zweites permanents FGS, kein Autostart-Hack ohne PO |

## Won’t

Root. Hersteller-Whitelist erfinden. iOS.

## DoD

- [ ] Gerät-Protokoll 178 liegt vor
- [ ] Nur bauen wenn rot
