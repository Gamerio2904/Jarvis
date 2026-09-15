# Sprint 272 — Java-Änderungen auf dem Gerät prüfen

**Version:** `18.1.0` (versionCode `180100` bei nächstem Sideload) — **CODE** Must
**Plan:** [`71-audit.md`](../71-audit.md) §2b, §4
**Mitgeliefert in:** `18.1.0` mit 273–281. **282** bleibt Freeze.

## Ziel

Die 11 Java-Änderungen aus dem Audit §2b sind im Quelltext belegt. Was hier
kein Android-SDK bauen kann, steht als PO-Liste in
[`TEST-18.1.0.md`](../TEST-18.1.0.md).

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S272-1 | Statische Prüfung | `scripts/test-java-audit.mjs` | `START_NOT_STICKY`, `MY_PACKAGE_REPLACED`, `bargeMute`, GPS `handleOnDestroy`, Taschenlampe ohne `CAMERA`, Widget-Toggle, `test()`, `<queries>` |
| S272-2 | PO-Gerät | `TEST-18.1.0.md` | Wecker nach Update, kein Geisteralarm, Sprachmodus am Lautsprecher, Ansage im Fahrmodus |

## Won’t

- APK in dieser Umgebung bauen (kein Android-SDK).
- Die sieben Android-Reste aus §3e außer SMS (275).

## Abbruchkriterium

Ein Wecker klingelt, den niemand gestellt hat, oder einer bleibt nach einem
Update aus. Der Sprachmodus bricht mitten in der Antwort ab.
