# Sprint 365 — Presence: Native Bind `:18791`

**Version:** `18.15.0` — **CODE + APK** Must
**Plan:** [`87-next.md`](../87-next.md)
**Voraussetzung:** 212 Handler CODE (`presence-http.ts`). Default `presence_enabled: false`.

## Ziel

Wenn Presence an ist, lauscht das Hirn-Handy wirklich auf **LAN-Port 18791**.
Ohne Bind bleibt der Schalter ehrlich aus, kein Fake-Chat.

## Ist

`handlePresenceHttp` + Token + Redact **CODE**. Settings-Text: „Ohne Native-Bind“.
Kein `JarvisPresence` in `MainActivity`. WebView kann den Port nicht binden.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S365-1 | Plugin | `frontend/native/…/JarvisPresencePlugin.java` | `ServerSocket` **nur** `192.168.0.0/16` und `10.0.0.0/8` (wie `isPresenceLan`). Port `presence_port` Default 18791. IPv6-ULA optional, kein `0.0.0.0` zum WAN |
| S365-2 | Bridge | `presence.ts` + Capacitor | `start` / `stop` / `bound`. Requests → `handlePresenceHttp` (bestehend). Kein zweiter Router |
| S365-3 | Register | `MainActivity.java` | `registerPlugin` wie TV/Voice. Schalter aus → Socket zu |
| S365-4 | Copy | Settings | Bind ok: „Hirn lauscht :18791 nur LAN.“ Bind fehlgeschlagen: bisheriger Hint, kein „läuft“ |
| S365-5 | Test | `test-presence-12.mjs` + Gerät | POST mit Token → Chat-Pfad. Falsches Token 401. Browser ohne APK: ehrlich tot |

## Won’t

WAN, Cloudflare-Tunnel, mDNS ins Internet. Electron-Server. Zweites
IndexedDB auf dem PC. Always-on Kamera. Port 18790 (das ist JarvisPC-Werkzeug).

## Abbruchkriterium

Socket lauscht auf allen Interfaces. Oder Presence an ohne Bind behauptet
„Hirn lauscht“. Oder Keys stehen in `/v1/presence`-JSON.

## PO-Prüfung

1. Schalter aus: PC `http://HANDY:18791/` tot, Satz ehrlich.
2. Schalter an, gleiches WLAN, Token: Verlauf lesen, Zeile senden.
3. Gastnetz / andere Subnet-Klasse: abgewiesen.
