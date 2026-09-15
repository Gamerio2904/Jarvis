# Sprint 280 — exhaustive-deps einzeln

**Version:** `18.1.0` — **CODE** Should
**Plan:** [`71-audit.md`](../71-audit.md) §3d, §4

## Ziel

Die sechs offenen Hook-Warnungen sind entweder behoben oder als Absicht
dokumentiert. Kein pauschales Abschalten.

## Entscheidung

| Datei | Was | Warum |
|-------|-----|--------|
| `VoiceMode.tsx` | disable, `[]` | `startLoop` nur beim Öffnen — ein Re-Run startet die Hörschleife doppelt |
| `Calendar.tsx` | `reload` in deps; Fokus nur bei `sheetOpen` | Monat neu laden ohne Autofokus |
| `SettingsScreen.tsx` | `p.onTopic`, `railQuery` in deps | Suche wechselt den Reiter, Highlight folgt der Eingabe |
| `Lage.tsx` | `moduleKey = modules.join(',')` | `modules` ist jedes Render ein neues Array — Join ist der Inhalt |
| `BodyTree.tsx` / `AgentTree.tsx` | `nodeSig` aus Knoten-Ids, disable für `graph.nodes` | sonst klappt der Baum bei jedem Tick zu |

`App.tsx` Wake-Word und Theme waren schon Absicht (Audit §3d).

Regex-Kosmetik aus §3d bleibt Won’t.

## Abbruchkriterium

Eine Kachel in der Lage lädt zweimal innerhalb einer Sekunde nach.
