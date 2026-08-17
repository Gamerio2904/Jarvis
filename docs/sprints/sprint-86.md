# Sprint 86 — Suche & Antworten (`1.33.0`)

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | **MUST** |
| Ziel-Version | **`1.33.2`** |
| Quelle | PO 2026-08-17 Screenshots: Suche sagt Absage plus Quellen; Preise fehlen; „Timon — liegt.“; „Öffnen Carplay“; Route ohne Netz |
| Voraussetzung | Sideload `1.32.1` |
| Plan | [`28-next.md`](../28-next.md) |

## Ziel

Internet-Suche liefert eine echte Antwort (Preise wo in den Treffern), keine Absage über Quellen. Jarvis merkt Namen klar. CarPlay öffnet den Fahrmodus.

## Must

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| R1 | Keine Live-Suche-Absage wenn Quellen da sind | Screenshot-Fall ersetzt durch Treffer-Text |
| R2 | Produkte: Idealo/Geizhals + € nur aus Snippets | Keine erfundenen Preise |
| R3 | Snippets in der Quellenliste | Titel allein reicht nicht |
| R4 | Memory-Bestätigung | `Name gemerkt: Timon.` nicht `Timon — liegt.` |
| R5 | `Öffnen CarPlay` | Fahrmodus, kein Apple-Märchen |
| R6 | Route: zweiter Router wenn OSRM leer | Weniger „Netz hat die Route nicht geliefert“ |
| R7 | Version `1.33.0` | Sideload |
| R8 | YouTube-Video ≠ Film-Lookup; Follow-up `Spiele … ab` | `1.33.1` |
| R9 | Widget-Tap öffnet Sprachmodus (hören + antworten) | `1.33.2` |

## Probe

1. Research + Gemini an: `Suche nach Küchengeräte` → Antwort mit Shops/Vergleich, **kein** „kann keine Live-Suche“. Links inkl. Idealo/Geizhals.
2. `Beste Preise Staubsauger` → Euro nur wenn im Snippet, sonst ehrlich auf Vergleichsseite.
3. `Ich heiße Timon` → `Name gemerkt: Timon.`
4. `Öffnen CarPlay` → Fahrmodus, nicht Apple-Entitlement.
5. `Spiele … YouTube Video auf dem Fernseher` → YouTube, kein fremder Film. Danach `Spiele Sonic 3 ab` bleibt am TV.
6. Widget antippen oder 🎙 — Sprachmodus, Jarvis hört und antwortet.

## Won’t

Preis-Garantie, Shop-Login, Apple CarPlay, neue Such-APIs mit Key.
