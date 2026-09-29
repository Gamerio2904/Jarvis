# TEST 18.16 — Personen-Knäuel + Gedächtnis

Nach Execute von [`88-next.md`](./88-next.md). App-Code **`18.16.0`**.
Sideload bleibt **`18.15.0`** bis APK. Over `18.15.0` installieren, sobald die 18.16-APK da ist.

Gerät, nicht nur die Cloud-VM. Jede Box ist ein Satz — **einmal tippen, kopieren, in den Chat**.

## 1. Version

Einstellungen / Hilfe nennt **`18.16.0`**. Nicht `18.15.0`.

## 2. Personen-Knäuel — Must

Eintragen. **Nicht** sofort die Frage hinterherkleben. Warten, gern neuer Chat.

```
Mama hat am 3. März Geburtstag
```

Später:

```
Wer ist meine Mutter und wann hat sie Geburtstag
```

Erwartung: **ein** Satz. Trace **recall**. Nennt Mama und 3. März / 3.3. Kein Ingrid. Kein zweites Eintragen.

```
Wann hat Mama Geburtstag
```

Dieselbe Belege, Agent **recall**.

Ohne Pin (oder nach Vergessen):

```
vergiss Mama
```

```
Wer ist meine Mutter und wann hat sie Geburtstag
```

Ehrlich leer, kein Raten.

Papa analog:

```
Papa hat am 12. Juni Geburtstag
```

```
Wer ist mein Vater und wann hat er Geburtstag
```

Oma/Opa dürfen **nicht** Mamas Datum liefern.

## 3. Kontakt im Knäuel

Nach Mama-Geburtstag:

```
Mama, Tel 01711234567
```

Ja-Pfad wie heute. Danach:

```
Rufe Mama an
```

maps, Nummer da, weiter auf Ja. Geburtstagsfrage bleibt Datum — **keine** Nummer im Satz, wenn nicht gefragt.

```
Freundin wohnt in Heilbronn
```

bleibt maps, nicht recall.

```
Mama, Mail name@gmx.de
```

liegt; Geburtstagsfrage erfindet die Mail nicht.

## 4. Begrüßung

```
Timer 8 Minuten Nudeln
```

dann:

```
Hallo
```

Höchstens ein belegter Halbsatz (Timer) oder „Ich höre.“ Siezen, kein Vorname, kein „gut geschlafen“.

`Guten Morgen` bleibt Wetter-Brief, nicht Smalltalk-Begrüßung.

## 5. Episode

Nach Timer + Geburtstag App kurz in den Hintergrund. Später:

```
Was war heute
```

Nur was lief, oder leer. Kein Roman.

## 6. Sleep

Gemini-Key darf stehen. Danach **nicht** erwarten, dass das landet:

```
gestern Pizza gegessen
```

Widerspruch bleibt:

```
kein Kaffee mehr
```

## 7. Korrektur

Undeutlich, dann:

```
Nein, das war der Timer
```

Timer-Handlung oder „Welchen Timer?“. Ja-Gate:

```
Fernseher an
```

wartet weiter auf Ja.

## 8. Won’t / Regression

```
Samstag Geburtstag Jakob 18 Uhr
```

Kalender-Termin, nicht still Mama.

```
Fernseher an
```

bleibt Fernseher.

Kein Live, kein Schwarm, kein zweiter Agent im Zug.
