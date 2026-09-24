# Sprint 304 — Intelligenz-Gefühl

**Version:** landet in `18.10.0` (historisch `18.5.3`) — **CODE** Must
**Plan:** [`76-next.md`](../76-next.md)
**Voraussetzung:** 301 (Observe). 75 Allowlist darf schon CODE sein.

## Ziel

Jarvis wirkt klüger, ohne ein zweites Gedächtnis und ohne dass das
Modell Geräte wählt. Drei Hebel: merken was er tat, Prompt an die Lage
anpassen, Packs dort wo der Parser schon weiß.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S304-1 | Working Memory nach Tool | `working-memory.ts` + Execute-Ende | Nach TV/Kalender/Watchliste/Timer: eine Zeile `tv: an, beobachtet 200` / `tv: wol ohne Antwort`. Cap 8 bleibt, 160 Zeichen. Dump-Filter bleibt |
| S304-2 | Voice-Hint | `persona.ts` | Gerät/Parser: 1 fertiger Satz. Smalltalk/Erklärung: 2–3. Kein Essay. Kein Telegramm |
| S304-3 | Repair-Grounding | Voice-Pfad | Nur wenn `repairSpeech` den Text geändert hat: still im Working Memory, nicht jedes Mal vorsprechen |
| S304-4 | Knowledge in Parser-Zügen | `chat.ts` | Allowlist aus 75: Film/Watchliste/Kalender dürfen `knowledgeBlock` sehen. Kein Broadcast an TV/GPIO. e5 nicht in Route |
| S304-5 | Test | `test-prompts` / Gold | „Fernseher an“ dann „was war zuletzt am Fernseher“ trifft Memory-Zeile. TV-Agent startet kein Pack-Essay |

## Won’t

- Mem0, Letta, Qdrant, LLM-Organizer. Längeres Persona für 0,5B.
- Jeden Befehl nachsprechen.

## Abbruchkriterium

TV-Zug schreibt Working Memory nicht, oder Knowledge-Block stiehlt
`Fernseher an` in den Research-Agenten.

## Manuell

Fernseher an (301-Probe). Danach „Woran haben wir am Fernseher zuletzt
gedreht?“ — Jarvis nennt die Zeile, erfindet keinen HDMI-Film.
