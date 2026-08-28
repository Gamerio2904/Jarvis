# Sprint 123 — Körper-Show + virtueller Globus (`6.20`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** |
| Priorität | nach Motion-Kern `6.10` |
| Ziel-Version | `6.20.0` (Research `6.21` Fly-to/Zoom, `6.22` GIBS, `6.23` Blickmitte) |
| Quelle | PO: Körper/Kugel massiv; Satellitenfoto; Zoomen; Zeig London; Was ist das für eine Stadt |
| Plan | [`45-next.md`](../45-next.md) |
| Baut auf | `BodySchema.tsx`, `GlobeView.tsx`, Gazetteer-Pin `5.11`, GIBS-Plan [`43-next.md`](../43-next.md) |

## Ziel

Körper: Show statt Skizze (Licht, Pulse aus echten Werten, Kamera zum Organ).

Kugel: **virtueller Globus**. Weit weg Blue Marble. Ranzoomen — Finger oder Satz — NASA-Satellitenfoto (GIBS), Stand in Stunden, Datum sichtbar. `Zeig mir London` dreht, zoomt, sagt den Namen. `Was ist das für eine Stadt?` nennt die Stadt in der Blickmitte, wenn sie im Lexikon liegt.

Chat bleibt. Organ antippen startet kein Gerät. Kein Live-Video.

## Must

| ID | Inhalt |
|----|--------|
| C1 | Körper: Pulse nur mit echten Werten; Ease zu Hirn/PC-Auge; kein Tool-Start |
| C2 | Zoom an der Kugel (Geste). Weit = Blue Marble, nah = GIBS mit „Stand Datum, oft Stunden alt“ |
| C3 | `Zeig London` / `Zeig mir Paris` / `Wo liegt Berlin`: drehen, zoomen, Pin, ein Satz. Unbekannt: ehrlich nicht auf der Kugel |
| C4 | `Was ist das für eine Stadt?` / `Was sehe ich?` bei offener Kugel: Blickmitte → Lexikon. Treffer: Name + fester kurzer Satz (Gemini darf schleifen). Meer: keine Stadt erfinden |
| C5 | Lexikon erweitern (Hauptstädte + vorhandene Orte + ein Klischee-Halbsatz fest im Code) |
| C6 | Reduced-motion: Zoom ohne Dauerspin; 2D-Karte mit denselben Orten |
| C7 | Ein Zeichen-Budget mit dem Körper — nicht beide Sichten gleichzeitig |

## Won’t (dieser Sprint)

Live-Satellitenvideo. Street-View. Überwachung. Jedes Dorf der Welt. Iron-Man-Mesh. Sideload. Apple CarPlay (124).
