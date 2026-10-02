# Formulierung egal

Plan nach [`plan-vorlage.md`](./plan-vorlage.md). Noch nichts davon ist gebaut. Ein Sprint wird erst gebaut, wenn jemand `Umsetzen` sagt.

## Bedingung

Ergänze in die Planung: Meine Formulierung und eingaben sollen egal sein, also egal wie ich etwas formuliere, er soll immer erkennen was ih tun möchte. also zb Verbinde dich mit dem Handy und öffne den 2. Bildschrim soll beides eine kopplungsafrage auf das 2. Gerät senden. Deep research dazu wie man das am beszten umsetzt.

Gelesen als: Dieselbe Absicht trifft dieselbe vorhandene Aktion, egal wie der Satz klingt. „Verbinde dich mit dem Handy“ und „öffne den 2. Bildschirm“ schicken beide eine Kopplungsanfrage an das zweite Gerät, solange noch nichts gekoppelt ist.

## Rahmen dieses Projekts

Die Rahmen der Vorlage gelten. Dazu, enger:

1. Nur Aktionen, die es schon gibt. Eine neue Aktion entsteht hier nicht.
2. Der feste Satz, der heute schon gilt, bleibt und gewinnt sofort.
3. Kein fremdes Paket, kein Training, kein zweites Hirn.
4. Zwei verschiedene Wünsche in einem Satz bleiben, was der vorhandene Teilsatz schon tut. Dieser Plan ändert das nicht.
5. Diese Planung schreibt keinen Code, keine Version und kein APK.

## Quellen

Gesucht, weil die Bedingung Recherche verlangt, wie man das umsetzt.

| Name | Adresse | Was dort steht |
|---|---|---|
| Semantic Router | https://docs.aurelio.ai/semantic-router/get-started/quickstart | Eine Absicht ist ein Name plus Beispielsätze. Ein neuer Satz trifft die Absicht über die Bedeutung, nicht über dasselbe Wort. Passt nichts, kommt keine Entscheidung. |
| Schwelle | https://docs.aurelio.ai/semantic-router/user-guide/features/threshold-optimization | Unter der Schwelle gewinnt keine Absicht. Die Schwelle wird an Beispielen gesetzt, nicht geraten. |
| Semantic Routing, GlobeCom 2024 | https://arxiv.org/html/2404.15869 | Mehr und verschieden formulierte Beispielsätze verallgemeinern die Absicht. Ein freies Sprachmodell allein erfindet daneben. Die Route kann für sich stehen. |
| Cegin, Simko, Brusilovsky, EMNLP 2023 | https://aclanthology.org/2023.emnlp-main.117/ | Umschreibungen einer Absicht können vielfältig sein und ein Modell darauf bleibt robust. Das Papier erzeugt Trainingsdaten. Es beschreibt kein Laufzeit-Training. |
| Harte Außenseiter, LREC 2024 | https://aclanthology.org/2024.lrec-main.674/ | Ein Satz, der nur ähnlich klingt, aber keine vorhandene Absicht ist, muss abgelehnt werden. Sonst antwortet das System daneben. |
| Kopplung heute | `frontend/src/engine/fenster-parse.ts` | Nur „Verbinde das Handy“ und „Verbinde das Tablet“ lösen die Anfrage aus. „Verbinde dich mit dem Handy“ und „öffne den 2. Bildschirm“ tun das nicht. |
| Weg heute | `frontend/src/engine/route-pick.ts` | Die Parser schlagen vor. Passen zwei, wird gefragt. Passt keiner, passiert nichts. |

## Anforderungen

A1. „Verbinde dich mit dem Handy“ und „öffne den 2. Bildschirm“ schicken beide eine Kopplungsanfrage an das zweite Gerät, solange noch nichts gekoppelt ist. Abnahme: „Verbinde das Handy“ tut dasselbe wie bisher. Ist schon gekoppelt, geht keine zweite Anfrage hinaus. Gateway `go`.

A2. Trifft kein fester Satz, ordnet Ultron den Satz höchstens einer Aktion zu, die es schon gibt. Abnahme: Eine Umschreibung von Kalender, Planungsbildschirm und Kopplung trifft jeweils die richtige vorhandene Aktion. Eine neue Aktion entsteht nicht. Gateway `go`.

A3. Passt der Satz zu keiner vorhandenen Aktion, tut er nichts und sagt das. Abnahme: Ein ähnlich klingender Satz, der etwas anderes meint, löst die nahe Aktion nicht aus. Passen zwei Aktionen gleich gut, fragt er einmal und tut nichts, bis die Antwort da ist. Gateway `go`.

## Entscheidungen

E1. Geschlossene Liste. Grund: Die GlobeCom-Quelle sagt, ein freies Sprachmodell erfindet. Semantic Router gibt keine Route zurück, wenn nichts passt. Ultron darf nur eine Aktion wählen, die der Weg schon kennt. Gateway `go`.

E2. Kein Semantic Router im Baum, kein Training auf erzeugten Umschreibungen. Grund: Dessen Weg braucht einen eigenen Encoder und optional eine Vektordatenbank. Cegin erzeugt Trainingsdaten, kein Verhalten zur Laufzeit. Dieselbe Idee, Beispielsätze und eine Schwelle, läuft über den vorhandenen Weg: erst der feste Satz, dann eine Wahl aus der bekannten Liste. Gateway `go`.

E3. Der feste Satz gewinnt sofort. Grund: Die Sätze, die heute gelten, sollen nicht auf eine zweite Meinung warten. Die freie Formulierung gilt nur, wenn der feste Satz nichts trifft. Gateway `go`.

E4. „Öffne den 2. Bildschirm“ ist in diesem Plan der Wunsch zu koppeln, nicht der Wunsch, eine bestimmte Fläche zu zeigen. Grund: Die Bedingung sagt, beide Sätze schicken die Kopplungsanfrage. Eine Fläche auf dem zweiten Fenster bleibt der Satz, der die Fläche nennt. Gateway `go`.

E5. Unbekannt und zweideutig werden nicht geraten. Grund: Die Schwelle und die harten Außenseiter. Zwei gleich gute Aktionen fragen einmal. Keine Aktion sagt einen ehrlichen Satz. Gateway `go`.

## Sprints

### S1 — Kopplung, egal wie gesagt

Ziel: Die beiden Sätze aus der Bedingung schicken dieselbe Kopplungsanfrage wie „Verbinde das Handy“.

Anforderungen: A1.

Lieferumfang:

- S1-1. „Verbinde dich mit dem Handy“ schickt die Anfrage, solange nichts gekoppelt ist. Fertig, wenn dieselbe Anfrage hinausgeht wie bei „Verbinde das Handy“. Quelle: Semantic Router, https://docs.aurelio.ai/semantic-router/get-started/quickstart
- S1-2. „Öffne den 2. Bildschirm“ schickt dieselbe Anfrage. Fertig, wenn bei bestehender Kopplung keine zweite Anfrage hinausgeht. Quelle: `frontend/src/engine/fenster-parse.ts`

Gateway `go`. Go, wenn beide Sätze die Anfrage schicken und der alte Satz sie weiter schickt. No-Go, wenn einer von beiden eine Fläche öffnet oder eine zweite Anfrage bei bestehender Kopplung schickt. Abbruch: der Satz meint eine andere vorhandene Aktion. Dann geht keine Kopplung hinaus. Hängt an der gebauten Kopplung.

Prompt: Verbinde dich mit dem Handy und öffne den 2. Bildschirm schicken beide eine Kopplungsanfrage an das zweite Gerät, solange noch nichts gekoppelt ist. Verbinde das Handy bleibt. Ist schon gekoppelt, kommt keine zweite Anfrage. Keine neue Bibliothek, keine erfundene Aktion. Abbruch, wenn der Satz eine andere vorhandene Aktion meint: dann keine Kopplung.

### S2 — Jede vorhandene Aktion, nicht nur die Kopplung

Ziel: Eine Umschreibung trifft die vorhandene Aktion, auch wenn der feste Satz sie nicht erkennt.

Anforderungen: A2.

Lieferumfang:

- S2-1. Kalender, Planungsbildschirm und Kopplung treffen über eine Umschreibung die richtige vorhandene Aktion. Fertig, wenn dabei keine neue Aktion entsteht. Quelle: Cegin, Simko, Brusilovsky, https://aclanthology.org/2023.emnlp-main.117/
- S2-2. Der feste Satz bleibt der erste Treffer. Fertig, wenn ein heute gültiger Satz nicht auf die freie Wahl wartet. Quelle: `frontend/src/engine/route-pick.ts`

Gateway `go`. Go, wenn die drei Umschreibungen richtig liegen und ein fester Satz sofort gilt. No-Go, wenn die freie Wahl eine Aktion erfindet oder einen festen Satz verzögert. Abbruch: zwei Aktionen passen gleich gut. Dann fragt er einmal und tut nichts. Hängt an S1 und A2.

Prompt: Trifft kein fester Satz, wählt Ultron höchstens eine Aktion, die es schon gibt. Die Beispiele sind die Sätze, die heute gelten, und enge Umschreibungen derselben Absicht. Er findet keine neue Aktion. Kein fremdes Paket, kein Training. Abbruch, wenn zwei Aktionen gleich gut passen: dann fragt er einmal und tut nichts.

### S3 — Unbekannt bleibt unbekannt

Ziel: Was zu keiner vorhandenen Aktion gehört, löst nichts aus.

Anforderungen: A3.

Lieferumfang:

- S3-1. Ein Satz ohne passende Aktion bekommt einen ehrlichen Satz und keine Aktion. Fertig, wenn nichts geöffnet, gekoppelt oder geschrieben wird. Quelle: Harte Außenseiter, https://aclanthology.org/2024.lrec-main.674/
- S3-2. Ein ähnlich klingender Satz mit anderer Absicht trifft die nahe Aktion nicht. Fertig, wenn stattdessen der ehrliche Satz oder die eine Rückfrage kommt. Quelle: Schwelle, https://docs.aurelio.ai/semantic-router/user-guide/features/threshold-optimization

Gateway `go`. Go, wenn Unbekannt und Zweideutig nichts tun. No-Go, wenn ein Außenseiter die ähnlichste Aktion still auslöst. Abbruch: die Wahl ist nicht eindeutig. Dann fragt er oder sagt, dass er die Aktion nicht kennt, und wartet. Hängt an S2 und A3.

Prompt: Passt der Satz zu keiner vorhandenen Aktion, sagt er das und tut nichts. Ein ähnlich klingender Satz, der etwas anderes meint, löst die nahe Aktion nicht aus. Kein Raten, kein zweites Hirn. Abbruch, wenn er trotzdem eine Aktion erfindet.

## PSP

P1. Kopplung, egal wie gesagt. Paket P1-1: beide Beispielsätze schicken die Anfrage, der alte Satz bleibt. Ergebnis: A1. Fertig, wenn bei bestehender Kopplung keine zweite Anfrage hinausgeht. Abbruch, wenn der Satz eine andere Aktion meint. Hängt an der gebauten Kopplung.

P2. Jede vorhandene Aktion. Paket P2-1: Umschreibung trifft nur eine bekannte Aktion, der feste Satz gewinnt sofort. Ergebnis: A2. Fertig, wenn keine neue Aktion entsteht. Abbruch bei zwei gleich guten Aktionen. Hängt an P1.

P3. Unbekannt bleibt unbekannt. Paket P3-1: keine Aktion, ehrlicher Satz oder eine Rückfrage. Ergebnis: A3. Fertig, wenn nichts ausgelöst wird. Abbruch, wenn eine Aktion erfunden wird. Hängt an P2.

## Risiken

R1. Ein freies Sprachmodell erfindet eine Aktion. Deshalb bleibt die Liste geschlossen. Quelle: https://arxiv.org/html/2404.15869

R2. Ein ähnlich klingender Satz löst die nahe Aktion aus. Deshalb gilt die Schwelle: ohne klaren Treffer passiert nichts. Quelle: https://aclanthology.org/2024.lrec-main.674/

R3. Semantic Router wäre ein zweites System mit Encoder. Deshalb kommt er nicht in den Baum. Die Idee der Beispielsätze bleibt. Quelle: https://docs.aurelio.ai/semantic-router/get-started/quickstart

## Schnittstellen

Vorhanden: die festen Parser, darunter die Kopplung, der Weg, der bei zwei Treffern fragt, und der Teilsatz für zwei Wünsche. Neu: die freie Formulierung nur nach einem Fehltreffer, die Wahl aus der bekannten Liste, und der ehrliche Satz, wenn nichts passt.

## Lücken

L1. „Immer“ gilt für Umschreibungen vorhandener Aktionen. Eine Absicht, die es in der App nicht gibt, wird nicht erfunden.

L2. Zwei verschiedene Wünsche in einem Satz, etwa koppeln und zugleich den Kalender auf dem zweiten Gerät öffnen, entscheidet dieser Plan nicht. Der vorhandene Teilsatz bleibt.

L3. Wie viele Beispielsätze eine Aktion braucht, damit die Schwelle sitzt, ist nicht gemessen. Die drei Abnahmen in A1 und A2 sind der Anfang. Eine vollständige Liste aller Umschreibungen gibt es hier nicht.

## Projekt

Gateway `go`. Go, weil A1 bis A3, E1 bis E5 und S1 bis S3 je Abnahme und Abbruch haben und L1 bis L3 benannt sind. No-Go, wenn ein Sprint ein fremdes Paket, ein Training, eine erfundene Aktion oder eine zweite Kopplungsanfrage bei bestehender Kopplung will.
