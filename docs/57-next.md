# 57 — Memory-10 Intensiv **CODE** `10.66.0`

PO 2026-09-03: Execute 196–201. Befund aus dem PLAN-Lauf, Fixes im Code **`10.66.0`**. 195 e5 bleibt **FREEZE**. 193 Gerät **PO**.

**App-Stand:** Code **`10.66.0`**. Sideload zuletzt **`10.60.2`** (APK-Bump extra). Hirn Gemini → Groq → 0,5B. Parser zuerst.

Gold: `npm run test:memory-10`. Intensiv-Gate: `npm run test:memory-10-intens` (exit 1 bei Rot).

---

## Execute

| Sprint | Version | Thema | Stand |
|--------|---------|-------|-------|
| **196** | `10.61.0` | Alias ohne `passwort`/`essen`/`termin` | **CODE** |
| **197** | `10.62.0` | Recall leer: kein Gespräch-Echo | **CODE** |
| **198** | `10.63.0` | `memoryBlock` nutzt Memory-Hits | **CODE** |
| **199** | `10.64.0` | `parent_key` nur Reise-Goals | **CODE** |
| **200** | `10.65.0` | Gold = Live-Pfad; Intensiv ist Gate | **CODE** |
| **201** | `10.66.0` | `Mag ich …?` Parser ohne Hirn | **CODE** |
| **193** | Gerät | Memory-Tor auf dem Handy | **PO** |
| **195** | `10.70.0` | e5-Rerank | **FREEZE** |

## Was sich geändert hat

| Fläche | Ist |
|--------|-----|
| Alias | Gruppen: WLAN ohne `passwort`, Döner ohne `essen`, Zahnarzt allein. `aliasMembers` nur exakt |
| Recall | Aktuelle Frage kein Message-Hit. Goal ohne Pin → *Nichts Belegtes*, nicht *Gespräch:* |
| Verify | `cited` nur über `pickRecallHits`, nicht über Echo-Messages |
| memoryBlock | Retrieve-Memory-Hits zuerst (max 4), Token-Fallback `name`/`zuhause`/`boundary` |
| parent_key | `inferParentKey`: `reise` nur bei Japan/Tokyo/Reise/Urlaub |
| Mag ich | `parsePrefItemAsk` → Memory-Tool. Serie/Film/Musik nicht. Ohne Pin ehrlich leer |
| Gold | G2/G3 über Merk-`notiz`. G5 mit Messages. G4 Copy = Contradiction-Delete |
| Intensiv | 56/56 grün, exit 1 bei Rot |

## Won’t unverändert

Qdrant, Qwen-Embed, e5 als Router, stilles Harvest, Goal-Write ohne Merk.

Index: [`42-planned.md`](./42-planned.md). Schema-Ist: [`56-next.md`](./56-next.md). Fachwissen: [`58-next.md`](./58-next.md) **PLAN**.
