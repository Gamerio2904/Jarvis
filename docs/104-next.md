# 104 — Yu-Gi-Oh!-Self-Play, Zugsuche und Dev-Umschalter **PLAN** (`18.42`–`18.45`)

**Zweck:** Die Duell-KI soll gegen einen Klon ihrer selbst spielen, Züge per
begrenzter Suche wählen, Matches live zeigen und aus den Protokollen lernen.
Das Yu-Gi-Oh!-Fenster bleibt das Game-Overlay; ein Schalter wechselt ins
Entwicklermenü (Builder, Labore, Self-Play) und zurück.

**Planungsstand:** Sprint 503 (Match-Runner `yugioh-selfplay.ts`) und 504 (Zugsuche
`yugioh-search.ts`) sind als Engine-Code mit Tests im Arbeitsbaum (`CODE*`, noch ohne
UI). Gemessen (400 Matches je Zeile, abwechselnde Seiten, Suche gegen Heuristik,
ohne Netz): generierte Decks 61,5 % ±4,8 (Training-Profil) bzw. 62,3 % ±4,8
(Proof-Profil); echte Decks 51,5 % ±4,9 bzw. 52,0 % ±4,9, also nicht
unterscheidbar von 50 %, weil die meisten echten Karten keinen simulierten Effekt
haben. Außerdem ist die Statusblase „Ultron denkt / setzt / beschwört“ im
Overlay im Arbeitsbaum (Test-Build `18.31.7`, `CODE`). Alles ab 505 ist
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
2. **Zugsuche:** Pro Zug werden Aktionsfolgen mit Beam Search mit
   iterativer Vertiefung (Breite 5–6) bewertet, im Spiel bis zur Stabilität des
   besten Zugs, hart max. 30 s (Training: kleines festes Budget); gewählt wird per Softmax mit Temperatur, damit
   Exploration erhalten bleibt. Gegnerhand wird nur als Stichprobe aus seinem
   Deck geschätzt, nie ausgelesen.
3. **Live-Darstellung:** Das Duell läuft sichtbar schrittweise; die Blase zeigt
   die Aktion der jeweils ziehenden Seite.
4. **Auswertung und Lernen:** Protokoll pro Aktion, Fehlerkandidaten nach dem
   Match, Value-Kopf plus suchgestützte Policy, Checkpoint-Liga und Model Soup.
5. **Nachweis:** Training-Overlay (Live-Board links, Dev-Infos rechts), danach
   Analyse und grüner Verify-Button. Verify prüft den Gewichts-Hash, spielt die
   Testspiele (inkl. verstecktem Seed-Satz) nach und rechnet die Statistik neu;
   die Nachweis-Datei ist immer ladbar. Eine Elo-Liga (Bradley-Terry, Heuristik
   als Anker) zeigt den Verlauf über die Versionen.
6. **Dev-Umschalter:** Header-Button `Dev ⇄ Spiel`; ein laufendes Duell bleibt
   beim Wechsel erhalten.

## 3. Geplante Releases und Abhängigkeiten

| Zielversion | Sprints | Schwerpunkt | Freigabe |
|---|---:|---|---|
| `18.42.0` | 503–504 | Self-Play-Kern und Zugsuche | Reproduzierbare Matches mit festem Seed; Suche bleibt in 30 s (Spiel) bzw. Trainingsbudget; keine versteckten Gegnerinformationen |
| `18.43.0` | 505–506 | Live-Match-Ansicht, Dev-Umschalter | Overlay-Zustand bleibt beim Wechsel; Handy/Tablet-Bedienung; Reduced Motion |
| `18.44.0` | 507–508 | Protokoll, Review, Lernen, Liga | Neue Version wird nur gespeichert, wenn sie auf festen Holdout-Seeds nicht schlechter ist |
| `18.45.0` | 509–510 | Nachweis-Datei, Verify, Elo-Liga, Training-Overlay | Speichern nur bei grünem Verify **und** bestandenem Gate; Verify spielt Testspiele mit festem Knotenbudget nach |

Abhängigkeiten: 504 nach 503, 505 nach 503, 506 unabhängig, 507 nach 503,
508 nach 504 und 507, 509 nach 507 und 508, 510 nach 506, 508 und 509. Das Netz-Speicherformat `jarvis_yugioh_net_v1` (28
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
6. Verify beweist nur, dass Messung und Datei stimmen, nicht Stärke gegen echte
   Spieler. Der Nachweis nutzt ein festes Knotenbudget statt Zeitlimit, sonst
   ist das Nachspielen nicht deterministisch. Elo gilt nur innerhalb der Liga.
7. Aussagen zur Spielstärke gelten nur für die vereinfachte Simulation, nicht
   für echte Turnierspiele.

## 5. Nicht-Ziele

- Keine vollständige Yu-Gi-Oh!-Regelimplementierung, kein Online-Spiel.
- Kein Cloud-Training und kein Server; alles bleibt lokal.
- Keine automatische Versionsfreigabe durch Winrate allein; Geräteabnahme bleibt
  Pflicht.

Sprintdetails: [`sprint-503.md`](./sprints/sprint-503.md) bis
[`sprint-510.md`](./sprints/sprint-510.md). Funktionsumfang und Grenzen des
Prototyps: [`yugioh-duel.md`](./yugioh-duel.md).
