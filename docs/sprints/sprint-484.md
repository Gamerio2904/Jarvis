# Sprint 484 — LAN-Kanal absichern

**Version:** `18.36.0` — **PLAN** Must  
**Plan:** [`../102-next.md`](../102-next.md)  
**Voraussetzung:** 483.

**Ist im Arbeitsbaum:** TLS 1.2/1.3, Zertifikat-Pinning und Bearer-Header sind
für den Hausstand-Kanal vorhanden. Die Fenster-Steuerung bleibt getrennt und
ungeschützt; einheitliches Pairing, geschützte Token-Speicherung sowie
Nonce-/Ablauf-/Request-ID-Schutz sind noch offen. Sprint und Release-Gate
bleiben daher PLAN.

## Ziel

Hausstand und Fensterbefehle laufen nur über einen authentisierten,
verschlüsselten und gepinnten GerätekanaI.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S484-1 | TLS | `JarvisHausPlugin.java` `JarvisFensterPlugin.java` | TLS 1.2+ mit gepinntem Gerätezertifikat; Zertifikat bei sichtbarer Pairing-Bestätigung binden. |
| S484-2 | Pairing | `fenster.ts` `tablet-sync.ts` `store.ts` | Fenster- und Hausstand-Pairing in einer bestätigten Peer-Identität zusammenführen; getrennte Sync-/Steuerrechte, Widerruf und Rotation. |
| S484-3 | Secrets/Replay | `JarvisHausPlugin.java` `JarvisFensterPlugin.java` | Tokens aus URL und Request-Payload entfernen; authentisierte Header, Keystore-geschützte Speicherung, Ablaufzeit, Nonce, Request-ID und Größenlimit. |

## Abbruchkriterium

Unverschlüsselter Fallback, unbestätigtes Zertifikat, wiederverwendbare Anfrage,
getrennte doppelte Pairing-Identitäten oder Token in URL/Log. In diesen Fällen
bleibt Sync/Fernsteuerung gesperrt.
