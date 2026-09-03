# Sprint 172 — LocateAnything Freeze (`4.78`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** (Freeze) |
| Ziel-Version | Freeze ohne eigenen Sideload-Bump; Satz in App `9.10.0` |
| Quelle | [`54-next.md`](../54-next.md) · Sprint 171 **NO-GO** |
| Vorher | **171** NO-GO |

## Ziel

**NO-GO:** Freeze. Chat bleibt *Sehen am PC ist aus*. Parser CODE. Keine Dummy-Boxen. Kein Sidecar.

## Must (NO-GO)

| ID | Inhalt | Stand |
|----|--------|-------|
| N1 | Ein Satz, den der Nutzer hört: Sehen aus, Parser bleibt | `capMissingReply('ground')` + `pc.ts` nennen 3060-Freeze |
| N2 | Kein totes `ready` | `pcActionVerified` vision ≠ ready |

Parser `ground-parse` / `/v1/ground` unverändert.

## Won’t

3B im WASM. APK-Gewichte. FastAPI-Hirn. Beleg → Bank. JarvisSee ohne 3060.

## DoD

- [x] 171-Votum umgesetzt (Freeze)
- [x] Ground-Konflikte / `test:014` / `test:rest-final` grün
