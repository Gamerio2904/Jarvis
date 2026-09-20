# Sprint 319 — Settings-Writes Allowlist

**Version:** `18.7.4` — **PLAN** Must
**Plan:** [`78-next.md`](../78-next.md)
**Voraussetzung:** Sprint **318**. Writes nur nach „Soll ich?“.

## Ziel

Jarvis legt **eigene** Schalter um, die auf der Allowlist stehen.
Alles andere: ehrliche Absage. Keys, Tokens, MAC, Hausstand nie.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S319-1 | Allowlist | `app-parse.ts` oder `ui-action.ts` | Start: `tv_enabled`, `research_opt_in` (nicht `research_enabled`), `tool_propose`, `hud_accent`, `drive_speak`, `globe_webgl`, `gemini_enabled`. Titel deutsch: Research, Gemini, Werkzeug-Vorschlag, Lage-Akzent, Fahrt-Stimme, Kugel-Lite, Fernseher |
| S319-2 | Parse | `app-parse.ts` | `Research an/aus`, `Gemini aus/an`, `Werkzeug-Vorschlag aus`. `settings.set` + key + bool/enum. Unbekanntes Flag → `null`, nicht raten |
| S319-3 | Confirm | `app.ts` `director.ts` | `app` bleibt `sideEffect: 'write'`. Satz landet im bestehenden Pending („Verstanden als … Soll ich?“). Erst nach Ja `patchSettings` / `saveSettings` |
| S319-4 | Verboten | | `gemini_api_key`, `groq_api_key`, `pc_token`, `tv_mac`, `tv_token`, `omdb_api_key`, Hausstand-Import, `presence_token`: Parser trifft nicht. Kein Vertrag |
| S319-5 | Test | | Ja setzt den Schalter. Nein lässt ihn. `WLAN aus` bleibt device-Won’t. Theme-Sätze (`Orange-Akzent`) dürfen weiter ohne Pending bleiben — das ist schon `app` theme, kein neues Flag |

## Won’t

- Android-WLAN/BT umlegen (`device.ts` Satz bleibt).
- LLM erfindet ein Settings-Key.
- Allowlist heimlich um Keys erweitern.

## Abbruchkriterium

Ein Write ohne Ja. Oder ein Key/Token steht nach einem Satz. Oder
Research schreibt ein nicht existentes `research_enabled`.

## Manuell

```
Research an
```

„Verstanden als Research an. Soll ich?“ — nach Ja ist
`research_opt_in` true. `Gemini aus` ebenso. `Mach WLAN aus` Won’t.
