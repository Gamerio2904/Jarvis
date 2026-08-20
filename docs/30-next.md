# 30 — Uhrzeit, Ort, Research, Live-Qualität (`2.2.0`–`2.2.4`)

PO 2026-08-20 (Screenshots): Jarvis wusste die Uhrzeit nicht, hat den Wohnort geraten und bei BIP „keine Zahlen“ gesagt statt zu suchen. Weitere Screens: Uhr/Akku alt, Fake-Spotify, Wetter im Briefing, „Guten Morgen“ auf der Einkaufsliste.

Reihe davor: [`29-next.md`](./29-next.md). App jetzt: Sideload **`2.2.2`**. Als Nächstes Code: **`2.2.3`**. Welt-Reihe danach: [`31-next.md`](./31-next.md) **PLAN** (`2.3`–`2.19`).

Früher intern falsch `0.13.2`–`0.14`: Latenz ist in `0.13.2`/`2.2.2` schon da; Live-Qualität = **`2.2.3`**; optionales 1.5B = **`2.2.4`**; native llama.cpp bleibt PO.

Eine Sideload-Stufe pro Version.

## Reihenfolge

| Version | Inhalt | Status |
|---------|--------|--------|
| **`2.2.0`** | Uhrzeit vom Gerät, GPS statt Wohnort-Raten, Suche von selbst bei Live-Fakten | **CODE** |
| **`2.2.1`** | Testprompts zum Kopieren (Einstellungen → Tests) | **CODE** |
| **`2.2.2`** | Testprompts wieder raus aus der APK | **CODE** |
| **`2.2.3`** | Live-Qualität: Uhr/Akku frisch, Musik ehrlich, Wetter-Gate, Einkauf-Intent | **IN SPRINT** |
| **`2.2.4`** | Optional 1.5B Q4 on-device (Default 0.5B) | **PLANNED** SHOULD |

Sprints: [`sprint-104.md`](./sprints/sprint-104.md) (`2.2.0`–`2.2.2`) · [`sprint-105.md`](./sprints/sprint-105.md) (`2.2.3`) · [`sprint-106.md`](./sprints/sprint-106.md) (`2.2.4`).

## Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Uhr | `new Date()` auf dem Handy, nicht das Netz, nicht „kein Systemzugriff“. |
| Ort | GPS / Freigabe. Wohnort aus dem Gedächtnis ist keine Live-Lage. |
| Research | Mit Gemini: BIP, aktuelle Zahlen, Tabellen — Suche ohne das Wort „suche“. Lücke in der Antwort → nochmal Netz. |
| Tabelle | Textzeilen mit Spatien, kein Markdown, keine Absage. Zahlen nur aus Treffern. |
| Wetter (`2.2.0`) | `Wetter heute` = Open-Meteo. |
| Wetter (`2.2.3`) | Nur Wetterfrage + Standort. **Kein** Wetter in „Was steht an“ / „Was kommt heute?“ / Briefing. |

## Chat

`Wie spät ist es?` / `weißt du wie viel Uhr es ist` → Uhr vom Gerät.

`Wo bin ich?` / `weißt du wo ich bin` / `wo könnte ich denn sein` → GPS oder ehrliche Freigabe, nicht Ingersheim raten.

`Was ist der BIP in Deutschland` → Suche + Quellen. Tabelle auf Wunsch als Text.

## Probe

1. `Wie spät ist es?` — echte Uhr, kein „kein Zugriff“.
2. `Wo bin ich?` — GPS oder Nachfrage, kein geratener Wohnort.
3. `Was ist der BIP in Deutschland` mit Gemini — Zahlen aus Quellen, nicht „keine verifizierten Zahlen“.
4. Tabelle-Frage — Texttabelle oder belegte Zahlen, nicht „Tabellen kann ich nicht“.
5. `Steckdose an` bleibt Stecker. `kein Kaffee mehr` bleibt Gedächtnis. Ab `2.2.3`: `Guten Morgen` ist Begrüßung, kein Einkauf und kein Wetter-Brief.

## `2.2.1` — Testprompts kopieren — **CODE**

Einstellungen → Tests: jedes Prompt-Feld hat **Kopieren**, plus Alle je Gruppe und Alles. Chat bleibt ohne Chips.

**Probe:** Kopieren, Chat einfügen. Randfälle (Duzen, Marvel, Alexa, BIP erfinden) ehrlich ablehnen.

## `2.2.2` — Tests nicht in der App — **CODE**

Kopierfelder wieder weg aus Einstellungen. Prompts nur außerhalb der APK (dieser Chat). Chat ohne Chips.

## `2.2.3` — Live-Qualität — **IN SPRINT**

Quelle: [`15-live-probe.md`](./15-live-probe.md) · Sprint [`sprint-105.md`](./sprints/sprint-105.md).  
(Intern früher `0.13.3`.)

Live-Musts zuerst, dann 0.5B-Härten in derselben Version (Gemini aus).

| Must | Chat / Probe |
|------|----------------|
| Uhr, Akku live | `Wie spät ist es?` / `Wie voll ist der Akku?` = Statusleiste |
| Kein Fake-Spotify | `Spiel mal was Nettes` → „Musik ist nicht angebunden.“ Kein Modal, **keine API** |
| Briefing ohne Wetter | `Was steht an?` / `Was kommt heute?` — Termine, keine °C/Luft/Sonne |
| Wetter-Gate | nur Wetterfrage + Ort oder „hier“; `anziehen` ohne Ort = nachfragen |
| Ort aus dem Satz | Bietigheim, nicht der ganze Satz; kein München-Default |
| Einkauf nur Kauf | `Guten Morgen` ≠ Listenposten; `Milch kaufen` bleibt Liste |
| Intent | Switch-2-Kauf ≠ Film; `Termin 15 Uhr` ≠ Ort; Recall ohne Müll |

Should: Texttabelle (BIP), Zahl oder „keine Quelle“, Ticker nicht über Icons, `/hilfe` ohne Spotify-Claim.

Won’t in `2.2.3`: Spotify bauen, Wetter „nett dazu“, 1.5B, DWD.

## `2.2.4` — optionales 1.5B — **PLANNED** SHOULD

Sprint [`sprint-106.md`](./sprints/sprint-106.md). Default 0.5B. Toggle scharf ≈ 1,1 GB. Blockiert `2.3.0` nicht. Native llama.cpp = PO, nicht diese Version.

## Won’t (`2.2.x`)

Zahlen erfinden, Standort raten, Spotify-API, Tuya-Cloud, Tapo, Apple CarPlay, iOS, Play Store.
