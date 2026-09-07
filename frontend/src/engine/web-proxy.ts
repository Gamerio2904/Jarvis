/** Hosts the Vite-dev-proxy may fetch. Browser-CORS umgehen, kein offenes Relais. */
export const WEB_PROXY_HOSTS = new Set([
  'html.duckduckgo.com',
  'api.duckduckgo.com',
  'de.wikipedia.org',
  'en.wikipedia.org',
  'api.frankfurter.app',
  'api.frankfurter.dev',
  'www.dwd.de',
  'nominatim.openstreetmap.org',
  'photon.komoot.io',
  'geocoding-api.open-meteo.com',
  'api.open-meteo.com',
  'air-quality-api.open-meteo.com',
  'overpass-api.de',
  'overpass.kumi.systems',
  'www.tagesschau.de',
  'rss.dw.com',
  'api.wheretheiss.at',
  'v6.db.transport.rest',
  'api.transitous.org',
  'apis.justwatch.com',
  'api.openligadb.de',
  'world.openfoodfacts.org',
  'openlibrary.org',
  'api.inaturalist.org',
  'opensky-network.org',
  'ferien-api.de',
  'date.nager.at',
  'creativecommons.tankerkoenig.de',
  'www.omdbapi.com',
  'api.stlouisfed.org',
  'basemaps.cartocdn.com',
])

export const WEB_PROXY_PATH = '/__jarvis_proxy'

export function shouldProxyWebHost(hostname: string): boolean {
  return WEB_PROXY_HOSTS.has(hostname)
}
