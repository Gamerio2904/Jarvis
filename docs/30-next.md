# 30 — Uhrzeit, Ort, Research (`2.2.0`)

PO 2026-08-20 (Screenshots): Jarvis wusste die Uhrzeit nicht, hat den Wohnort geraten und bei BIP „keine Zahlen“ gesagt statt zu suchen.

Reihe davor: [`29-next.md`](./29-next.md). App vorher: Sideload **`2.1.1`**.

Eine Sideload-Stufe.

## Reihenfolge

| Version | Inhalt | Status |
|---------|--------|--------|
| **`2.2.0`** | Uhrzeit vom Gerät, GPS statt Wohnort-Raten, Suche von selbst bei Live-Fakten | **CODE** |

Sprint: [`sprint-104.md`](./sprints/sprint-104.md).

## Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Uhr | `new Date()` auf dem Handy, nicht das Netz, nicht „kein Systemzugriff“. |
| Ort | GPS / Freigabe. Wohnort aus dem Gedächtnis ist keine Live-Lage. |
| Research | Mit Gemini: BIP, aktuelle Zahlen, Tabellen — Suche ohne das Wort „suche“. Lücke in der Antwort → nochmal Netz. |
| Tabelle | Textzeilen mit Spatien, kein Markdown, keine Absage. Zahlen nur aus Treffern. |
| Wetter | `Guten Morgen` / `Wetter heute` bleiben Brief bzw. Open-Meteo. |

## Chat

`Wie spät ist es?` / `weißt du wie viel Uhr es ist` → Uhr vom Gerät.

`Wo bin ich?` / `weißt du wo ich bin` / `wo könnte ich denn sein` → GPS oder ehrliche Freigabe, nicht Ingersheim raten.

`Was ist der BIP in Deutschland` → Suche + Quellen. Tabelle auf Wunsch als Text.

## Probe

1. `Wie spät ist es?` — echte Uhr, kein „kein Zugriff“.
2. `Wo bin ich?` — GPS oder Nachfrage, kein geratener Wohnort.
3. `Was ist der BIP in Deutschland` mit Gemini — Zahlen aus Quellen, nicht „keine verifizierten Zahlen“.
4. Tabelle-Frage — Texttabelle oder belegte Zahlen, nicht „Tabellen kann ich nicht“.
5. `Guten Morgen` bleibt Wetter-Brief. `Steckdose an` bleibt Stecker. `kein Kaffee mehr` bleibt Gedächtnis.

## Won’t

Zahlen erfinden, Standort raten, Tuya-Cloud, Tapo, Apple CarPlay, iOS, Play Store.
