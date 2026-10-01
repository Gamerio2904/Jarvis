# RoomAR und OpenScan

Die Vorlage ist [`plan-vorlage.md`](./plan-vorlage.md). Hier steht nur, was der Mensch einmal gibt. Anforderungen, Entscheidungen, Sprints, PSP, Risiken, Schnittstellen, Lücken und Gateways schreibt er selbst. Kein Code, keine Version, kein APK.

## Bedingung

Jarvis führt den RoomAR-Ablauf auf dem Handy und den OpenScan3-Ablauf am gekoppelten Raspberry Pi, Schritt für Schritt wie in den Projekten, und nimmt beides in den Hausstand.

## Rahmenpunkte dieses Projekts

Die acht Punkte der Vorlage gelten. Dazu, gelesen am 1. Oktober 2026:

1. Raum-Ablauf ist [colbehr/RoomAR](https://github.com/colbehr/RoomAR), Paket `com.colbehr.roomar`. Keine `LICENSE` im Repo. Verhalten neu bauen. Kotlin, Compose, `arrow.glb` und Icons bleiben im Upstream.
2. [kuroaman/Roomar](https://github.com/kuroaman/Roomar) ist ein Seitenexport. Er ist nicht der Ablauf.
3. Scanner-Ablauf ist [OpenScan3](https://github.com/OpenScan-org/OpenScan3), Zweig `develop`, GPL-3.0. Architektur: [ARCHITECTURE.md](https://github.com/OpenScan-org/OpenScan3/blob/develop/docs/ARCHITECTURE.md). Überblick: [OpenScan-Doc](https://openscan-org.github.io/OpenScan-Doc/).
4. Die Firmware bleibt auf dem Pi. Jarvis spricht `/latest` und liest `/versions`. Kein Python aus `openscan_firmware/` im Baum.
5. `system_update` und `openscan-updater` fasst er nicht an.
6. Das Handy hat keinen Rotor. Ohne gekoppelten Pi legt er keinen Scan an.
7. Paket-ID bleibt `local.jarvis.app`.
8. Hausstand trägt Punkt-JSON und die Pi-Adresse. Fotos und Cloud-Geheimnis bleiben auf dem Pi.
9. `Freitag` bleibt Kalender.

Er setzt die Zahl der Sprints. Drei feste Titel sind keine Vorgabe.
