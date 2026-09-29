# Sprint 388 — Deep Research härten (allgemein) + OSS

**Version:** `18.19.0` — **PLAN** Must
**Plan:** [`91-next.md`](../91-next.md)
**Voraussetzung:** Deep-Ist `11.60` / Chat-Loop (`research-parse.ts`, `web-search.ts`, Slot `research-deep`). **Nicht** tisch-exklusiv.

## Ziel

„Recherchiere tief“ und „suche Open Source“ werden professioneller:
Rollen-Queries, Quellenpflicht, optionale GitHub-Suche. Weiterhin **ein**
Loop, kein Researcher/Critic-Schwarm. Nutzbar im Chat ohne Tischplatte.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S388-1 | Rollen | `research-parse.ts` | Queries aus Rollen `core`, `constraint`, `compare`, `wiki`, `code` — max 5. Anzug/Stalingrad-Hardcodes → Theme-Detektor oder Default-Rollen. Bloßes „recherchier Benzinpreis“ bleibt normal (nicht Deep) |
| S388-2 | Claims | `research-parse.ts` | `ResearchSource` bleibt. Deep-Bericht nur Sätze mit URL. `guardResearchReply` weiter Zahlen aus Snippets |
| S388-3 | Pass | `web-search.ts` Should | Zweiter Pass nur wenn Pass 1 ≥ 2 URLs: eine Verfeinerung aus Top-3-Titel. Kein dritter. `AbortSignal` |
| S388-4 | OSS | `github-search.ts` **neu** | „Open Source“ / `site:github` → Rolle `code`. REST `/search/repositories` **nur** mit User-Token (Settings, offizielle API). Ohne Token: DDG `site:github.com` + Satz unvollständig. Kein Login-Scraping |
| S388-5 | Slot | `brain-orchestrator.ts` | `research-deep` weiter Gemini Grounding wenn Key. Sonst Groq + Digest. Tischplatte ändert den Slot nicht |
| S388-6 | Offer | `research-pending.ts` | Teach-Offer „Fachwissen merken?“ bleibt. Memory-Proposals kommen in 390, hier nur Hook: Deep legt Claims ab, write erst nach Ja |

## Won’t

12 h Crawl. FGS. Instagram. arXiv-Volltext-PDF in IndexedDB. Multi-Agent.
Neues `if (deep)` in `chat.ts` außerhalb Parser/fill. GitHub ohne Token
so tun als vollständig. Zweites Hirn.

## Abbruchkriterium

Deep ohne URL-Quellen erzählt Zahlen. Oder OSS-Suche behauptet GitHub-Treffer
ohne Token und ohne DDG-Zeile.

## Manuell

```
Recherchiere tief: Anzugs-Energiequelle ehrlich, ohne Marvel-Magie
Recherchiere tief: Open-Source Kalender ICS Parser
recherchier Benzinpreis
```

Erstes/zweites: mehrere Quellen. Drittes: normale Suche, nicht Deep.
