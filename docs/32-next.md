# 32 — Fahren, Musik, Chat, Angebot, FC 26 (`2.21`–`2.27`)

PO 2026-08-23: Blitzer inkl. mobile Baustellen; CarPlay erst ausführen, dann vorlesen (oder nur vorlesen); Graphik glatter / weniger Latenz; Alternative zur Spotify-API (Amazon Musik); Chats in Ordner; benachrichtigen wenn Instanudeln im Angebot; FC-26-Mannschaft vom Bild analysieren, Vorschläge nach Karrierejahr und Potenzial, FIFA-Karten im Tablet, Auswahl-Animation.

Reihe davor: [`31-next.md`](./31-next.md) Alltag & Welt `2.4`–`2.20`. App jetzt: Sideload **`2.3.0`**. Diese Reihe ist **PLAN**, Bau auf PO-Kommando.

Eine Sideload-Stufe pro Version. Nichts erfinden. Keine Amts-API vortäuschen.

## Reihenfolge

| Version | Inhalt | API / Quelle | Status |
|---------|--------|--------------|--------|
| **`2.21.0`** | Blitzer + mobile Baustellen | Autobahn GmbH (Baustelle/Warnung/Sperrung), OSM fest + Baustelle; mobiles Blitzer nur benannte freie Liste oder ehrlich leer | **PLAN** |
| **`2.22.0`** | CarPlay: zuerst tun, dann sprechen | intern Fahrmodus + vorhandenes TTS | **PLAN** |
| **`2.23.0`** | Graphik & Latenz | intern (Chat, Overlay, Tablet, Karte) | **PLAN** |
| **`2.24.0`** | Amazon Musik als Alternative | Android-Intent in die Amazon-Musik-App; interne API nur mit PO-Zugang (closed Beta) | **PLAN** |
| **`2.25.0`** | Chats in Ordner | lokal IndexedDB | **PLAN** |
| **`2.26.0`** | Instanudeln im Angebot | vorhandene Research + Notify; keine Rewe/Lidl-Reverse-API | **PLAN** |
| **`2.27.0`** | FC 26 Mannschaft + Tablet-Karten | Auge (Foto) + benannte Spielerquelle; Potenzial-Jahr = Näherung | **PLAN** |

Sprint-Kickoff: [`sprint-107.md`](./sprints/sprint-107.md).

## Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Netz | Nur freie, benannte Quellen oder schon vorhandene Suche. Kein neuer Cloud-Zwang. |
| Ehrlichkeit | Fehlt die Kamera, das Angebot, der Spielerwert: das sagen. Kein Raten. |
| Blitzer | Autobahn-API für Baustellen, Warnungen, Sperrungen auf Autobahnen (kein Key). OSM `amenity=speed_camera` und `highway=construction` für fest / Straße. **Keine Amts-API für mobile Blitzer.** Community-Liste nur wenn frei, dokumentiert und als solche genannt. Kein Blitzer.de-Scrape. |
| CarPlay | Internes Android-HUD, nicht Apple CarPlay. Befehl zuerst ausführen (Navi, Lautstärke, Anruf-Nachfrage). Danach kurze Bestätigung vorlesen. Optional nur vorlesen — kein langes LLM vor dem Tun. |
| Graphik | Bestehendes härten. Weniger Re-Renders, Overlay/Karte/Tablet ohne Ruckler. Keine neue Design-Marke. |
| Amazon Musik | Offizielle Web-API ist **closed Beta**. Ohne PO-Zugang: Intent öffnet die Amazon-Musik-App, ehrlich „in der App“. Spotify bleibt Default. Kein inoffizieller Stream-Scrape. |
| Chat-Ordner | Nur lokal. Anlegen, umbenennen, Chat hineinlegen. Kein Cloud-Sync, kein Export-Zwang. |
| Instanudeln | Keine freie offizielle Angebots-API (Rewe/Lidl nur App-Backends). Watchlist + vorhandene Rabatt-Suche + bestehende Notify. Kein Treffer = ehrlich. Kein erfundenes „ja, im Angebot“. |
| FC 26 | Foto über bestehendes Auge. Werte nur aus benannter Quelle (gebündelter Stand oder genehmigtes SoFIFA). Karrierejahr fehlt → fragen. Wachstum OVR↔POT ist **Näherung**, nicht der EA-Kernel. Immer drei Vorschläge: erfahren, jung, Mitte. Tablet-Karten; Auswahl füllt den Schirm, „Gute Wahl, Sir.“ |

## `2.21.0` — Blitzer & Baustellen

Im Fahrmodus und im Chat: was **vor Ihnen** liegt.

| Lage | Quelle | Ansage |
|------|--------|--------|
| Autobahn-Baustelle, Sperrung, Verkehrsmeldung | `verkehr.autobahn.de` (frei, kein Key) | Distanz + Art, wenn GPS und Straße passen |
| Feste Blitzer, Straßen-Baustelle | OSM Overpass | nur gemappte Punkte, Lücken ehrlich |
| Mobiler Blitzer, Blitzer-Anhänger | keine Amtsquelle | benannte Community-Liste **oder** „mobil nicht aus Amt“ |

**Chat:** `Gibt’s Blitzer?` / `Baustelle vor mir` / im Fahrmodus automatisch in Reichweite.

**Probe:** Auf einer Autobahn mit bekannter Baustelle in der API — Ansage. Außerhalb: OSM oder ehrlich leer. Kein erfundener mobiler Blitzer.

## `2.22.0` — CarPlay: zuerst tun, dann sprechen

„Außer, CarPlay verbessern“: im Fahrmodus nicht erst einen langen Satz bauen.

1. Parser trifft → Tool läuft sofort.
2. Kurze Bestätigung wird vorgelesen (`Route liegt.`, `Leiser.`).
3. Langer Chat-Text optional danach oder gar nicht (`nur vorlesen` = nur die kurze Zeile).

Navi-Abbieger bleiben wie bisher System-TTS, ohne Gemini-Warten.

**Probe:** `Nach Heilbronn` startet die Route, dann eine kurze Zeile. `Lautstärke 10` ändert Spotify zuerst, spricht danach. Smalltalk ohne Tool bleibt vorlesen wie bisher.

## `2.23.0` — Graphik & Latenz

Weniger laggy: Chat-Scroll, Fahrmodus-Karte, Tablet-HUD, Overlay-Wechsel. Keine neuen Features.

**Probe:** Fahrmodus + Tablet öffnen/schließen ohne Ruckler. Stimme antwortet nicht erst nach einem sichtbaren Hänger. Regression: `Wetter heute`, Steckdose, Route.

## `2.24.0` — Amazon Musik

Alternative, wenn Spotify fehlt oder der PO Amazon nutzt.

| Zugang | Verhalten |
|--------|-----------|
| Kein Amazon-API-Zugang (Default) | `Spiel … auf Amazon` öffnet die Amazon-Musik-App (Intent). Jarvis behauptet kein internes Abspielen. |
| PO hat closed-Beta-Zugang | Dann erst interner Player wie Spotify, gleicher Fahrmodus-Tab. |

Spotify-Befehle ohne „Amazon“ bleiben Spotify. `Lautstärke` trifft weiter das letzte Medium.

**Probe:** Ohne Zugang: Intent, ehrliche Zeile. Spotify-Play unverändert.

## `2.25.0` — Chat-Ordner

Sidebar: Ordner anlegen, Chat hineinziehen oder `Leg das Gespräch nach Arbeit`. Suche bleibt über alle Ordner, sofern nicht gefiltert.

**Probe:** Zwei Ordner, ein Chat verschieben, nach Neustart da. Löschen eines Ordners fragt, Chats nicht still mitlöschen.

## `2.26.0` — Instanudeln im Angebot

Watchlist (Default: Instanudeln / Instant Noodles / Ramen / klare Marken, wenn der PO sie nennt). Prüfung über **vorhandene** Research/Rabatt-Suche. Treffer → Notify wie Wecker/Erinnerung. Kein Treffer → still oder auf Nachfrage ehrlich.

Keine Lidl-Plus-/Rewe-App-Zertifikate, kein Prospekt-Raten.

**Probe:** `Sag Bescheid wenn Instanudeln im Angebot sind` legt die Watchlist. Künstlicher Treffer in der Suche → eine Notification. Ohne Treffer kein „ist im Angebot“.

## `2.27.0` — FC 26 Mannschaft

Foto der Aufstellung (Auge). Fehlt etwas: nachfragen (`In welchem Karrierejahr sind Sie?`, Formation, Budget nur wenn nötig).

Vorschläge **immer drei**:

| Typ | Regel |
|-----|--------|
| Erfahren | hohes OVR, älter, ergänzt eine Schwäche |
| Junges Talent | hohes POT, jung; OVR im genannten Jahr ≈ Wachstum Richtung POT |
| Mitte | tragfähig jetzt, kein Extrem |

Jahr: Spieljahr der Karriere, nicht Kalender. Formel offengelegt als Näherung. Unbekannter Spieler = nicht erfinden.

Tablet: Karten-Auswahl. Nennt der PO einen Namen — Karte füllt den Schirm, die anderen weichen, kurze Zeile **„Gute Wahl, Sir.“**

**Probe:** Foto + Jahr → drei benannte Vorschläge mit Quelle. Ohne Jahr: Frage, keine Liste. `Neymar` im Tablet: Animation + Satz. Ohne Werte-Quelle: ehrlich, kein Fake-OVR.

## Chat (Zielbild)

| Version | Beispiel |
|---------|----------|
| `2.21.0` | `Gibt’s Blitzer?` / `Baustelle vor mir` |
| `2.22.0` | `Nach Heilbronn` — Route zuerst, dann eine Zeile |
| `2.23.0` | (kein neuer Befehl — flüssiger) |
| `2.24.0` | `Spiel Hotel California auf Amazon` |
| `2.25.0` | `Leg das Gespräch nach Arbeit` |
| `2.26.0` | `Sag Bescheid wenn Instanudeln im Angebot sind` |
| `2.27.0` | Foto + `Wer fehlt in der Mannschaft` / Name einer Karte |

## Probe (wenn die jeweilige Version CODE ist)

1. Frage wie in der Tabelle — Quelle oder ehrlich leer.
2. Regression: `Wetter heute`, `Steckdose an`, `aktiviere fullscreen`, Fahrmodus-Lautstärke = letztes Medium, `Ruf Odett an` klebt nicht.
3. `/hilfe` nennt die neue Fähigkeit erst nach dem Sideload.

## Won’t

Apple CarPlay, iOS, Blitzer.de-Scrape, Lufop-Zwang-Account als Default, Amazon-Stream ohne Beta-Zugang, Rewe-mTLS / Lidl-Plus-Reverse, erfundene Angebote, EA-Server / FUT-Markt, erfundene OVR, Play Store, Tuya-Cloud, Alexa.
