# 71 — Code-Audit `18.0.3` **BEFUND + PLAN**

Anlass ist kein Screenshot, sondern die Frage: was steht im Repo, das nicht
mehr stimmt, nicht mehr gebraucht wird oder Ärger macht. Geprüft wurde am
15.9.2026 gegen Code `18.0.3`.

Umfang: 300 Dateien und ~48 500 Zeilen in `frontend/src`, 44 Skripte in
`frontend/scripts`, 5 900 Zeilen Java in `frontend/native`, 81 Dokumente in
`docs/` plus 272 in `docs/sprints/`, dazu `desktop/` und `releases/`.

**Ausgangslage:** `npm run lint` läuft durch (22 Warnungen), `npx tsc -b` ist
sauber, alle 28 Testläufe aus `scripts/run-all-tests.sh` sind grün. Es lag
also kein roter Zustand vor — die Befunde unten sind Dinge, die *trotz*
grünem Lauf falsch waren.

---

## 1. Was der grüne Lauf nicht gesehen hat

Drei Klassen, die keine Testsuite abdeckt, weil kein Test sie abdecken kann:

| Klasse | Warum unsichtbar |
|--------|------------------|
| Dokumente gegen Code | Kein Test liest `apk.md` und vergleicht mit der APK im Ordner |
| Skripte gegen Browser | `scripts/*.mjs` liegen in keinem `tsconfig`; ihr Inhalt wird nie typgeprüft, und Code, der als Zeichenkette in den Browser geht, erst recht nicht |
| Regeln ohne Schalter | `tsc` prüfte ohne `strict`, obwohl der Code strict-sauber ist — die Regel war nur nicht eingeschaltet |

---

## 2. Behoben in diesem Durchgang

| # | Befund | Beleg | Was jetzt gilt |
|---|--------|-------|----------------|
| 1 | `apk.md`, `docs/README`, `09-versioning`, `sprints/README` und `CHANGELOG` versprachen die Sideload-APK **`18.0.3`** an einem Link, der **`18.0.2`** ausliefert | `git log releases/Jarvis.apk` → letzter Stand „Sideload APK 18.0.2“ | Sideload ist jetzt `18.0.3` / versionCode `180003` an demselben Link |
| 2 | Root-`README.md` stand auf **`15.3.1`** und verwies auf `TEST-15.1.0.md` | Code war 15 Versionen weiter | `18.0.3` / APK `18.0.2`, Verweis auf `TEST-18.0.0.md`, dazu ein Abschnitt „Prüfen“ |
| 3 | Sprints **260–262** standen als **PLAN**, obwohl `18.0.3` sie geliefert hat | `chess.ts`, `chat-blocks.ts`, `sport.ts` `tableBlock` im Code | Tabelle sagt **CODE** in `18.0.3`; die zwei offenen Tasks aus 260 stehen namentlich in §3 |
| 4 | `tsconfig` ohne `strict`, in 48 500 Zeilen | `tsc --strict` gemessen: **0 Fehler** | `"strict": true` in `tsconfig.app.json` und `tsconfig.node.json` |
| 5 | 21 eingefrorene User-Agent-Versionen: Nominatim bekam `Jarvis/2.1.0`, OpenLigaDB `Jarvis/3.19.0`, NASA `Jarvis/6.90.0`, Tankstellen `Jarvis/1.41.0` | `rg 'Jarvis/[0-9]'` | Eine Quelle `engine/ua.ts` (`USER_AGENT`, `jsonUA`, `htmlUA`) aus `APP_VERSION` |
| 6 | Der Fortschritts-Regex im Emulator-Smoke war zerlegt: im Backtick-String wurde `\b` zum Backspace-Zeichen und `\d` zum Buchstaben `d` | Nachgestellt: der Browser bekam `/⌫([1-9]d?)%/` und traf „42 %“ nie | `\\b` / `\\d`; die Prozent-Erkennung greift wieder |
| 7 | Abbruch-Retry hing an `kind === 'gemini'`, **Standard-Hirn ist aber Groq** — genau dort blieb der Satz aus den Screenshots stehen (`volatil. bis eine`) | `chat.ts` ~891 gegen `store.ts` `brain_primary: 'groq'` | Ein Retry für jedes Cloud-Hirn. Das lokale 0,5B bleibt außen vor: es bricht oft ab und braucht Sekunden |
| 8 | Der Notausgang aus `15.3.1` nahm dem Nutzer `hud_force` bei **jedem** Update weg, stumm | `store.ts` `stored.version !== APP_VERSION && prev.hud_force`; die Ursache ist seit `18.0.1` weg (`lageSessionActive`) | Migrationsschritt `002-lage-falle-einmalig-loesen` — einmal, mit Test, der belegt: der Schalter überlebt den nächsten Versionsprung |
| 9 | Bild-Blöcke: `.chat-image` hatte **kein CSS**, und ein Bild ohne Quelle wäre quellenlos gerendert worden | `70-next.md` §7 nennt genau das als Abbruchkriterium | `parseChatBlocks` verwirft Bilder ohne Quelle (fail-closed), CSS nachgezogen |
| 10 | `versionCode` = `major*10000 + minor*100 + patch` — bei Minor 100 landet der Code in der nächsten Hauptversion und Android lehnt das Update wortlos ab. Dieses Projekt zählt Minor weit hoch (`6.90`, `10.66`, `13.44`) | `apply-native-tv.mjs` ~297 | Der Build bricht ab, solange das Schema zwei Stellen je Feld hat |
| 11 | 7 Debug-APKs (`0.13.2` bis `17.0.0`), 127 MB im Arbeitsbaum, in **keinem** Dokument und **keinem** Skript verlinkt | `rg 'jarvis-0\.1|17\.0\.0-debug'` findet nur `releases/Jarvis.apk` | Entfernt; die Historie behält sie |
| 12 | Zwei importierte, nie benutzte Namen in Testskripten | `oxlint` | Weg |

Alle 28 Testläufe, `tsc -b` und `lint` sind nach jedem dieser Schritte grün.

### 2b. Zweiter Durchgang: vier Tiefenprüfungen

Nach dem Dokumenten- und Aufräumteil lasen vier getrennte Durchgänge den Code
selbst — Motor, Oberfläche, Android-Schicht, toter Code. Sie fanden 22 Dinge,
die im laufenden Betrieb schiefgehen und die kein Test bemerkt, weil kein Test
ein Mikrofon, einen Weckerdienst oder einen Render-Zyklus hat. Nummer 35 kam
erst beim Abfilmen der Belege dazu — auch das ist ein Befund über Tests: die
Zweitliga-Tabelle war rechnerisch richtig und trotzdem unlesbar.

**Der wichtigste Befund betrifft den Bug aus den Screenshots.** Der
Sprachmodus las weiter nur den Anfang vor. Der Wächter für „dazwischenreden“
im Plugin sah nur `tts.isSpeaking()`, also die **System**-Stimme. Die
Standardspur ist aber Edge oder Gemini als MP3 in einem `<audio>`-Element:
dort ist `tts` still, der Wächter war blind, und der Lautsprecher redete
Jarvis die eigene Antwort als Unterbrechung ins Mikrofon. Acht Bilder über
RMS 0,12 sind rund 256 ms durchgelassener Lautsprecherton — nach dem
2-Sekunden-Fenster trivial erreicht. Das größere Fenster aus dem ersten
Durchgang hat den Abbruch also nur verschoben.

| # | Befund | Was jetzt gilt |
|---|--------|----------------|
| 13 | Sprachmodus schnitt sich selbst ab (siehe oben) | Beide Sprachspuren melden über `bargeMute()`, wenn die App spricht, plus 400 ms Nachhall. Der Wächter steht ab dem **ersten** gesprochenen Satz statt erst nach dem Stream — vorher hörte Jarvis bei langen Antworten minutenlang niemandem zu, obwohl unten „unterbrechen“ stand |
| 14 | `loop()` in `VoiceMode` war ein ungeschütztes `while`. Ein Fehler aus dem Mikrofon beendete die Schleife, `live.current` blieb wahr — der Sprachmodus stand endlos auf „Ich höre…“, ohne zu hören | Ein Durchlauf darf scheitern, die Schleife nicht: Fehler wird gezeigt, kurze Pause, weiter |
| 15 | Vier Wege aus dem Sprachmodus setzten nur `voiceOpen` zurück und ließen das Wake-Tor offen. Danach gab `acceptWake` **für immer** `null` zurück: kein Wake-Wort, kein Mikroknopf, bis die App neu startet | Ein `closeVoice()`, durch das jeder Weg geht |
| 16 | `LazyHudCell` hing seinen Ladeeffekt an `onSnap` — eine Pfeilfunktion im JSX, bei jedem Render neu. Laden → `snap` schreiben → Render → Effekt neu → laden: die Kachelansicht lud endlos nach | `useCallback`; dieselbe Fehlerklasse, die `18.0.1` lahmgelegt hat |
| 17 | Dasselbe mit `onHudChange`: GPS holen → Pins laden → melden → Settings setzen → Render → von vorn. Dauerhafte Ortung, leerer Akku. Als Nebenwirkung stellte sich der Globus-Rundgang immer selbst zurück, statt weiterzuziehen | `useCallback` in `App`, Meldung nur noch bei lebendigem Effekt |
| 18 | `conflicts.ts` warf bei „was kostet E10 an der nächsten Tankstelle“ den **Tank**-Agenten ab und ließ nur den Ausblick stehen — den dieselbe Regel eine Zeile darüber ebenfalls abwirft. Niemand war zuständig, das Modell erfand Preise | Nur der Ausblick fliegt; eine Preisfrage ist keine Prognose. Mit Test |
| 19 | `weather.ts` verglich `current.time` (`T08:15`) auf Gleichheit mit der Stundenreihe (`T08:00`). Das traf nie, fiel auf Index 0 zurück: „regnet es gleich?“ antwortete mit dem Wetter **ab Mitternacht** | Vergleich auf die Stunde gekürzt. Live gegen Open-Meteo nachgemessen |
| 20 | `sport.ts` rechnete die Saison als laufendes Jahr. OpenLigaDB schlüsselt nach **Startjahr** — von Januar bis Juli fragte Jarvis eine Saison ab, die erst im August beginnt, und antwortete auf jede Ergebnisfrage „keine Spiele“ | `seasonYears()` als eine Quelle für Tabelle und Spiele. Live gegen die API belegt (Saison 2025 beginnt 22.8.2025, Saison 2026 am 28.8.2026) |
| 21 | „2. Bundesliga“ landete in der **ersten** Liga (der Text enthält „bundesliga“), und „2. Liga“ galt gar nicht als Sportfrage | Beide treffen `bl2`. Mit Test |
| 22 | Spotify meldete `Nächster.`, `Pause.` und `Lautstärke 40.` **ohne den Status anzusehen**. Ohne aktives Gerät (404) oder ohne Premium (403) log die App und die Musik lief unverändert weiter | Nur 200/202/204 heißt ausgeführt, sonst ein ehrlicher Satz |
| 23 | Schach: der Figurenname stand im Muster, wurde aber verworfen. „Dame e2 e4“ zog den **Bauern** auf e2 und meldete Erfolg | Passt die genannte Figur nicht zum Startfeld, sagt Jarvis das. Mit Test |
| 24 | Wake-Wort-Dienst: `startForeground` ohne Absicherung. Ein Mikrofon-Dienst aus dem Hintergrund ist unter Android 14 gesperrt, unter Android 15 beim Systemstart verboten — die Ausnahme aus `onStartCommand` nahm **den ganzen Prozess** mit. Nach jedem Neustart „Jarvis wurde beendet“, und das Widget stürzte beim Tippen ab | Der Dienst gibt auf statt abzustürzen, wird nicht mehr aus dem Systemstart geholt (die App macht ihn beim Öffnen ohnehin alle 4 s wieder scharf), und das Widget öffnet zum Anschalten die App |
| 25 | Die Schaltaktion des Widgets stand im **exportierten** Filter. Jede installierte App hätte das Dauerzuhören einschalten können | Aus dem Filter entfernt; der eigene `PendingIntent` nennt die Komponente direkt |
| 26 | Weckerdienst lief als `START_STICKY` und wurde nach einem Speicherengpass mit **null**-Intent neu gestartet: Standardwerte, Vollbildschirm, Standardklingelton in Endlosschleife — ein Wecker, den niemand gestellt hatte, Stunden später | `START_NOT_STICKY` und ein früher Ausstieg ohne Intent. Die Wahrheit steht im AlarmManager, hier gibt es keinen Zustand zu retten |
| 27 | Ein verpasster Wecker klingelte und vibrierte **unbegrenzt** weiter; der Wake-Mode des Players hielt dabei die CPU wach | Nach zehn Minuten ist Schluss, Dienst inklusive |
| 28 | Nach einem gesprochenen Timer blieb eine nicht wegwischbare Meldung stehen und der Wake-Lock lief seine 30 Minuten aus — niemand rief `stopSelf()` | Die Sprachausgabe meldet „fertig“ zurück, mit 20-Sekunden-Rückfallfrist; die Meldung ist wegwischbar |
| 29 | **Jeder Wecker und jede Erinnerung war nach einem App-Update still weg.** Das Ersetzen des Pakets streicht alle `AlarmManager`-Einträge, gehorcht wurde aber nur `BOOT_COMPLETED`. Die Liste in den Einstellungen zeigte sie weiter an | `MY_PACKAGE_REPLACED` und `TIMEZONE_CHANGED` im Filter, dazu `restoreAll` bei jedem App-Start als doppelter Boden |
| 30 | Ein zweiter `speak()`-Ruf überschrieb den ersten, dessen Versprechen in JS damit nie einlöste. `DriveMode` wartet in `.finally()` darauf: `navBusy` blieb wahr und **für den Rest der Fahrt kam keine Ansage mehr** | Der überholte Ruf wird beantwortet; die Notbremse nach 20 s sagt die Wahrheit und nur für ihren eigenen Ruf |
| 31 | „Fernseher testen“ rief `native.test` — eine Methode, die das Plugin nie hatte. `withTimeout` machte aus der Ablehnung den Rückfalltext „TV antwortet nicht. Gleiches WLAN?“ und schickte die Nutzer auf die Suche nach einem Netzproblem, das es nicht gab | Die Methode gibt es jetzt (Kopplung mit kurzer Geduld), und `withTimeout` kann eine Ablehnung von einer Zeitüberschreitung unterscheiden |
| 32 | Die Taschenlampe verlangte das Kamera-Recht, das `setTorchMode` seit API 23 nicht braucht. Wer ablehnte — für eine Taschenlampe naheliegend — bekam für immer „Kamera-Recht fehlt“ | Kein Dialog mehr; `CAMERA` ist auch aus dem Manifest raus, nichts sonst greift auf die Kamera zu |
| 33 | Das GPS lief weiter, wenn die Activity starb, ohne dass JS aufräumen konnte. Beim Neuaufbau kam ein zweiter Satz Abfragen obendrauf | `handleOnDestroy` meldet die Ortung ab |
| 34 | `openApp` konnte seit Android 11 **keine** installierte App finden (Sichtbarkeitsfilter), und der Rückfallweg zeigte auf eine Amazon-Appstore-URL, die es auf einem Play-Gerät nicht gibt | `<queries>` mit `MAIN`/`LAUNCHER`, Rückfall auf `market://` |
| 35 | In der Beleg-Aufnahme der neuen Zweitliga-Tabelle fiel es auf: `shortClub` kannte nur Erstliga-Vereine und schnitt alles andere nach 16 Zeichen hart ab — „SpVgg Greuther F“, „Eintracht Brauns“, „DSC Arminia Biel“ | 19 Zweitliga-Vereine mit Kurznamen, und was danach noch zu lang ist, bricht an der Wortgrenze statt im Wort. Mit Test |

Nebenbei geschlossen: zwei `listen()`-Rufe kurz hintereinander brachen die
Erkennung nicht ab und liefen in `ERROR_RECOGNIZER_BUSY`; ein Wecker forderte
den Audio-Fokus bis zu dreimal an und gab ihn einmal zurück, weshalb Spotify
danach stumm blieb; und ein Dienst, der es nie in den Vordergrund schafft,
beendet sich jetzt selbst, statt fünf Sekunden später mit einer
`RemoteServiceException` die App zu erschlagen.

Die Java-Schicht ist hier nicht baubar (kein Android-SDK). Geprüft wurde
stattdessen Datei für Datei auf Syntax — die einzigen Meldungen sind
unauflösbare `android.*`-Pakete, also erwartete Artefakte, keine Fehler.
**Diese 11 Java-Änderungen sind ungetestet**, siehe §7.

---

## 3. Offen — und warum es hier steht statt im Code

Nicht alles gehört in einen Audit-Durchgang. Was folgt, braucht eine
Entscheidung oder eine Messung, nicht einen schnellen Handgriff.

### 3a. Zwei Tasks aus Sprint 260, die nie geliefert wurden

| Task | Soll | Ist | Warum nicht einfach nachziehen |
|------|------|-----|-------------------------------|
| **S260-6** | Widerspruch („das ist nicht der Fall“, „stimmt nicht“) zieht eine Suche auf den **vorherigen** Turn | Kein Code dafür. `memory-parse.ts` und `pack-parse.ts` kennen „stimmt nicht“ nur als **Gedächtnis**-Korrektur | Dasselbe Satzmuster bedient zwei Absichten. Wer „stimmt nicht“ zu einer gemerkten Vorliebe sagt, will kein Wahlergebnis gesucht bekommen. Das braucht den `last_step_tool`-Kontext als Bedingung, nicht ein zweites Regex |
| **S260-7** | `looksTruncated` erkennt zusätzlich `[.!?]\s+[a-zäöü]` mitten im Text | Prüft nur das letzte Zeichen | Der Sprint-Vorschlag würde auf **deutschen Abkürzungen** falsch anschlagen: „ca. drei Kilometer“, „ggf. der Zug“, „z. B. das Wetter“. So wie spezifiziert macht die Regel gute Antworten kaputt. Braucht eine Abkürzungsliste vor dem Punkt |

Der Screenshot-Fall selbst (`volatil. bis eine`) fällt schon auf die
bestehende Prüfung — Satzende ohne Zeichen. Es ist also **kein** offener Bug
aus den Aufnahmen, sondern eine Verschärfung, die als Nächstes falsch wäre.

### 3b. Bild-Block ohne Erzeuger

`ChatBlock` kennt `image`, der Renderer zeichnet es, `parseChatBlocks` prüft
es — aber **kein** Handler schreibt je einen Bild-Block (`rg 'blocks:'` findet
nur `sport.ts` und `chess.ts`). Das ist Gerüst für Sprint 263, keine Leiche:
der Typ ist in `70-next.md` §5 verabredet. Bleibt liegen, ist jetzt aber
wenigstens fail-closed und gestylt.

### 3c. `scripts/` ist typfrei

44 Skripte, darunter alle Testläufe, liegen in keinem `tsconfig`. Sie
importieren `.ts`-Module und werden über `node --experimental-strip-types`
ausgeführt — Typfehler zeigt niemand an. Befund 6 (der zerlegte Regex) ist
genau die Klasse, die dadurch durchkommt.

### 3d. Verbleibende Lint-Warnungen

19 Stück, in zwei Gruppen:

- **8 × `react-hooks/exhaustive-deps`.** Einzeln zu beurteilen, nicht
  pauschal. Geprüft: `App.tsx` ~563 (Wake-Word) ist **kein** Fehler — `settings`
  wird nur über `settings?.wake_word` gelesen, und genau das steht in den
  Abhängigkeiten. `App.tsx` ~416 (Theme) ebenso. Die übrigen sechs
  (`VoiceMode`, `Calendar`, `SettingsScreen` ×3, `Lage`, `BodyTree`,
  `AgentTree`) sind noch offen.
- **11 × Regex-Kosmetik** (`\-` in einer Zeichenklasse, `\"` in einer
  Zeichenklasse, `no-control-regex` auf dem absichtlichen
  Steuerzeichen-Filter in `tool-contract.ts`). Bedeutungsgleich; ein Umbau
  hier ändert Regex-Semantik gegen null Gewinn. **Bleibt**, mit Ansage.

### 3e. Offene Befunde aus den vier Tiefenprüfungen

Was nicht in diesen Durchgang gehört, weil es eine Entscheidung braucht oder
weil ein blinder Handgriff mehr kaputt macht als er heilt.

**Motor.** Der schwerste offene Punkt: wenn ein lesender Agent scheitert, gibt
`director.ts` eine **leere** Antwort zurück und der Zug fällt ans Modell.
Genau die Fälle, in denen es keine Daten gab — Tanke nicht erreichbar, Wetter
weg —, sind die, in denen das Modell etwas erfindet. Das braucht eine Marke
(`factual: true`) an den Agenten, deren Scheitern eine ehrliche Absage
verdient, kein pauschales Umschalten. Dazu: `fuel` und `poi` sind als `read`
eingetragen und bekommen damit zwei Versuche, treiben aber die Navi-Zustände —
eine Zeitüberschreitung kann die Navigation zweimal starten. Kleiner:
„lauter“ ohne laufendes Medium landet nirgends, ein „ja“ auf einen Vorschlag
tut still nichts, ein fehlgeschlagener Settings-Schreibvorgang wird
verschluckt, die Spotify-Lautstärke rechnet von einem erfundenen Ausgangswert,
und zwei gleichzeitige Token-Erneuerungen melden den Nutzer ab.

**Oberfläche.** Elf mittlere Befunde, drei davon greifbar: der Fahrmodus
lässt die Sprachausgabe beim Verlassen laufen und sein Mikrofon lässt sich
nicht abschalten; der Kalender zieht beim Öffnen den Eingabefokus; und der
Download-Knopf hält eine Bildschleife am Leben, die die Komponente überlebt.
Der Rest ist Auflösung und Trefferfläche (Lage-Reiter zu klein) sowie
Zeichenarbeit pro Bild im Globus.

**Android.** Sieben Reste, alle in derselben Klasse „meldet Erfolg, den es
nicht gibt“ oder „räumt nicht auf“: `sendSms` bestätigt, sobald die Nachricht
dem System übergeben ist, nicht wenn der Mobilfunk sie angenommen hat (das
braucht einen `sentIntent` und einen eigenen Empfänger — ohne Baumöglichkeit
hier zu riskant); die Vollbild-Weckseite wird seit Android 10 aus einem
Empfänger heraus verworfen und der zweite Wecker zeigt den Text des ersten;
`ensureAlarmVolume` hebt die Weckerlautstärke dauerhaft auf 75 % und bräuchte
`ACCESS_NOTIFICATION_POLICY`, um bei „nicht stören“ zu greifen; ein selbst
gewählter Klingelton geht beim Neustart verloren; der Portscan lässt 32
Threads weiterlaufen; der Export scheitert auf Android 6–9 ohne
`WRITE_EXTERNAL_STORAGE`; und vier `setKeepAlive(true)` vor einer
Rechteanfrage halten Rufe fest, die Capacitor selbst sichert.

**Toter Code.** Keine einzige unerreichbare Datei, aber 54 exportierte Namen
ohne Nutzer — darunter ganze API-Klienten-Rümpfe und eine ältere
Kachel-Pipeline —, 4 unbenutzte Settings-Schlüssel, 13 nicht referenzierte
CSS-Klassen und 10 überholte Emulator-Skripte. Nichts davon tut weh; es
kostet Lesezeit. Das gehört in einen eigenen Durchgang mit einem Test, der
neue Leichen verhindert, nicht in eine Sammellöschung am Ende eines Audits.

### 3f. Anker aus `9.x`

Der Warnkasten in `sprints/README.md` zu 178, 183–186 stimmt weiter: fünf
sachlich offene Sprints nennen Zielversionen `8.0`–`9.10.0`, der Code steht
bei `18.0.3`. Unverändert gültig, hier nur bestätigt.

---

## 4. Sprint-Schnitt

| Version | Sprint | Thema | Priorität |
|---------|--------|-------|-----------|
| **`18.1.0` CODE** | 272 | **Auf einem Gerät prüfen, was hier nicht baubar war:** die 11 Java-Änderungen aus §2b — Wecker nach Update, Geisteralarm, Sprachmodus am Lautsprecher, Ansage im Fahrmodus. Hier: statischer Test + [`TEST-18.1.0.md`](./TEST-18.1.0.md) | Must |
| **`18.1.0` CODE** | 273 | Gescheiterte Faktenagenten sagen ab statt ans Modell zu fallen: Marke `factual` an `fuel`, `weather`, `poi`, `sport` | Must |
| **`18.1.0` CODE** | 274 | `fuel` und `poi` aus `read` lösen, damit eine Zeitüberschreitung die Navigation nicht zweimal startet | Must |
| **`18.1.0` CODE** | 275 | `sendSms` mit `sentIntent`: melden, wenn der Mobilfunk annimmt, nicht wenn das System übernimmt | Should |
| **`18.1.0` CODE** | 276 | Fahrmodus räumt beim Verlassen auf (Sprachausgabe, Mikrofon), Kalender lässt den Eingabefokus | Should |
| **`18.1.0` CODE** | 277 | Widerspruch zieht Suche (S260-6), an `last_step_tool` gebunden | Should |
| **`18.1.0` CODE** | 278 | `looksTruncated` zweite Form **mit** Abkürzungsliste (S260-7) | Should |
| **`18.1.0` CODE** | 279 | `scripts/` unter `tsc`: eigenes `tsconfig.scripts.json`, `lint`-Schritt im Testlauf | Must |
| **`18.1.0` CODE** | 280 | Die sechs offenen `exhaustive-deps` einzeln entscheiden: Fehler beheben, Absicht dokumentieren | Should |
| **`18.1.0` CODE** | 281 | Toten Code räumen (Settings/CSS/Skripte **mit** Test). 54 ungenutzte Exporte bleiben — blindes Löschen trifft dynamische Importe | Could |
| — | 282 | **Freeze:** `versionCode`-Schema auf drei Stellen je Feld — nur wenn eine Version `x.100` erreicht | Freeze |

Die Anker `18.0.4`/`18.0.5` galten gegen Code `18.0.3`. Live war `18.0.8`,
deshalb ein Bündel **`18.1.0`**. 290 (Overlay) rückt auf `18.1.3`.

Ketten: 272 zuerst und allein — solange die Java-Änderungen nicht auf einem
Gerät liefen, ist alles andere in dieser Schicht Spekulation. 273 vor 274 (wer
ehrliche Absagen hat, sieht beim Umstellen der Wiederholungen, was wirklich
scheitert). 279 vor 280 und vor 281 (wer Skripte typprüft, sieht Hook- und
Leichenfälle mit weniger Rauschen). 277 und 278 sind frei. 282 bleibt liegen,
bis die Schranke aus Befund 10 wirklich zuschlägt.

Kein Sprint für die Regex-Kosmetik aus §3d — siehe Won't.

---

## 5. Gegen die PO-Prioritäten

Vorgaben unverändert: hohe Antwortqualität, alles funktioniert, wenig Latenz,
kostenlos und viel nutzbar — nur ändern, wenn Nutzen ohne Verlust.

| Sprint | Qualität | Funktion | Latenz | Free |
|--------|----------|----------|--------|------|
| 272 | belegt, dass die Korrekturen halten | Wecker, Ansage, Sprachmodus | keine | unverändert |
| 273 | keine erfundenen Preise mehr, wenn Daten fehlen | ehrliche Absage statt Erfindung | ein Aufruf weniger ans Modell | **billiger** |
| 274 | Navigation startet einmal | keine doppelte Zielführung | ein Versuch weniger | unverändert |
| 275 | „SMS gesendet“ stimmt dann auch | Fehlschlag wird sichtbar | bis zu 10 s Warten, mit Rückfall | unverändert |
| 276 | keine Stimme aus dem geschlossenen Fahrmodus | Mikrofon lässt sich abschalten | weniger Nebenläufigkeit | unverändert |
| 277 | Korrektur führt zu Belegen statt zu Trainingstext | „stimmt nicht“ trifft die richtige Absicht | ein Lookup, nur nach Widerspruch | unverändert |
| 278 | abgebrochene Sätze fallen auf, gute bleiben ganz | keine Fehlalarme auf „ca. drei“ | reine Prüffunktion | unverändert |
| 279 | Fehler wie der zerlegte Regex fallen beim Bauen | Testläufe bleiben gleich | `tsc` läuft nebenher | unverändert |
| 280 | keine stale-closure-Überraschungen | Oberfläche bleibt gleich | weniger überflüssige Renders | unverändert |
| 281 | weniger Lesefläche für den nächsten Durchgang | nichts sichtbar | kleineres Bündel | unverändert |

Der zweite Durchgang selbst zahlt sich auf allen vier Achsen aus: die
Endlosschleifen in der Lage kosteten Akku und Renderzeit, die erfundenen
Spritpreise Antwortqualität, und der Sprachmodus las Antworten nicht vor, die
längst da waren. Die Stummschaltung während des eigenen Sprechens kostet eine
Fähigkeit — dazwischenreden wirkt jetzt erst nach dem Satz, unterbrechen geht
per Antippen. Ohne Echo-Kompensation für die Medienspur ist das die ehrliche
Seite des Tauschs; die ganze Antwort zu hören wiegt mehr als ein Zuruf, der
in neun von zehn Fällen die eigene Stimme war. Der Hinweistext sagt das jetzt
auch so.

Was schon geliefert ist, rechnet sich so: Befund 7 kostet im schlechten Fall
einen zweiten Cloud-Aufruf, aber nur bei abgebrochener Antwort und nur einmal
— und ersetzt eine Absage, die der Nutzer vorlesen musste. Befund 4, 5, 10
und 11 kosten zur Laufzeit nichts.

---

## 6. Won't

- Regexe umschreiben, damit `oxlint` still ist (`\-` in einer Zeichenklasse
  ist bedeutungsgleich; jeder Handgriff dort riskiert Semantik gegen null
  Gewinn).
- `no-control-regex` in `tool-contract.ts` abschalten oder umbauen: der
  Steuerzeichen-Filter ist der Zweck der Zeile.
- Die APK-Historie aus der Git-Historie schreiben. Der Arbeitsbaum ist
  aufgeräumt, `.git` bleibt wie es ist — Historie umschreiben kostet jedem
  Klon seinen Stand.
- `NN-next.md` zusammenfassen oder löschen. Sie sind das Protokoll dieses
  Projekts; falsch war nicht ihre Zahl, sondern eine Versionszeile.
- `image`-Blöcke entfernen, weil sie noch keinen Erzeuger haben. Sprint 263
  ist verabredet.
- Ein zweiter Retry nach dem ersten (Kontingent, ohne messbaren Gewinn).
- Echo-Kompensation für die Medienspur selbst bauen, damit Zurufe während des
  Sprechens wieder greifen. Das hieße, die neuronale Stimme über die
  Kommunikationsspur auszugeben — schlechtere Klangqualität und ein Umbau der
  ganzen Wiedergabe, für eine Fähigkeit, die das Antippen schon abdeckt.
- Die 54 toten Namen aus §3e in diesem Durchgang löschen. Ohne Test, der neue
  findet, wächst dieselbe Liste bis zum nächsten Audit nach.

---

## 7. Abbruchkriterien

- Ein Dokument nennt wieder eine Sideload-Version, die nicht in
  `releases/Jarvis.apk` liegt.
- `strict` wird abgeschaltet, um einen neuen Fehler durchzulassen.
- Eine Abkürzung wie „ca. drei“ wird nach 278 als abgebrochene Antwort
  gemeldet.
- Ein Bild erscheint ohne Quelle im Chat.
- Ein zweiter Cloud-Aufruf pro Zug für denselben Abbruch.
- `versionCode` sinkt oder kollidiert.
- **Der Sprachmodus bricht wieder mitten in der Antwort ab** — dann greift die
  Stummschaltung nicht und der Tausch aus §5 war umsonst.
- Ein Wecker klingelt, den niemand gestellt hat, oder einer bleibt nach einem
  Update aus. Beides ist mit den Änderungen aus §2b geschlossen, aber auf
  keinem Gerät nachgemessen — das ist der Grund, warum Sprint 272 zuerst kommt.
- Eine Kachel in der Lage lädt zweimal innerhalb einer Sekunde nach.
- Ein Agent scheitert und das Modell antwortet trotzdem mit Zahlen.

Index: [`sprints/README.md`](./sprints/README.md) · Versionen:
[`09-versioning.md`](./09-versioning.md) · Vorherige Schiene:
[`70-next.md`](./70-next.md) · Nächste Produktschiene (Ideen, 283–287):
[`72-next.md`](./72-next.md) — Zahlen 272–282 bleiben diese Audit-Reste.
