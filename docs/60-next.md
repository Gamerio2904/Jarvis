# 60 — Jarvis 13.0 Körper-Wissensbaum **CODE** `13.30.0`

PO 2026-09-03: Körper nimmt den **Eingang** (Auge, Ohr, …), entscheidet welche **Wissens- und Skill-Knoten** sichtbar sind, als tiefer werdender Baum. 195 e5 **FREEZE**. Kein Qdrant.

**App-Stand:** Code **`13.30.0`**. Sideload **`13.30.0`**. Hirn Gemini → Groq → 0,5B. Parser zuerst.

Gold: `npm run test:body-13`.

---

## Produkt in einem Satz

Der Körper ist kein Deko-Canvas. Ein Organ ist **Eingang**. Darunter hängen **Skills** (Kalender, Internet, Deep Research, Gedächtnis) und nur die **Wissensknoten**, die zu diesem Eingang passen — Token-Cluster, linear, Cap. Kein erfundener Vektorraum.

---

## 1. Ist

| Fläche | Datei | Ist | Lücke |
|--------|-------|-----|--------|
| Körper-Canvas | `BodySchema.tsx` | 8 Organe, Kanten Hirn↔Sinn, Live-Puls | Kein Baum, kein Wissen |
| Snap | `body-snap.ts` | Eine Zeile pro Organ (Gemini/Wake/Foto/PC) | Keine Entscheidung welche Knoten |
| Wissen | `knowledge_packs`, `retrievePacks` | Topic-Match, Cap 12 Packs | Nicht am Körper |
| Memory | Retrieve-2, RRF, 1-Hop | Token, e5 Freeze | Nicht am Körper |
| Skills | `registry.ts` / `route-pick.ts` | Kalender, Research, Teach, … | Körper startet kein Tool (richtig) |
| Kalender | `calendar-parse.ts` | Termin/Liste/Löschen | „nächsten Freitag“, „Kalender heute“ fehlten |

---

## 2. Vektoren — ehrlich auf diesem Stack

| Wunsch | Wahrheit |
|--------|----------|
| Semantische Cluster + Vektoren wie Qdrant/HNSW | **Won’t.** [`56-next.md`](./56-next.md). Linearer Scan IndexedDB. |
| e5-small als Baum-Encoder | **Freeze** (195). Wenn 195 je rotiert: e5 **nur Rerank** der schon gebauten Kandidaten, nie `pickRoute`. |
| Deepening tree | Tiefe 0 Organ → 1 Skill → 2 Cluster/Wissen → 3 Claim. Cap. Kein endloses Embedding. |
| Cluster jetzt | `clusterKey` = erstes Topic-Token + `retrievePacks`. Das ist **kein** Vektor. |

Aufsetzbar später ohne Schema-Bruch: dieselbe `BodyGraph`-Liste, e5 sortiert `nodes` mit `kind=knowledge`. Kein neuer Store.

---

## 3. Leit

```text
Eingang (Organ live)
  → skillsForOrgan (Katalog = Route-IDs)
    → Kalender: nächste Events
    → Memory/Recall: Pins per Token-Overlap
    → Internet/Deep: Packs → Cluster → Claims
```

- Organ-Tap startet **kein** Gerät (bleibt).
- Skill-Knoten „Chat“ schickt den bestehenden Parser-Prompt.
- Leer: *Kein Knoten. Foto, Teach oder Termin zuerst.*
- Kein neues `if` in `chat.ts`.

---

## 4. Sprints

Eigene Schiene `13.x`. Kein Diebstahl von `12.71`.

| Sprint | Version | Thema | Must? | Stand |
|--------|---------|-------|-------|-------|
| **217** | `13.0.0` | Leit + Won’t Vektorindex | Must | **CODE** in `13.30.0` |
| **218** | `13.10.0` | `body-graph.ts` Eingang→Skills→Wissen | Must | **CODE** in `13.30.0` |
| **219** | `13.20.0` | `BodyTree` in der Lage | Must | **CODE** in `13.30.0` |
| **220** | `13.30.0` | Kalender-Härte + Gold | Must | **CODE** |

Sideload **`13.30.0`**.

---

## 5. Gold

| ID | Soll |
|----|------|
| **K1** | Auge ohne Foto/Pack: leerer Baum, keine erfundenen Claims |
| **K2** | Memory-Organ + Mate-Pin: Wissensknnoten am Skill Gedächtnis |
| **K3** | Brain + FritzBox-Pack: Cluster + Claim, Token nicht Vektor |
| **K4** | `Was steht nächsten Freitag an?` → calendar |
| **K5** | `Was steht an?` bleibt brief |

---

## 6. Won’t

- Qdrant, HNSW, Qwen-Embed, ColPali
- e5 in `pickRoute`
- Organ-Tap startet Kamera/PC still
- Cloud-Kalender / Google-OAuth
- Unendlicher Graph, Multi-Agent

Index: [`42-planned.md`](./42-planned.md). Körper-Ist: `4.66` in 42. Wissen: [`58-next.md`](./58-next.md). Memory: [`56-next.md`](./56-next.md).
