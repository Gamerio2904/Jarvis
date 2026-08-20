# 15 — Live-Probe (Screenshots 2026-08-20)

PO-Alltag: Jarvis **2.2.1**, Banner **Gemini (Google) — Nachrichten gehen ins Netz.**  
Live auf `main` war **`2.2.2`**. Musts von Sprint **105** / **`2.2.3`** sind in **`2.19.0` CODE**. [`30-next.md`](./30-next.md). Früher intern falsch `0.13.3`.

## PO-Vorgabe (verbindlich)

1. **Musik** — öffnet nicht, **keine Spotify-API**. Weder Fehler-Modal noch „ich öffne die Musik“.
2. **„Was steht an“ / „Was kommt heute?“** — **kein Wetter**. Kein Einkauf aus Smalltalk.
3. **Wetter** — nur wenn gefragt wird, **wie das Wetter an einem Standort wird**.

## Befund (neu + alt)

| # | Screenshot | Soll | Ist | Klasse |
|---|------------|------|-----|--------|
| D1 | „Wie spät ist es?“ (Statusleiste 07:59) | aktuelle Gerätezeit | **07:47**, zweimal gleich, Chip Uhrzeit | **Must** — Cache |
| D2 | „Wie voll ist der Akku?“ (Leiste 94–95 %) | OS-Akku jetzt | **97 %, lädt nicht** | **Must** — Cache |
| M1 | Musik-Modal | kein Spotify | „keine gültigen Spotify API-Zugangsdaten“ | **Must** |
| M2 | „Spiel mal was Nettes“ | ehrlich: nicht angebunden | **„Ich öffne die Musik“** ohne Playback | **Must** — False-Confirm |
| W1 | „Was steht an?“ / „Was kommt heute?“ | Termine, kein Wetter | Valeostraße 20°, Einkauf Brot/Milch/**Guten Morgen** | **Must** |
| W2 | „Was soll ich anziehen?“ | kein Wetter ohne Standortfrage | Open-Meteo München | **Must** |
| W3 | „Wetter heute“ / „Temperatur hier“ | Wetter am Ort | Valeostraße via Open-Meteo | **ok** |
| W4 | „… in Bietigheim … Schirm?“ | Ort Bietigheim | ganzer Satz als Ort, „Kein Ort“ | **Must** |
| W5 | „Wie ist die Luft?“ ohne Ort | nachfragen | Default München | **Must** |
| E1 | „Guten Morgen“ | Begrüßung | **auf die Einkaufsliste** | **Must** |
| E2 | „Milch kaufen“ / „auch Brot“ / „Milch hab ich“ | Liste stimmt | ok | — |
| I1 | Switch-2-Kauf | Shopping | Film Zoomania 2 | **Must** |
| I2 | „Termin morgen 15 uhr“ | Uhrzeit | als Ort geparst | **Must** |
| I3 | „Wann … Steuer?“ | ehrlicher Recall | Valeo-Wischer / Persona | **Must** |
| F1 | „BIP Deutschland“ bei Netz an | Zahl oder klar „keine Quelle“ | erst keine Zahl, dann Definition | **Should** |
| F2 | „BIP in einer Tabelle“ | einfache Tabelle im Chat | „Tabellen kann ich nicht“ | **Should** |
| U1 | Kopfzeile | Icons frei | Ticker „Switch 2 mit Rabatt“ überlappt | **Should** |

`/hilfe` nennt Spotify nicht, solange keine API da ist (`2.2.3` Should).

## Regeln (DoD)

```text
Gerät
  Uhr / Akku IMMER live vom OS, kein alter Snapshot

Wetter
  NUR Wetterfrage + Standort (genannt oder „hier“/Home)
  NICHT in „Was steht an“, „Was kommt heute“, „anziehen“, ohne Ort

Briefing
  Termine / echte offene Loops
  KEIN Wetter, KEINE Luft, KEINE Sonne
  KEINE Einkaufsposten aus Smalltalk

Einkauf
  NUR klare Kauf-/Listen-Befehle (Milch kaufen, auch Brot, Milch hab ich)
  NICHT „Guten Morgen“, „Hallo“, Prefs

Musik
  KEIN Spotify-Modal, KEIN „ich öffne…“ ohne Player
  Satz: „Musik ist nicht angebunden.“
  KEINE Spotify-API bauen
```

## Won’t

- Spotify-OAuth / Playback
- Wetter „nett dazu“ im Briefing
- Stadt raten
- Hilfe als Feature-Wunschliste (Karte, Bahn, Shelly) in `2.2.3`
