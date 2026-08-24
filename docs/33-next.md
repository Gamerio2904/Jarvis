# 33 — Polish Tablet, Sprache, CarPlay (`2.29.0`) **CODE**

PO 2026-08-24: Alles bis `2.28` umsetzen, APK fertig, danach Tabletmodus, Sprachmodus und internes CarPlay in einer **2.29 Polish**-Stufe.

Mitgeliefert in Sideload **`2.29.0`**: Alltag & Welt [`31-next.md`](./31-next.md) `2.3`–`2.19` und Kaufmodus [`32-next.md`](./32-next.md) `2.20`–`2.28`. App jetzt: [`00-now.md`](./00-now.md).

Eine Sideload-Stufe: **`2.29.0`**.

## Inhalt

| Fläche | Was sich ändert | Status |
|--------|-----------------|--------|
| Tablet (`min-width: 900px`) | Sidebar bleibt, Composer/Stimme/HUD/Kaufmodus größer, Voice-Sheet mittig | **CODE** |
| Sprachmodus | Leeres Zuhören ohne Dauer-Nörgeln, 180 ms Pause, Orb und Zeilen auf dem Tablet lesbar | **CODE** |
| CarPlay intern | HUD/Tabs/Mic größer auf dem Tablet, HUD 160 ms, Mic schneller frei; bleibt intern, nicht Apple | **CODE** |
| Kaufmodus-Stimme | Mic im Overlay, Nummer antippen wählt das Produkt | **CODE** |

## Chat / Probe

1. Tablet oder Browser ≥ 900 px: Chat mit sichtbarer Sidebar, Sprachmodus-Karte in der Mitte, CarPlay-HUD lesbar, Kaufmodus zweispaltig.
2. Sprachmodus: nach Stille nicht jedes Mal „Nichts gehört“, nach zwei Leerläufen Hinweis. Antworten zu Unwetter/Ferien/Kurs werden vorgelesen.
3. `Öffnen CarPlay` / `Carplay`: Overlay intern. `Lautstärke 50` bleibt Spotify. Kein Apple-Entitlement.
4. `Kaufmodus` + Mic im Overlay: `Such mir einen Fernseher`. `Milch kaufen` bleibt Einkaufsliste.

## Won’t

Apple CarPlay, iOS, Play Store, Tuya-Cloud, Tapo, In-App-Bestellung, kaufDA-Lizenz.
