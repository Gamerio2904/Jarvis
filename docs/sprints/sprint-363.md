# Sprint 363 — Knowledge zitierbar auf Lese-Agenten

**Version:** `18.15.0` — **CODE + APK** Must
**Plan:** [`87-next.md`](../87-next.md)
**Voraussetzung:** 204 + 304 Allowlist CODE (`film` / `watchlist` / `calendar`).

## Ziel

Wo der Parser schon **liest**, darf das Wissenszentrum mit. Jeder Satz aus
einem Pack trägt einen Claim und eine URL. Geräte bleiben pack-frei.

## Ist

`KNOWLEDGE_PARSER_ALLOW = film, watchlist, calendar`. `knowledgeBlock` max
2 Packs, Claims mit `source_urls[0]`. TV/GPIO nicht — das bleibt.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S363-1 | Allowlist | `knowledge-block.ts` | Dazu **nur read**: `news`, `search`, `sport`, `law`, `teach`, `pack`, `osint`. Nicht `tv`, `plug`, `alarm`, `maps` (Gerät), `sms` |
| S363-2 | Zitat | `knowledgeBlock` | Zeile `- {claim} ({url})`. Ohne URL: Claim nur wenn `user_ok` und Text; keine erfundenen Links |
| S363-3 | Retrieve-Trennung | `knowledge-retrieve.ts` | Pack-Score Token/Alias wie heute. e5 nicht. Zweiter Pack nur bei Score-Regel wie 75 |
| S363-4 | Prompt | `chat.ts` | `knowledgeAllowedForRoute(routeNow)` für Parser-**und** Hirn-none (none bleibt erlaubt). Device-Route: Block leer |
| S363-5 | Test | Gold / `test-prompts` | „Was weißt du über Dune“ mit Pack → Claim+URL. „Fernseher an“ → kein Pack-Essay |

## Won’t

Broadcast an alle 63. Pack startet TV. e5 in Pack-Retrieve. ColBERT.
Erfundene Quellen. `knowledgeBlock` in Write/Device.

## Abbruchkriterium

`Fernseher an` liest ein Film-Pack und redet statt zu schalten.
Oder ein Claim ohne `user_ok` landet im Prompt.

## PO-Prüfung

1. Gelerntes Film-Pack, dann Filmtitel fragen → zitierte Zeile.
2. Nachricht / Sport-Frage mit passendem Pack → URL sichtbar.
3. Steckdose / Timer: keine Fachwissen-Zeile.
