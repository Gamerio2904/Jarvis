# Sprint 327 — Debug überspringt die Frage, Rollback deckt Fristen

**Version:** `18.8.4` — **CODE** Must
**Plan:** [`79-next.md`](../79-next.md)
**Voraussetzung:** 323 + 325 + 326.

## Ziel

Der sequentielle Debug-Lauf hängt nicht in „Wann erinnern?“. Trotzdem
verschwinden Test-Termine **und** ihre Extra-Notifies nach Fertig.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S327-1 | Guard | `calendar.ts` | `debugSnapshot().running` → Create ohne Pending/Frage, eine Start-Notify wie bisher |
| S327-2 | Snapshot | `captureHouse` | `remind_offsets_min` liegt in den Event-Zeilen. Restore spielt das alte Array zurück |
| S327-3 | Cancel | Restore | Neben `evt-{id}` auch `evt-{id}-m*` der IDs die neu waren. Timer/`notify_id` wie 323 |
| S327-4 | Pending | | Restore leert Pending, auch wenn 325 zwischenzeitlich eines gesetzt hätte (Stop genau in der Frage — darf im Lauf nicht vorkommen, Guard ist Pflicht) |
| S327-5 | Test | Node | running=true → keine Frage-Reply. Restore nach addEvent mit Offsets → Event weg, cancel für Start + m1440 |

## Won’t

- Auto-Antwort „am Termin“ als Fake-User-Turn im Lauf.
- Auto-Ja auf Anruf/SMS.

## Abbruchkriterium

Lauf bleibt beim Zahnarzt-Prompt stehen und wartet auf Fristen. Oder
nach Fertig klingelt noch `evt-…-m1440`.

## Manuell

Nur Kalender-Kategorie laufen lassen. Prompts kommen hintereinander.
Nach Fertig: kein Zahnarzt, Dock-Download geht, nächster Chat-Termin
fragt wieder nach Fristen.
