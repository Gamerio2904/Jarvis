# Sprint 06 — GUI Update Premium-Motion

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Ziel-Version | **`0.3.0`** |
| Quelle | Roadmap / Vision: MVP Motion light → eigenes GUI-Update; nach Charakter-Patches `0.2.x` |

## Ziel

Die Chat-UI fühlt sich **spürbar premium** an — Spotify-Dunkel + ChatGPT-Layout bleiben, aber mit gezielter Motion, klarerer Hierarchie und smoother Interaktion. Kein Redesign von Null; **Polish auf dem bestehenden Shell**.

## Abgrenzung

| In Scope | Out of Scope |
|----------|--------------|
| Motion & Mikrointeraktionen in der bestehenden Web-UI | Neues Farbschema / anderes Produkt-Look |
| Feinschliff Sidebar, Bubbles, Composer, Streaming | Native App, Handy-VPN, Auth |
| Reduced-motion / Performance-bewusst | Gedächtnis-Ausbau (`0.4.0`) |
| Version `0.3.0` in UI + Health | Backend-Guards / Persona-Änderungen (außer Version-Bump) |

## Must

| ID | Story | Done wenn |
|----|-------|-----------|
| M1 | **Message-Enter** — neue Bubbles erscheinen mit kurzem Fade/Slide (nicht abrupt) | Senden + Stream-Final fühlen sich soft an |
| M2 | **Streaming-Präsenz** — Tippen/Caret oder subtile Pulse am laufenden Assistant-Bubble | klar sichtbar „Jarvis schreibt“, ohne Flackern |
| M3 | **Composer-Focus** — Input-Zone hebt sich bewusst (Border/Glow-dezent, Expand) beim Fokus | Fokuszustand klar, mobil + Desktop |
| M4 | **Sidebar-Motion** — Chat-Wechsel / Neuer Chat / Mobile-Drawer mit kurzer Transition | kein hartes Umschalten; Drawer smooth |
| M5 | **`prefers-reduced-motion`** — Motion abschaltbar / stark reduziert | System-Einstellung wird respektiert |
| M6 | **Version `0.3.0`** — API Health + UI-Fußzeile | `version == 0.3.0` |

## Should

| ID | Inhalt |
|----|--------|
| M7 | Hover/Active-States Buttons & Chat-Liste feiner (kein Multi-Layer-Glow-Spam) |
| M8 | Leere-Zustand / Welcome-Zeile mit ruhigem Appear |
| M9 | Scroll-Verhalten beim Stream ruhiger (weniger Jumpiness) |

## Could

| ID | Inhalt |
|----|--------|
| M10 | Sehr dezente Ambient-Atmosphäre (Gradient/Noise) hinter dem Chat — Spotify-Atmosphäre, kein Lila-Glow |
| M11 | Typografie-Feinschliff (expressiver Display nur Brand, Body lesbar) |

## Won’t

- Gedächtnis / Recall über Chats hinweg
- Phase-2 Handy-Auth / VPN
- Komplett neues Layout-Paradigma oder Card-Grid-Dashboard
- Schwere Animation-Libraries, wenn CSS + wenig JS reichen

## Design-Leitplanken (verbindlich)

- Spotify-Dunkel + ChatGPT-Chatstruktur **behalten**
- Motion = **Präsenz & Hierarchie**, nicht Deko-Feuerwerk (Ziel: 3–6 bewusste Motion-Momente)
- Keine Floating-Badges / Promo-Chips über dem Chat
- Keine Card-Hölle; Bubbles bleiben Bubbles
- Accent bleibt Spotify-Grün; kein Purple-Default

## Exit / Abnahme

1. Live auf Desktop + schmalem Viewport: M1–M5 spürbar
2. Reduced-motion: UI bleibt nutzbar ohne „Zappeln“
3. Smalltalk-Feeling unverändert (Guards/`0.2.2`-Charakter bleiben)
4. Nach PO-OK: Tag **`v0.3.0`**

## Abhängigkeiten

- Stabiler Stand `0.2.2` (Charakter/Guards)
- Frontend Vite/React Shell

## Increment

MINOR: Premium-GUI-Motion auf dem bestehenden Local-Chat — spürbar smoother, gleiche Funktion.
