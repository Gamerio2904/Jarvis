# 11 — Delight, Easter Eggs & Einstellungen

Spielerei und Begeisterung — **dosiert**, abschaltbar, local-first.  
Einstellungen: **einfach, flach, klar** — wenig Verschachtelung.

## Versionierung (verbindlich)

| Version | Sprint / Doc | Inhalt |
|---------|--------------|--------|
| `0.4.0` | Sprint 8 | Gedächtnis (Voraussetzung für Jokes) |
| `0.5.0`–`0.6.0` | Sprint 9–10 | Intelligence (Router, Research) — **vorher** |
| **`0.7.0`** | Sprint 11 | Jarvis-Moment, Inside-Jokes, Sound, Easter Eggs + flaches Settings |

Reihenfolge bewusst: erst scharfsinnig/verlässlich, dann Delight.

---

## 1) Jarvis-Moment

### Idee
Seltene, situative Mikro-Momente: Jarvis wirkt präsent (UI + Text), ohne Gimmick-Spam.

### Trigger (Beispiele)
- Erste Begrüßung des Tages
- User kommt nach langer Pause zurück
- Erfolgreicher Recall eines wichtigen Fakts
- Nach hartem Inject-Block (trocken siegessicher)

### UX
- Sehr dezenter Accent-Glint am Avatar / Brand-Mark (1×, kurz)
- Optional: ein knapper Satz im Jarvis-Ton
- Frequency-Cap: z.B. max. 1–2 / Tag (Setting)

### Setting
`Delight → Jarvis-Momente` = An / Aus (Default: An)

---

## 2) Inside Jokes

### Idee
Laufende Gags aus **Langzeitgedächtnis** (category `joke` / `pref`), selten und treffend.

### Regeln
- Nur speichern, wenn User mitspielt oder explizit „das behalten wir“
- Nie überstrapazieren (Cooldown-Cap)
- Soft-delete in „Was Jarvis über mich weiß“
- Kein Witz bei ernstem Intent (`task` / `research` / klar schlechte Stimmung)

### Setting
`Delight → Inside Jokes` = An / Aus  
`Delight → Witz-Frequenz` = Selten / Normal (zwei Stufen, kein Slider-Wald)

---

## 3) Sound Design (light)

### Idee
Minimale UI-Sounds für Präsenz — Premium, nicht Arcade.

### Sounds (wenige)
| Event | Charakter |
|-------|-----------|
| Send | kurz, weich |
| Receive/done | sehr kurz, warm |
| Error | gedämpft, nicht schrill |
| Jarvis-Moment | optional hauchzart |

### Regeln
- Default: **Aus** oder sehr leise (PO-Entscheidung im Sprint)
- Ein Master-Toggle + Volume (eine Stufe-Leiste)
- `prefers-reduced-motion` respektiert; separates `prefers-reduced-sound` wenn möglich

### Setting
`Sound → UI-Sounds` An/Aus  
`Sound → Lautstärke` niedrig/mittel (max. 2–3 Stufen)

---

## 4) Easter-Egg-Commands

### Idee
Versteckte, aber **in den Einstellungen gelistete** Kommandos — Entdecken + Nachschlagen.

### Beispiele
| Command | Wirkung |
|---------|---------|
| `/protokoll` oder „Protokoll“ | Dry Status: Modell, Memory-Count, Version |
| `/mission` | Quatsch-Mission im Jarvis-Ton (1 Kurzabsatz) |
| `/kante` / `/ruhe` | Stimmungsmodus für die Session |
| `/vergissWitz` | letzten Joke-Pin löschen |
| `/quellen` | nur sinnvoll wenn Research an |

### Sichtbarkeit
Einstellungen → Abschnitt **„Easter Eggs“**:
- Liste: Command · Kurzbeschreibung · Beispiel
- Keine Verschachtelung, keine versteckten Submenüs
- Toggle: `Easter Eggs aktiv` (Default An)

### Sicherheit
- Keine Shell, kein Dateisystem, kein Netz über Eggs
- Eggs laufen durch dieselbe Guard-Pipeline

---

## 5) Einstellungs-Update (UX-Prinzip)

### Leitregeln (verbindlich)
1. **Eine Settings-Seite** (Panel/Route) — kein Nesting über 1 Ebene
2. **Max. 5–7 Hauptabschnitte** als flache Anker-Liste
3. Jede Einstellung: **Label + 1 Satz Hilfe + Kontrolle**
4. Keine Modal-in-Modal; keine Accordion-Hölle
5. Sofort speichern oder 1× „Speichern“ — nicht beides mischen
6. Danger-Zonen klar getrennt (Memory löschen, Research)

### Vorgeschlagene Abschnitte (flach)

```text
Einstellungen
├─ Allgemein          (Sprache UI, Version-Anzeige)
├─ Modell             (Default / Fallback / Routing-Modus)
├─ Gedächtnis         (An/Aus, „Über mich“ öffnen, alles löschen)
├─ Delight            (Momente, Jokes, Frequenz)
├─ Sound              (An/Aus, Lautstärke)
├─ Easter Eggs        (An/Aus + Command-Liste)
└─ Forschung (Netz)   (Opt-in Research, Allowlist-Hinweis)  [erst wenn Feature da]
```

### Anti-Patterns
- Tabs in Tabs in Tabs
- 20 Toggle ohne Gruppierung
- Versteckte Advanced-Seite mit 50 Flags
- Einstellungen nur als JSON-Datei für den PO (Datei darf bleiben, UI ist Primär)

### Abnahme Settings
- PO findet Easter-Egg-Liste in &lt; 10 Sekunden
- Memory löschen braucht Bestätigung
- Kein Abschnitt tiefer als: Seite → Abschnitt → Kontrolle

---

## Backlog-IDs (Vorschlag)

| ID | Story |
|----|-------|
| S8.1 | Jarvis-Momente An/Aus + Frequency-Cap |
| S8.2 | Inside Jokes via Memory-Pins |
| S8.3 | UI-Sounds Send/Receive/Error |
| S8.4 | Easter-Egg-Commands + Liste in Settings |
| S8.5 | Flaches Settings-Panel mit Abschnitten oben |

Epic: **E8 Delight & Settings** (neu im Product Backlog).
