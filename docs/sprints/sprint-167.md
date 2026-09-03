# Sprint 167 — Greeting, News, TV, STT, Stimme (`9.9.2`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Ziel-Version | `9.9.2` |
| Quelle | Screenshot-Bugs, [`53-next.md`](../53-next.md) |

## Ziel

Undeutliche Sätze und STT-Tippfehler treffen den Parser. Greeting hängt nicht. Weltlage geht mit „gerade“. Sprachmodus antwortet kürzer und früher mit ganzen Sätzen.

## Must

| ID | Inhalt |
|----|--------|
| V1 | Greeting nicht bei Arbeit/Welt/langen Sätzen; Mood „Gut, danke. Und Ihnen?“ |
| V2 | `smalltalk`/`identity` nicht als last-step merken |
| V3 | Outlook: `was passiert gerade/jetzt in der Welt` und `… in der Welt passiert` |
| V4 | Repair `gersde`/`gerate`/`fernseheren`; News-SKIP `gerade` |
| V5 | TV-Follow-up ohne Anker + `das\|du\|es` ist kein An |
| V6 | `Mach du das an` bestätigt Research; `Suche nach Fernseher` ist TV-Discover |
| V7 | `finishReply` versteckt keinen Wort-Bindestrich (`Bietigheim-`) |
| V8 | Edge First-Audio 1100 ms; `spokenForGemini` am letzten `.!?`; Voice 240 Tokens |
| V9 | STT `EXTRA_MAX_RESULTS` 8; `pickHeard` bewertet Outlook/News |

## Won’t

Whisper/Parakeet in der APK. Pipecat-Server. ElevenLabs. FGS `5.12`.

## DoD

- [x] Parser-Asserts in `test-014` (Gersde, Greeting, TV, Hyphen, Research-Confirm)
- [x] Typecheck grün
