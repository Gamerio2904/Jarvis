# 84 — Mister-Beats-Clips (Timo Instagram, optional TikTok) **PLAN** (`18.13.0`)

PO: Clips an Jarvis schicken. Jarvis organisiert Beschreibung,
Hochladen und Konto. Ziel zuerst **Timo Instagram**, auf Wunsch
**beides** (Instagram + TikTok). Hochgeladene Dateien löschen.
Bei **10** und **5** verbleibenden Clips benachrichtigen.

Kein Code in dieser Etappe. Sideload bleibt `18.12.0`.

## 0. Quellen (Research)

| Quelle | Was sie hergibt | Was nicht |
|--------|-----------------|-----------|
| [IG Content Publishing](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/content-publishing/) · [IG User Media](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media/) | Professional Account, Container → `media_publish`, Reels `media_type=REELS` | Stilles Posten ohne App-Review; privates Hobby-Konto |
| [Resumable Uploads](https://developers.facebook.com/docs/instagram-platform/content-publishing/resumable-uploads/) | Lokale Datei über `rupload.facebook.com`, nur **Facebook Login for Business** | Instagram-Login allein: kein rupload, braucht öffentliche `video_url` |
| [content_publishing_limit](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/content_publishing_limit/) | Live `quota_total` / `quota_usage` (Referenz oft 50 / 86400 s) | Hart codierte 50 — Meta-Seiten widersprechen sich (50 vs 100) |
| [TikTok Inbox Upload](https://developers.tiktok.com/doc/content-posting-api-reference-upload-video) | `video.upload` + `FILE_UPLOAD`, Nutzer beendet in TikTok | „Ist online“ ohne Inbox-Klick |
| [TikTok Direct Post](https://developers.tiktok.com/doc/content-posting-api-reference-direct-post) | `video.publish` + `FILE_UPLOAD`, App muss freigegeben sein | Ungenehmigte Clients: oft nur privat / gesperrt |
| Jarvis Ist [`66-agents-ist.md`](./66-agents-ist.md) · [`70-next.md`](./70-next.md) §0b | Director **einen** Agenten pro Zug; `scheduleNotify` / `JarvisNotify` | Kein 5. Hirn, kein LLM-Organizer-Schwarm |
| WhatsApp-Muster [`81-next.md`](./81-next.md) | Senden erst nach Ja, nie Accessibility | Stilles Tippen in Instagram/TikTok |

**Konto:** Öffentliche Suche liefert keinen belegten Handle für
„Mister Beats / Timo Instagram“. `@timo`, `@iammrbeat`, `@timbeatz19`
sind andere Leute. Handle **nur der Nutzer**, nie erraten.

**Recht:** Der PO sagt, die Clips dürfen so raus. Jarvis speichert das
als **Nutzerbehauptung**, prüft kein Urheberrecht und erfindet keine
Lizenz.

## 1. Warum nicht die naheliegenden Ideen

| Idee | Warum nicht |
|------|-------------|
| Extra-Agenten „Beschreibung“, „Upload“, „Account“ | Director ein Agent pro Zug. Ein `clip` mit Phasen, kein Schwarm |
| 5. Hirn / LLM-Organizer | [`70-next.md`](./70-next.md) §0b Won’t |
| instagrapi / sessionid / inoffizielle API | Gesperrte private API, Account-Risiko, nicht ehrlich |
| Accessibility tippt Instagram | Genau das stille Senden aus HELP / `81-next` |
| Instagram-Login + `video_url` | Jarvis hostet keine öffentliche Datei |
| TikTok `PULL_FROM_URL` | Domain müsste verifiziert sein; lokal = `FILE_UPLOAD` |
| Datei durch `ingestDocFile` (OCR) | Video ist kein Dokument; Kamera-Pfad bleibt Foto/S6+ |
| Koch-PR `#149` oder `hud` wiederverwenden | Anderes Fach. Koch unmerged wäre 64.; Clip ist ein eigener Agent |
| Handle / Songtitel / Rechte erfinden | Honesty |

## 2. Architektur

```text
Share / Datei (video/*)
    → clip-vault  (App-Ordner + IndexedDB clip_vault, IDB v11)
„lade den Clip hoch“ / pending clip
    → Agent clip  (ein Katalog-Eintrag, Director wählt ihn)
Gemini-Entwurf Caption  →  Nutzer darf ändern  →  Ja
Timo Instagram (Must)
    Facebook Login for Business
    POST /{ig-user-id}/media  media_type=REELS  upload_type=resumable
    POST rupload.facebook.com/ig-api-upload/{container}
    GET  container?fields=status_code
    Quota: GET content_publishing_limit  (live lesen)
    Ja → POST /media_publish
optional TikTok (beides)
    zuerst Inbox video.upload + FILE_UPLOAD
    Direct Post nur nach Freigabe video.publish
media_publish / TT-Publish bestätigt
    → lokale Videodatei löschen, Metadaten behalten
verbleibend  (prev > 10 ∧ n ≤ 10) oder (prev > 5 ∧ n ≤ 5)
    → JarvisNotify einmal je Schwelle
```

**Organisieren** heißt: der Director nimmt `clip`. Der Agent hat
Phasen, keine eigenen Katalog-Agenten.

| Phase | Wer | Ohne Ja? |
|-------|-----|----------|
| `ingest` | Share/`ACTION_SEND` oder Datei `video/*` | Ablegen ja, posten nein |
| `caption` | Gemini-Entwurf, Nutzertext gewinnt | nur Entwurf |
| `account` | Settings wie Spotify: Token, Handle, Quota, Trennen | kein Chat-Secret |
| `publish_ig` | offizielle Reels-Kette | nie |
| `publish_tt` | Inbox, später Direct Post | Inbox ≠ „ist online“ |
| `reap` | Datei weg nach **bestätigtem** Publish | nie vorher |
| `low` | Notify bei 10 und 5 verbleibend | Schwellen-Kreuzung, kein Spam |

`clip` wird der **64.** Domänen-Agent auf main, wenn Koch `#149`
unmerged bleibt. Merged Koch zuerst → Clip ist der **65.**
`test:agents` zählt mit. Kamera bleibt `hud` (kein Extra-Agent).

## 3. Ziel: Timo Instagram oder beides

Default **Instagram**. „Beides“ = dieselben Clip-Metadaten, zwei
Ziele. Handle und Token legt der Nutzer unter Settings.

- OAuth-Konto muss zum gespeicherten Handle passen, sonst ehrlich aus.
- Meta App Review (`instagram_business_content_publish`) ist
  Voraussetzung für Produktion, nicht nur Code.
- Professional Account (Creator/Business). Hobby-Login reicht nicht.
- Container verfallen nach 24 h. Nicht „hochgeladen“ sagen, bevor
  `media_publish` + `status_code` fertig sind.
- Quota live lesen, nicht 50 fest einbauen.

TikTok in Sprint 352. Inbox zuerst (ehrlich: Nutzer tippt in TikTok
fertig). Direct Post nur mit `video.publish`. Datei bleibt, bis
**alle gewählten** Ziele bestätigt sind. Nur-IG: löschen nach IG-Erfolg.

## 4. Speicher und 10 / 5

`verbleibend` = lokale, noch nicht bestätigte Clips im Vault.

Nach jedem erfolgreichen Löschen:

```text
wenn vorher > 10 und jetzt ≤ 10  →  Notify „noch 10 Clips“
wenn vorher > 5  und jetzt ≤ 5   →  Notify „noch 5 Clips“
```

Einmal je Abwärtsschwelle. Zähler über der Schwelle setzt die Flagge
zurück. Sprung 12→4 löst beide aus. Auffüllen löst nichts aus.
**0** ist kein Must (PO nannte 10 und 5).

Weg: `scheduleNotify` / `JarvisNotify` sofort (`at = now`),
IDs `notifyIdFromKey('clip-remain-10'|'clip-remain-5')`.
Kein Kalender-`addReminder`.

Löschen **nur** nach bestätigtem Publish. Fehlschlag, Quota, Abbruch:
Datei bleibt. Metadaten (Caption, Ziel, URL, Zeit, Rechte-Satz)
bleiben nach dem Löschen.

## 5. Recht (Nutzerbehauptung)

Vor dem ersten Publish: „Sie sagen, diese Clips dürfen so
veröffentlicht werden. Stimmt das?“ `Ja` → Timestamp in Settings.
Jarvis sagt nicht „ist legal“. Kein erfundener Lizenztext.

## 6. Ist im Code (Lücken)

| Stelle | Heute | Lücke |
|--------|-------|-------|
| Katalog | 63 Parser/Executoren, letzte IDs `face`, `app` | kein `clip` |
| Datei | `onDocFile` → `ingestDocFile` (Bild/PDF/Text) | kein `video/*` |
| Share | kein `ACTION_SEND` video | Teilen aus Galerie kommt nicht an |
| Notify | `scheduleNotify` + `JarvisNotify` | keine Vault-Schwelle |
| OAuth-Vorbild | Spotify in Settings | kein IG/TT-Token |
| `wont` | „öffne Instagram/TikTok“ | bleibt Won’t (App starten ≠ posten) |

## 7. Won’t

Inoffizielle APIs. Session-Login. Accessibility. Stilles Posten.
LLM-Organizer / Agenten-Schwarm. 5. Hirn. Handle raten. Rechte
erfinden. Caption als Fakt ohne Ja. `video_url` ohne eigenes Hosting.
Datei löschen vor bestätigtem Publish. Notify-Spam. Koch/`hud`/`food`
für Clips. `18.5` parallel. Sideload in dieser PLAN-Etappe.

## 8. Sprints

| Sprint | Version | Thema |
|--------|---------|-------|
| [348](./sprints/sprint-348.md) | `18.13.0` | Vault + Share/Datei-Ingest, Zähler |
| [349](./sprints/sprint-349.md) | `18.13.0` | Ein Agent `clip` (Katalog, Parse, Pending) |
| [350](./sprints/sprint-350.md) | `18.13.0` | Caption-Entwurf + Rechte-Ja |
| [351](./sprints/sprint-351.md) | `18.13.0` | Instagram Reels offiziell, Löschen nach Erfolg |
| [352](./sprints/sprint-352.md) | `18.13.0` | Notify 10/5; TikTok optional (beides) |

Harte Kette: 348 → 349 → 350 → 351. 352 nach 351 (Notify braucht
Reap; TikTok nach IG).

Test nach Execute: [`TEST-18.13.md`](./TEST-18.13.md).
