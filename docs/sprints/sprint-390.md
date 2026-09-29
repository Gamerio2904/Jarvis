# Sprint 390 — Memory-Vorschläge ins Haupthirn

**Version:** `18.19.0` — **CODE + APK** Must
**Plan:** [`91-next.md`](../91-next.md)
**Voraussetzung:** `writeMemory` / Gate (`memory-gate.ts`). Deep-Claims 388. Tafel-Chips 385 optional.

## Ziel

Recherche und Board dürfen **vorschlagen**, nicht speichern. Erst nach
Prüfung (Ja auf Chip oder im Chat) geht der Satz durch `writeMemory` ins
Haupthirn. Dump/Smalltalk kommt nicht in die Schlange.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S390-1 | Origin | `memory-layer.ts` | `MemoryOrigin` um `'research'` **nur für akzeptierte** Pins. Confidence Accept 0.55 (unter User 0.95, über Sleep 0.4). User-REVISE gewinnt |
| S390-2 | Store | `store.ts` | `memory_proposals`: `{ id, text, key?, category, origin, url?, status, created_at }`. Pending **nicht** in Cap-80, nicht in `memoryBlock` |
| S390-3 | Vorschlagen | `memory-propose.ts` **neu** | `proposeMemory(candidate)` ruft `decideGate` zuerst: IGNORE → kein Chip. Max 3 Claims pro Deep-Lauf, nur mit URL |
| S390-4 | UI | Chat + Tafel | „Vorschlag: {text} Quelle: {domain}. Merken?“ Ja → `writeMemory`. Nein / 24 h → `rejected` |
| S390-5 | Wer | | Nutzer „merk dir“ bleibt Direkt-Write. Pack-Teach („lern das“) bleibt Pack-Store. Katalog schlägt nie vor. Sleep unverändert (375) |
| S390-6 | Hausstand | `backup.ts` | Proposals mit exportieren (wie Memory), Jobs nicht |

## Won’t

Stiller Write aus Deep Research. Origin `tool` 0.8 für Web-Funde.
Proposals als Pins erinnern. Qdrant. Zweites Hirn.

## Abbruchkriterium

Nach Deep liegt ohne Ja ein Pin in Cap-80. Oder Recall zitiert `pending`.

## Manuell

```
Recherchiere tief: Open-Source ICS Parser
```

Chip/Frage. Dann:

```
Nein
```

Kein Pin. Nochmal Deep, dann `Ja` / `Merk dir den Vorschlag` → Pin, Recall
findet den Satz mit Quelle.
