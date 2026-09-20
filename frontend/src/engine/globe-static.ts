import type { GeoFix } from './globe-geo.ts'

/** Öffentlich bekannte Engstellen und Häfen — Tabelle, kein Crawl. */
export const SEA_FIXES: GeoFix[] = [
  { name: 'Hormus', lat: 26.57, lon: 56.25, kind: 'ship', line: 'Tabelle · Meerenge' },
  { name: 'Malakka', lat: 2.5, lon: 101.67, kind: 'ship', line: 'Tabelle · Meerenge' },
  { name: 'Suez', lat: 30.45, lon: 32.35, kind: 'ship', line: 'Tabelle · Kanal' },
  { name: 'Panama', lat: 9.08, lon: -79.68, kind: 'ship', line: 'Tabelle · Kanal' },
  { name: 'Gibraltar', lat: 36.14, lon: -5.35, kind: 'ship', line: 'Tabelle · Meerenge' },
  { name: 'Bosporus', lat: 41.12, lon: 29.07, kind: 'ship', line: 'Tabelle · Meerenge' },
  { name: 'Rotterdam', lat: 51.95, lon: 4.14, kind: 'ship', line: 'Tabelle · Hafen' },
  { name: 'Hamburg', lat: 53.54, lon: 9.98, kind: 'ship', line: 'Tabelle · Hafen' },
  { name: 'Antwerpen', lat: 51.27, lon: 4.33, kind: 'ship', line: 'Tabelle · Hafen' },
  { name: 'Shanghai', lat: 31.37, lon: 121.56, kind: 'ship', line: 'Tabelle · Hafen' },
  { name: 'Singapur', lat: 1.26, lon: 103.84, kind: 'ship', line: 'Tabelle · Hafen' },
  { name: 'Los Angeles', lat: 33.73, lon: -118.26, kind: 'ship', line: 'Tabelle · Hafen' },
]

/** Öffentlich bekannte große Anlagen — Koordinaten im Repo, kein Scraping. */
export const INFRA_FIXES: GeoFix[] = [
  { name: 'Neckarwestheim', lat: 49.04, lon: 9.17, kind: 'infra', line: 'Tabelle · Kernkraft' },
  { name: 'Isar', lat: 48.61, lon: 12.29, kind: 'infra', line: 'Tabelle · Kernkraft' },
  { name: 'Cattenom', lat: 49.42, lon: 6.22, kind: 'infra', line: 'Tabelle · Kernkraft' },
  { name: 'Fessenheim', lat: 47.91, lon: 7.56, kind: 'infra', line: 'Tabelle · Kernkraft' },
  { name: 'Gravelines', lat: 50.99, lon: 2.13, kind: 'infra', line: 'Tabelle · Kernkraft' },
  { name: 'Flamanville', lat: 49.54, lon: -1.88, kind: 'infra', line: 'Tabelle · Kernkraft' },
  { name: 'Sellafield', lat: 54.42, lon: -3.5, kind: 'infra', line: 'Tabelle · Anlage' },
  { name: 'Tihange', lat: 50.53, lon: 5.27, kind: 'infra', line: 'Tabelle · Kernkraft' },
  { name: 'Doel', lat: 51.32, lon: 4.26, kind: 'infra', line: 'Tabelle · Kernkraft' },
  { name: 'Temelín', lat: 49.18, lon: 14.38, kind: 'infra', line: 'Tabelle · Kernkraft' },
  { name: 'Mochovce', lat: 48.26, lon: 18.46, kind: 'infra', line: 'Tabelle · Kernkraft' },
  { name: 'Zaporischschja', lat: 47.51, lon: 34.59, kind: 'infra', line: 'Tabelle · Kernkraft' },
  { name: 'Tschernobyl', lat: 51.39, lon: 30.1, kind: 'infra', line: 'Tabelle · Anlage' },
  { name: 'Fukushima Daiichi', lat: 37.42, lon: 141.03, kind: 'infra', line: 'Tabelle · Anlage' },
  { name: 'Kashiwazaki-Kariwa', lat: 37.43, lon: 138.6, kind: 'infra', line: 'Tabelle · Kernkraft' },
  { name: 'Palo Verde', lat: 33.39, lon: -112.86, kind: 'infra', line: 'Tabelle · Kernkraft' },
  { name: 'Bruce', lat: 44.32, lon: -81.6, kind: 'infra', line: 'Tabelle · Kernkraft' },
  { name: 'Olkiluoto', lat: 61.24, lon: 21.44, kind: 'infra', line: 'Tabelle · Kernkraft' },
  { name: 'Barakah', lat: 23.97, lon: 52.23, kind: 'infra', line: 'Tabelle · Kernkraft' },
  { name: 'Buschehr', lat: 28.83, lon: 50.89, kind: 'infra', line: 'Tabelle · Kernkraft' },
]
