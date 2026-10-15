# Test 18.60 — Yu-Gi-Oh!-Duell

Test-Build **`18.60.0`** / versionCode `186000`. Das ist eine Geräteprüfung, keine Release-Freigabe.

Sideload: https://github.com/Gamerio2904/Jarvis/raw/cursor/ygo-md-sprints-531-550-a6ca/releases/Jarvis.apk

In der App: Einstellungen → **Tests** → Spur **Heute** → Gruppe **18.60 Duell**. **Senden** öffnet das Duell. **Kopieren** legt den Satz in die Zwischenablage.

## 1. Sätze, die das Duell öffnen

Jeder Satz öffnet das Vollbild und antwortet: „Herausforderung angenommen. Es ist Zeit für ein Duell!“

```
Jarvis, ich fordere dich zu einem Duell heraus.
Ich fordere dich zu einem Duell heraus
Zeit für ein Duell
Starte Yu-Gi-Oh
Spiel Yu-Gi-Oh
Yu-Gi-Oh
Duell
```

Diese Sätze öffnen das Duell nicht:

```
Wie viele Yu-Gi-Oh Spielkarten gibt es?
Ich fordere dich heraus
Wie wird das Wetter
```

`Duell schließen` oder `Escape` beendet die Ansicht.

## 2. Deckeditor

1. **Jarvis-Gehirn** auf **Skript-KI (alt)** stellen. **Neuronales Netz** trainiert vor dem Start auf dem Hauptthread.
2. Ein echtes Deck wählen und **Deck laden**. Main zeigt 40–60, Extra höchstens 15.
3. Rechts bleiben die Felder **Typ**, **Attribut**, **Stufe**, **Rasse**, **Archetyp**, **Effekttext**. Sie filtern nur die schon geladenen Karten.
4. Limit 0 ist verboten, 1 limitiert, 2 semi-limitiert. Ohne Limit gibt es keine Banlist-Farbe.
5. Eine Karte mit Archetyp zeigt verwandte Karten desselben Namens. Ohne Archetyp steht „Kein Archetyp-Name vorhanden.“

## 3. Start und Turn 1

1. **Duell starten**.
2. Münzwurf mit **Überspringen** beenden.
3. Statuszeile zeigt Zug, Phase und **Aktivieren** mit OFF / AUTO / ON. AUTO ist der Startwert und bleibt auf dem Gerät.
4. Im ersten Zug des beginnenden Spielers gibt es keinen Knopf **Kampf**. **Ende** ist sichtbar.
5. **Nächste Phase** geht Draw → Standby → Main 1. In der Endphase heißt der Knopf **Jarvis Zug starten**.
6. Das Feld scrollt nicht. Die Skalen **Skala L** und **Skala R** sitzen links und rechts der Monsterreihe.

## 4. Aktivieren, Ziele, Kette

1. **Aktivieren** auf AUTO: eine eigene optionale Karte fragt **Ja** oder **Nein** und nennt das Kettenglied. **Nein** lässt die Karte liegen.
2. OFF fragt nicht. Eine Karte, deren Text „muss“, „Pflicht“ oder „must“ enthält, wirkt trotzdem.
3. ON fragt zusätzlich vor dem Phasenwechsel.
4. Nach **Ja** leuchten nur legale Ziele. Ein einziges Ziel wird übernommen. Mehrere warten auf einen Tipp. Der Hinweis lautet „Wähle ein leuchtendes Ziel.“
5. Gegnerdeck und gegnerisches Extra bleiben verdeckt. Friedhof, eigenes Deck, eigenes Extra und offene verbannte Karten sind wählbar.
6. Die Kette steht als Stapel, CL1 unten. **Passen / Kette auflösen** schreibt den Zustand einmal. Bei zwei Gliedern gibt es eine kurze Pause, „Kette löst auf …“.
7. Zwei eigene Auslöser gleichzeitig: **Reihenfolge bestätigen** oder **Umkehren**.

## 5. Kampf und Lebenspunkte

1. Ab dem zweiten Zug des beginnenden Spielers gibt es **Kampf**.
2. Ein Angriff bleibt in der Schadensrechnung stehen. Die Schritte heißen Start, Angriffsdeklaration, Schadensrechnung, Ende.
3. **Schadensrechnung** zieht die Lebenspunkte einmal ab. Der Pfeil und die Zahl kommen aus diesem einen Abzug.
4. **Ende** aus Main 1 überspringt den Kampf. Nach dem Kampf folgt Main 2 über **Nächste Phase**.

## 6. Zonen, Pendel, Ritual, Protokoll

1. Eine Normalbeschwörung mit mehreren freien Spalten fragt die Spalte. Eine illegale Spalte wird abgelehnt.
2. Extra-Deck-Monster nur in eine freie Extra-Monsterzone oder in eine Hauptspalte, auf die ein eigener Link zeigt.
3. Xyz-Material bleibt unter der Karte und geht nicht auf den Friedhof.
4. **Skala L** oder **Skala R** mit einer Karte ohne Skala sagt: „Diese Karte hat keine Pendel-Skala. Es wird keine Skala erfunden.“
5. Zwei Skalen: **Pendelbeschwören** einmal pro Zug, Stufe strikt zwischen den Skalen. Eine Feldkarte mit Skala geht offen ins Extra Deck, nicht auf den Friedhof.
6. **Ritual** verbraucht die Normalbeschwörung nicht. Die Tributstufe reicht mindestens für die Ritualstufe.
7. Unter der Statuszeile listet das **Duellprotokoll** Beschwörung, Aktivierung, Kettenglied, Angriff und Phasenwechsel. Es gibt keinen Replay-Knopf.

## 7. Offen

Xyz-Material abnehmen, Replay, historische Pendel-Ausnahmen, OCG gegen TCG. Shop, Rangliste, Crafting, Solo, Sleeves und Feld-Skins gehören nicht in diesen Stand.

Fassung der Regeln: [`yugioh-duel.md`](./yugioh-duel.md).
