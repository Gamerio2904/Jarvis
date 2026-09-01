#!/usr/bin/env node
/**
 * Jarvis PC protocol server (dev + tests). On Windows, use JarvisPC.bat instead.
 */
import http from 'node:http'

const STUB_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDIBCQkJDAsMGA0NGDIhHCEyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMv/AABEIAAEAAQMBIgACEQEDEQH/xAAfAAABBQEBAQEBAQAAAAAAAAAAAQIDBAUGBwgJCgv/xAC1EAACAQMDAgQDBQUEBAAAAX0BAgMABBEFEiExQQYTUWEHInEUMoGRoQgjQrHB0f/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwD3+iiigD//2Q==',
  'base64',
)

export const lastActions = []
let rtcSession = ''

export function startJarvisPcServer(opts = {}) {
  const port = opts.port || 18790
  const token = opts.token || '123456'
  const stub = Boolean(opts.stub)
  const host = opts.host || '127.0.0.1'
  lastActions.length = 0
  rtcSession = ''

  function auth(req) {
    const h = String(req.headers['x-jarvis-token'] || '')
    const b = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
    return h === token || b === token
  }

  function readBody(req) {
    return new Promise((resolve) => {
      const chunks = []
      req.on('data', (c) => chunks.push(c))
      req.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8')
        try {
          resolve(raw ? JSON.parse(raw) : {})
        } catch {
          resolve({})
        }
      })
    })
  }

  function send(res, obj) {
    const buf = Buffer.from(JSON.stringify(obj))
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Content-Length': buf.length,
    })
    res.end(buf)
  }

  function handle(path, body) {
    if (path === '/v1/status') {
      return {
        ok: true,
        app: stub ? 'JarvisPC-stub' : 'JarvisPC-node',
        stub,
        port,
        ips: [host],
        screen: { width: 1920, height: 1080 },
        cursor: { x: 10, y: 10 },
        last: lastActions.at(-1) || 'Bereit.',
        level: stub ? 'files' : 'screen',
        capabilities: stub
          ? ['status', 'screen', 'launch', 'click', 'move', 'type', 'key', 'files', 'stream']
          : ['status', 'screen'],
        vision: 'off',
        webrtc: 'off',
      }
    }
    if (path === '/v1/screenshot') {
      lastActions.push('screenshot')
      return {
        ok: true,
        mime: 'image/jpeg',
        image: STUB_JPEG.toString('base64'),
        width: 8,
        height: 8,
        screenW: 1920,
        screenH: 1080,
      }
    }
    if (path === '/v1/input') {
      lastActions.push(`input:${String(body.kind || '')}`)
      if (!stub) return { ok: false, message: 'Echte Maus nur in JarvisPC.bat auf Windows.' }
      return {
        ok: true,
        message: body.kind === 'click' ? 'Klick gesendet.' : 'Maus bewegt.',
        sent: true,
        stub: true,
      }
    }
    if (path === '/v1/launch') {
      const q = String(body.query || '').trim()
      lastActions.push(`launch:${q}`)
      if (!q) return { ok: false, message: 'Kein Programm.' }
      if (!stub) return { ok: false, message: 'Starten nur in JarvisPC.bat auf Windows.' }
      if (/^missing-app$/i.test(q)) return { ok: false, message: `„${q}“ nicht gefunden.` }
      return { ok: true, name: q, started: true, message: `${q} Startbefehl angekommen (Stub).`, stub: true }
    }
    if (path === '/v1/files') {
      lastActions.push(`files:${String(body.op || '')}:${String(body.path || '')}`)
      if (!stub) return { ok: false, message: 'Ordner nur in JarvisPC.bat auf Windows.' }
      return {
        ok: true,
        path: String(body.path || ''),
        entries: body.op === 'list' ? ['[Ordner] Test'] : [],
        message: body.op === 'list' ? '[Ordner] Test' : `Stub ${String(body.op)}.`,
        stub: true,
      }
    }
    if (path === '/v1/webrtc' || path === '/v1/webrtc/frame') {
      const act = path === '/v1/webrtc/frame' ? 'frame' : String(body.action || (body.sdp ? 'offer' : ''))
      lastActions.push(`webrtc:${act}`)
      if (act === 'start' || act === 'offer') {
        rtcSession = `stub${Date.now().toString(36)}`
        return {
          ok: true,
          sessionId: rtcSession,
          webrtc: 'off',
          mode: 'lan-jpeg',
          ice: 'host',
          message: act === 'offer' ? 'Kein WebRTC-Peer. Live-Bilder über LAN-JPEG.' : 'Live-Sitzung (LAN-JPEG).',
          stub: true,
        }
      }
      if (act === 'frame') {
        if (!rtcSession) return { ok: false, message: 'Kein Live-Bild offen.' }
        return {
          ok: true,
          sessionId: rtcSession,
          webrtc: 'off',
          mode: 'lan-jpeg',
          frame: true,
          mime: 'image/jpeg',
          image: STUB_JPEG.toString('base64'),
          stub: true,
        }
      }
      if (act === 'hangup') {
        rtcSession = ''
        return { ok: true, webrtc: 'off' }
      }
      if (act === 'status') {
        return { ok: true, sessionId: rtcSession, webrtc: 'off', mode: rtcSession ? 'lan-jpeg' : '', alive: Boolean(rtcSession) }
      }
      return { ok: false, message: 'Unbekannte Live-Aktion.' }
    }
    if (path === '/v1/trace') {
      const host = String(body.host || '').trim()
      lastActions.push(`trace:${host}`)
      if (!host) return { ok: false, message: 'Kein Host.' }
      if (!stub) return { ok: false, message: 'Traceroute nur in JarvisPC.bat auf Windows.' }
      return {
        ok: true,
        host,
        hops: [
          { hop: 1, host: 'gateway', ip: '192.168.1.1', ms: 1 },
          { hop: 2, host, ip: host, ms: 12 },
        ],
        stub: true,
      }
    }
    return { ok: false, message: 'Unbekannter Pfad.' }
  }

  const server = http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
      send(res, { ok: true })
      return
    }
    const path = String(req.url || '/').split('?')[0]
    if (!auth(req)) {
      send(res, { ok: false, message: 'Token falsch. Den Code aus dem Jarvis-PC-Fenster eintragen.' })
      return
    }
    const body = req.method === 'POST' ? await readBody(req) : {}
    send(res, handle(path, body))
  })

  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, host, () => resolve(server))
  })
}

const isMain = /jarvis-pc\.mjs$/.test(String(process.argv[1] || ''))
if (isMain) {
  const port = Number(process.env.JARVIS_PC_PORT || 18790)
  const token = process.env.JARVIS_PC_TOKEN || '123456'
  const stub = process.argv.includes('--stub')
  const host = process.env.JARVIS_PC_HOST || '0.0.0.0'
  const server = await startJarvisPcServer({ port, token, stub, host })
  console.log(`Jarvis PC ${stub ? 'stub' : 'node'} http://${host}:${port} token=${token}`)
  server.on('error', (err) => {
    console.error(err)
    process.exit(1)
  })
}
