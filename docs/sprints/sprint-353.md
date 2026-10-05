# Sprint 353 — Serie-Avatare lokal

**Version:** `18.12.2` — **CODE** Must
**Plan:** [`83-next.md`](../83-next.md) §4

## Ziel

Jeder Knoten zeigt das Charakterbild, auch offline und ohne API-429.

## Lieferumfang

Lokale JPEGs `public/rm-avatars/{id}.jpeg`, `rmAvatar` lokal,
API nur Fallback, Tests.

## Won’t

Nur die Familie cachen. `img.src` nach CORS-Fetch nochmal remote.
