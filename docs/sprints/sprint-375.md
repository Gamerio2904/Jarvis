# Sprint 375 — Sleep schreibt Prefs und Ort

**Version:** `18.16.0` — **CODE + APK** Should
**Plan:** [`88-next.md`](../88-next.md)
**Voraussetzung:** `memory-gate.ts` (Mahlzeiten-IGNORE existiert).

## Ziel

Arbeitsgedächtnis darf **stabile** Prefs und Orte nachziehen, auch wenn ein
Gemini-Key liegt. Weiter durch das Gate. Kein Alltagessen.

## Ist

`tickSleepMemory`: Return bei `isGeminiConfigured()`. Nur Regex Name.
Curator ruft Sleep im Preflight, 12-Minuten-Takt.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S375-1 | Zaun weg | `sleep-memory.ts` | Gemini-Key schaltet Sleep **nicht** ab. Voice/Drive weiter skip |
| S375-2 | safeFact | dieselbe Datei | Zusätzlich: Vorliebe (`trinke gerne`), Ort (`wohne in`), weiter kurz < 80 Zeichen. Mahlzeit-Regex bleibt IGNORE im Gate |
| S375-3 | origin | `writeMemory` `origin: 'sleep'`, niedrigere confidence, `expiresFor` | User-Write gewinnt bei REVISE |
| S375-4 | Test | `test-memory-10` | Sleep mit Dummy-Gemini-Key schreibt trotzdem Name aus Working, wenn Gate STORE |

## Won’t

Sleep als zweiter Memory-Agent im Director. Groq-Extraktor.

## Abbruchkriterium

„Gestern Pizza“ landet als Pref. Oder Sleep überschreibt „kein Kaffee mehr“.

## PO-Prüfung

1. „Ich heiße Max und trinke gerne Kaffee“ (memory-Agent) bleibt die Quelle.
2. Sleep darf nur ergänzen, was das Gate neu findet — Widerspruch bleibt User.
