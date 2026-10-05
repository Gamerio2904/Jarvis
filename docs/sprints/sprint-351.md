# Sprint 351 — Instagram Reels (Timo), Löschen nach Erfolg

**Version:** `18.13.0` — **PLAN** Must
**Plan:** [`84-next.md`](../84-next.md)
**Voraussetzung:** 350. Meta App Review + Professional Account +
Facebook Login for Business — sonst nur Testnutzer, ehrlich sagen.

## Ziel

Nach Ja geht der Clip über die **offizielle** Reels-Kette auf das
Nutzer-Instagram (Timo-Handle vom Nutzer). Danach lokale Datei weg.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S351-1 | Login | Settings wie Spotify | Facebook Login for Business; Token nicht im Chat |
| S351-2 | Handle | Settings | Nutzer tippt Timo-Handle; Token-User muss passen |
| S351-3 | Quota | `GET content_publishing_limit` | live `quota_total`/`quota_usage`, nichts fest auf 50 |
| S351-4 | Upload | `clip-ig.ts` | `media_type=REELS`, `upload_type=resumable`, `rupload.facebook.com` |
| S351-5 | Publish | nach Ja | `media_publish` erst wenn Container `status_code` fertig; 24-h-Verfall ehrlich |
| S351-6 | Reap | `clip-store` | Datei löschen nur nach bestätigtem Publish; Metadaten bleiben |
| S351-7 | Test | Pack ig | Mock Graph; kein stiller Publish; Fehlschlag lässt Datei liegen |

## Won’t

instagrapi / sessionid. Instagram-Login + öffentliche `video_url`.
Accessibility. „ist oben“ ohne `media_publish`. Löschen bei Fehler.
TikTok in diesem Sprint.

## Abbruchkriterium

Ein inoffizieller Client. Oder die Datei verschwindet vor dem
bestätigten Publish. Oder ein Handle, den der Nutzer nicht gesetzt hat.
