import { publishGlance } from '../native/notify.ts'
import { listMemory, loadSettings } from './store.ts'
import { readGlanceSnap } from './glance-snap.ts'

export async function syncGlance(): Promise<void> {
  try {
    const snap = await readGlanceSnap()
    const home = (await listMemory('place')).find((m) => m.key === 'zuhause' && m.value.trim())
    const weather =
      loadSettings().last_weather_line.trim() ||
      (home ? 'Route nach Hause im Chat' : snap.weather)
    await publishGlance({ next: snap.next, weather })
  } catch {
    /* Widget ist optional */
  }
}
