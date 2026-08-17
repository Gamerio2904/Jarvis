# 26 — Samsung-Apps (`1.32`)

PO 2026-08-17: YouTube, Amazon, Disney+, Netflix per Befehl auf dem Samsung-Tizen. „Spiele … Film“ sucht, wo der Titel **kostenlos** läuft, und öffnet die passende App.

Reihe davor: [`25-next.md`](./25-next.md). App vorher: Sideload **`1.31.0`**.

## Reihenfolge

| Version | Inhalt | Status |
|---------|--------|--------|
| **`1.32.0`** | Tizen-Apps starten; Film-Suche kostenlos zuerst | **CODE** |

Sprint: [`sprint-84.md`](./sprints/sprint-84.md).

## Befehle

| Sage | Wirkung |
|------|---------|
| `Öffne Netflix` / `Starte YouTube` / `Disney Plus am Fernseher` | App auf dem gekoppelten Samsung |
| `Spiel YouTube` / `Spiel Amazon` | dieselbe App, ohne Titel |
| `Spiel Dune auf Netflix` | App (Deep-Link, wenn die Suche eine URL liefert) |
| `Spiel Dune Film` / `Spiele den Film Dune` / `Spiel Dune Film App` | Lookup DE: **gratis/Werbung** vor Abo, dann App öffnen |

Musik bleibt unangetastet: `Spiel Hotel California` und `Spiel das auf Spotify` gehen nicht an den Fernseher.

## Lookup

Keine Extra-Keys. JustWatch GraphQL (DE), sonst DuckDuckGo nach YouTube-`watch?v=`. Leihen/Kaufen nur, wenn die App genannt wurde. Kein Fake-„läuft jetzt“, wenn die App nicht startet.

## Won’t

SmartThings, Fire-TV-Apps, ARD/ZDF/Joyn starten, Apple CarPlay, Garantie dass YouTube der *ganze* Film ist.
