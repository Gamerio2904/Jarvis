# Testanleitung — Jarvis `15.1.0`

Stand Code **`15.1.0`**. Diese Anleitung deckt Agenten-Netzwerk (Sprints 228–235) und Dual Brain (236–237) ab.

## Voraussetzungen

| Was | Warum |
|-----|--------|
| APK `15.1.0` installiert | Sideload über vorherige Version oder nach Hausstand-Export |
| **Groq-API-Key** | Smalltalk, micro-merge, research-lite (primäres Hirn) |
| **Gemini-API-Key** (optional) | Vision, Deep Research, Grounding |
| Netz (WLAN/Mobil) | Cloud-Hirn + Research |
| 15–20 Minuten Ruhe | Erste Turns nach Update |

**Hausstand:** Einstellungen → Hausstand → Exportieren **bevor** Deinstall. Keys liegen nur lokal.

---

## 1. Smoke nach Installation

1. App öffnen → Overlay oder Einstellungen: Version **`15.1.0`** (Mehr / Hilfe).
2. Groq-Key eintragen, Gemini optional.
3. Chat: **`/hilfe`** → Hilfetext enthält `15.1.0`.
4. Chat: **`Fernseher an`** → Parser (nicht Smalltalk), ehrliche TV-Meldung wenn TV aus.
5. Chat: **`Wetter heute`** → Open-Meteo-Antwort ohne Hirn-Zwang.

**Erwartung:** Parser-Tools funktionieren ohne Groq. Smalltalk braucht Groq (oder Gemini bei Rollback).

---

## 2. Agenten-Netzwerk (`agent_network_v2`)

Default: **an**. Rollback testen am Ende (Abschnitt 8).

### 2.1 Director / Routing

| # | Prompt | Erwartung |
|---|--------|-----------|
| 1 | `Milch auf die Einkaufsliste` | Einkaufsliste, kein LLM-Geplauder |
| 2 | `Timer 8 Minuten Nudeln` | Timer angelegt |
| 3 | `Wetter morgen in München` | Wetter-Antwort |
| 4 | `Öffne Netflix` | TV-Route (ehrlich wenn TV aus) |
| 5 | `Was kannst du?` | Hilfe/Identity canned |

Nach jedem Turn (Debug): `last_agent_id` gesetzt (z. B. `shopping`, `timer`, `weather`).

### 2.2 Multi-Intent

Prompt: **`Milch auf die Einkaufsliste und Timer 5 Minuten`**

**Erwartung:** Zwei Antworten oder kombinierte Antwort; beide Tools erkannt.

### 2.3 Curator / Memory

1. **`Ich heiße Max und trinke gerne Kaffee.`** → Gemerkt.
2. **`Was trinke ich?`** → Kaffee (Recall).
3. **`kein Kaffee mehr`** → Widerspruch/Update.

**Erwartung:** Kein Regression gegen `13.44`-Memory-Verhalten.

---

## 3. Agenten-Karte (Lage)

1. Tab **Lage** → Körper-Ansicht (Standard: **Agenten-Karte**, nicht klassisches Organ-Schema).
2. **Sieben Cluster** um **Haus-Gehirn** sichtbar.
3. Cluster antippen → Baum rechts zeigt Agenten des Clusters.
4. Bei Agent mit **Chat**-Button tippen → Prompt landet im Chat.
5. Nach Tool-Turn (z. B. Wetter): aktiver Cluster pulsiert / grün entlang Pfad.

**Klassische Körper-Ansicht:** Einstellungen → `body_view: classic` (falls exposed) oder Hausstand-Import mit `"body_view":"classic"`.

**Reduced Motion:** System „Animationen reduzieren“ → kein Pulse auf der Karte.

---

## 4. Dual Brain (`brain_v2`)

Default: **an**, `brain_primary: groq`.

### 4.1 Groq primär (Smalltalk)

1. Gemini **aus** lassen oder Key leer; Groq-Key **an**.
2. **`Sag Hallo und duze mich.`**
3. In Einstellungen / Debug-Latenz: Pfad **`groq`**, **kein** Gemini-Call.

**Erwartung:** Antwort in 1–2 Sätzen, Groq-Stimme im Chat.

### 4.2 Micro-merge (Parser → Formulierung)

1. `brain_micro_llm_merge: true` (Default).
2. **`Wetter heute`** (Parser-Antwort mit Fakten).
3. Antwort klingt formuliert (Jarvis-Stimme), Inhalt = Wetter-Fakten, keine erfundenen Zahlen.

### 4.3 Micro-clarify (Gleichstand)

Schwer reproduizierbar ohne künstlichen Gleichstand. Wenn Policy zwei Routen nicht trennt:

**Erwartung:** Kurze Rückfrage auf Deutsch (Groq, max ~600 ms), Fallback Regex-Frage.

### 4.4 Research-lite vs Deep

| Prompt | Primär | Gemini? |
|--------|--------|---------|
| `Suche im Internet nach Kuchenrezepten` | Groq + Links | Nur wenn Quellen dünn |
| Deep / Produkt mit Grounding | Gemini Deep | Ja |

**Erwartung:** Leichte Suche ohne Gemini-Key: DDG/Wiki-Links + Groq-Zusammenfassung wenn Key da.

### 4.5 Gemini Spezialist (Vision)

1. Gemini-Key **an**.
2. Foto / Datei-Flow (Auge) wie in `13.44`.
3. **Erwartung:** Gemini Vision, nicht Groq.

---

## 5. Debug-Export

1. Einstellungen → Debug → Kategorien wählen → Lauf starten.
2. JSON exportieren.

**Neu in 15.1.0:**

```json
"agent_traces": [ { "agentId": "router", "phase": "parse", "ms": 12, "ok": true } ],
"brain_slots": [ { "slot": "chat", "model": "groq", "ms": 340, "ok": true } ]
```

Nach Parser-Turn: `agent_traces` mit `router`, Domänen-ID, ggf. `curator`.  
Nach Smalltalk: `brain_slots` mit `chat` + `groq`.

---

## 6. Gold-Regression (Pflicht vor Release)

Am Dev-PC im Repo:

```bash
cd frontend
npm run test:prompts    # 181/181
npm run test:014
npm run test:agents
npm run test:brain-orchestrator
npm run test:rest-final
npm run build
```

**Am Handy (Stichprobe):** Einstellungen → Tests, plus Probe V1–V9 aus Debug.

---

## 7. Latenz (informell)

| Turn-Typ | Ziel vs. 13.44 |
|----------|----------------|
| Parser-only | Gleich (~0 ms LLM) |
| Smalltalk Groq | First-Token spürbar schneller |
| Deep Research | Gemini, ähnlich 13.44 |

Debug-Latenzzeile nach Turn prüfen (`P95` im Export).

---

## 8. Rollback-Flags

Im Hausstand-JSON oder (wenn UI vorhanden) Einstellungen:

| Flag | Wert | Verhalten |
|------|------|-----------|
| `agent_network_v2` | `false` | Altes `routeRegistry`, keine Director-Traces |
| `brain_v2` | `false` | Gemini → Groq → 0,5B wie `13.44` |
| `brain_primary` | `gemini` | Mit `brain_v2: true` Gemini als Chat primär |

Nach Rollback: App neu starten, Smoke Abschnitt 1 wiederholen.

---

## 9. Bekannte Grenzen (15.1.0)

- Sprint **238** (Production-SLO, Shadow-Sign-off) noch **PLAN**.
- `brain_shadow_mode`: misst parallel, liefert Baseline — PO-Freigabe ausstehend.
- Kein Cloud-Schwarm, keine 137× LLM — eine Nutzer-Stimme bleibt.

---

## 10. Fehler melden

Debug-JSON + Prompt + erwartetes vs. tatsächliches Verhalten. Branch **`main`**, Version **`15.1.0`**.
