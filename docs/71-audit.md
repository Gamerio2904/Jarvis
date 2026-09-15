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
| 1 | `apk.md`, `docs/README`, `09-versioning`, `sprints/README` und `CHANGELOG` versprachen die Sideload-APK **`18.0.3`** an einem Link, der **`18.0.2`** ausliefert | `git log releases/Jarvis.apk` → letzter Stand „Sideload APK 18.0.2“; hier ist kein Android-SDK, die APK konnte nicht gebaut werden | Docs sagen: Code `18.0.3`, APK `18.0.2`, `./build-apk.sh` macht die neue |
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

### 3e. Anker aus `9.x`

Der Warnkasten in `sprints/README.md` zu 178, 183–186 stimmt weiter: fünf
sachlich offene Sprints nennen Zielversionen `8.0`–`9.10.0`, der Code steht
bei `18.0.3`. Unverändert gültig, hier nur bestätigt.

---

## 4. Sprint-Schnitt

| Version | Sprint | Thema | Priorität |
|---------|--------|-------|-----------|
| `18.0.4` | 272 | Widerspruch zieht Suche (S260-6), an `last_step_tool` gebunden | Should |
| `18.0.4` | 273 | `looksTruncated` zweite Form **mit** Abkürzungsliste (S260-7) | Should |
| `18.1.0` | 274 | `scripts/` unter `tsc`: eigenes `tsconfig.scripts.json`, `lint`-Schritt im Testlauf | Must |
| `18.1.0` | 275 | Die sechs offenen `exhaustive-deps` einzeln entscheiden: Fehler beheben, Absicht dokumentieren | Should |
| — | 276 | **Freeze:** `versionCode`-Schema auf drei Stellen je Feld — nur wenn eine Version `x.100` erreicht | Freeze |

Ketten: 274 vor 275 (wer Skripte typprüft, sieht Hook-Fälle mit weniger
Rauschen). 272 und 273 sind frei und unabhängig. 276 bleibt liegen, bis die
Schranke aus Befund 10 wirklich zuschlägt.

Kein Sprint für die Regex-Kosmetik aus §3d — siehe Won't.

---

## 5. Gegen die PO-Prioritäten

Vorgaben unverändert: hohe Antwortqualität, alles funktioniert, wenig Latenz,
kostenlos und viel nutzbar — nur ändern, wenn Nutzen ohne Verlust.

| Sprint | Qualität | Funktion | Latenz | Free |
|--------|----------|----------|--------|------|
| 272 | Korrektur führt zu Belegen statt zu Trainingstext | „stimmt nicht“ trifft die richtige Absicht | ein Lookup, nur nach Widerspruch | unverändert |
| 273 | abgebrochene Sätze fallen auf, gute bleiben ganz | keine Fehlalarme auf „ca. drei“ | reine Prüffunktion | unverändert |
| 274 | Fehler wie der zerlegte Regex fallen beim Bauen | Testläufe bleiben gleich | `tsc` läuft nebenher | unverändert |
| 275 | keine stale-closure-Überraschungen | Oberfläche bleibt gleich | weniger überflüssige Renders | unverändert |

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

---

## 7. Abbruchkriterien

- Ein Dokument nennt wieder eine Sideload-Version, die nicht in
  `releases/Jarvis.apk` liegt.
- `strict` wird abgeschaltet, um einen neuen Fehler durchzulassen.
- Eine Abkürzung wie „ca. drei“ wird nach 273 als abgebrochene Antwort
  gemeldet.
- Ein Bild erscheint ohne Quelle im Chat.
- Ein zweiter Cloud-Aufruf pro Zug für denselben Abbruch.
- `versionCode` sinkt oder kollidiert.

Index: [`sprints/README.md`](./sprints/README.md) · Versionen:
[`09-versioning.md`](./09-versioning.md) · Vorherige Schiene:
[`70-next.md`](./70-next.md)
