# Sprint 389 — Jobs: Recherche und Plan in einem Zug

**Version:** `18.19.0` — **CODE** Must
**Plan:** [`91-next.md`](../91-next.md)
**Voraussetzung:** 385 (Chips auf Glas), 386 (Plan-Karten), 388 (Deep/OSS). Idea-Fill existiert.

## Ziel

Ein Befehl kann Recherche **und** Sprintplan anstoßen. Das fühlt sich nach
zwei Agenten an. Im Code: **ein** `board`-Handler, Fetches parallel,
**ein** Groq-Fill nacheinander. Director bleibt ein Agent pro Zug.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S389-1 | Jobs | `board-jobs.ts` **neu** `store.ts` | Typ `{ id, kind: 'research'\|'plan'\|'catalog'\|'propose', status, label }`. Cap 4, TTL 15 min, `AbortSignal`. Nicht im Hausstand |
| S389-2 | Parser | `board-parse.ts` | Doppel: „such Open Source zu X und plane Sprints für Idee n“. Ohne Tafel: Split `chain.ts` darf research dann idea **sequentiell** — kein zweiter Organizer |
| S389-3 | Handler | `board.ts` | `Promise.all` nur HTTP (388). Danach `fillPlanWithModel` **einmal** (idea.ts Logik teilen, nicht kopieren). Ein Reply-Satz |
| S389-4 | UI | `Workbench.tsx` | Chips „Recherche läuft“ / „Plan liegt“. Stopp → Abort. Copy: **Jobs**, nicht „Schwarm“ |
| S389-5 | Persona | | Jarvis sagt nicht, er starte ein Agenten-Netz. „Ich suche und fülle den Plan.“ |

## Won’t

AutoGen. Zwei `completeGroq` parallel. 5. LLM. Agent-zu-Agent-JSON.
Englische Scrum-Master-Persona. Plan ausführen / PRs mergen.

## Abbruchkriterium

Zwei Director-Züge mit zwei Personas auf einen Satz. Oder Groq wählt den
Agenten statt Parser.

## Manuell

```
Tischplatte an
Such Open Source zu ICS und plane Sprints für Idee 1
```

Zwei Chips, ein Satz, Karten + Quellen. Ohne Cloud-Key: ehrlich, Plan-Vorlage
leer oder ungefüllt, keine erfundenen Repos.
