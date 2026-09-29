# Sprint 386 — Workspace: Sprints, Module, GUI-Sim

**Version:** `18.19.0` — **PLAN** Must
**Plan:** [`91-next.md`](../91-next.md) §4.4 §6
**Voraussetzung:** 385 (Wand B, Icons aus). Idee-Plan `18.2`.

## Ziel

Jarvis steuert das interaktive Hintergrundbild: Sprints, PSP, Modul-
Wireframes, eine GUI-Simulation. Dieselbe `IdeaPlan`-Vorlage. Kein
Gesicht, kein zweites Live-GUI, kein xyflow-npm.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S386-1 | Sichten | `store.ts` `board-parse.ts` | `tischplatte_view`: `sprints` \| `psp` \| `modules` \| `sim` \| `research`. Eine Sicht. Befehle: `Zeig Sprints`, `Zeig PSP`, `Zeig Module`, `Simuliere {modul}` |
| S386-2 | Sprints | `Workbench.tsx` `idea-plan.ts` | Default-Sicht. Drei Kerne + Custom als HUD-Platten. Inhalt nur Store. Leer = „Idee: …“, Mitte ohne Kopf |
| S386-3 | PSP | | Baum links, fokussierte Karte wächst (Noessel: relevant groß, Rest Haarlinie). `tischplatte_focus` |
| S386-4 | Module | | Ghost-Wireframes der internen Flächen (nicht Homescreen-Icons). Klick/Befehl setzt Fokus |
| S386-5 | GUI-Sim | `board-wire.ts` **neu** | Low-Fi SVG/DOM im Theme. Kalender zeigt nur echten nächsten Termin oder beschriftete Leere. Kein `CalendarScreen` mounten, kein iframe |
| S386-6 | Jarvis-Plan | | „Zeig Jarvis-Plan“ = Katalog-Kopf (387) oder Ideen. Keine Git-History |
| S386-7 | Vertrag | `idea.ts` | Plan-Fill unverändert. Tafel liest. Groq schreibt kein CSS |

## Won’t

tldraw, `@xyflow/react`, Excalidraw-Bundle, AGPL-WorkBase, Face in der
Mitte, Marvel-HUD-Clone, Gantt, RICE, Dateien nach `docs/sprints/`.
Live-App in der Simulation.

## Abbruchkriterium

`Simuliere Kalender` erfindet Termine. Oder die Mitte ist ein Portrait.
Oder andere Sprint-Kapitel als Kern/Härten/Probe.

## Manuell

```
Tischplatte an
Zeig Sprints
Zeig Module
Simuliere Kalender
```

Icons bleiben aus. Sichten wechseln. Kalender-Gitter ohne Fake-Event.
