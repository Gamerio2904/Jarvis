# 104 — Yu-Gi-Oh!-Self-Play, Zugsuche und Dev-Umschalter **PLAN** (`18.42`–`18.44`)

**Zweck:** Die Duell-KI soll gegen einen Klon ihrer selbst spielen, Züge per
begrenzter Suche wählen, Matches live zeigen und aus den Protokollen lernen.
Das Yu-Gi-Oh!-Fenster bleibt das Game-Overlay; ein Schalter wechselt ins
Entwicklermenü (Builder, Labore, Self-Play) und zurück.

**Planungsstand:** Nur die Statusblase „Ultron denkt / setzt / beschwört“ im
Overlay ist im Arbeitsbaum (Test-Build `18.31.7`, `CODE`). Alles unten ist
**PLAN**. Die Folge beginnt nach den Gates bis `18.41.0` bzw. kann als
eigenständige Schiene früher gezogen werden, weil sie nur
`frontend/src/engine/yugioh-*` und `YugiohDuel.tsx` berührt. Kein Test-Build ist
eine Release-Freigabe.

## 1. Ausgangslage (gemessen, nicht angenommen)

- Das Netz (28 Merkmale, 16 tanh-Neuronen) liegt in etwa gleichauf mit der
  Heuristik (~80 % gegen zufällige Decks); es schlägt sie bisher nicht.
- Engine und Netz arbeiten nur für `state.player`; Jarvis spielt über eine
  gespiegelte Sicht (`jarvisView` / `fromJarvisView`).
- `candidateActions` liefert die legalen Aktionen, `jarvisStep` führt einen
  sichtbaren Schritt aus. Nur ca. 430 von 1395 Karten haben einen simulierten
  Effekt.

## 2. Zielbild

1. **Self-Play-Match:** zwei gleiche KI-Instanzen (Klon), je Match zufälliger
   Archetyp/Deck pro Seite, abwechselnd Zug für Zug.
2. **Zugsuche:** Pro Zug werden Aktionsfolgen mit Beam Search (Tiefe 3–4,
   Breite 5–6) bewertet; gewählt wird per Softmax mit Temperatur, damit
   Exploration erhalten bleibt. Gegnerhand wird nur als Stichprobe aus seinem
   Deck geschätzt, nie ausgelesen.
3. **Live-Darstellung:** Das Duell läuft sichtbar schrittweise; die Blase zeigt
   die Aktion der jeweils ziehenden Seite.
4. **Auswertung und Lernen:** Protokoll pro Aktion, Fehlerkandidaten nach dem
   Match, Value-Kopf plus suchgestützte Policy, Checkpoint-Liga und Model Soup.
5. **Dev-Umschalter:** Header-Button `Dev ⇄ Spiel`; ein laufendes Duell bleibt
   beim Wechsel erhalten.

## 3. Geplante Releases und Abhängigkeiten

| Zielversion | Sprints | Schwerpunkt | Freigabe |
|---|---:|---|---|
| `18.42.0` | 503–504 | Self-Play-Kern und Zugsuche | Reproduzierbare Matches mit festem Seed; Suche bleibt im Zeitbudget; keine versteckten Gegnerinformationen |
| `18.43.0` | 505–506 | Live-Match-Ansicht, Dev-Umschalter | Overlay-Zustand bleibt beim Wechsel; Handy/Tablet-Bedienung; Reduced Motion |
| `18.44.0` | 507–508 | Protokoll, Review, Lernen, Liga | Neue Version wird nur gespeichert, wenn sie auf festen Holdout-Seeds nicht schlechter ist |

Abhängigkeiten: 504 nach 503, 505 nach 503, 506 unabhängig, 507 nach 503,
508 nach 504 und 507. Das Netz-Speicherformat `jarvis_yugioh_net_v1` (28
Merkmale) bleibt gültig; neue Köpfe oder Merkmale erhalten eine neue
Versionsnummer mit Migration oder werden abgelehnt.

## 4. Qualitätsregeln

1. Kein Lernerfolg wird behauptet, bevor er auf getrennten Holdout-Seeds gegen
   Heuristik **und** Vorgängerversion gemessen wurde.
2. Die Suche darf nur Information nutzen, die der ziehenden Seite sichtbar ist.
3. Self-Play gegen einen einzigen Klon kann kreisen oder kollabieren; deshalb
   Liga mit Checkpoints, Temperatur und feste Referenzgegner.
4. Training läuft in Häppchen (Timer/Worker), blockiert die UI nicht und ist
   abbrechbar; Dauerläufe bleiben ein Dev-Menü-Werkzeug.
5. Speicherstände werden nur durch ausdrückliche Aktion oder bestandenes Gate
   überschrieben, mit Rückfall auf den letzten guten Stand.
6. Aussagen zur Spielstärke gelten nur für die vereinfachte Simulation, nicht
   für echte Turnierspiele.

## 5. Nicht-Ziele

- Keine vollständige Yu-Gi-Oh!-Regelimplementierung, kein Online-Spiel.
- Kein Cloud-Training und kein Server; alles bleibt lokal.
- Keine automatische Versionsfreigabe durch Winrate allein; Geräteabnahme bleibt
  Pflicht.

Sprintdetails: [`sprint-503.md`](./sprints/sprint-503.md) bis
[`sprint-508.md`](./sprints/sprint-508.md). Funktionsumfang und Grenzen des
Prototyps: [`yugioh-duel.md`](./yugioh-duel.md).
