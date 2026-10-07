# Test 18.28 — Planungsmodus stabilisieren

**Status:** PLAN. Isolierten Test-Hausstand verwenden.

## Routing und Ansichten

| Eingabe | Erwartung |
|---|---|
| `Plane eine App: Einkaufszettel` | Plan-/Projektpfad, kein Entwurf |
| `Entwirf eine App: Einkaufszettel` | Stummer Entwurfspfad, keine Planänderung |
| `Zeig Sprints` | Nur Sprintansicht der aktiven Idee |
| `Zeig PSP` | PSP-/Strukturansicht, keine Sprintliste |
| `Simuliere Kalender` | Als Simulation gekennzeichnete Vorschau, keine Live-App |
| `Hallo` / gewöhnlicher Smalltalk | Kein Board-Intent |

## Zustand und Fehler

1. Zwei Projekte anlegen, Plan A öffnen, zu B wechseln und zurück: Daten,
   Phase, Sprintliste und Export gehören immer zur richtigen Projekt-ID.
2. App nach Speichern und nach Abbruch neu starten: Der kanonische Plan ist
   wieder lesbar; flüchtige Bestätigungen sind nicht fälschlich offen.
3. Eine Modellantwort mit ungültigem JSON oder unbekannter Abhängigkeit wird
   als Fehler/Lücke gemeldet; sie erzeugt keinen Erfolgseintrag.
4. PSP bleibt auch nach Wechsel Sprints → PSP, Neustart und Projektwechsel
   sprintkartenfrei.
5. Neue Tests laufen gemeinsam mit bestehenden Board-, Idea-Plan- und
   UI-Regressionen.

## Release-Gate

Nur nach grüner Browser- und Android-WebView-Abnahme Version `18.28.0` /
versionCode `182800` setzen.
