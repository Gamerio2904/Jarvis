# Sprint 386 — PSP und Sprintkarten auf dem Glas

**Version:** `18.19.0` — **PLAN** Must
**Plan:** [`91-next.md`](../91-next.md)
**Voraussetzung:** 385 (Fläche existiert). Idee-Plan `18.2` ([`72-next.md`](../72-next.md)).

## Ziel

Die Tischplatte zeigt denselben `IdeaPlan`, den der Chat schon kennt:
Auftrag, PSP-Baum, Kern/Härten/Probe, Won’t. Kein zweites Schema, kein
RICE, Jarvis führt nichts aus.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S386-1 | Projektion | `Workbench.tsx` `idea-plan.ts` | Links PSP (Idee → Sprint → Task), Mitte drei Kern-Karten + Custom, Inhalt nur Store. Leer = Satz „Idee: …“, kein Fake-Backlog |
| S386-2 | Fokus | `board.ts` | Aktive Idee = `last_step_title` oder „Zeig Plan für Idee n“. Status now/next/parked/done mappt `Idea.status` + Sprint.n, keine neuen Enums im Modell |
| S386-3 | Klick | Karten | Groß: ziel, lieferumfang, wont, abbruch. Schließen zurück. Kein Edit-Jira |
| S386-4 | Jarvis-Plan | | „Zeig Jarvis-Plan“ nutzt Katalog-Kopf (387) wenn da, sonst nur Ideen. Keine Git-History |
| S386-5 | Vertrag | `idea.ts` | Plan-Fill unverändert. Tafel **liest**. Groq schreibt nicht aufs Canvas |

## Won’t

Neues Plan-JSON. Dateien unter `docs/sprints/` aus der APK. Story-Points.
Gantt. Zweiter Scrum-LLM. Overlay statt Chat-Reply (Reply bleibt Mini-Chat).

## Abbruchkriterium

Tafel zeigt andere Kapitel als Kern/Härten/Probe. Oder erfindet Tasks,
die nicht in `Idea.plan` stehen.

## Manuell

```
Idee: ICS ohne Google-Kalender
Zeig den Sprintplan für Idee 1
Tischplatte an
```

Drei Kerne sichtbar. Custom nur mit Grund im `ziel`.
