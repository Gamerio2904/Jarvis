# 44 — Debug-Lauf: Kategorien, Sequenz, Export (`5.11`) **CODE**

PO 2026-08-27: Debug-Button, Fenster mit **allen** eingebauten Themen als Klickboxen, vorbereitete Prompts pro Gruppe, Start → **neues Gespräch**, Prompt für Prompt warten, Download mit Prompt/Antwort **und** ob der Befehl sauber gelaufen ist — zum Schicken an die Planung. Hintergrund wenn möglich, sonst Chat/Settings offen.

**Ist:** Settings → Debug ist **CODE** `3.19.0` ([`34-next.md`](./34-next.md), `DebugPanel.tsx`). Eine Kategorie (Select), Start im **aktuellen** Chat, Download nur `Sie:`/`Jarvis:`-Text. Katalog: `test-copy.ts`. CI-Flachliste: `test-prompts.ts`.

**Lücke:** keine Mehrfachwahl, kein neues Gespräch, keine Soll-Route, kein Tool-Status im File, Welt-Tools `3.1`–`3.17` und Face/Lage/Hausstand fehlen in den Gruppen, kein Stop, Android-Hintergrund ungeklärt.

**Live:** Code **`4.53.0`**. Sideload **`3.18.1`**. `4.66` Körper, `4.76` LocateAnything, `5.0` Weltkugel (PR #58) bleiben eigene Schienen. Diese Nummer: **`5.11`**, nicht `5.0`.

Kein Execute in diesem Sprint. Research `5.12` vor Hintergrund-Service. Sideload nach Hausstand.

## Kurz: was wir konkret bauen

| Wunsch | Entscheidung |
|--------|----------------|
| Debug-Button | Bleibt Einstellungen → **Debug**. Das Thema wird zum Lauf-Fenster (Klickboxen, Start/Stop/Download), kein zweites App-Icon. |
| Alle Kategorien | Eine Box pro Gruppe. **Alle** / **keine**. Zähler `12/84`. |
| Prompts | Fest im Code (`test-copy.ts`), nicht vom LLM erzeugt. Unten: bestehende Gruppen bleiben, **neue** Gruppen stehen ausgeschrieben. |
| Start | Neues Gespräch `Debug YYYY-MM-DD HH:MM`. Dann Prompt 1, auf `onDone` warten, Prompt 2, … Stop bricht ab, Download bleibt. |
| Chat offen | Nicht nötig. Lauf schreibt ins Gespräch; Settings dürfen oben bleiben. Chat-Ansicht darf zu. |
| App im Hintergrund (Home) | Research `5.12`. v1: **Vordergrund** (Settings oder Chat sichtbar, optional Bildschirm-Wach). v2: Foreground-Service nur wenn Spike zeigt, dass JS sonst stirbt. App **schließen** = Lauf tot. |
| Download | JSON (für die Planung) + TXT (lesbar). Prompt, Antwort, Route, `tool_status`, Soll/Ist, Dauer, Version, Gemini an/aus. |

## Ist vs. Soll

| Heute `3.19` | `5.11` |
|--------------|--------|
| `<select>` eine Gruppe | Klickboxen, mehrere Gruppen hintereinander |
| `activeId` (Alltagschat) | `createConversation()` extra |
| `onSend` → nur Reply-String | Turn-Ergebnis: reply + `tool` + Dauer |
| Download Plaintext | JSON+TXT inkl. Verdict |
| 19 Gruppen, Lücken bei Welt/Face | Katalog deckt Register-IDs ab |
| Kein Stop | Stop + Teildownload |

`sendMessage` in `App.tsx` liefert die Reply schon; Tool-Meta liegt an der Assistant-Message (`meta.tool`). Der Lauf muss das **einsammeln**, nicht nur den Chat-Text.

## Writes sind echt

Start-Hinweis, sonst kein Start:

> Timer, Wecker, Kalender, Einkauf, Steckdose, Taschenlampe laufen **wirklich**. Anruf, SMS und Taxi warten auf Ja — der Lauf schickt **kein** automatisches Ja.

| Art | Verhalten |
|-----|-----------|
| Lesen (Uhr, Wetter, News, ISS) | normal |
| Schreiben (Timer, Termin, Liste) | echt, Testdaten in den Prompts |
| Confirm (Anruf, SMS, Taxi) | erster Prompt erwartet **Nachfrage**, nicht Ausführung. Kein Auto-Ja. |
| Hausstand-Import | **nicht** im Default-Katalog |
| PC/TV ohne Gerät | ehrlicher Fehler = **pass**, wenn Soll `status: error` oder `skip_if: offline` |

## Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Produkt | **Ein** Debug-Lauf in der App. Kein Cloud-Upload, keine zweite APK. |
| Router | Unverändert. Der Lauf **misst**, er patcht keine Scores. |
| Soll-Werte | Pro Prompt `expect.tool` (Register-ID oder `smalltalk` / `refuse`). Abgleich mit `meta.tool.tool` bzw. Smalltalk = kein Tool. |
| 0,5B | Tools laufen über Parser, nicht über das Modell. Smalltalk-Qualität ist im File, Verdict dort oft `unknown`. |
| Gemini | Unverändert Opt-in. Export schreibt `brain: local\|gemini`. |
| Datei | `jarvis-debug-YYYYMMDD-HHmm.json` plus `.txt`. Share-Sheet wenn Capacitor das hergibt, sonst Download wie heute. |
| CI | `test:014` / `test:prompts` bleiben Node. Der Handy-Lauf ist kein Ersatz, er liefert **Live**-Spuren. Eine Quelle: Gruppen in `test-copy.ts`, Flachliste daraus ableiten. |

## Kategorien (Klickboxen)

Bestehende Titel in `test-copy.ts` **behalten** (Prompts schon CODE):

Smalltalk · Gedächtnis · Einkauf · Tag & Hilfe · Uhr & Gerät · Ort · Wetter · Timer Wecker Erinnerung · Kalender & Losgehen · Fernseher & Film · Haus · Fahren & Spotify · Tanke POI Bahn · Leute Anruf SMS · PC Foto Notiz · Research Nachrichten Feiertag · Weltlage · Alltagskette · Randfälle

**Neu CODE `5.11`:** Welt & Lage · Gesicht & Hausstand

**Neu CODE `6.50` nach Prompt-Test** ([`46-test-650.md`](./46-test-650.md)):

### Bühne & Hirn · Naive Fragen · Kaputt 6.50

Globus `Zeig mir London` / Blickmitte / Atlantis, naive „Was kannst du?“, kaputte Sätze. Soll-Werte sind **CODE in `6.51`** ([`46-next.md`](./46-next.md)). `Ok Google, Timer …` **nicht** im Live-Katalog (echter Write).

**Neu einbauen** (Prompts fest, Execute füllt `test-copy.ts`):

### Welt & Lage (`3.1`–`3.18`)

| Label | Prompt | Soll |
|-------|--------|------|
| Unwetter | `Gibt es Unwetter?` | `warn` |
| DWD | `DWD Warnung` | `warn` |
| Ferien | `Wann sind die Schulferien in Baden-Württemberg?` | `ferien` |
| ISS | `Wo ist die ISS?` | `sky` |
| Mond | `Wie ist der Mond heute?` | `sky` |
| Flüge | `Was fliegt da über uns?` | `flights` |
| Bundesliga | `Wie steht die Bundesliga?` | `sport` |
| Schach öffnen | `Schach` | `chess` oder `hud` |
| Lebensmittel | `Zutaten von Nutella` | `food` |
| Buch | `Wer schrieb Der Prozess?` | `library` |
| Waschsymbol | `Was bedeutet Waschschüssel 40?` | `haushalt` |
| Schritte | `Wie viele Schritte heute?` | `sensors` (ehrlich leer erlaubt) |
| Norden | `Wo ist Norden?` | `sensors` |
| Recht | `Darf ich im Park grillen?` | `law` |
| Lage an | `Lage an` | `hud` |
| Wetterstatistik | `Wetterstatistik an` | `hud` |
| Traceroute | `Welche Route nimmt google.de` | `trace` |
| Gespräch fassen | `Fass das Gespräch zusammen` | `digest` |

### Gesicht & Hausstand (`4.46` / `4.53`)

| Label | Prompt | Soll |
|-------|--------|------|
| Friday | `Friday` | `face` |
| Jarvis zurück | `Jarvis` | `face` |
| Freitag≠Friday | `Was steht am Freitag an?` | `calendar`, **nicht** `face` |
| Hausstand | `Hausstand exportieren` | `backup` — nur wenn Parser nachfragt / UI, **kein** stiller Import |

Natur/Foto (`Lies das Foto`) bleibt in **PC Foto Notiz**. Todo-Notiz: `{ label: 'Todo', text: 'Todo: Testdebug Milch', expect: { tool: 'todo' } }` in Tag & Hilfe oder neu **Todos**.

## Expect-Form (Execute)

```ts
type TestExpect = {
  tool?: string              // Register-ID, 'smalltalk', 'refuse'
  status?: 'executed' | 'error' | 'pending'
  mustNot?: string[]         // z.B. 'ist bestellt', Duzen
  confirm?: boolean          // Anruf/SMS/Taxi: Nachfrage, kein Execute
  skipIf?: 'no_pc' | 'no_tv' | 'no_gps' | 'no_gemini'
}
```

Verdict: `pass` · `fail` · `skip` · `unknown` (Smalltalk). `fail` wenn Tool ≠ Soll oder `mustNot` in der Antwort.

## Export (das File an die Planung)

JSON-Wurzel:

- `app_version`, `generated_at`, `brain`, `face`, `gemini`
- `categories[]`, `stopped: boolean`
- `turns[]`: `group`, `label`, `prompt`, `reply`, `ms`, `tool` (status/id/action/label), `expect`, `verdict`, `error`

TXT: dieselben Turns hintereinander, eine Zeile `VERDICT pass|fail|…` pro Prompt. Dateiname mit Uhrzeit. Mitten im Lauf herunterladen = bisherige Turns.

Keine Cloud, kein automatisches GitHub. PO schickt die Datei.

## Hintergrund

| Stufe | Was | Wann |
|-------|-----|------|
| v1 Must | Lauf in der geöffneten App (Settings oder Chat). Optional Screen-WakeLock bis Stop/Ende. Home-Button: Lauf darf sterben, File soweit schreiben. | `5.14` |
| v2 Should | Foreground-Service „Jarvis testet…“ + WakeLock, damit Home den Lauf nicht killt. Kein zweites Hirn. | nach Spike `5.12` |
| Won’t | Lauf nach App-Prozess-Kill. Lauf ohne dass die APK offen war. | |

**Done wenn Research:** WebView `onPause` gemessen (ein Gerät). Entweder Service oder ehrlicher Satz im Fenster: „Bitte App offen lassen.“

## Researchphasen

### `5.11.0` Leitentscheidung

Dieses Dokument. **Done wenn:** Mehrfachwahl, neues Gespräch, Expect+Export, Writes-Warnung, kein Auto-Ja, `5.11` ≠ `5.0`.

### `5.12.0` Research: Hintergrund + Writes

1. Stirbt der Lauf bei Home?  
2. Reicht Screen-WakeLock oder braucht es den bestehenden Notify/Wake-Dienst?  
3. Welche Gruppen default-aus (PC, TV, Writes)? Vorschlag: Writes **an** mit Warnung; PC/TV default **aus**.  
**Done wenn:** v1/v2-Votum in einer Tabelle.

### `5.13.0` Research: Export-Schema + Abgleich

1. Felder oben, ohne PII-Zwang (kein volles Memory-Dump). GPS-Antworten dürfen im Reply stehen, das ist der Test.  
2. `test-prompts.ts` aus Gruppen ableiten, nicht doppelt pflegen.  
**Done wenn:** JSON-Beispiel im Doc oder Fixture.

## Bau

| Version | Inhalt | Status |
|---------|--------|--------|
| **`5.11.0`** | Leitentscheidung + Boxen, neues Gespräch, Expect, JSON+TXT | **CODE** |
| **`5.12.0`** | Research Hintergrund / Writes | v1: App offen lassen **CODE**; Service später |
| **`5.13.0`** | Research Export + eine Prompt-Quelle | **CODE** (`test-copy.ts` + `test-prompts.ts`) |
| **`5.14.0`** | UI: Boxen, Alle/keine, Sequenz, Stop | **CODE** |
| **`5.15.0`** | Neue Gruppen + `expect` | **CODE** |
| **`5.16.0`** | JSON+TXT Download, Verdict | **CODE** |
| **`5.17.0`** | WakeLock oder Service laut `5.12`; Gold | WakeLock-Versuch **CODE**; Service geplant |
| **`5.18.0`** | Sideload nach Hausstand | geplant |

## Chat / Settings (Ziel)

| User | Soll |
|------|------|
| Einstellungen → Debug | Fenster mit Boxen |
| Start ohne Box | Hinweis, nicht loslaufen |
| Start | Warnung Writes → neues Gespräch → Lauf |
| Stop | kein weiterer Prompt, Download ok |
| Chat herunterladen | JSON+TXT, auch nach Stop |

## Dateien (Ziel)

| Datei | Rolle |
|-------|--------|
| `frontend/src/engine/test-copy.ts` | Gruppen, Prompts, `expect` |
| `frontend/src/engine/debug-run.ts` | Sequenz, Verdict, JSON bauen |
| `frontend/src/DebugPanel.tsx` | Boxen, Fortschritt, Start/Stop/Download |
| `frontend/src/App.tsx` | neues Gespräch; `onDebugSend` liefert Turn (reply+tool) |
| `frontend/src/engine/test-prompts.ts` | generiert oder Re-Export der Texte |
| Tests | Verdict-Fixtures; **nicht** `registry.ts` importieren |

## Won’t

Auto-Ja. Debug-Cloud. Import-Hausstand im Lauf. Router für Tests verbiegen. 60 parallele Chats. App-tot-Lauf. Play Store. iOS. Marvel-Friday. Anderen Usern Logs schicken.

## Abnahme

1. Zwei Boxen an (z. B. Uhr + Kalender) → ein neues Gespräch, zuerst Uhr-Prompts, dann Kalender, Chat-Alltag unangetastet.  
2. JSON enthält pro Turn Soll-Tool und Ist-Tool; `Wie spät ist es?` → `device` oder ehrliches Gerät-Tool, nicht Smalltalk.  
3. `bestell ein Taxi` ohne folgendes Ja → nicht „ist bestellt“, Verdict `pass` wenn Nachfrage.  
4. Stop nach 3 Prompts → Download hat genau 3 Turns.  
5. `Freitag` bleibt Kalender, `Friday` schaltet Face.  
6. Fenster sagt klar, ob Hintergrund geht oder App offen bleiben muss.

Körper [`40-next.md`](./40-next.md) · Sehen [`41-next.md`](./41-next.md) · Kugel `5.0` [PR #58](https://github.com/Gamerio2904/Jarvis/pull/58) · Ist-Debug [`34-next.md`](./34-next.md) · Sprint [`sprints/sprint-120.md`](./sprints/sprint-120.md).
