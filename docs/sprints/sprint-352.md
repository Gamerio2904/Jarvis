# Sprint 352 — 10/5-Notify und TikTok (beides)

**Version:** `18.13.0` — **PLAN** Must (Notify) / Should (TikTok)
**Plan:** [`84-next.md`](../84-next.md)
**Voraussetzung:** 351.

## Ziel

Wenn der Vault nach dem Löschen 10 oder 5 Clips hat, kommt eine
Benachrichtigung. Auf Wunsch zweites Ziel TikTok.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S352-1 | Schwelle | nach Reap | `prev > 10 ∧ n ≤ 10` und `prev > 5 ∧ n ≤ 5` |
| S352-2 | Notify | `scheduleNotify` / `JarvisNotify` | `at = now`; IDs `clip-remain-10` / `clip-remain-5`; kein `addReminder` |
| S352-3 | Dedupe | Settings-Flags | einmal je Abwärtsschwelle; über der Schwelle Flag zurück |
| S352-4 | Sprung | 12→4 | beide Notifies; Auffüllen keine |
| S352-5 | TikTok | `clip-tt.ts` | Inbox `video.upload` + `FILE_UPLOAD` zuerst; Direct Post nur mit `video.publish` |
| S352-6 | Beides | Reap | Datei erst weg, wenn **alle** gewählten Ziele bestätigt; Inbox ≠ online |
| S352-7 | Test | Pack low + tt | Gold=TEST_PROMPTS; 0-Clips kein Must |

## Won’t

Notify bei jedem Löschen. Kalender-Erinnerung. `PULL_FROM_URL` ohne
verifizierte Domain. „TikTok ist online“ nach Inbox. Löschen, wenn
IG fertig und TikTok noch offen.

## Abbruchkriterium

Spam-Notify. Oder Datei weg, obwohl ein gewähltes Ziel offen ist.
Oder inoffizielle TikTok-API.
