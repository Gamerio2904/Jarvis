# 15 — Live-Probe (Screenshots 2026-08-20)

PO-Alltag auf dem Handy. Banner: **Gemini (Google) — Nachrichten gehen ins Netz.**  
Dieses Git-Repo ist on-device WASM (`0.13.2`); die Probe gilt trotzdem als nächste Qualitäts-Musts.

## PO-Vorgabe (verbindlich)

1. **Musik öffnet nicht** — und es gibt **keine Spotify-API**. Die Fehlermeldung („keine gültigen Spotify API-Zugangsdaten“, Button Einstellungen) ist falsch.
2. **„Was steht an“** — **kein Wetter**. Nur Termin/Agenda.
3. **Wetter** — nur wenn gefragt wird, **wie das Wetter an einem Standort wird**.

## Befund

| # | Screenshot | Soll | Ist | Klasse |
|---|------------|------|-----|--------|
| M1 | Musik-Dialog | kein Spotify, kein Settings-Zwang | Modal: Spotify-Zugangsdaten fehlen | **Must** — Fake-API |
| W1 | „Was steht an“ (PO) | Agenda ohne Wetter | Wetter würde mitlaufen | **Must** |
| W2 | „Was soll ich anziehen?“ / „und morgen?“ | kein Wetter-Dump ohne Standort-Wetterfrage | Open-Meteo München, Chip Wetter | **Must** |
| W3 | „Wetter heute“ / „Temperatur hier“ / „Wetter in Bietigheim“ | Wetter für den genannten/„hier“-Ort | Valeostraße bzw. Bietigheim via Open-Meteo | **ok** (das ist die erlaubte Form) |
| W4 | „Und in Bietigheim brauche ich da heute Schirm?“ | Ort = Bietigheim, Wetter ja | ganzer Satz als Ortsname, Chip „Kein Ort“ | **Must** — Parse |
| W5 | „Wie ist die Luft?“ | nicht München raten; nur bei klarem Ort | Default München | **Must** |
| I1 | „Wo kann ich Switch 2 kaufen“ | Shopping/Preise | erst Film *Zoomania 2*, Chip Film | **Must** — Intent |
| I2 | „Steuer planen als Termin morgen 15 uhr“ | Termin morgen 15:00 | „Ort morgen 15 uhr nicht gefunden“ | **Must** — Zeit ≠ Ort |
| I3 | „Wann hatte ich das mit der Steuer?“ | ehrliche Erinnerung oder „nichts gefunden“ | Valeo-Wischer + Persona-Müll | **Must** — Recall |
| I4 | „Wo bin ich gerade?“ | Standort | Valeostraße 1 — ok wenn GPS/Home bewusst | Policy: nur auf Standort-Frage |

Luft/Sonne/Taschenlampe/WLAN in den Screenshots sind **nicht** der Sprint-Kern. Wetter hängt nicht an „anziehen“, „steht an“, Follow-up ohne Ort.

## Regeln (DoD)

```text
Wetter-Ausgabe
  NUR wenn: Nutzer fragt Wetter/Temperatur/Regen/Schirm
            UND ein Standort steckt (genannt ODER „hier“ mit bekanntem Home)
  SONST: kein Wetter-Chip, kein Open-Meteo, kein München-Default

„Was steht an“
  NUR Termine / offene Loops
  KEIN Wetter, keine Luft, keine Sonne

Musik
  KEINE Spotify-Fehlermeldung
  KEINE Settings→Spotify
  Wenn Musik-Intent: ehrlich „Musik ist nicht angebunden.“ — oder still ignorieren
  Spotify-API wird nicht gebaut
```

## Won’t

- Spotify-OAuth / Playback
- Wetter in Briefings „nett dazu“
- Stadt raten (München), wenn kein Ort in der Frage ist
