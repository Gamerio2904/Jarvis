import { APP_VERSION } from './store.ts'

/**
 * Eine Quelle für den Kontakt-Header. Vorher trug jedes Modul seine eigene
 * eingefrorene Nummer — `Jarvis/2.1.0` bei Nominatim, `Jarvis/3.19.0` bei
 * OpenLigaDB, `Jarvis/6.90.0` bei NASA. Nominatim und OpenLigaDB wollen einen
 * echten Absender, und aus einem Bug-Report ließ sich so nicht ablesen, welche
 * App-Version gefragt hat.
 */
export const USER_AGENT = `Jarvis/${APP_VERSION} (local.jarvis.app)`

export const jsonUA = { Accept: 'application/json', 'User-Agent': USER_AGENT }

export const htmlUA = { Accept: 'text/html', 'User-Agent': USER_AGENT }
