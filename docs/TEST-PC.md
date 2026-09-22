# PC einrichten und 18.8 testen

App-Code **`18.8.4`** auf `main`. Sideload-APK **`18.8.4`**.  
Diese Anleitung gilt für den **Dev-PC** (Browser) und optional für **Jarvis PC** (Rechner steuern).

Volltest mit Prompts seit `1.16`: [`TEST-1.16-plus.md`](./TEST-1.16-plus.md). In der App: Tests → Story → **Seit 1.16 der Reihe nach**.

---

## 1. Einmal einrichten (Windows)

1. [Node.js LTS](https://nodejs.org/) installieren (20 oder neuer). Beim Setup **npm** mitnehmen.
2. [Git](https://git-scm.com/download/win) installieren.
3. Repo holen:

```bat
git clone https://github.com/Gamerio2904/Jarvis.git
cd Jarvis
git checkout main
git pull
```

4. Abhängigkeiten:

```bat
cd frontend
npm install
```

macOS/Linux: dieselben `npm`-Befehle im Terminal.

---

## 2. Jarvis im Browser

```bat
cd frontend
npm run dev
```

Chrome oder Edge: http://localhost:5173

Einstellungen → **API-Keys**: **Groq** für Smalltalk. Optional Gemini (Vision/Research).  
Einstellungen → **Tests**: Spur **Heute** — nicht die ganze Liste scrollen.

Ohne Groq-Key antwortet nur der Parser (Befehle). Smalltalk bleibt stumm oder fällt auf 0,5B zurück.

Automatische Suite:

```bat
cd frontend
bash scripts/run-all-tests.sh
```

Unter Windows ohne Bash: Git-Bash oder WSL. Einzelne Checks: `npm run test:app-ui`, `npm run test:prompts`, `npm run eval:migrate`.

---

## 3. Optional: Rechner steuern (Jarvis PC)

Nur wenn Sie FIFA, Screenshot, Klick oder `PC live` prüfen. Sonst reicht der Browser.

1. `desktop/JarvisPC.bat` doppelklicken. Das **graue Fenster** muss offen bleiben.
2. Dort **QR-Code öffnen**.
3. Im Browser oder auf dem Handy: Einstellungen → Geräte → **QR scannen**.
4. PC-WLAN = Handy-/Browser-Gerät, Profil **Privat**, Firewall zulassen.
5. Chat: `PC testen`. Im grauen Fenster muss **„Anfrage von …“** stehen.

Ohne Kamera: IP `192.168…` / `10…`, Port `18790`, Token von Hand. Nicht `172…` (WSL).

Mehr: [`desktop/README.md`](../desktop/README.md).

---

## 4. Testprompts in der App

Einstellungen → **Tests**.

Die Leiste oben bleibt kleben. Grüne Pille (wie die Settings-Reiter) markiert die Spur.

| Taste | Spur | Inhalt |
|-------|------|--------|
| **1** | **Heute** | 18.7 Fläche, Körper, Flächen-12 |
| **2** | **Gespräch** | Smalltalk, Memory, Recall |
| **3** | **Alltag** | Einkauf, Timer, Kalender, Fahrt |
| **4** | **Gerät** | PC, TV, Haus, Foto |
| **5** | **Lage** | Kugel, Wetter, Welt |
| **6** | **Probe** | Memory-10 bis V9 (Gerätetest) |
| **7** | **Story** | Gespräche der Reihe nach, ↳ = Folge |
| **8** | **Lauf** | Automatischer Debug-Lauf (bleibt rechts kleben) |

`/` fokussiert die Suche (über alle Spuren). Escape leert sie.  
Zweite Pillenreihe filtert die Gruppe in der aktuellen Spur.

Auf jeder Spur außer Lauf sitzt der Knopf **Automatischer Debug-Lauf**.  
`Öffne Debug` und Dock **Tests** landen direkt auf Spur Lauf mit **Start**.

**Senden** schließt die Folie und gibt den Satz in den Chat (Antwort-Orb). **Kopieren** bleibt fürs echte Handy.

Die letzte Spur merkt sich die Sitzung (Tab schließen setzt auf Heute zurück). Der Reiter **Tests** bleibt rechts in der Einstellungs-Leiste kleben.

---

## 5. 18.7 von Hand (Spur Heute oder Story „18.7 Fläche“)

1. Dock: Chat Lage Hören Kalender **Filme** Mehr.
2. Tap Filme → Folie Watchliste, nicht Fahrmodus. Zweiter Tap schließt.
3. `Öffne Lieblinge` → Tab Lieblinge, Thumb auf Filme. Fertig oder `Einstellungen zu`.
4. `Research an` → „Soll ich?“. Danach `Mach WLAN aus` → Geräteseite / „nur auf dem Handy“, **kein** Research-Schalter.
5. `Stell irgendwas mit der Watchliste an` → ehrliche Absage, drei Nachbarn, kein „habe ich gemacht“.
6. `Zeig Erdbeben` → Kugel, Schicht, kein Live-Label.
7. Chat-Satz → Orb, bis Text da ist.
8. Dock Kalender: Monat / Liste / Jahr. `Termin morgen 15 Uhr Zahnarzt` → Karte **Arzt** (Türkis). Teammeeting → **Arbeit**. FAB: Thema und Erinnerung in einem Sheet.

PC/TV-Sätze ohne Gerät: ehrliche Absage zählt.

---

## 6. Won’t

- Keine neue APK aus der Cloud-VM. Sideload: https://github.com/Gamerio2904/Jarvis/raw/main/releases/Jarvis.apk
- 18.5 (Stimme/TV) nicht parallel.
- Computer-Use, Kameras, WLAN-Schalter umlegen: Jarvis macht das nicht.
