# TEST 18.25.14 — Einkaufslisten-GUI + Flächen-Fixes

App-Code und Sideload **`18.25.14`** (versionCode `182514`):
https://github.com/Gamerio2904/Jarvis/raw/main/releases/Jarvis.apk

Vorgänger: [`TEST-18.25.md`](./TEST-18.25.md), Bugplan [`flaechen-bugs-plan.md`](./flaechen-bugs-plan.md), Einkauf-Plan [`einkaufsliste-plan.md`](./einkaufsliste-plan.md).

Jede Box ist ein Satz — einmal tippen, kopieren, in den Chat (oder GUI wie beschrieben).

## 1. Version

```
Was kannst du?
```

Antwort nennt **`18.25.14`**.

## 2. Einkauf — Sprache (Hauptliste)

```
Milch auf die Einkaufsliste
```

```
auch Brot
```

```
was fehlt?
```

Antwort listet Milch und Brot (Hauptliste).

## 3. Einkauf — benannte Liste

```
Airpods zur Amazon-Liste
```

```
Butter zur Urlaub-Liste
```

Startbildschirm → Kachel **Einkauf** → es gibt **Hauptliste**, **Amazon**, **Urlaub** mit passenden offenen Zähler.

## 4. Einkauf — GUI

1. Homescreen → **Einkauf**
2. **Hauptliste** öffnen → Milch/Brot sichtbar
3. FAB **+** → „Joghurt“ tippen → **Freitext übernehmen**
4. Karte **Joghurt** nach **links** wischen → halbtransparent, nach unten
5. Karte **Brot** nach **rechts** wischen → weg
6. **← Listen** → **Fertig**

## 5. Kalender (FAB, schließen)

```
Termin Freitag 15 Uhr Zahnarzt
```

Kalender öffnen → **+** unten mittig → neuer Termin-Dialog.

```
Kalender zu
```

Overlay zu, Chat bestätigt.

## 6. Watchliste

```
Watchliste: Inception
```

Filme-Overlay → Poster sichtbar, kein abgeschnittenes Layout.

```
Watchliste zu
```

## 7. Planungsmodus / Tisch

```
Plane eine App: Einkaufsliste mit zwei Listen
```

Drei Rahmen, Auswahl per **Die zweite** möglich.

```
Entwurf zu
```

## 8. Kugel Tokio

```
Zeig mir Tokio
```

Kugel fokussiert Japan/Tokio (nicht leerer Ozean).

## 9. Flächen per Satz

```
schließe die watchliste
```

```
öffne den kalender
```

```
Tischplatte an
```

```
Tischplatte aus
```

## 10. Kopplung (zwei Geräte, natives APK)

Tablet und Handy: Einstellungen → Kopplung → scannen/koppeln.
Jarvis in den Hintergrund legen → nach ~30 s soll eine **Kopplung**-Benachrichtigung kommen (kein stilles Abbrechen).

---

**Schnellblock (nur Chat):**

```
Milch auf die Einkaufsliste
Airpods zur Amazon-Liste
was fehlt?
Milch hab ich
Kalender zu
Watchliste zu
Zeig mir Tokio
```
