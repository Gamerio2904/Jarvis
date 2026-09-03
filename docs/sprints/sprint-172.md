# Sprint 172 — LocateAnything Sidecar oder Freeze (`4.78`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** |
| Ziel-Version | `4.78.0`–`4.80.0` bei GO; sonst Freeze ohne Versionsbump |
| Quelle | [`54-next.md`](../54-next.md) · Sprint 171 |
| Vorher | **171** GO oder NO-GO |

## Ziel

**GO:** `JarvisSee` localhost, JarvisPC proxyt `/v1/ground`, Status `off|loading|ready|error`. Unsicher = kein Klick. Overlay `Wo ist Speichern` ohne Maus.

**NO-GO:** Freeze. Chat bleibt *Sehen am PC ist aus*. Parser CODE. Keine Dummy-Boxen.

## Must (GO)

| ID | Inhalt |
|----|--------|
| S1 | Sidecar-Status im PC-Cap / Chat ehrlich |
| S2 | `doClick` nur mit Box über Schwelle |
| S3 | `Lies das Foto` bleibt `eye`; `Körper an` bleibt HUD |
| S4 | CI-Stub ohne GPU: Status error, keine Lüge |

## Must (NO-GO)

| ID | Inhalt |
|----|--------|
| N1 | Ein Satz, den der Nutzer hört: Sehen aus, Parser bleibt |
| N2 | Kein totes `ready` |

## Won’t

3B im WASM. APK-Gewichte. FastAPI-Hirn. Beleg → Bank.

## DoD

- [ ] 171-Votum umgesetzt
- [ ] `test:014` Ground-Konflikte grün
