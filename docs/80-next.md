# 80 — Recover + Hirn härten **PLAN** (`18.9`)

Wenn eine Quelle oder Methode ausfällt, soll Jarvis **selbst** die nächste
erlaubte Option prüfen — API nochmal, Cache neu, zweite Allowlist-Seite —
und das **ansagen**, bevor er das Ergebnis liefert. Dazu die Härte aus
EdgeCat / LocalAgent / AgentGate: prüfen statt plaudern.

`18.5` (301–306) bleibt PLAN und läuft **nicht** parallel.

Quellen (MIT/Apache, kein Copy der Apps):

- [blayer/EdgeCat](https://github.com/blayer/EdgeCat) — Replan nach Fail, Evaluator nur bei Ambivalenz
- [SangbumChoi/LocalAgent](https://github.com/sangbumchoi/localagent) — Abstention
- [AgentGate](https://arxiv.org/html/2604.06696v1) — Action-first, Escalation
- [slm-orchestrator](https://pypi.org/project/slm-orchestrator/) — Fallback-Parser
- [nrl-ai/edgevox](https://github.com/nrl-ai/edgevox) — `world_predicate` vor LLM-Verdikt

**Ist:** App-Code **`18.8.4`**. Director: ein Agent, `applyRetry` nur
fuel/weather/poi/transit *nach* Erfolg, Lesen 2 Versuche still im Bus.
Kein Satz „ich versuche eine andere Methode“. News ist nur Tagesschau.
Write/Device einmal. `noteFail` merkt den Bruch, steuert aber nicht um.

**Dieses Dokument ist PLAN.** Execute: Sprints **331–337**. Sideload
unverändert, bis ein eigenes APK-Execute kommt. `GOLD_EXPECT`-Keys =
`TEST_PROMPTS`. `PROBE_COPY_GROUPS`.length 13.

---

## 0. Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Recover | **Allowlist-Schritte**, kein freies Web. Höchstens **2 Alternativen** (3 Versuche). |
| Ansage | Vor dem Wechsel ein Satz: „X geht nicht. Ich versuche Y.“ Danach das Ergebnis oder ehrliche Absage. |
| API | „Aktualisieren“ = Cache-Bust + Retry-After. **Kein** Key drehen, kein stilles Key-Tauschen. |
| Website | Nächste **eingetragene** URL derselben Domäne, nie „irgendeine Seite“. |
| Write/Device | **Kein** zweiter Lauf — sonst doppelte Termine / Tasten. Recover nur Read + Hirn-Slot. |
| Hirn | Parser zuerst. Kein zweites Modell, kein LLM-Organizer, e5 nicht in `pickRoute`. |
| Verify | Regeln zuerst. LLM-Richter nur bei `leer`. |
| 18.5 | Unberührt. |

---

## 1. Nutzerfluss

```
Quelle A tot
    → „Tagesschau antwortet nicht. Ich lade neu.“
    → Retry / Cache-Bust
    → immer noch tot
    → „Immer noch nichts. Ich versuche DW.“   (nur wenn DW in der Liste steht)
    → Treffer → „Laut DW: …“
    → beide tot → „Geht nicht. Tagesschau und DW schweigen. Kein Raten.“
```

Kein Erfolgssatz ohne ausgeführten Schritt. Kein „Ist erledigt“ aus dem Chat.

---

## 2. Recover-Registry (Vorschlag)

Eine Tabelle, kein LLM-Plan. Datei-Kandidat: `recover.ts`.

| Agent / Slot | Schritt 1 | Schritt 2 | Schritt 3 | Won’t |
|--------------|-----------|-----------|-----------|--------|
| news | Tagesschau neu | DW-RSS/API wenn schon CODE | Research-Lite nur mit Quellen | Beliebige News-Site |
| research | Aktiver Provider neu | Nächster Hirn-Slot (Groq→Gemini) | — | Crawl, 12-h-Suche |
| weather | Open-Meteo Cache-Bust | — | — | Zweite Wetter-Firma erfinden |
| globe layer | `fetchLayer` ohne Cache | — | — | Andere Geo-API ohne Plan |
| watchlist/omdb | OMDb neu | Ratings[] / IMDb-Feld | Publikum — | RT-Scrape |
| flights/overhead | OpenSky neu | — | — | ADS-B-Welt |
| fuel/poi | `applyRetry` wie heute | — | — | Zweite Navigation |
| groq 429 | Retry-After | Gemini-Spezialist | 0,5B oder Absage | Key wechseln |
| write/device | — | — | — | Zweiter Execute |

Jeder Schritt hat `label` (Ansage) und `run()`. Leerer Treffer zählt als Fail, nicht als Erfolg.

---

## 3. Schiene `18.9` (Sprints 331–337)

Harte Kette: **331 → alles**. 332 braucht 331. 336 braucht 331+332.
333–335 unabhängig nach 331. **337 zuletzt**.

| Version | Sprint | Thema |
|---------|--------|-------|
| `18.9.0` | [331](./sprints/sprint-331.md) | Recover-Kern: Ansage, Cap 2, `last_failed` in Ctx |
| `18.9.1` | [332](./sprints/sprint-332.md) | Read-Quellen: News, Research, Lage, OMDb |
| `18.9.2` | [333](./sprints/sprint-333.md) | Rules-first Verify nach Write |
| `18.9.3` | [334](./sprints/sprint-334.md) | Abstention auf Read-Fails; Micro-Merge-Allowlist |
| `18.9.4` | [335](./sprints/sprint-335.md) | Propose: Action-then-ground + JSON-Repair |
| `18.9.5` | [336](./sprints/sprint-336.md) | API/Cache: Retry-After, Quota, fehlender Key → Quelle ohne Key |
| `18.9.6` | [337](./sprints/sprint-337.md) | Härten, Gold, [`TEST-18.9.md`](./TEST-18.9.md) |

Kein Sideload-Bump in diesem PLAN. Nicht parallel zu `18.5`.

---

## 4. Sätze (Probe, keine neuen Gold-Keys ohne Execute)

| Satz | Erwartung |
|------|-----------|
| Nach tot-gemockter Tagesschau: `Nachrichten` | Ansage + zweite Quelle oder ehrliche Absage |
| `Zeig Erdbeben` bei USGS-Timeout | „USGS antwortet nicht. Ich lade neu.“ dann Punkte oder Absage |
| `Termin morgen 15 Uhr Zahnarzt` | Wie 18.8, **kein** Recover-Zweitlauf |
| Write-Fail | `failureReply`, kein Chat-Erfolg |

Offset-Sätze bleiben **nicht** allein in `TEST_PROMPTS`.

### 4b. Auto-Debug (Spur Lauf)

`PROBE_COPY_GROUPS`.length bleibt **13**. Kein 14. Pack „Recover“.

| Wo | Was |
|----|-----|
| Bestehende Probe-Sätze | `Nachrichten`, `Zeig Erdbeben`, `Termin morgen 15 Uhr Zahnarzt` bleiben in den heutigen Gruppen. Happy-Path-Route unverändert. |
| Copy-Erweiterung bei Execute | Recover-Happy-Path (Ansage-Text nur wenn ohne Mock routbar) in **bestehende** Gruppen, z. B. Research/Nachrichten und 18.8 Debug & Termin. Titel der 13 Spuren nicht umbenennen. |
| Mock-Pfad | 503→200, 503→503, 429→Retry: nur `test-recover.mjs` + [`TEST-18.9.md`](./TEST-18.9.md). Nicht in `TEST_PROMPTS` / `GOLD_EXPECT`, weil der Auto-Debug kein Netz-Mock fährt. |
| Gold | Jeder neue `TEST_PROMPTS`-Eintrag braucht denselben Key in `GOLD_EXPECT` und steht in `allTestCopyTexts()`. |

Der Auto-Debug prüft also: Route stimmt, Write bleibt einmal, kein Fake-Erledigt. Den Wechsel „geht nicht / versuche“ belegt das Mock-Skript.

---

## 5. Won’t

- Freies Web, RT-Scrape, inoffizielle Wrapper.
- Keys rotieren, Keys aus dem Chat „aktualisieren“.
- Zweiter Write/Device-Execute.
- LLM wählt die nächste URL.
- Qdrant, Mem0, Graphiti, e5 in `pickRoute`, zweites Hirn, Z3, Pipecat.
- 18.5 mitziehen.

---

## 6. Manuell (nach Execute)

1. Netz-Mock: Tagesschau 503 → Ansage → DW oder Absage, keine erfundenen Meldungen.
2. USGS Timeout → Ansage → Retry → Absage oder Pins.
3. Termin anlegen während tot-News: **ein** Termin, keine Doppel-Anlage.
4. Offene Filme-Folie: neuer Film erscheint ohne Tab-Wechsel (18.8-Nachzieher).
