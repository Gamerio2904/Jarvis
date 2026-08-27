import { getPending, loadSettings } from './store'
import { handlePlug, loadPlugs } from './plug'
import { parseTvIntent, parseTvWatch } from './tv-parse'
import { handleTv } from './tv'
import { parseFilmIntent } from './film-parse'
import { handleFilm } from './film'
import { parseFanIntent } from './fan-parse'
import { handleFan } from './fan'
import { parsePlugIntent } from './plug-parse'
import { parseHereIntent } from './here-parse'
import { handleHere } from './here'
import { parseFuelIntent } from './fuel-parse'
import { handleFuel } from './fuel'
import { parsePoiIntent } from './poi-parse'
import { handlePoi } from './poi'
import { parseTransitIntent } from './transit-parse'
import { handleTransit } from './transit'
import { parseDriveIntent } from './drive-parse'
import { parseSpotifyIntent } from './spotify-parse'
import { handleDrive } from './drive'
import { parseDeviceIntent } from './device-parse'
import { handleDevice } from './device'
import { parsePcIntent } from './pc-parse'
import { handlePc } from './pc'
import { isPcGround, isEyeGround, parseGroundIntent } from './ground-parse'
import { parsePlaceNav, parsePlaceRecall, parsePlaceWrite } from './places-parse'
import { handlePlaces } from './places'
import { isIdentityAsk, isMemoryRecall, isMemoryWrite, VERGISS, VERGISS_ALL } from './memory-parse'
import { handleMemory } from './memory'
import { parseShopIntent } from './shopping-parse'
import { handleShopping } from './shopping'
import { parseBirthdayIntent } from './birthday-parse'
import { handleBirthday } from './birthday'
import { parseHomeIntent } from './home-parse'
import { handleHome } from './home'
import { parseLeaveIntent } from './leave-parse'
import { handleLeave } from './leave'
import { isBriefAsk } from './brief-parse'
import { handleBrief } from './brief'
import { parseHolidayIntent } from './holiday-parse'
import { handleHoliday } from './holiday'
import { parseCalendarIntent } from './calendar-parse'
import { handleCalendar } from './calendar'
import { parseAlarmIntent } from './alarm-parse'
import { handleAlarms } from './alarms'
import { parseTimerIntent } from './timer-parse'
import { handleTimers } from './timers'
import { parseReminderIntent } from './remind-parse'
import { handleReminders } from './reminders'
import { parseToolIntent } from './tools-parse'
import { handleTools, type ToolMeta } from './tools'
import { parseEyeIntent } from './eye-parse'
import { handleEyeAsk } from './eye'
import { parseWeatherFollowup, parseWeatherIntent, type WeatherLast } from './weather-parse'
import { handleWeather } from './weather'
import { parseNewsIntent } from './news-parse'
import { handleNews } from './news'
import { parseChatSearch } from './search-chat-parse'
import { handleChatSearch } from './search-chat'
import type { ResearchMeta } from './research-parse'
import { askReply, parserScore, pickPolicy } from './policy'
import { propose } from './route-pick'
import type { RouteCtx, SideEffect } from './route-types'
import { parseWarnIntent, handleWarn } from './warn'
import { parseFerienIntent, handleFerien } from './ferien'
import { parseFxIntent, handleFx } from './fx'
import { parseFoodIntent, handleFood } from './food'
import { parseLibraryIntent, handleLibrary } from './library'
import { parseSportIntent, handleSport } from './sport'
import { parseSkyIntent, handleSky } from './sky'
import { parseNatureIntent, handleNature } from './nature'
import { parseFlightsIntent, handleFlights } from './flights'
import { parseLawIntent, handleLaw } from './law'
import { parseHaushaltIntent, handleHaushalt } from './haushalt'
import { parseSensorsIntent, handleSensors } from './sensors'
import { parseChessIntent, handleChess } from './chess'
import { parseHudIntent } from './hud-parse'
import { handleHud } from './hud'
import { parseTraceIntent } from './trace-parse'
import { handleTrace } from './trace'
import { parseDigestIntent } from './digest-parse'
import { handleDigest } from './digest'
import { parseOutlookIntent } from './outlook-parse'
import { handleOutlook } from './outlook'
import { parseTaxiIntent } from './taxi-parse'
import { handleTaxi } from './taxi'
import { parseBackupIntent, handleBackup } from './backup'
import { parseFaceIntent } from './face-parse.ts'
import { handleFace } from './face.ts'

export type { RouteCtx, SideEffect } from './route-types'

export type RouteHit = {
  reply: string
  tool?: ToolMeta | null
  research?: ResearchMeta
  lastTool?: string
  retry?: 'fuel' | 'weather' | 'poi' | 'transit'
}

type Capability = {
  id: string
  label: string
  sideEffect: SideEffect
  parse: (ctx: RouteCtx) => number | null
  execute: (ctx: RouteCtx) => Promise<RouteHit | null>
}

function score(text: string, extra = 0): number {
  return parserScore(text, extra)
}

function weatherLast(): WeatherLast | null {
  const s = loadSettings()
  if (!s.last_weather_kind) return null
  if (s.last_weather_kind === 'place' && s.last_weather_place) {
    return {
      kind: 'place',
      place: s.last_weather_place,
      when: (s.last_weather_when as WeatherLast['when']) || 'now',
      focus: (s.last_weather_focus as WeatherLast['focus']) || 'general',
    }
  }
  return {
    kind: 'here',
    when: (s.last_weather_when as WeatherLast['when']) || 'now',
    focus: (s.last_weather_focus as WeatherLast['focus']) || 'general',
  }
}

async function fromHandler(
  id: string,
  res: {
    handled?: boolean
    reply?: string
    tool?: ToolMeta
    research?: ResearchMeta
    lastTool?: string
    retry?: 'fuel' | 'weather' | 'poi' | 'transit'
  },
): Promise<RouteHit | null> {
  if (res.retry) {
    return {
      reply: res.reply || '',
      tool: res.tool,
      lastTool: res.lastTool || id,
      retry: res.retry,
    }
  }
  if (!res.handled || !res.reply) return null
  return {
    reply: res.reply,
    tool: res.tool,
    research: res.research,
    lastTool: res.lastTool || id,
  }
}

function makeCatalog(): Capability[] {
  return [
    {
      id: 'tv',
      label: 'Fernseher',
      sideEffect: 'device',
      parse: (ctx) => {
        const follow = ctx.lastTool === 'tv'
        if (parseTvWatch(ctx.text) || parseTvIntent(ctx.text, follow)) return score(ctx.text, 0.06)
        return null
      },
      execute: async (ctx) => fromHandler('tv', await handleTv(ctx.text)),
    },
    {
      id: 'film',
      label: 'Film',
      sideEffect: 'read',
      parse: (ctx) => (parseFilmIntent(ctx.text) ? score(ctx.text, 0.04) : null),
      execute: async (ctx) => fromHandler('film', await handleFilm(ctx.conversationId, ctx.text)),
    },
    {
      id: 'fan',
      label: 'Ventilator',
      sideEffect: 'device',
      parse: (ctx) => (parseFanIntent(ctx.text, ctx.lastTool === 'fan') ? score(ctx.text, 0.05) : null),
      execute: async (ctx) => fromHandler('fan', await handleFan(ctx.text)),
    },
    {
      id: 'plug',
      label: 'Steckdose',
      sideEffect: 'device',
      parse: (ctx) => {
        const names = loadPlugs().map((p) => p.name)
        return parsePlugIntent(ctx.text, names, ctx.lastTool === 'plug') ? score(ctx.text, 0.05) : null
      },
      execute: async (ctx) => fromHandler('plug', await handlePlug(ctx.text)),
    },
    {
      id: 'here',
      label: 'Standort',
      sideEffect: 'read',
      parse: (ctx) => (parseHereIntent(ctx.text, ctx.lastTool) ? score(ctx.text, 0.05) : null),
      execute: async (ctx) => fromHandler('here', await handleHere(ctx.text)),
    },
    {
      id: 'fuel',
      label: 'Tanke',
      sideEffect: 'read',
      parse: (ctx) => (parseFuelIntent(ctx.text) ? score(ctx.text, 0.08) : null),
      execute: async (ctx) => fromHandler('fuel', await handleFuel(ctx.conversationId, ctx.text)),
    },
    {
      id: 'poi',
      label: 'In der Nähe',
      sideEffect: 'read',
      parse: (ctx) => (parsePoiIntent(ctx.text) ? score(ctx.text) : null),
      execute: async (ctx) => fromHandler('poi', await handlePoi(ctx.conversationId, ctx.text)),
    },
    {
      id: 'transit',
      label: 'Bahn',
      sideEffect: 'read',
      parse: (ctx) => (parseTransitIntent(ctx.text) ? score(ctx.text, 0.04) : null),
      execute: async (ctx) => fromHandler('transit', await handleTransit(ctx.conversationId, ctx.text)),
    },
    {
      id: 'drive',
      label: 'Fahrmodus',
      sideEffect: 'device',
      parse: (ctx) =>
        parseDriveIntent(ctx.text, ctx.inDrive) || parseSpotifyIntent(ctx.text) ? score(ctx.text, 0.04) : null,
      execute: async (ctx) => fromHandler('drive', await handleDrive(ctx.conversationId, ctx.text)),
    },
    {
      id: 'device',
      label: 'Gerät',
      sideEffect: 'device',
      parse: (ctx) => (parseDeviceIntent(ctx.text) ? score(ctx.text, 0.04) : null),
      execute: async (ctx) => fromHandler('device', await handleDevice(ctx.conversationId, ctx.text)),
    },
    {
      id: 'pc',
      label: 'PC',
      sideEffect: 'device',
      parse: (ctx) =>
        parsePcIntent(ctx.text) || isPcGround(parseGroundIntent(ctx.text)) ? score(ctx.text, 0.05) : null,
      execute: async (ctx) => fromHandler('pc', await handlePc(ctx.conversationId, ctx.text)),
    },
    {
      id: 'maps',
      label: 'Karten',
      sideEffect: 'read',
      parse: (ctx) =>
        parsePlaceWrite(ctx.text) || parsePlaceRecall(ctx.text) || parsePlaceNav(ctx.text)
          ? score(ctx.text)
          : null,
      execute: async (ctx) => fromHandler('maps', await handlePlaces(ctx.conversationId, ctx.text)),
    },
    {
      id: 'memory',
      label: 'Gedächtnis',
      sideEffect: 'write',
      parse: (ctx) => {
        const t = ctx.text
        if (VERGISS_ALL.test(t) || VERGISS.test(t) || isMemoryWrite(t) || isMemoryRecall(t) || isIdentityAsk(t)) {
          return score(t, 0.04)
        }
        return null
      },
      execute: async (ctx) => fromHandler('memory', await handleMemory(ctx.conversationId, ctx.text)),
    },
    {
      id: 'shopping',
      label: 'Einkauf',
      sideEffect: 'write',
      parse: (ctx) => (parseShopIntent(ctx.text) ? score(ctx.text) : null),
      execute: async (ctx) => fromHandler('shopping', await handleShopping(ctx.conversationId, ctx.text)),
    },
    {
      id: 'birthday',
      label: 'Geburtstag',
      sideEffect: 'write',
      parse: (ctx) => (parseBirthdayIntent(ctx.text) ? score(ctx.text) : null),
      execute: async (ctx) => fromHandler('birthday', await handleBirthday(ctx.conversationId, ctx.text)),
    },
    {
      id: 'home',
      label: 'Zuhause',
      sideEffect: 'write',
      parse: (ctx) => (parseHomeIntent(ctx.text) ? score(ctx.text) : null),
      execute: async (ctx) => fromHandler('home', await handleHome(ctx.conversationId, ctx.text)),
    },
    {
      id: 'leave',
      label: 'Losgehen',
      sideEffect: 'read',
      parse: (ctx) => (parseLeaveIntent(ctx.text) ? score(ctx.text) : null),
      execute: async (ctx) => fromHandler('leave', await handleLeave(ctx.conversationId, ctx.text)),
    },
    {
      id: 'brief',
      label: 'Tageslage',
      sideEffect: 'read',
      parse: (ctx) => (isBriefAsk(ctx.text) ? score(ctx.text, 0.08) : null),
      execute: async () => fromHandler('brief', await handleBrief()),
    },
    {
      id: 'holiday',
      label: 'Feiertag',
      sideEffect: 'read',
      parse: (ctx) => (parseHolidayIntent(ctx.text) ? score(ctx.text, 0.04) : null),
      execute: async (ctx) => fromHandler('holiday', await handleHoliday(ctx.text)),
    },
    {
      id: 'calendar',
      label: 'Kalender',
      sideEffect: 'write',
      parse: (ctx) => (parseCalendarIntent(ctx.text) ? score(ctx.text, 0.04) : null),
      execute: async (ctx) => fromHandler('calendar', await handleCalendar(ctx.conversationId, ctx.text)),
    },
    {
      id: 'alarm',
      label: 'Wecker',
      sideEffect: 'write',
      parse: (ctx) => (parseAlarmIntent(ctx.text) ? score(ctx.text, 0.04) : null),
      execute: async (ctx) => fromHandler('alarm', await handleAlarms(ctx.conversationId, ctx.text)),
    },
    {
      id: 'timer',
      label: 'Timer',
      sideEffect: 'write',
      parse: (ctx) => (parseTimerIntent(ctx.text) ? score(ctx.text, 0.04) : null),
      execute: async (ctx) => fromHandler('timer', await handleTimers(ctx.conversationId, ctx.text)),
    },
    {
      id: 'reminder',
      label: 'Erinnerung',
      sideEffect: 'write',
      parse: (ctx) => (parseReminderIntent(ctx.text) ? score(ctx.text) : null),
      execute: async (ctx) => fromHandler('reminder', await handleReminders(ctx.conversationId, ctx.text)),
    },
    {
      id: 'todo',
      label: 'Todos',
      sideEffect: 'write',
      parse: (ctx) => (parseToolIntent(ctx.text) ? score(ctx.text) : null),
      execute: async (ctx) => fromHandler('todo', await handleTools(ctx.conversationId, ctx.text)),
    },
    {
      id: 'eye',
      label: 'Auge',
      sideEffect: 'read',
      parse: (ctx) =>
        parseEyeIntent(ctx.text) || isEyeGround(parseGroundIntent(ctx.text)) ? score(ctx.text) : null,
      execute: async (ctx) => fromHandler('eye', await handleEyeAsk(ctx.text)),
    },
    {
      id: 'weather',
      label: 'Wetter',
      sideEffect: 'read',
      parse: (ctx) => {
        if (parseWeatherIntent(ctx.text) || parseWeatherFollowup(ctx.text, ctx.weatherLast ?? weatherLast())) {
          return score(ctx.text, 0.05)
        }
        return null
      },
      execute: async (ctx) => fromHandler('weather', await handleWeather(ctx.text)),
    },
    {
      id: 'news',
      label: 'Nachrichten',
      sideEffect: 'read',
      parse: (ctx) => (parseNewsIntent(ctx.text) ? score(ctx.text) : null),
      execute: async (ctx) => fromHandler('news', await handleNews(ctx.text)),
    },
    {
      id: 'search',
      label: 'Chatsuche',
      sideEffect: 'read',
      parse: (ctx) => (parseChatSearch(ctx.text) ? score(ctx.text) : null),
      execute: async (ctx) => fromHandler('search', await handleChatSearch(ctx.text)),
    },
    {
      id: 'warn',
      label: 'Unwetter',
      sideEffect: 'read',
      parse: (ctx) => (parseWarnIntent(ctx.text) ? score(ctx.text, 0.08) : null),
      execute: async (ctx) => fromHandler('warn', await handleWarn(ctx.text)),
    },
    {
      id: 'ferien',
      label: 'Ferien',
      sideEffect: 'read',
      parse: (ctx) => (parseFerienIntent(ctx.text) ? score(ctx.text, 0.08) : null),
      execute: async (ctx) => fromHandler('ferien', await handleFerien(ctx.text)),
    },
    {
      id: 'fx',
      label: 'Kurs',
      sideEffect: 'read',
      parse: (ctx) => (parseFxIntent(ctx.text) ? score(ctx.text, 0.08) : null),
      execute: async (ctx) => fromHandler('fx', await handleFx(ctx.text)),
    },
    {
      id: 'food',
      label: 'Lebensmittel',
      sideEffect: 'read',
      parse: (ctx) => (parseFoodIntent(ctx.text) ? score(ctx.text, 0.06) : null),
      execute: async (ctx) => fromHandler('food', await handleFood(ctx.text)),
    },
    {
      id: 'library',
      label: 'Buch',
      sideEffect: 'read',
      parse: (ctx) => (parseLibraryIntent(ctx.text) ? score(ctx.text, 0.06) : null),
      execute: async (ctx) => fromHandler('library', await handleLibrary(ctx.text)),
    },
    {
      id: 'sport',
      label: 'Sport',
      sideEffect: 'read',
      parse: (ctx) => (parseSportIntent(ctx.text) ? score(ctx.text, 0.08) : null),
      execute: async (ctx) => fromHandler('sport', await handleSport(ctx.text)),
    },
    {
      id: 'sky',
      label: 'Himmel',
      sideEffect: 'read',
      parse: (ctx) => (parseSkyIntent(ctx.text) ? score(ctx.text, 0.08) : null),
      execute: async (ctx) => fromHandler('sky', await handleSky(ctx.text)),
    },
    {
      id: 'nature',
      label: 'Natur',
      sideEffect: 'read',
      parse: (ctx) => (parseNatureIntent(ctx.text) ? score(ctx.text, 0.06) : null),
      execute: async (ctx) => fromHandler('nature', await handleNature(ctx.text)),
    },
    {
      id: 'flights',
      label: 'Flug',
      sideEffect: 'read',
      parse: (ctx) => (parseFlightsIntent(ctx.text) ? score(ctx.text, 0.06) : null),
      execute: async () => fromHandler('flights', await handleFlights()),
    },
    {
      id: 'law',
      label: 'Gesetz',
      sideEffect: 'read',
      parse: (ctx) => (parseLawIntent(ctx.text) ? score(ctx.text, 0.05) : null),
      execute: async (ctx) => fromHandler('law', await handleLaw(ctx.text)),
    },
    {
      id: 'haushalt',
      label: 'Haushalt',
      sideEffect: 'read',
      parse: (ctx) => (parseHaushaltIntent(ctx.text) ? score(ctx.text, 0.05) : null),
      execute: async (ctx) => fromHandler('haushalt', await handleHaushalt(ctx.text)),
    },
    {
      id: 'sensors',
      label: 'Sensor',
      sideEffect: 'read',
      parse: (ctx) => (parseSensorsIntent(ctx.text) ? score(ctx.text, 0.05) : null),
      execute: async (ctx) => fromHandler('sensors', await handleSensors(ctx.text)),
    },
    {
      id: 'chess',
      label: 'Schach',
      sideEffect: 'read',
      parse: (ctx) => (parseChessIntent(ctx.text, ctx.lastTool === 'chess') ? score(ctx.text, 0.08) : null),
      execute: async (ctx) => fromHandler('chess', await handleChess(ctx.text)),
    },
    {
      id: 'hud',
      label: 'Lage',
      sideEffect: 'write',
      parse: (ctx) => (parseHudIntent(ctx.text) ? score(ctx.text, 0.12) : null),
      execute: async (ctx) => fromHandler('hud', await handleHud(ctx.text)),
    },
    {
      id: 'trace',
      label: 'Traceroute',
      sideEffect: 'read',
      parse: (ctx) => (parseTraceIntent(ctx.text) ? score(ctx.text, 0.14) : null),
      execute: async (ctx) => fromHandler('trace', await handleTrace(ctx.text)),
    },
    {
      id: 'digest',
      label: 'Gespräch',
      sideEffect: 'write',
      parse: (ctx) => (parseDigestIntent(ctx.text) ? score(ctx.text, 0.1) : null),
      execute: async (ctx) => fromHandler('digest', await handleDigest(ctx.conversationId, ctx.text)),
    },
    {
      id: 'outlook',
      label: 'Weltlage',
      sideEffect: 'read',
      parse: (ctx) => (parseOutlookIntent(ctx.text, ctx.lastTool) ? score(ctx.text, 0.1) : null),
      execute: async (ctx) => fromHandler('outlook', await handleOutlook(ctx.text)),
    },
    {
      id: 'taxi',
      label: 'Taxi',
      sideEffect: 'read',
      parse: (ctx) => (parseTaxiIntent(ctx.text) ? score(ctx.text, 0.12) : null),
      execute: async (ctx) => fromHandler('taxi', await handleTaxi(ctx.conversationId, ctx.text)),
    },
    {
      id: 'backup',
      label: 'Hausstand',
      sideEffect: 'read',
      parse: (ctx) => (parseBackupIntent(ctx.text) ? score(ctx.text, 0.2) : null),
      execute: async (ctx) => fromHandler('backup', await handleBackup(ctx.conversationId, ctx.text)),
    },
    {
      id: 'face',
      label: 'Gesicht',
      sideEffect: 'write',
      parse: (ctx) => (parseFaceIntent(ctx.text) ? score(ctx.text, 0.22) : null),
      execute: async (ctx) => fromHandler('face', await handleFace(ctx.conversationId, ctx.text)),
    },
  ]
}

let CATALOG: Capability[] | null = null

export function capabilities(): Capability[] {
  if (!CATALOG) CATALOG = makeCatalog()
  return CATALOG
}

export function makeCtx(conversationId: string, text: string): RouteCtx {
  const s = loadSettings()
  return {
    conversationId,
    text,
    lastTool: (s.last_step_tool || '').trim(),
    lastMedium: (s.last_medium || '').trim(),
    inDrive: Boolean(s.drive_mode),
    weatherLast: weatherLast(),
    plugNames: loadPlugs().map((p) => p.name),
    lastPlace: s.last_place || '',
  }
}

export { pickRoute, pickRouteFromCtx, propose } from './route-pick'

export async function routeRegistry(conversationId: string, text: string): Promise<RouteHit | null> {
  const pending = await getPending(conversationId)
  if (pending) {
    const pendingHit = await handleTools(conversationId, text)
    if (pendingHit.handled && pendingHit.reply) return fromHandler('todo', pendingHit)
  }
  const ctx = makeCtx(conversationId, text)
  const pick = pickPolicy(propose(ctx))
  if (pick.kind === 'none') return null
  if (pick.kind === 'ask') {
    return { reply: askReply(pick.a, pick.b), lastTool: 'clarify' }
  }
  const cap = capabilities().find((c) => c.id === pick.id)
  if (!cap) return null
  const hit = await cap.execute(ctx)
  if (!hit) return null
  if (hit.retry) {
    const utterance = loadSettings().last_step_utterance || text
    if (hit.retry === 'fuel') return fromHandler('fuel', await handleFuel(conversationId, utterance))
    if (hit.retry === 'weather') return fromHandler('weather', await handleWeather(utterance))
    if (hit.retry === 'poi') return fromHandler('poi', await handlePoi(conversationId, utterance))
    if (hit.retry === 'transit') return fromHandler('transit', await handleTransit(conversationId, utterance))
  }
  return hit
}
