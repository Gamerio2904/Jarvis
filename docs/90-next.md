# 90 — Homescreen **CODE + APK** (`18.18.0`)

PO: Jarvis soll sich wie ein **zweiter Homescreen** anfühlen. APK auf,
dann App-Icons — nicht sofort der Chat. Rechts eine kleine Leiste mit
echten Werten. Mini-Chat und Sprach-Kugel als Shortcuts auf dem Schirm.

Grundlage: Sideload **`18.19.0`**, versionCode `181900`. **Dieses Dokument ist nach Execute CODE + APK.**
Sprints **382–384**. App-Code **`18.18.0`**. In Sideload **`18.19.0`**.

Andere Drafts bleiben getrennt: Koch `#149`, Kamera-Wahl `#151`, Clips `#152`,
Experte `#153`, Docs-Stand `#156`, Abbruch-Hotfix `#158`, PLAN `#159`.

## 0. Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Start | Öffnen = Homescreen, nicht Chat |
| Kacheln | Chat, Sprache, Kalender, Kugel, Lage, Overlay, Gehirn, Einstellungen, Filme |
| Werte-Leiste | Rechte Kante, Mitte, ausklappbar. Nur Store: Termin, Timer, Wetter-Satz, Einkauf, Key da/nicht |
| Mini-Chat | Shortcut unten links. Groß wechselt in den vollen Chat |
| Sprache | App = volle Folie. Shortcut = kleine 3D-Kugel (CSS, kein WebGL) |
| Dock | Start als erstes Icon, Chat bleibt erreichbar |
| Router | `Zeig Homescreen` → `app` / `dock.go` `home`. Kein neuer Agent |

## 1. Won’t

Android-Launcher, fremde Apps, Now-Karten, WebGL, Lottie, 64. Agent,
erfundene Wetter/Live-Werte.

## 2. Sprints (`18.18.0`)

| Sprint | Thema | Rolle |
|--------|--------|--------|
| 382 | Homescreen-Raster + Dock Start | Must |
| 383 | Werte-Leiste, Mini-Chat, Sprach-Kugel | Must |
| 384 | Tests und Gold | Must |

Landet in App-Code **`18.18.0`**. In Sideload **`18.19.0`**.
Test: [`TEST-18.18.md`](./TEST-18.18.md).
