import { loadSettings } from '../store.ts'
import { handlePlug } from '../plug.ts'
import { handleTv } from '../tv.ts'
import { handleFilm } from '../film.ts'
import { handleFan } from '../fan.ts'
import { handleHere } from '../here.ts'
import { handleFuel } from '../fuel.ts'
import { handlePoi } from '../poi.ts'
import { handleTransit } from '../transit.ts'
import { handleDrive } from '../drive.ts'
import { handleDevice } from '../device.ts'
import { handlePc } from '../pc.ts'
import { handlePlaces } from '../places.ts'
import { handleMemory } from '../memory.ts'
import { handleShopping } from '../shopping.ts'
import { handleBirthday } from '../birthday.ts'
import { handleHome } from '../home.ts'
import { handleLeave } from '../leave.ts'
import { handleBrief } from '../brief.ts'
import { handleHoliday } from '../holiday.ts'
import { handleCalendar } from '../calendar.ts'
import { handleAlarms } from '../alarms.ts'
import { handleTimers } from '../timers.ts'
import { handleReminders } from '../reminders.ts'
import { handleTools, type ToolMeta } from '../tools.ts'
import { handleEyeAsk } from '../eye.ts'
import { handleDoc } from '../doc.ts'
import type { WeatherLast } from '../weather-parse.ts'
import { handleWeather } from '../weather.ts'
import { handleNews } from '../news.ts'
import { handleChatSearch } from '../search-chat.ts'
import type { ResearchMeta } from '../research-parse.ts'
import type { RouteCtx } from '../route-types.ts'
import { handleWarn } from '../warn.ts'
import { handleFerien } from '../ferien.ts'
import { handleFx } from '../fx.ts'
import { handleFood } from '../food.ts'
import { handleLibrary } from '../library.ts'
import { handleSport } from '../sport.ts'
import { handleSky } from '../sky.ts'
import { handleNature } from '../nature.ts'
import { handleFlights } from '../flights.ts'
import { handleLaw } from '../law.ts'
import { handleHaushalt } from '../haushalt.ts'
import { handleSensors } from '../sensors.ts'
import { handleChess } from '../chess.ts'
import { handleHud } from '../hud.ts'
import { handleTrace } from '../trace.ts'
import { handleDigest } from '../digest.ts'
import { handleOutlook } from '../outlook.ts'
import { handleTaxi } from '../taxi.ts'
import { handleBackup } from '../backup.ts'
import { handleFace } from '../face.ts'
import { handleWont } from '../wont-parse.ts'
import { handleBlitzer } from '../blitzer.ts'
import { handleFolder } from '../folders.ts'
import { handleWatchPrice } from '../watch-price.ts'
import { handleAmazonMusic } from '../amazon.ts'
import { handleRecall } from '../recall.ts'
import { handleApp } from '../app.ts'
import { handleTeach, handlePack } from '../knowledge.ts'
import { handleDesk } from '../desk.ts'
import type { RouteHit } from './types.ts'

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

export async function fromHandler(
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

export { weatherLast }

export type AgentExecutor = (ctx: RouteCtx) => Promise<RouteHit | null>

export const AGENT_EXECUTORS: Record<string, AgentExecutor> = {
  wont: async (ctx) => fromHandler('wont', handleWont(ctx.text)),
  tv: async (ctx) => fromHandler('tv', await handleTv(ctx.text)),
  film: async (ctx) => fromHandler('film', await handleFilm(ctx.conversationId, ctx.text)),
  fan: async (ctx) => fromHandler('fan', await handleFan(ctx.text)),
  plug: async (ctx) => fromHandler('plug', await handlePlug(ctx.text)),
  here: async (ctx) => fromHandler('here', await handleHere(ctx.text)),
  fuel: async (ctx) => fromHandler('fuel', await handleFuel(ctx.conversationId, ctx.text)),
  poi: async (ctx) => fromHandler('poi', await handlePoi(ctx.conversationId, ctx.text)),
  transit: async (ctx) => fromHandler('transit', await handleTransit(ctx.conversationId, ctx.text)),
  drive: async (ctx) => fromHandler('drive', await handleDrive(ctx.conversationId, ctx.text)),
  device: async (ctx) => fromHandler('device', await handleDevice(ctx.conversationId, ctx.text)),
  pc: async (ctx) => fromHandler('pc', await handlePc(ctx.conversationId, ctx.text)),
  maps: async (ctx) => fromHandler('maps', await handlePlaces(ctx.conversationId, ctx.text)),
  teach: async (ctx) => fromHandler('teach', await handleTeach(ctx.conversationId, ctx.text)),
  pack: async (ctx) => fromHandler('pack', await handlePack(ctx.conversationId, ctx.text)),
  memory: async (ctx) => fromHandler('memory', await handleMemory(ctx.conversationId, ctx.text)),
  shopping: async (ctx) => fromHandler('shopping', await handleShopping(ctx.conversationId, ctx.text)),
  birthday: async (ctx) => fromHandler('birthday', await handleBirthday(ctx.conversationId, ctx.text)),
  home: async (ctx) => fromHandler('home', await handleHome(ctx.conversationId, ctx.text)),
  leave: async (ctx) => fromHandler('leave', await handleLeave(ctx.conversationId, ctx.text)),
  brief: async () => fromHandler('brief', await handleBrief()),
  holiday: async (ctx) => fromHandler('holiday', await handleHoliday(ctx.text)),
  calendar: async (ctx) => fromHandler('calendar', await handleCalendar(ctx.conversationId, ctx.text)),
  alarm: async (ctx) => fromHandler('alarm', await handleAlarms(ctx.conversationId, ctx.text)),
  timer: async (ctx) => fromHandler('timer', await handleTimers(ctx.conversationId, ctx.text)),
  reminder: async (ctx) => fromHandler('reminder', await handleReminders(ctx.conversationId, ctx.text)),
  todo: async (ctx) => fromHandler('todo', await handleTools(ctx.conversationId, ctx.text)),
  desk: async (ctx) => fromHandler('desk', await handleDesk(ctx.conversationId, ctx.text)),
  eye: async (ctx) => fromHandler('eye', await handleEyeAsk(ctx.text)),
  doc: async (ctx) => fromHandler('doc', await handleDoc(ctx.conversationId, ctx.text)),
  weather: async (ctx) => fromHandler('weather', await handleWeather(ctx.text)),
  news: async (ctx) => fromHandler('news', await handleNews(ctx.text)),
  search: async (ctx) => fromHandler('search', await handleChatSearch(ctx.text)),
  warn: async (ctx) => fromHandler('warn', await handleWarn(ctx.text)),
  ferien: async (ctx) => fromHandler('ferien', await handleFerien(ctx.text)),
  fx: async (ctx) => fromHandler('fx', await handleFx(ctx.text)),
  food: async (ctx) => fromHandler('food', await handleFood(ctx.text)),
  library: async (ctx) => fromHandler('library', await handleLibrary(ctx.text)),
  sport: async (ctx) => fromHandler('sport', await handleSport(ctx.text)),
  sky: async (ctx) => fromHandler('sky', await handleSky(ctx.text)),
  nature: async (ctx) => fromHandler('nature', await handleNature(ctx.text)),
  flights: async () => fromHandler('flights', await handleFlights()),
  law: async (ctx) => fromHandler('law', await handleLaw(ctx.text)),
  haushalt: async (ctx) => fromHandler('haushalt', await handleHaushalt(ctx.text)),
  sensors: async (ctx) => fromHandler('sensors', await handleSensors(ctx.text)),
  chess: async (ctx) => fromHandler('chess', await handleChess(ctx.text)),
  hud: async (ctx) => fromHandler('hud', await handleHud(ctx.text)),
  trace: async (ctx) => fromHandler('trace', await handleTrace(ctx.text)),
  digest: async (ctx) => fromHandler('digest', await handleDigest(ctx.conversationId, ctx.text)),
  outlook: async (ctx) => fromHandler('outlook', await handleOutlook(ctx.text)),
  taxi: async (ctx) => fromHandler('taxi', await handleTaxi(ctx.conversationId, ctx.text)),
  backup: async (ctx) => fromHandler('backup', await handleBackup(ctx.conversationId, ctx.text)),
  face: async (ctx) => fromHandler('face', await handleFace(ctx.conversationId, ctx.text)),
  blitzer: async (ctx) => fromHandler('blitzer', await handleBlitzer(ctx.text)),
  'chat-folder': async (ctx) => fromHandler('chat-folder', await handleFolder(ctx.conversationId, ctx.text)),
  'watch-price': async (ctx) => fromHandler('watch-price', await handleWatchPrice(ctx.text)),
  amazon: async (ctx) => fromHandler('amazon', await handleAmazonMusic(ctx.text)),
  recall: async (ctx) => fromHandler('recall', await handleRecall(ctx.text)),
  app: async (ctx) => fromHandler('app', await handleApp(ctx.conversationId, ctx.text)),
}
