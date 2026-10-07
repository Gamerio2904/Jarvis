# Testanleitung 18.31.5

Vorbereitung: APK `releases/Jarvis.apk` auf **Tablet** und **Handy** installieren (Update über die alte Version). Beide Geräte im **selben WLAN**. Mikrofon-, Kamera- und Benachrichtigungsrechte erlauben. Auf dem Tablet in den Android-Einstellungen Akku → „Nicht optimieren“ für Ultron.

Sicherheitshinweis: Der Server nutzt unverschlüsseltes HTTP im Heimnetz; die Kennung (Token) schützt vor Fremdzugriff, der Hausstand kann API-Keys enthalten. Nicht in fremden WLANs benutzen.

Legende: ✅ erwartet · ❌ Fehler → mit Uhrzeit und Screenshot melden.

---

## A. Tabletmodus (Tablet)

| # | Eingabe/Aktion | Erwartet |
|---|---|---|
| A1 | Chat: `Tabletmodus an` | ✅ Antwort „Tabletmodus an…“; Lage im Vollbild ohne Seitenleiste; große Uhr, leuchtender Ring; Statuszeile „Hausstand-Server läuft: http://192.168.x.x:8765“ |
| A2 | Benachrichtigungsleiste ansehen | ✅ „Ultron Tablet – Hausstand-Server aktiv.“ |
| A3 | Bildschirm bleibt an, Tablet 10 Min liegen lassen | ✅ Bildschirm bleibt an, Ring atmet |
| A4 | Sage `Ultron` | ✅ Sprachmodus öffnet sich, Ring/Anzeige reagiert |
| A5 | Sage `Ultron, wie spät ist es?` | ✅ Antwort mit Uhrzeit |
| A6 | Ring antippen | ✅ Sprachmodus öffnet |
| A7 | App komplett schließen (Recents), neu öffnen | ✅ Tabletmodus startet wieder (Lage, Server, Wake) |
| A8 | `Tabletmodus aus` | ✅ Antwort „Tabletmodus aus…“; Sidebar zurück; Benachrichtigung weg |
| A9 | `Tablet-Modus beenden`, `schalte den Tabletmodus ein` | ✅ aus bzw. an |
| A10 | `Was ist der Tabletmodus und wie geht das genau zu bedienen?` | ✅ löst den Modus **nicht** aus |

## B. Koppeln und automatischer Abgleich

| # | Gerät | Aktion | Erwartet |
|---|---|---|---|
| B1 | Tablet | `Handy koppeln` (Tabletmodus an) | ✅ QR-Code im Chat |
| B2 | Handy | `Scanne QR Code`, Kamera auf Tablet | ✅ „Mit dem Tablet gekoppelt. Hausstand wird abgeglichen.“ |
| B3 | Beide | Stände vorher gleich | ✅ Hinweis „Hausstand ist aktuell.“, nichts geändert |
| B4 | Tablet | Notiz anlegen: `Notiz: Matrikelnummer 123456` | ✅ gespeichert |
| B5 | Handy | App schließen, neu öffnen (max. ~15 s warten) | ✅ „Hausstand vom Tablet übernommen.“, Seite lädt neu, Notiz vorhanden (`Was ist meine Matrikelnummer?`) |
| B6 | Handy | Einkauf: `Setz Milch auf die Einkaufsliste` | ✅ lokal gespeichert |
| B7 | Handy | App in den Hintergrund, nach >45 s zurück | ✅ „Neuerer Hausstand ans Tablet geschickt.“ |
| B8 | Tablet | zuhören | ✅ Tablet sagt **„Hausstand aktualisiert, Sir.“**, lädt neu, Milch steht auf der Liste |
| B9 | Handy | WLAN aus, App öffnen | ✅ kein Absturz, keine Fehlermeldung-Flut, keine Datenänderung |
| B10 | Handy | WLAN wieder an | ✅ nach Reconnect Abgleich (max. ~1 Min) |
| B11 | Tablet | `Kopplung zurücksetzen` | ✅ neuer Token; Handy findet Server nicht mehr (kein Abgleich) bis erneut gekoppelt |
| B12 | Handy | Kopplung zurücksetzen / `Kopplung zurücksetzen` | ✅ „Kopplung auf diesem Gerät gelöscht.“ |
| B13 | Beide | Änderungen an beiden Geräten ohne Abgleich dazwischen | ⚠ Bekannt: der **neuere Stand ersetzt komplett** (kein Zusammenführen). Prüfen: es geht nichts kaputt, Chats/Notizen des neueren Geräts sind vollständig |
| B14 | Handy | `Handy koppeln` auf dem Handy | ✅ „Das geht nur auf dem Tablet.“ |

Fehlerfälle: Tablet ausschalten → Handy öffnen: ✅ still; Server-Port belegt: ✅ Server nimmt anderen Port (Handy folgt über Suche, ggf. erneut koppeln).

## C. Design und Responsive

| # | Prüfpunkt | Erwartet |
|---|---|---|
| C1 | Handy hochkant | ✅ eine Spalte, Eingabefeld rund, Touch-Flächen ≥ 44 px, nichts hinter der Notch/Navigationsleiste |
| C2 | Handy quer | ✅ bedienbar, Tastatur verdeckt Eingabe nicht |
| C3 | Tablet/iPad quer | ✅ Sidebar links, Chat zentriert (max. ~900 px) |
| C4 | Tablet/iPad hochkant | ✅ schmalere Sidebar, größere Schrift |
| C5 | Gerät drehen | ✅ Layout wechselt ohne Neustart |
| C6 | Alle Bereiche (Chat, Lage, Tischplatte, Einstellungen, Kalender) | ✅ Glas-Look, Cyan-Akzent, keine abgeschnittenen Texte, Kontrast lesbar |
| C7 | Android „Animationen reduzieren“ an | ✅ Ring ohne Bewegung |
| C8 | Hell-Theme in Einstellungen | ⚠ Echo-Look ist dunkel ausgelegt; Auffälligkeiten melden |

## D. Review-Bugfixes (frühere Fehlerliste B1–B11)

| # | Eingabe | Erwartet |
|---|---|---|
| D1 | `/hilfe` | ✅ strukturierte Liste mit Gedächtnis, Organisation, Information, Medien, Gerät, Tischplatte, PC, Dateien |
| D2 | `Merk dir: Matrikelnummer 123456` dann `Was ist meine Matrikelnummer?` | ✅ „123456“ mit Quelle |
| D3 | `Notiz: WLAN-Passwort ist abc` dann `Was steht in meinen Notizen?` | ✅ Notiz wird wiedergegeben |
| D4 | `Erinnere mich` | ✅ Rückfrage nach Text/Zeit statt Erfolgsmeldung |
| D5 | `Ruf an` | ✅ Rückfrage „Wen?“ |
| D6 | `Ruf an` → `Mama` → `ja` | ✅ Bestätigung erst nach vollständigen Angaben |
| D7 | `Wetter` → Ort fehlt? | ✅ Rückfrage nach Ort oder Standort |
| D8 | `Wetter` → Themenwechsel `Was ist 5 mal 5?` | ✅ Rückfrage verworfen, Antwort 25 |
| D9 | `Wer bist du?` / `Bist du ChatGPT?` | ✅ „Ich bin Ultron, Version 18.31.5…“ |
| D10 | `Lösch alles` | ✅ wird abgelehnt/rückgefragt |
| D11 | Tischplatte antippen (alter und neuester Hausstand) | ✅ kein Absturz |
| D12 | Einstellungen → Hausstand → Import älterer Hausstand | ✅ Vorschau, danach Tischplatte ohne Absturz |
| D13 | `Plane ein Projekt` ohne Idee | ✅ „Noch keine Idee“ statt Fehler |
| D14 | `Wie war unser Gespräch?` | ✅ lokale Zusammenfassung |
| D15 | Sprachmodus: `Wie ist meine Matrikelnummer?` | ✅ keine erfundenen Zahlen |

## E. Soup (Vorbereitung — Stand ehrlich)

Soup ist **nicht in der App** und wurde **nicht trainiert oder verglichen**. Umgesetzt ist nur die Daten-Governance (Sprint 467/469-Vorarbeit). Prüfung am PC im Ordner `frontend/`:

| # | Befehl | Erwartet |
|---|---|---|
| E1 | `npm run eval` | ✅ 952/952 bestanden |
| E2 | `npm run eval:report` | ✅ Bericht je Kategorie, keine Abstürze |
| E3 | `npm run eval:governance` | ✅ Bericht; zeigt **2 Datenschutzbefunde** (synthetische Telefon/E-Mail) → Trainingsexport bleibt **blockiert** (gewollt) |
| E4 | `npm run test:dataset-governance` | ✅ grün |
| E5 | `npm run test:voice-facts` | ✅ grün (Sprachantwort ohne erfundene Fakten) |
| E6 | `npm run test:review-fixes` | ✅ grün |
| E7 | `npm run test:tablet-sync` und `npm run test:sync-compare` | ✅ grün |

Offen (nicht testbar): Soup-Schattenlauf (S470-3), Variantengenerierung (469), Planungs-/Rückfrage-Gold (474/478), Voice-Kürzung (479–481), Gesamt-Gold (482).

---

## Fehlerbericht-Vorlage

Gerät/Android · Schritt-Nr. · Eingabe · erwartet · tatsächlich · Screenshot · Uhrzeit (für `adb logcat`).
Bekannte alte Testfehler (nicht neu): `test:agents-sweep`, `brain-orchestrator`, `memory-10`, `lage-body-globe`, `rm-graph`, `dead-code`, `18.17`, `18.18`, `clip`, `tsc:scripts`.
