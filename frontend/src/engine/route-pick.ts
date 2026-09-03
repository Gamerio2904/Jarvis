import { parseTvIntent, parseTvWatch, isTvDiscover } from './tv-parse.ts'
import { parseFilmIntent } from './film-parse.ts'
import { parseFanIntent } from './fan-parse.ts'
import { parsePlugIntent } from './plug-parse.ts'
import { parseHereIntent } from './here-parse.ts'
import { parseFuelIntent } from './fuel-parse.ts'
import { parsePoiIntent } from './poi-parse.ts'
import { parseTransitIntent } from './transit-parse.ts'
import { parseDriveIntent } from './drive-parse.ts'
import { parseSpotifyIntent } from './spotify-parse.ts'
import { parseDeviceIntent } from './device-parse.ts'
import { parsePcIntent } from './pc-parse.ts'
import { isEyeGround, isPcGround, parseGroundIntent } from './ground-parse.ts'
import { parsePlaceNav, parsePlaceRecall, parsePlaceWrite } from './places-parse.ts'
import { isIdentityAsk, isMemoryRecall, isMemoryWrite, VERGISS, VERGISS_ALL } from './memory-parse.ts'
import { parseShopIntent } from './shopping-parse.ts'
import { parseBirthdayIntent } from './birthday-parse.ts'
import { parseHomeIntent } from './home-parse.ts'
import { parseLeaveIntent } from './leave-parse.ts'
import { isBriefAsk } from './brief-parse.ts'
import { parseHolidayIntent } from './holiday-parse.ts'
import { parseCalendarIntent } from './calendar-parse.ts'
import { parseAlarmIntent } from './alarm-parse.ts'
import { parseTimerIntent } from './timer-parse.ts'
import { parseReminderIntent } from './remind-parse.ts'
import { parseToolIntent } from './tools-parse.ts'
import { parseEyeIntent } from './eye-parse.ts'
import { parseDocIntent } from './doc-parse.ts'
import { parseWeatherFollowup, parseWeatherIntent } from './weather-parse.ts'
import { parseNewsIntent } from './news-parse.ts'
import { parseChatSearch } from './search-chat-parse.ts'
import { parseWarnIntent } from './warn.ts'
import { parseFerienIntent } from './ferien.ts'
import { parseFxIntent } from './fx.ts'
import { parseFoodIntent } from './food.ts'
import { parseLibraryIntent } from './library.ts'
import { parseSportIntent } from './sport.ts'
import { parseSkyIntent } from './sky.ts'
import { parseNatureIntent } from './nature.ts'
import { parseFlightsIntent } from './flights.ts'
import { parseLawIntent } from './law.ts'
import { parseHaushaltIntent } from './haushalt.ts'
import { parseSensorsIntent } from './sensors.ts'
import { parseChessIntent } from './chess.ts'
import { parseHudIntent } from './hud-parse.ts'
import { parseTraceIntent } from './trace-parse.ts'
import { parseDigestIntent } from './digest-parse.ts'
import { parseOutlookIntent } from './outlook-parse.ts'
import { parseTaxiIntent } from './taxi-parse.ts'
import { parseBackupIntent } from './backup.ts'
import { parseFaceIntent } from './face-parse.ts'
import { parseWontIntent } from './wont-parse.ts'
import { parseBlitzerIntent } from './blitzer-parse.ts'
import { parseFolderIntent } from './folder-parse.ts'
import { parseWatchPriceIntent } from './watch-price-parse.ts'
import { parseAmazonMusicIntent } from './amazon-parse.ts'
import { parseRecallIntent } from './recall-parse.ts'
import { parseAppIntent } from './app-parse.ts'
import { applyConflicts } from './conflicts.ts'
import { isFollowish, parserScore, pickPolicy, withCost, withPrior } from './policy.ts'
import type { Candidate, RouteCtx, SideEffect } from './route-types.ts'
import { isPersonaAsk } from './guards.ts'
import { promoteSplitPart, splitIntents } from './split-intents.ts'

function score(text: string, extra = 0): number {
  return parserScore(text, extra)
}

type Parser = (ctx: RouteCtx) => number | null

const PARSERS: Array<{ id: string; sideEffect: SideEffect; parse: Parser }> = [
  { id: 'wont', sideEffect: 'read', parse: (ctx) => (parseWontIntent(ctx.text) ? score(ctx.text, 0.4) : null) },
  { id: 'identity', sideEffect: 'read', parse: (ctx) => (isPersonaAsk(ctx.text) ? score(ctx.text, 0.45) : null) },
  { id: 'tv', sideEffect: 'device', parse: (ctx) => (parseTvWatch(ctx.text) || parseTvIntent(ctx.text, ctx.lastTool === 'tv') || isTvDiscover(ctx.text) ? score(ctx.text, 0.06) : null) },
  { id: 'film', sideEffect: 'read', parse: (ctx) => (parseFilmIntent(ctx.text) ? score(ctx.text, 0.04) : null) },
  { id: 'fan', sideEffect: 'device', parse: (ctx) => (parseFanIntent(ctx.text, ctx.lastTool === 'fan') ? score(ctx.text, 0.05) : null) },
  {
    id: 'plug',
    sideEffect: 'device',
    parse: (ctx) =>
      parsePlugIntent(ctx.text, ctx.plugNames || [], ctx.lastTool === 'plug') ? score(ctx.text, 0.05) : null,
  },
  { id: 'here', sideEffect: 'read', parse: (ctx) => (parseHereIntent(ctx.text, ctx.lastTool) ? score(ctx.text, 0.05) : null) },
  { id: 'fuel', sideEffect: 'read', parse: (ctx) => (parseFuelIntent(ctx.text) ? score(ctx.text, 0.08) : null) },
  { id: 'poi', sideEffect: 'read', parse: (ctx) => (parsePoiIntent(ctx.text) ? score(ctx.text) : null) },
  { id: 'transit', sideEffect: 'read', parse: (ctx) => (parseTransitIntent(ctx.text) ? score(ctx.text, 0.04) : null) },
  {
    id: 'drive',
    sideEffect: 'device',
    parse: (ctx) => (parseDriveIntent(ctx.text, ctx.inDrive) || parseSpotifyIntent(ctx.text) ? score(ctx.text, 0.04) : null),
  },
  { id: 'device', sideEffect: 'device', parse: (ctx) => (parseDeviceIntent(ctx.text) ? score(ctx.text, 0.04) : null) },
  {
    id: 'pc',
    sideEffect: 'device',
    parse: (ctx) =>
      parsePcIntent(ctx.text) || isPcGround(parseGroundIntent(ctx.text)) ? score(ctx.text, 0.05) : null,
  },
  {
    id: 'maps',
    sideEffect: 'read',
    parse: (ctx) =>
      parsePlaceWrite(ctx.text) || parsePlaceRecall(ctx.text) || parsePlaceNav(ctx.text) ? score(ctx.text) : null,
  },
  {
    id: 'memory',
    sideEffect: 'write',
    parse: (ctx) => {
      const t = ctx.text
      return VERGISS_ALL.test(t) || VERGISS.test(t) || isMemoryWrite(t) || isMemoryRecall(t) || isIdentityAsk(t)
        ? score(t, 0.04)
        : null
    },
  },
  { id: 'shopping', sideEffect: 'write', parse: (ctx) => (parseShopIntent(ctx.text) ? score(ctx.text) : null) },
  { id: 'birthday', sideEffect: 'write', parse: (ctx) => (parseBirthdayIntent(ctx.text) ? score(ctx.text) : null) },
  { id: 'home', sideEffect: 'write', parse: (ctx) => (parseHomeIntent(ctx.text) ? score(ctx.text) : null) },
  { id: 'leave', sideEffect: 'read', parse: (ctx) => (parseLeaveIntent(ctx.text) ? score(ctx.text) : null) },
  { id: 'brief', sideEffect: 'read', parse: (ctx) => (isBriefAsk(ctx.text) ? score(ctx.text, 0.08) : null) },
  { id: 'holiday', sideEffect: 'read', parse: (ctx) => (parseHolidayIntent(ctx.text) ? score(ctx.text, 0.04) : null) },
  { id: 'calendar', sideEffect: 'write', parse: (ctx) => (parseCalendarIntent(ctx.text) ? score(ctx.text, 0.04) : null) },
  { id: 'alarm', sideEffect: 'write', parse: (ctx) => (parseAlarmIntent(ctx.text) ? score(ctx.text, 0.04) : null) },
  { id: 'timer', sideEffect: 'write', parse: (ctx) => (parseTimerIntent(ctx.text) ? score(ctx.text, 0.04) : null) },
  { id: 'reminder', sideEffect: 'write', parse: (ctx) => (parseReminderIntent(ctx.text) ? score(ctx.text) : null) },
  { id: 'todo', sideEffect: 'write', parse: (ctx) => (parseToolIntent(ctx.text) ? score(ctx.text) : null) },
  {
    id: 'eye',
    sideEffect: 'read',
    parse: (ctx) =>
      parseEyeIntent(ctx.text) || isEyeGround(parseGroundIntent(ctx.text)) ? score(ctx.text) : null,
  },
  {
    id: 'doc',
    sideEffect: 'read',
    parse: (ctx) => (parseDocIntent(ctx.text) ? score(ctx.text, 0.22) : null),
  },
  {
    id: 'weather',
    sideEffect: 'read',
    parse: (ctx) =>
      parseWeatherIntent(ctx.text) || parseWeatherFollowup(ctx.text, ctx.weatherLast ?? null)
        ? score(ctx.text, 0.05)
        : null,
  },
  { id: 'news', sideEffect: 'read', parse: (ctx) => (parseNewsIntent(ctx.text) ? score(ctx.text) : null) },
  { id: 'search', sideEffect: 'read', parse: (ctx) => (parseChatSearch(ctx.text) ? score(ctx.text) : null) },
  { id: 'warn', sideEffect: 'read', parse: (ctx) => (parseWarnIntent(ctx.text) ? score(ctx.text, 0.08) : null) },
  { id: 'blitzer', sideEffect: 'read', parse: (ctx) => (parseBlitzerIntent(ctx.text) ? score(ctx.text, ctx.inDrive ? 0.22 : 0.12) : null) },
  { id: 'chat-folder', sideEffect: 'write', parse: (ctx) => (parseFolderIntent(ctx.text) ? score(ctx.text, 0.18) : null) },
  { id: 'watch-price', sideEffect: 'write', parse: (ctx) => (parseWatchPriceIntent(ctx.text) ? score(ctx.text, 0.16) : null) },
  { id: 'amazon', sideEffect: 'device', parse: (ctx) => (parseAmazonMusicIntent(ctx.text) ? score(ctx.text, 0.14) : null) },
  { id: 'recall', sideEffect: 'read', parse: (ctx) => (parseRecallIntent(ctx.text) ? score(ctx.text, 0.1) : null) },
  { id: 'ferien', sideEffect: 'read', parse: (ctx) => (parseFerienIntent(ctx.text, ctx.lastPlace) ? score(ctx.text, 0.08) : null) },
  { id: 'fx', sideEffect: 'read', parse: (ctx) => (parseFxIntent(ctx.text) ? score(ctx.text, 0.08) : null) },
  { id: 'food', sideEffect: 'read', parse: (ctx) => (parseFoodIntent(ctx.text) ? score(ctx.text, 0.06) : null) },
  { id: 'library', sideEffect: 'read', parse: (ctx) => (parseLibraryIntent(ctx.text) ? score(ctx.text, 0.06) : null) },
  { id: 'sport', sideEffect: 'read', parse: (ctx) => (parseSportIntent(ctx.text) ? score(ctx.text, 0.08) : null) },
  { id: 'sky', sideEffect: 'read', parse: (ctx) => (parseSkyIntent(ctx.text) ? score(ctx.text, 0.08) : null) },
  { id: 'nature', sideEffect: 'read', parse: (ctx) => (parseNatureIntent(ctx.text) ? score(ctx.text, 0.06) : null) },
  { id: 'flights', sideEffect: 'read', parse: (ctx) => (parseFlightsIntent(ctx.text) ? score(ctx.text, 0.06) : null) },
  { id: 'law', sideEffect: 'read', parse: (ctx) => (parseLawIntent(ctx.text) ? score(ctx.text, 0.05) : null) },
  { id: 'haushalt', sideEffect: 'read', parse: (ctx) => (parseHaushaltIntent(ctx.text) ? score(ctx.text, 0.05) : null) },
  { id: 'sensors', sideEffect: 'read', parse: (ctx) => (parseSensorsIntent(ctx.text) ? score(ctx.text, 0.05) : null) },
  {
    id: 'chess',
    sideEffect: 'read',
    parse: (ctx) => (parseChessIntent(ctx.text, ctx.lastTool === 'chess') ? score(ctx.text, 0.08) : null),
  },
  { id: 'hud', sideEffect: 'write', parse: (ctx) => (parseHudIntent(ctx.text) ? score(ctx.text, 0.12) : null) },
  { id: 'trace', sideEffect: 'read', parse: (ctx) => (parseTraceIntent(ctx.text) ? score(ctx.text, 0.14) : null) },
  { id: 'digest', sideEffect: 'write', parse: (ctx) => (parseDigestIntent(ctx.text) ? score(ctx.text, 0.1) : null) },
  { id: 'outlook', sideEffect: 'read', parse: (ctx) => (parseOutlookIntent(ctx.text, ctx.lastTool) ? score(ctx.text, 0.1) : null) },
  { id: 'taxi', sideEffect: 'read', parse: (ctx) => (parseTaxiIntent(ctx.text) ? score(ctx.text, 0.12) : null) },
  { id: 'backup', sideEffect: 'read', parse: (ctx) => (parseBackupIntent(ctx.text) ? score(ctx.text, 0.2) : null) },
  { id: 'face', sideEffect: 'write', parse: (ctx) => (parseFaceIntent(ctx.text) ? score(ctx.text, 0.22) : null) },
  { id: 'app', sideEffect: 'write', parse: (ctx) => (parseAppIntent(ctx.text) ? score(ctx.text, 0.28) : null) },
]

export function propose(ctx: RouteCtx): Candidate[] {
  const raw: Candidate[] = []
  for (const cap of PARSERS) {
    try {
      const n = cap.parse(ctx)
      if (n != null) raw.push({ id: cap.id, score: n, sideEffect: cap.sideEffect })
    } catch {
      /* ein Parser darf Routing nicht kippen */
    }
  }
  return withCost(withPrior(applyConflicts(raw, ctx.text, ctx), ctx.lastTool, isFollowish(ctx.text)))
}

function pickOneFromCtx(ctx: RouteCtx): string | null {
  const pick = pickPolicy(propose(ctx))
  if (pick.kind === 'run') return pick.id
  if (pick.kind === 'ask') return pick.a
  return null
}

export function pickRouteFromCtx(ctx: RouteCtx): string | null {
  const whole = pickOneFromCtx(ctx)
  if (whole === 'wont') return 'wont'
  const parts = splitIntents(ctx.text)
  if (parts.length > 1) {
    let last: string | null = null
    for (const raw of parts) {
      const id = pickOneFromCtx({ ...ctx, text: promoteSplitPart(raw) })
      if (id) last = id
    }
    if (last) return last
  }
  return whole
}

export function pickRoute(text: string): string | null {
  return pickRouteFromCtx({
    conversationId: 'test',
    text,
    lastTool: '',
    lastMedium: '',
    inDrive: false,
  })
}
