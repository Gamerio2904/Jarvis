# Sprint 40 — Samsung TV Core

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Priorität | **MINOR** — Smart-Home-TV nach NAS/APK |
| Ziel-Version | **`0.11.0`** |
| Quelle | PO: Tizen, gleiches WLAN, ein TV, lokal, kein Confirm, Ein inkl. WOL; **nach** `0.10.5` |

## Ziel

Ein Samsung-Tizen-TV (2016+) lokal steuern: **Ein/Aus, Lautstärke, Mute, HDMI**. Kein SmartThings, keine Apps.

## Must

| ID | Story | Done wenn |
|----|-------|-----------|
| T1 | **Treiber** — `backend/app/tv_samsung.py`: `samsungtvws` + Wake-on-LAN | Keys und WOL isoliert testbar |
| T2 | **Tool `tv`** — Actions `on\|off\|volume_up\|volume_down\|mute\|input`; `needs_confirm=False` | Chat: „Fernseher aus“ führt sofort aus |
| T3 | **Parser-Anker** — Befehl braucht `Fernseher`/`TV` (Follow-up nur nach TV-Turn) | „lauter“ allein im Smalltalk feuert nicht |
| T4 | **Kill-Switch** — `tv_enabled` Default aus bis gekoppelt; Inject führt nie TV aus | Ungepaart → ehrliche Meldung |
| T5 | Pairing-Token unter `backend/data/` (gitignored); Host/MAC/Name in Settings | Erste Verbindung: Haken am TV |
| T6 | `/hilfe` + False-Claim-Guard (kein Fake-„ist aus“) | Eval `scripts/eval_0_11_0.py` grün (TV gemockt) |
| T7 | Version `0.11.0` | Health/UI |

## Should

| ID | Inhalt |
|----|--------|
| T8 | HDMI-Map in Settings (`hdmi1` → `KEY_HDMI1`) |
| T9 | Status-API für spätere Settings-UI (Sprint 42) |

## Won’t

- SmartThings-Cloud
- Apps (Netflix, YouTube, …)
- Mehrere TVs
- Confirm-Dialog (PO: sofort ausführen)
- Fire TV / Alexa / Mail
- Volle Settings-UI (Sprint 42)

## Chat-Beispiele

- „Fernseher an“ / „TV aus“
- „Fernseher lauter“ / „TV leiser“ / „Fernseher stumm“
- „Fernseher auf HDMI 2“

## Architektur

```text
User → Router intent=tool → parse_tv_request
     → tv_enabled + Token? sonst ehrlich ablehnen
     → execute sofort
     → Power-on: WOL an MAC, dann WS
     → sonst: samsungtvws Keys (8001/8002)
     → Reply nur aus Tool-Ergebnis
```

## Exit / Abnahme

PO am eigenen Tizen-TV: an, aus, Vol, Mute, HDMI. Tag **`v0.11.0`**.

## Danach

- Sprint 41 / `0.11.1` TV Hotfix
