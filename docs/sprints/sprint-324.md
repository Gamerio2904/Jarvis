# Sprint 324 — Debug-Chat Download sichtbar

**Version:** `18.8.1` — **CODE** Must
**Plan:** [`79-next.md`](../79-next.md)
**Voraussetzung:** 323 soweit Must (Restore darf den Chat nicht löschen).

## Ziel

Den Debug-Chat kann man **sehen und speichern**, ohne die Spur Lauf in
den Settings zu suchen. Auf dem Handy landet eine Datei in Downloads,
im Browser im Download-Ordner.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S324-1 | Dock | `DebugChatDock.tsx` | Knopf „Chat herunterladen“ ab `turns.length > 0`, auch nach Fertig (`live`). Stop/Tests bleiben. Disabled nur ohne Turns |
| S324-2 | Sicht | Dock-Guard | Sichtbar wenn `live && (running \|\| turns.length)`. Nach Fertig nicht verschwinden |
| S324-3 | Speichern | `debug-session.ts` | `downloadDebug` / `downloadHistory`: native `saveToDownloads`, sonst `appendChild`+click wie `backup.ts`. `saveBlob` ohne Tree **weg** |
| S324-4 | Panel | `DebugPanel.tsx` | Knöpfe bleiben auf Spur Lauf. Gleiche Funktion, nicht ein zweiter Report-Bau |
| S324-5 | Copy | CHANGELOG 79 | Kein „Download in den Settings versteckt“. Handy: Downloads/, PC: Browser-Downloads |

## Won’t

- Cloud-Upload. Share-Sheet Pflicht (native Save reicht; Share darf extra).
- Gruppentitel umbenennen. Download bevor der erste Turn da ist (dann
  leere Datei).

## Abbruchkriterium

Dock ohne Knopf nach Fertig. Oder `a.click()` ohne `appendChild` bleibt
der einzige Pfad. Oder ProbeShelf-Spur Heute blendet das Dock aus.

## Manuell

Lauf starten → Settings zu → Dock: Download nach erstem Turn. Fertig →
nochmal Download. Datei JSON+TXT lesbar. Spur Heute: Dock bleibt, Panel
nur auf Lauf.
