# Sprint 371 — Recall antwortet das Personen-Knäuel

**Version:** `18.16.0` — **CODE + APK** Must
**Plan:** [`88-next.md`](../88-next.md)
**Voraussetzung:** 369, 370.

## Ziel

Nach dem Eintrag **ohne** denselben Satz nochmal: „Wer ist meine Mutter
und wann hat sie Geburtstag“ → ein belegter Satz. Ein Agent: `recall`.

## Ist

`parseRecallIntent` kennt „was weißt du über …“, nicht „wer ist meine …“.
`formatRecallReply` listet bis 3 Zeilen, merget nicht Person×Datum.
Kombinierte Frage fällt oft ins LLM.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S371-1 | Parser | `recall-parse.ts` | `wer ist (meine\|mein) X`, `wann hat X Geburtstag`, `wann ist X' Geburtstag`. Topic = Alias-kanonisch. Nicht `was weißt du über mich` (bleibt memory) |
| S371-2 | Konflikt | `conflicts.ts` `parse-catalog` | Schreiben bleibt `birthday`. `Wo wohnt Mama` bleibt `maps`. Frage-Wer/Wann → `recall` |
| S371-3 | Cluster-Satz | `retrieve.ts` | `personClusterReply(query, hits, memory, reminders)`: Name aus Pin-Key/Alias, Datum nur aus birthday-Pin **oder** Reminder-Titel `Geburtstag …`. Ein Satz. Ohne Treffer: `Nichts Belegtes zu …` |
| S371-4 | Hops | `expandHops` | Birthday-Hit zieht Tel/Ort-Nachbarn mit, **nur** wenn `related_ids`/Entities. Nicht in den Satz erfinden, nur anhängen wenn die Frage Tel/Ort mitfragt |
| S371-5 | Gold | `TEST_PROMPTS` `GOLD_EXPECT` `test-copy` Sweep-Slice | Keys: `Wer ist meine Mutter und wann hat sie Geburtstag` → `recall`; `Wann hat Mama Geburtstag` → `recall` (oder birthday-list, eine Wahl, Testdoc). Keys = TEST_PROMPTS |
| S371-6 | TEST | [`TEST-18.16.md`](../TEST-18.16.md) | Gerät: eintragen, **neuen** Chat oder später, fragen, ohne den Eintragsatz zu wiederholen |

## Won’t

Bürgerlichen Vornamen erfinden. Zwei Agenten (birthday+recall) im Zug.
LLM als Fallback, der ein Datum rät.

## Abbruchkriterium

Antwort ohne Pin/Reminder. Oder Route `llm` für die Gold-Frage. Oder
„Mutter“ trifft Papas Pin.

## PO-Prüfung

1. `Mama hat am 3. März Geburtstag`.
2. Später: `Wer ist meine Mutter und wann hat sie Geburtstag`.
3. Jarvis nennt Mama und den 3. März. Kein zweites Eintragen.
4. Ohne Eintrag: ehrlich leer.
