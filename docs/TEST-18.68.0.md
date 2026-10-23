# Testanleitung 18.68.0 — Fristen, Namen, Tags, QR-Scanner, Server-Sätze, Vollabgleich

Beispiel-Sätze, die direkt in den Chat getippt oder gesprochen werden können.
**Wichtig vor dem Start:** Beide Geräte (Handy + Tablet) brauchen diese APK —
Ordner-Layout und Vollabgleich reisen erst zwischen gleichen Ständen.

---

## 1. Frist-Parser — „nächste Woche" und saubere Namen

| Prompt | Erwartet |
|---|---|
| `ich muss bis freitag nähste woche hausaufgaben in gm machen` | Todo **„Hausaufgaben in GM machen"** (offen, nicht erledigt) + Kalender am Freitag der **nächsten** Woche, 18:00. Kein „nähste woche" im Namen. |
| `ich muss bis freitag näxte woche hausaufgaben in gm machen` | Gleiches Verhalten — Schreibfehler egal. |
| `ich muss bis nächste woche hausaufgaben machen` | Todo „Hausaufgaben machen", Termin **Montag nächste Woche** 18:00. |
| `setze team meeting freitag nächste woche auf die to-do-liste` | Todo „Team Meeting" mit Termin Freitag nächste Woche. |
| `setzte minecraft auf todoliste` | Todo heißt **„Minecraft"** — nicht „Setzte minecraft". |
| `todo: kauf minecraft` | Todo heißt „Minecraft". |
| `kauf minecraft` | Einkaufsliste: Posten heißt „Minecraft". |
| `setzte minecraft auf die einkaufsliste` | Posten „Minecraft" (nicht „Setzte minecraft"). |

**Prüfen:** Kalender öffnen (Monatsansicht sichtbar), Tag des Termins antippen,
Todo-Liste öffnen — der Eintrag ist **offen**, nicht abgehakt.

---

## 2. Tags ohne Ziel und mit Ziel

| Prompt | Erwartet |
|---|---|
| `setzte minecraft auf todoliste` und danach `ergänze tag amazon` | Tag **amazon** hängt am letzten Todo („Minecraft"). Antwort: „Tag „amazon" hängt jetzt an „Minecraft"." — **nicht** auf die Einkaufsliste, kein „Den Sprint finde ich nicht". |
| `tag minecraft mit amazon` | Ziel wird selbst gesucht (Todo → Notiz → Bibliothek); Tag landet am Minecraft-Todo. |
| `tagge die notiz italien mit urlaub` | Tag urlaub an der Notiz „italien" (Notiz muss existieren). |
| `füge tag urlaub zur notiz italien hinzu` | Gleiches Ergebnis. |
| `tag einkaufen` | Tag landet am zuletzt berührten Eintrag. |
| `zeige todos mit tag amazon` | Listet die offenen Todos mit diesem Tag, öffnet die Todo-Fläche. |

**Prüfen:** Todo-Fläche — die Karte von „Minecraft" trägt einen farbigen
Rahmen und den Chip „amazon". Filter-Chip „amazon" antippen: nur diese Karte
bleibt. Nach Tag sortieren gruppiert.

---

## 3. Allgemeiner QR-Scanner

| Prompt | Erwartet |
|---|---|
| `scanne qr code` | Scanner öffnet sich — **kein** Hausstand-Zwang. |
| Beliebigen QR-Code vor die Kamera (Link) | Code wird gelesen, Text erscheint, Knopf **„Link öffnen"** öffnet den Browser, **„Kopieren"** kopiert, **„Weiter scannen"** reaktiviert die Kamera. |
| Beliebiger Text-QR (WLAN, Notiz, Ticket) | Text wird angezeigt und kann kopiert werden. |
| Kopplungs-QR vom Server-Gerät | Gerät speichert die Kopplung **und gleicht sofort ab**: „Gekoppelt und abgeglichen. … Beide Geräte haben denselben Stand." |

**Prüfen:** Ein fremden QR (z. B. von einer Verpackung) scannen — vorher sagte
er „Das ist kein Hausstand-Code", jetzt kommt der Inhalt.

---

## 4. Server per Satz (zwei Geräte)

| Gerät | Prompt | Erwartet |
|---|---|---|
| Tablet (Gerät 1) | `auf gerät 1 starte server` bzw. `starte server` | „Server läuft im WLAN (https://…)" + Kopplungs-QR im Chat. |
| Handy (Gerät 2) | `auf gerät 2 verbinde ich mit server` bzw. `verbinde mit server` | **Gekoppelt:** sofortiger Abgleich. **Noch nicht gekoppelt:** Scanner öffnet sich — Code vom Tablet scannen, danach Abgleich. |
| Handy (Gerät 2) | `hausstand übertragen` | Klassischer Weg: QR vom Tablet, Richtung wählen. Weiter verfügbar. |

**Prüfen:** Nach dem Abgleich beide Todo-Listen öffnen — beide Geräte zeigen
dieselben Einträge.

---

## 5. Hausstand-Vollabgleich

1. Tablet: Ordnerraster auf dem Startbildschirm ändern (App in Ordner ziehen,
   Ordner umbenennen) — jede Änderung hebt den Stand.
2. Tablet: `starte server` (oder QR zeigen mit `hausstand übertragen`).
3. Handy: `verbinde mit server`.
4. **Erwartet:** „Abgeglichen. … Beide Geräte haben denselben Stand."

Vergleich Handy ↔ Tablet nach dem Abgleich:
- Startbildschirm: gleiche Kacheln, gleiche **Ordner** mit gleichem Inhalt und Namen
- Todos (inkl. Tags), Todo-Listen
- Kalendertermine und Erinnerungen
- Notizen (inkl. Tags), Einkaufslisten
- Bibliothekseinträge (Verknüpfungen, Lesetexte, Tags)
- Merksätze, Ideen, Watchliste

**Prüfen:** Handy neu starten — das Ordner-Raster bleibt (es kommt aus dem
Hausstand, nicht aus dem RAM).

---

## 6. Kalender in der Monatsansicht

| Schritt | Erwartet |
|---|---|
| Kalender-Kachel antippen oder `öffne den kalender` | Kalender öffnet in der **Monatsansicht** (Reiter „Monat" ist an). |
| Wegschließen und wieder öffnen | Wieder Monat. |
| Nach `trag morgen … ein` Kalender öffnen | Monat, der neue Tag ist markiert. |

---

## 7. Tempo (Antwortzeiten)

| Prompt | Erwartet |
|---|---|
| `stell einen timer auf 5 minuten` | Antwort in ~1–2 s mit „Erledigt: …" — kein zweiter Modell-Lauf mehr. |
| `erinnere mich morgen um 8 an die Post` | Schnelle Bestätigung mit Vorschau. |
| `setze wäsche aufhängen auf die to-do-liste` | Schnelle Bestätigung. |
| Lange Wissensfrage (z. B. „erkläre Quantencomputer kurz") | Unverändert gestreamt — Tempo hier hängt am Modell. |

**Prüfen:** In der Lage → Agenten-Karte sieht man die Messwerte; Werkzeug-Züge
ohne Lese-Werkzeug enden direkt nach der Ausführung.

---

## 8. Automatische Tests

```
cd frontend
npm run test:round2   # neue Fälle dieser Runde
bash scripts/run-all-tests.sh   # Gesamtsuite
```

`test:round2` prüft: Fristen (auch falsch geschrieben), saubere Namen,
Tag-Sätze, Server-Sätze, Merge von Bibliothek und Ordner-Layout.
Bekannt und vor 18.68.0 vorhanden: `eval`, `eval:ambiguity`, `test:prompts`,
`test:dead-code`, `test:18.18`, `tsc:scripts` schlagen wegen alter Fälle
(„Ändere den Wecker" im Ablauf-Kontext, Yu-Gi-Oh-Typos im Skript-TS) fehlen —
nicht durch diese Runde.
