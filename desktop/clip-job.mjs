/**
 * Schnitt auf dem PC. Titel landen nur in der ASS-Datei, nie in der Kommandozeile.
 * Aufruf: node clip-job.mjs   (JSON auf stdin)
 *         node clip-job.mjs --worker <job.json>
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const JOB_MS = 12 * 60 * 1000
const TTL_MS = 30 * 60 * 1000
const MAX_SOURCE_S = 45 * 60

export function videoRoot() {
  return path.join(os.homedir(), 'Videos', 'Jarvis')
}

export function youtubeId(raw) {
  try {
    const url = new URL(String(raw))
    const host = url.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '')
    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0] || ''
      return /^[\w-]{6,}$/.test(id) ? id : ''
    }
    if (host !== 'youtube.com') return ''
    if (url.pathname === '/watch') {
      const id = url.searchParams.get('v') || ''
      return /^[\w-]{6,}$/.test(id) ? id : ''
    }
    const shorts = /^\/shorts\/([\w-]{6,})/.exec(url.pathname)
    return shorts ? shorts[1] : ''
  } catch {
    return ''
  }
}

export function canonicalUrl(raw) {
  const id = youtubeId(raw)
  return id ? `https://www.youtube.com/watch?v=${id}` : ''
}

function toolError(name) {
  return { ok: false, error: 'tool', tool: name, message: `${name} fehlt.` }
}

/**
 * @param {string} cmd
 * @param {string[]} args
 * @param {{ cwd?: string, timeoutMs?: number }} [opts]
 * @returns {Promise<{ code: number, out: string, err: string }>}
 */
function run(cmd, args, opts = {}) {
  const cwd = opts.cwd
  const timeoutMs = opts.timeoutMs ?? 60_000
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, windowsHide: true })
    let out = ''
    let err = ''
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      resolve({ code: -1, out, err: `${err}\ntimeout` })
    }, timeoutMs)
    child.stdout.on('data', (buf) => {
      out += buf
    })
    child.stderr.on('data', (buf) => {
      err += buf
    })
    child.on('error', (error) => {
      clearTimeout(timer)
      const code = /** @type {{ code?: string, message?: string }} */ (error).code
      const message = /** @type {{ message?: string }} */ (error).message
      resolve({ code: -1, out, err: code === 'ENOENT' ? 'ENOENT' : String(message || error) })
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ code: code ?? -1, out, err })
    })
  })
}

async function toolOnPath(name) {
  const which = process.platform === 'win32' ? 'where' : 'which'
  const found = await run(which, [name], { timeoutMs: 4000 })
  return found.code === 0 && !found.err.includes('ENOENT')
}

export function extractWords(json3) {
  let data
  try {
    data = typeof json3 === 'string' ? JSON.parse(json3) : json3
  } catch {
    return []
  }
  const events = Array.isArray(data?.events) ? data.events : []
  const words = []
  for (const event of events) {
    const start = Number(event.tStartMs) / 1000
    const dur = Number(event.dDurationMs) / 1000
    const segs = Array.isArray(event.segs) ? event.segs : []
    const pieces = segs
      .map((seg) => String(seg.utf8 || '').replace(/\n/g, ' ').trim())
      .filter((text) => text && text !== '\n')
    if (!pieces.length || !Number.isFinite(start)) continue
    const hasOffset = segs.some((seg) => Number.isFinite(seg.tOffsetMs))
    if (hasOffset) {
      segs.forEach((seg, i) => {
        const text = String(seg.utf8 || '').replace(/\n/g, ' ').trim()
        if (!text) return
        const t = start + (Number(seg.tOffsetMs) || 0) / 1000
        const next = segs[i + 1]
        const end = next && Number.isFinite(next.tOffsetMs) ? start + Number(next.tOffsetMs) / 1000 : start + (dur || 0.4)
        words.push({ t, d: Math.max(0.05, end - t), w: text })
      })
    } else {
      const slice = (dur || pieces.length * 0.4) / pieces.length
      pieces.forEach((text, i) => {
        words.push({ t: start + i * slice, d: slice, w: text })
      })
    }
  }
  return words.filter((word) => Number.isFinite(word.t) && word.w)
}

export function extractVttCues(vtt) {
  const lines = String(vtt || '').split(/\r?\n/)
  const words = []
  for (let i = 0; i < lines.length; i += 1) {
    const stamp = /(\d+):(\d+):(\d+)[.,](\d+)\s+-->\s+(\d+):(\d+):(\d+)[.,](\d+)/.exec(lines[i])
    if (!stamp) continue
    const start = Number(stamp[1]) * 3600 + Number(stamp[2]) * 60 + Number(stamp[3]) + Number(stamp[4]) / 1000
    const end = Number(stamp[5]) * 3600 + Number(stamp[6]) * 60 + Number(stamp[7]) + Number(stamp[8]) / 1000
    const text = []
    for (let j = i + 1; j < lines.length && lines[j].trim(); j += 1) text.push(lines[j].trim())
    const cue = text.join(' ').replace(/<[^>]+>/g, '').trim()
    if (cue) words.push({ t: start, d: Math.max(0.05, end - start), w: cue })
  }
  return words
}

function assTime(sec) {
  const cs = Math.max(0, Math.round(sec * 100))
  const h = Math.floor(cs / 360000)
  const m = Math.floor((cs % 360000) / 6000)
  const s = Math.floor((cs % 6000) / 100)
  const c = cs % 100
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(c).padStart(2, '0')}`
}

function assText(value) {
  return String(value || '')
    .replace(/[{}\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
}

export function buildAss({ theme, pieces, duration }) {
  const head = [
    '[Script Info]',
    'ScriptType: v4.00+',
    'PlayResX: 1080',
    'PlayResY: 1920',
    'WrapStyle: 0',
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    'Style: Top,Arial,64,&H0000FF00,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,6,0,8,40,40,36,1',
    'Style: Show,Arial,72,&H0000FFFF,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,6,0,8,40,40,110,1',
    'Style: Sub,Arial,78,&H000000FF,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,6,0,8,40,40,190,1',
    'Style: Item1,Arial,54,&H00FFFF00,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,4,0,7,70,40,280,1',
    'Style: Item2,Arial,54,&H00FF00FF,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,4,0,7,70,40,350,1',
    'Style: Item3,Arial,54,&H0000FFFF,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,4,0,7,70,40,420,1',
    'Style: Word,Arial,72,&H00FFFFFF,&H000000FF,&H00000000,&H64000000,-1,0,0,0,100,100,0,0,1,8,0,2,40,40,700,1',
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  ]
  const end = assTime(duration)
  const lines = [
    `Dialogue: 0,0:00:00.00,${end},Top,,0,0,0,,${assText('Top ' + pieces.length)}`,
    `Dialogue: 0,0:00:00.00,${end},Show,,0,0,0,,${assText(theme || 'Highlights')}`,
    `Dialogue: 0,0:00:00.00,${end},Sub,,0,0,0,,${assText('Highlights')}`,
  ]
  let cursor = 0
  pieces.forEach((piece, index) => {
    const len = Math.max(0.1, piece.duration || 0)
    const from = assTime(cursor)
    lines.push(`Dialogue: 0,${from},${end},Item${index + 1},,0,0,0,,${assText(`${index + 1}. ${piece.title}`)}`)
    for (const word of piece.words || []) {
      const w0 = cursor + Number(word.t)
      const w1 = w0 + Math.max(0.08, Number(word.d) || 0.2)
      lines.push(`Dialogue: 0,${assTime(w0)},${assTime(w1)},Word,,0,0,0,,${assText(word.w)}`)
    }
    cursor += len
  })
  return `${head.join('\n')}\n${lines.join('\n')}\n`
}

function workDir(root) {
  return path.join(root, 'work')
}

function readCurrent(root) {
  try {
    return JSON.parse(fs.readFileSync(path.join(workDir(root), 'current.json'), 'utf8'))
  } catch {
    return null
  }
}

function writeCurrent(root, job) {
  fs.mkdirSync(workDir(root), { recursive: true })
  fs.writeFileSync(path.join(workDir(root), 'current.json'), JSON.stringify(job))
}

function freshId() {
  return `c${Date.now().toString(36)}`
}

async function ensureTools() {
  if (!(await toolOnPath('ffmpeg'))) return toolError('ffmpeg')
  const filters = await run('ffmpeg', ['-hide_banner', '-filters'], { timeoutMs: 8000 })
  if (!/\bass\s/.test(filters.out)) return toolError('libass')
  return null
}

async function probeOne(url, dir) {
  const id = youtubeId(url)
  if (!id) return { ok: false, message: 'Nur YouTube-Links.' }
  if (!(await toolOnPath('yt-dlp'))) return toolError('yt-dlp')
  fs.mkdirSync(dir, { recursive: true })
  const args = [
    '-J',
    '--skip-download',
    '--write-auto-sub',
    '--write-subs',
    '--sub-langs',
    'de.*,en.*',
    '--sub-format',
    'json3',
    '--no-playlist',
    '--no-warnings',
    '-o',
    path.join(dir, '%(id)s'),
    canonicalUrl(url),
  ]
  const meta = await run('yt-dlp', args, { timeoutMs: 40_000 })
  if (meta.err === 'ENOENT' || (meta.code === -1 && String(meta.err).includes('ENOENT'))) return toolError('yt-dlp')
  let info = null
  try {
    info = JSON.parse(meta.out)
  } catch {
    return { ok: false, message: 'YouTube hat keine Metadaten geliefert.' }
  }
  const duration = Number(info.duration) || 0
  if (duration > MAX_SOURCE_S) return { ok: false, error: 'long', message: 'Die Quelle ist länger als 45 Minuten.' }
  const json3 = fs.readdirSync(dir).find((name) => name.startsWith(id) && name.endsWith('.json3'))
  let words = []
  let wordLevel = true
  if (json3) words = extractWords(fs.readFileSync(path.join(dir, json3), 'utf8'))
  if (!words.length) {
    const vttRun = await run(
      'yt-dlp',
      ['--skip-download', '--write-auto-sub', '--sub-langs', 'de.*,en.*', '--convert-subs', 'vtt', '--no-playlist', '-o', path.join(dir, '%(id)s'), canonicalUrl(url)],
      { timeoutMs: 40_000 },
    )
    const vtt = fs.readdirSync(dir).find((name) => name.startsWith(id) && name.endsWith('.vtt'))
    if (vtt) {
      words = extractVttCues(fs.readFileSync(path.join(dir, vtt), 'utf8'))
      wordLevel = false
    }
    if (vttRun.err === 'ENOENT') return toolError('yt-dlp')
  }
  if (!words.length) return { ok: false, error: 'nosubs', message: 'Dazu fehlen Wortzeiten.' }
  return {
    ok: true,
    id,
    url: canonicalUrl(url),
    title: String(info.title || 'Highlights').slice(0, 80),
    duration,
    wordLevel,
    words: words.slice(0, 8000).map((word) => [Number(word.t.toFixed(2)), Number(word.d.toFixed(2)), word.w.slice(0, 80)]),
  }
}

async function grabFrame(url, at, dest) {
  const start = Math.max(0, at)
  const end = start + 3
  const media = `${dest}.mp4`
  const got = await run(
    'yt-dlp',
    [
      '-f',
      'bv*[height<=720]+ba/b[height<=720]/b',
      '--download-sections',
      `*${start.toFixed(2)}-${end.toFixed(2)}`,
      '--force-keyframes-at-cuts',
      '--no-playlist',
      '-o',
      media,
      canonicalUrl(url),
    ],
    { timeoutMs: 90_000 },
  )
  if (got.err === 'ENOENT') return toolError('yt-dlp')
  if (got.code !== 0 || !fs.existsSync(media)) return { ok: false, message: 'Standbild nicht geladen.' }
  const frame = await run(
    'ffmpeg',
    ['-y', '-ss', '0.4', '-i', media, '-frames:v', '1', '-vf', 'scale=480:-1', '-q:v', '8', dest],
    { timeoutMs: 20_000 },
  )
  if (frame.err === 'ENOENT') return toolError('ffmpeg')
  if (!fs.existsSync(dest)) return { ok: false, message: 'Standbild leer.' }
  let bytes = fs.readFileSync(dest)
  if (bytes.length > 200_000) {
    await run('ffmpeg', ['-y', '-i', dest, '-vf', 'scale=320:-1', '-q:v', '12', `${dest}.small.jpg`], { timeoutMs: 15_000 })
    if (fs.existsSync(`${dest}.small.jpg`)) bytes = fs.readFileSync(`${dest}.small.jpg`)
  }
  return { ok: true, image: bytes.toString('base64'), mime: 'image/jpeg' }
}

async function downloadSection(url, start, end, dest) {
  const got = await run(
    'yt-dlp',
    [
      '-f',
      'bv*[height<=720]+ba/b[height<=720]/b',
      '--download-sections',
      `*${start.toFixed(2)}-${end.toFixed(2)}`,
      '--force-keyframes-at-cuts',
      '--no-playlist',
      '-o',
      dest,
      canonicalUrl(url),
    ],
    { timeoutMs: 180_000 },
  )
  if (got.err === 'ENOENT') return toolError('yt-dlp')
  if (got.code !== 0 || !fs.existsSync(dest)) return { ok: false, message: 'Abschnitt nicht geladen.' }
  return { ok: true }
}

async function stylePieces(pieces, assPath, outPath) {
  const dir = path.dirname(assPath)
  const list = path.join(dir, 'list.txt')
  const listPath = (file) => file.replace(/\\/g, '/').replace(/'/g, "'\\''")
  fs.writeFileSync(list, pieces.map((piece) => `file '${listPath(piece.file)}'`).join('\n'))
  const joined = path.join(dir, 'joined.mp4')
  const concat = await run(
    'ffmpeg',
    ['-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', joined],
    { cwd: dir, timeoutMs: 60_000 },
  )
  if (concat.code !== 0) return { ok: false, message: 'Zusammensetzen fehlgeschlagen.' }
  const styled = await run(
    'ffmpeg',
    [
      '-y',
      '-i',
      joined,
      '-filter_complex',
      '[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=24[bg];[0:v]scale=1080:608:force_original_aspect_ratio=decrease,pad=1080:608:(ow-iw)/2:(oh-ih)/2:color=black[fg];[bg][fg]overlay=0:640,ass=captions.ass[v]',
      '-map',
      '[v]',
      '-map',
      '0:a?',
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '20',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-movflags',
      '+faststart',
      outPath,
    ],
    { cwd: dir, timeoutMs: JOB_MS },
  )
  if (styled.err === 'ENOENT') return toolError('ffmpeg')
  if (styled.code !== 0 || !fs.existsSync(outPath)) {
    if (/ass|libass/i.test(styled.err)) return toolError('libass')
    return { ok: false, message: 'Schnitt fehlgeschlagen.', detail: String(styled.err || '').slice(-500) }
  }
  return { ok: true }
}

export async function renderLocal({ root, source, pieces, theme }) {
  const missing = await ensureTools()
  if (missing) return missing
  const id = freshId()
  const dir = path.join(workDir(root), id)
  fs.mkdirSync(dir, { recursive: true })
  const cut = []
  for (let i = 0; i < pieces.length; i += 1) {
    const piece = pieces[i]
    const file = path.join(dir, `seg${i}.mp4`)
    const made = await run(
      'ffmpeg',
      ['-y', '-ss', String(piece.start), '-to', String(piece.end), '-i', source, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-c:a', 'aac', '-b:a', '128k', '-pix_fmt', 'yuv420p', file],
      { timeoutMs: 30_000 },
    )
    if (made.code !== 0 || !fs.existsSync(file)) return { ok: false, message: 'Fixture-Schnitt fehlgeschlagen.' }
    const duration = piece.end - piece.start
    const words = (piece.words || [])
      .filter((word) => word.t >= piece.start - 0.05 && word.t < piece.end)
      .map((word) => ({ t: word.t - piece.start, d: word.d, w: word.w }))
    cut.push({ file, title: piece.title, duration, words })
  }
  const duration = cut.reduce((sum, piece) => sum + piece.duration, 0)
  const ass = buildAss({ theme: theme || 'Highlights', pieces: cut, duration })
  fs.writeFileSync(path.join(dir, 'captions.ass'), ass)
  const out = path.join(root, `clip-test-${id}.mp4`)
  const styled = await stylePieces(cut, path.join(dir, 'captions.ass'), out)
  if (!styled.ok) return styled
  return { ok: true, path: out, ass: path.join(dir, 'captions.ass'), duration }
}

async function doProbe(body, root) {
  const urls = Array.isArray(body.urls) ? body.urls.map(canonicalUrl).filter(Boolean).slice(0, 3) : []
  if (!urls.length) return { ok: false, message: 'Nur YouTube-Links.' }
  const dir = path.join(workDir(root), 'probe')
  const videos = []
  for (const url of urls) {
    const one = await probeOne(url, dir)
    if (!one.ok) return one
    videos.push(one)
  }
  return { ok: true, videos }
}

async function doFrames(body, root) {
  const missing = await ensureTools()
  if (missing) return missing
  if (!(await toolOnPath('yt-dlp'))) return toolError('yt-dlp')
  const shots = Array.isArray(body.shots) ? body.shots.slice(0, 3) : []
  const dir = path.join(workDir(root), 'frames')
  fs.mkdirSync(dir, { recursive: true })
  const frames = []
  for (let i = 0; i < shots.length; i += 1) {
    const url = canonicalUrl(shots[i].url)
    if (!url) return { ok: false, message: 'Nur YouTube-Links.' }
    const frame = await grabFrame(url, Number(shots[i].t) || 0, path.join(dir, `f${i}.jpg`))
    if (!frame.ok) return frame
    frames.push({ i, mime: frame.mime, image: frame.image })
  }
  return { ok: true, frames }
}

async function workJob(file, root) {
  const job = JSON.parse(fs.readFileSync(file, 'utf8'))
  try {
    const missing = await ensureTools()
    if (missing) {
      writeCurrent(root, { ...job, phase: 'error', message: missing.message, tool: missing.tool })
      return
    }
    if (!(await toolOnPath('yt-dlp'))) {
      const err = toolError('yt-dlp')
      writeCurrent(root, { ...job, phase: 'error', message: err.message, tool: err.tool })
      return
    }
    const dir = path.dirname(file)
    const pieces = []
    const segments = Array.isArray(job.segments) ? job.segments.slice(0, 3) : []
    for (let i = 0; i < segments.length; i += 1) {
      const seg = segments[i]
      const url = canonicalUrl(seg.url)
      if (!url) throw new Error('Nur YouTube-Links.')
      const media = path.join(dir, `seg${i}.mp4`)
      const got = await downloadSection(url, Number(seg.start), Number(seg.end), media)
      if (!got.ok) {
        writeCurrent(root, { ...job, phase: 'error', message: got.message, tool: got.tool })
        return
      }
      const duration = Number(seg.end) - Number(seg.start)
      const words = (Array.isArray(seg.words) ? seg.words : [])
        .map((word) => ({ t: Number(word[0]) - Number(seg.start), d: Number(word[1]), w: String(word[2] || '') }))
        .filter((word) => word.t >= -0.05 && word.t < duration + 0.2 && word.w)
      pieces.push({ file: media, title: String(seg.title || `Abschnitt ${i + 1}`), duration, words })
    }
    const duration = pieces.reduce((sum, piece) => sum + piece.duration, 0)
    if (duration > 180.5) {
      writeCurrent(root, { ...job, phase: 'error', message: 'Ausgabe länger als 3 Minuten.' })
      return
    }
    fs.writeFileSync(path.join(dir, 'captions.ass'), buildAss({ theme: job.theme || 'Highlights', pieces, duration }))
    const stamp = new Date()
    const name = `clip-${stamp.getFullYear()}${String(stamp.getMonth() + 1).padStart(2, '0')}${String(stamp.getDate()).padStart(2, '0')}-${String(stamp.getHours()).padStart(2, '0')}${String(stamp.getMinutes()).padStart(2, '0')}.mp4`
    const out = path.join(root, name)
    const styled = await stylePieces(pieces, path.join(dir, 'captions.ass'), out)
    if (!styled.ok) {
      writeCurrent(root, { ...job, phase: 'error', message: styled.message, tool: styled.tool })
      return
    }
    fs.rmSync(dir, { recursive: true, force: true })
    writeCurrent(root, { ...job, phase: 'done', path: out, message: out, titles: pieces.map((piece) => piece.title) })
  } catch (error) {
    writeCurrent(root, { ...job, phase: 'error', message: error instanceof Error ? error.message : 'Schnitt fehlgeschlagen.' })
  }
}

function startRender(body, root) {
  const current = readCurrent(root)
  if (current && current.phase === 'render' && Date.now() - current.at < JOB_MS) {
    return { ok: false, message: 'Es läuft schon ein Schnitt.' }
  }
  const segments = Array.isArray(body.segments) ? body.segments.slice(0, 3) : []
  if (!segments.length) return { ok: false, message: 'Keine Stellen.' }
  for (const seg of segments) {
    if (!canonicalUrl(seg.url)) return { ok: false, message: 'Nur YouTube-Links.' }
  }
  const id = freshId()
  const dir = path.join(workDir(root), id)
  fs.mkdirSync(dir, { recursive: true })
  const job = {
    id,
    at: Date.now(),
    phase: 'render',
    theme: String(body.theme || 'Highlights').slice(0, 80),
    segments,
    message: 'Schneide.',
  }
  const file = path.join(dir, 'job.json')
  fs.writeFileSync(file, JSON.stringify(job))
  writeCurrent(root, job)
  const child = spawn(process.execPath, [fileURLToPath(import.meta.url), '--worker', file, root], {
    detached: true,
    stdio: 'ignore',
  })
  child.unref()
  return { ok: true, jobId: id, phase: 'render' }
}

function readStatus(root) {
  const current = readCurrent(root)
  if (!current) return { ok: true, phase: 'idle', message: 'Kein Schnitt läuft.' }
  if (Date.now() - Number(current.at || 0) > TTL_MS) {
    fs.rmSync(path.join(workDir(root), current.id || ''), { recursive: true, force: true })
    fs.rmSync(path.join(workDir(root), 'current.json'), { force: true })
    return { ok: true, phase: 'idle', message: 'Kein Schnitt läuft.' }
  }
  return {
    ok: true,
    phase: current.phase,
    jobId: current.id,
    path: current.path || '',
    message: current.message || '',
    tool: current.tool || '',
    titles: current.titles || [],
  }
}

export async function handleClip(body, opts = {}) {
  const root = opts.root || videoRoot()
  fs.mkdirSync(root, { recursive: true })
  const action = String(body?.action || '')
  if (action === 'status') return readStatus(root)
  if (action === 'probe') return doProbe(body, root)
  if (action === 'frames') return doFrames(body, root)
  if (action === 'render') return startRender(body, root)
  return { ok: false, message: 'Unbekannte Schnitt-Aktion.' }
}

async function readStdin() {
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8').trim()
  if (!raw) return {}
  return JSON.parse(raw)
}

const isWorker = process.argv[2] === '--worker'
const isMain = Boolean(process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)

if (isWorker) {
  const file = process.argv[3]
  const root = process.argv[4] || videoRoot()
  workJob(file, root).then(() => process.exit(0))
} else if (isMain) {
  readStdin()
    .then((body) => handleClip(body))
    .then((result) => {
      process.stdout.write(JSON.stringify(result))
    })
    .catch((error) => {
      process.stdout.write(JSON.stringify({ ok: false, message: error instanceof Error ? error.message : 'Schnitt fehlgeschlagen.' }))
      process.exitCode = 1
    })
}
