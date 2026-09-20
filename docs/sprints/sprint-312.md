# Sprint 312 — Passive OSINT und Kugel-Pin

**Version:** `18.6.5` — **PLAN** Should
**Plan:** [`77-next.md`](../77-next.md)
**Voraussetzung:** 307.

## Ziel

Öffentliche Nachschlage-Sätze, ein Subject. Gibt es Koordinaten, fliegt
die Kugel hin. Kein Scan, kein fremdes Leak.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S312-1 | Domain | `osint.ts` neu | DNS + WHOIS + CT-Subdomains public. Timeout, ehrlich leer |
| S312-2 | IP | | Geo grob + ASN public. Fly-to wenn lat/lon da |
| S312-3 | CVE | | NVD public, Text, kein Pin |
| S312-4 | Sanktionen | | OFAC/OpenSanctions public, Treffer/kein Treffer, keine Anklage |
| S312-5 | Shodan | Settings | Nur mit **Nutzer-Key**. Sonst: „Shodan habe ich ohne Ihren Key nicht.“ |
| S312-6 | Parser | | Sätze Plan §4. Nicht `research`, nicht `unknown_place` |
| S312-7 | GitHub public | | Optionales Profil, Rate-Limit beachten |

## Won’t

- `/sweep`, `/scanner`, Portlisten gegen Dritte.
- `leaks`, Hudson Rock, Telefon-OSINT.
- Shodan-Key in der APK. Massen-Enumeration als Schleife.

## Abbruchkriterium

Ein Satz startet einen Portscan oder lädt Breach-Corpora.

## Manuell

`WHOIS example.com` → Registrar-Text.
`IP … auf der Kugel` → grober Pin oder ehrlich ohne Ort.
`Scan 1.1.1.1` → Absage, optional Hinweis auf vorhandenes Traceroute für **Ihr** Netz.
