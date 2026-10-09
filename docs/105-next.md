# 105 — Yu-Gi-Oh! Regeln, Effekte und Kartentext-Treue **PLAN** (`18.46`–`18.51`)

**Bedingung:** Das Duell soll sich **näher am TCG** anfühlen als der heutige Prototyp:
regelkonforme Züge und Ketten, **deutlich mehr spielbare Karteneffekte** in echten
Decks, und Effekte, die dem **offiziellen Kartentext** (PSCT/Errata) folgen — nicht
nur generischen Regex-Mustern auf Englisch.

**Planungsstand:** **PLAN**. Baut auf Test-Build **`18.45.0`** (Plan 104, Sprints
503–510 **CODE**) auf. Plan 104 bleibt für KI/Self-Play; Plan 105 adressiert die
**Simulationslücke** gegenüber echtem Yu-Gi-Oh! (siehe [`yugioh-duel.md`](./yugioh-duel.md)
§ Bewusste Grenzen). Keine Version `18.46.x` ist freigegeben, bis das jeweilige
Gate bestanden ist.

**Ist-Stand (gemessen / im Code):**

| Bereich | Heute | Lücke |
|---|---|---|
| Regeln | 8000 LP, 6 Phasen, Normal/Tribut, vereinfachter Kampf, Extra mit Materialcheck | EMZ/MMZ, Link-Pfeile, Turn-1-Battle, Kosten, Spell Speed, Banish, Pendel, … |
| Effekte | ~**430 / 1395** Karten (~31 %) mit simuliertem Effekt; 8 generische Effektarten | ~965 Karten ohne Effekt; echte Decks ~52 % Self-Play ≈ Münze |
| Fidelity | `effectFromDescription()` heuristisch auf API-Text | Kein PSCT-Modell, keine Zielwahl, kein OPT/HOPT, Feldzauber inaktiv, Errata |

**Reihenfolge:** Zuerst **Regelkomplettheit** (legaler Spielbaum), dann
**Effektabdeckung** (breite Wirkung), zuletzt **Fidelity** (Texttreue). Effekte
dürfen nicht auf Regeln gebaut werden, die Ketten/Timing noch falsch lösen.

---

## 1. Säule — Regelkomplettheit

**Ziel:** `candidateActions` und Auflösung folgen einem dokumentierten TCG-Subset;
Goldfälle für Zonen, Timing und Ketten. Kein Anspruch auf vollständiges
Competitive-Ruling aller Edge Cases in Sprint 1 — aber **keine bewusst falschen**
Turnier-Grundregeln mehr, wo TCG eindeutig ist.

| Thema | Fehlt heute (Auszug) | Geplant |
|---|---|---|
| Zonen | Keine Extra-Monsterzonen, Link-Pfeile, MMZ-Limit vereinfacht | EMZ/MMZ, Link-Register, Beschwörungszonen |
| Zugstruktur | Phasen da; Turn-1-Battle nicht TCG-korrekt | Draw/Standby/Main/Battle/Main2/End inkl. Turn-1-Regeln |
| Beschwörung | Normal/Extra vereinfacht | Pendel (Basis), Flip, richtige Tribut-/Materialregeln, Summon-Limit |
| Ketten | LIFO + Negation nur grob | Spell Speed 1–3, SEG, korrekte Priorität, Antwortfenster |
| Kosten & Bedingungen | Effekte ohne LP-/discard-Kosten | Aktivierungskosten, „cannot“, HOPT-Grundlage (Ausbau in Säule 3) |
| Kampf | ATK/DEF vereinfacht | Angriffsrecht, direkter Angriff, Piercing optional als Gate |
| Nebenkategorien | — | Friedhof/Banish, gleichzeitige Effekte, Deck-out vs. LP-0 |

| Version | Sprints | Gate (Kurz) |
|---|---:|---|
| `18.46.0` | 511–514 | Zonen + Zug/Phasen + Summon-Limit; Gold G1–G20 grün |
| `18.47.0` | 515–518 | Ketten + Kosten + Kampf-Rest; Self-Play nutzt neue Regeln ohne Crash-Loop |

Sprintdetails: [`sprint-511.md`](./sprints/sprint-511.md) bis [`sprint-518.md`](./sprints/sprint-518.md).

---

## 2. Säule — Effektabdeckung

**Ziel:** Anteil **simulierter Effekte** in eingebetteten Real-Decks messbar steigern;
Structure-Decks sind **spielbar**, nicht nur ATK-Schlachten. Metrik: **Deck-Coverage**
(% Karten im Deck mit ausführbarem Effekt in Engine) und **Match-Aktivierungen**
(Effekte pro Duell > Schwellwert auf Gold-Decks).

| Thema | Fehlt heute | Geplant |
|---|---|---|
| Pipeline | Einmaliges Enrichment, Regex | Versionierte Effekt-DB, Re-Enrichment, Coverage-Report im Dev-Menü |
| Effektarten | draw/damage/search/… (8) | special summon, bounce, banish, mill, discard, equip, continuous, field |
| Timing-Klassen | Alles als „effect“ | Quick/Trigger/Flip/Continuous getrennt (an Regeln aus 515+) |
| Feld & Continuous | Feldzauber-Effekt **nicht** simuliert | Field spell + continuous trap/spell Basis |
| Deck-Realität | Echte Decks ohne Effekt = Zufallsduell | Ziel: **≥70 %** Deck-Coverage Ultron-Pool; **≥50 %** aller 1395 Karten langfristig |

| Version | Sprints | Gate (Kurz) |
|---|---:|---|
| `18.48.0` | 519–521 | Effekt-Schema v2 + Metriken; +15 Prozentpunkte Coverage vs. 18.45-Baseline |
| `18.49.0` | 522–524 | Timing-Klassen + Field/Continuous; Gold-Structure-Deck spielbar ohne „stille“ 80 %-Hand |

Sprintdetails: [`sprint-519.md`](./sprints/sprint-519.md) bis [`sprint-524.md`](./sprints/sprint-524.md).

---

## 3. Säule — Fidelity (Kartentext-Treue)

**Ziel:** Effekte entsprechen dem **Kartentext** (PSCT), inkl. Ziele, Bedingungen,
„Once per turn“, Errata — nicht nur dem ersten passenden Regex. Unklare Texte:
**fail-closed** (Effekt nicht ausführbar + sichtbare Meldung), kein erfundenes Verhalten.

| Thema | Fehlt heute | Geplant |
|---|---|---|
| Parsing | Englische Heuristik auf `desc` | PSCT-Atommodell (Trigger, Cost, Effect, Condition) + Card-ID-Version |
| Ziele | Keine Spielerauswahl aus Text | Target-UI + Validator („1 monster your opponent controls“) |
| Limits | Kein OPT/HOPT | Zähler pro Karte/Zug/Chain |
| Errata | API-Text ohne Pin | Errata-Tabelle / API-Version; Regression pro Karten-ID |
| Qualität | Kein Ruling-Corpus | Gold-Deck + Gold-Kartenfälle; **Fidelity-Score** je Deck im Nachweis |

| Version | Sprints | Gate (Kurz) |
|---|---:|---|
| `18.50.0` | 525–527 | PSCT-Modell + Zielwahl; 100 Gold-Karten ≥95 % Übereinstimmung mit erwartetem Outcome |
| `18.51.0` | 528–530 | Errata + Fidelity-Nachweis; Structure-Deck-Demo ohne dokumentierte Text-Abweichung |

Sprintdetails: [`sprint-525.md`](./sprints/sprint-525.md) bis [`sprint-530.md`](./sprints/sprint-530.md).

---

## 4. Abhängigkeiten und Schnittstellen

- **104 → 105:** Self-Play, Suche und Proof bleiben; bei Engine-Regeländerung
  `engineStamp` in [`yugioh-proof.ts`](../frontend/src/engine/yugioh-proof.ts)
  erhöhen und Liga/Nachweis neu spielen.
- **105 intern:** 519+ braucht 515 (Ketten); 525+ braucht 519 (Schema v2).
- **Nicht-Ziele (bleiben):** Kein Online-PvP, kein offizielles Turnier-Judge-Tool,
  kein Ersatz für Konami-/YGOPRODeck-Lizenztexte im Repo, kein Cloud-Ruling-Service.

## 5. Gemeinsame Abnahme (Release `18.51.0`)

1. Automatisiert: `npm run test:yugioh-duel` + neues Paket `test:yugioh-rules` /
   `test:yugioh-fidelity` (Sprints 518, 530).
2. Coverage-Report: Ultron-Pool und 3 Gold-Structure-Decks dokumentiert.
3. Android: Duell gegen Ultron mit echtem Deck, Kette, Feldzauber, Zielwahl manuell.
4. Doku [`yugioh-duel.md`](./yugioh-duel.md): Grenzen ehrlich aktualisiert; keine
   Turnier-Winrate behaupten.

## 6. Lücken (bewusst offen)

- Vollständige **Pendel-/Link-Master-Rule**-Parität mit allen historischen Ausnahmen.
- **OCG vs TCG**-Unterschiede (eine Spieldition als Referenz festlegen).
- Offline-Vollkatalog ohne YGOPRODeck (optional, nicht Gate).

Funktionsumfang heute: [`yugioh-duel.md`](./yugioh-duel.md). Vorgänger KI:
[`104-next.md`](./104-next.md).
