/** Sec-MS-GEC v2. Gleicher Rechenweg wie edge-tts `generate_sec_ms_gec_v2`. */

const TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4'
const U32 = 0xffffffffn
const u32 = (v: bigint) => v & U32

const SHA256_INITIAL = [
  0x6a09e667n, 0xbb67ae85n, 0x3c6ef372n, 0xa54ff53an, 0x510e527fn, 0x9b05688cn, 0x1f83d9abn, 0x5be0cd19n,
]
const SHA256_STATE = [
  0xfd9fbea2n, 0x91243ce7n, 0xbe499094n, 0xcd2e1e0an, 0x6c006f49n, 0x04bd35abn, 0xfeb0a7e4n, 0x03effbd2n,
]
const SHA256_SCHEDULE = [
  0xeb24bf9en, 0x1558691fn, 0xa0c09ee2n, 0x0cfa32ban, 0xa622ee8cn, 0xd1dd9491n, 0xc0dd25a0n, 0xf9e70ab6n, 0xf0c31573n,
  0x7058ce4en, 0x7188e606n, 0x00e5ab33n, 0xd258b060n, 0x72766564n,
]
const SHA256_ROUND = [
  0x428a2f98n, 0x71374491n, 0xb5c0fbcfn, 0xe9b5dba5n, 0x3956c25bn, 0x59f111f1n, 0x923f82a4n, 0xab1c5ed5n, 0xd807aa98n,
  0x12835b01n, 0x243185ben, 0x550c7dc3n, 0x72be5d74n, 0x80deb1fen, 0x9bdc06a7n, 0xc19bf174n, 0xe49b69c1n, 0xefbe4786n,
  0x0fc19dc6n, 0x240ca1ccn, 0x2de92c6fn, 0x4a7484aan, 0x5cb0a9dcn, 0x76f988dan, 0x983e5152n, 0xa831c66dn, 0xb00327c8n,
  0xbf597fc7n, 0xc6e00bf3n, 0xd5a79147n, 0x06ca6351n, 0x14292967n, 0x27b70a85n, 0x2e1b2138n, 0x4d2c6dfcn, 0x53380d13n,
  0x650a7354n, 0x766a0abbn, 0x81c2c92en, 0x92722c85n, 0xa2bfe8a1n, 0xa81a664bn, 0xc24b8b70n, 0xc76c51a3n, 0xd192e819n,
  0xd6990624n, 0xf40e3585n, 0x106aa070n, 0x19a4c116n, 0x1e376c08n, 0x2748774cn, 0x34b0bcb5n, 0x391c0cb3n, 0x4ed8aa4an,
  0x5b9cca4fn, 0x682e6ff3n, 0x748f82een, 0x78a5636fn, 0x84c87814n, 0x8cc70208n, 0x90befffan, 0xa4506cebn, 0xbef9a3f7n,
  0xc67178f2n,
]
const SHA256_ADJUSTMENT = 0xc9dc06a7n
const BLOCK_CONSTANTS = [...SHA256_ROUND.slice(0, 14), SHA256_ADJUSTMENT, ...SHA256_ROUND.slice(15)]
const SIGMA0_ADJUSTMENT = 0x059c0b80n
const SIGMA1_ADJUSTMENT = 0x000b92c0n
const CS64_COEFFICIENTS: Array<[bigint, bigint]> = [
  [0xe82e91b1n, 0xb32700d0n],
  [0x44de24c6n, 0x88dff51dn],
  [0x3beb65bcn, 0x29514038n],
  [0xc89c5933n, 0xb328cbdfn],
  [0x8d1ec211n, 0xd405b4d5n],
  [0x314ef5d5n, 0x26e55f3cn],
  [0xe92491b1n, 0x607801c6n],
  [0xf0a5b9d5n, 0x82b2c1fbn],
  [0x06064cf3n, 0xfa51a3dan],
  [0xda79fa60n, 0x207cc464n],
  [0xbed20560n, 0x3c3c74f3n],
  [0x89f9c9f8n, 0xd2d14b61n],
  [0x35fa38c6n, 0xbb04a2c1n],
  [0xcb49e3c6n, 0xc5626167n],
]
const CS64_FACTOR = 0x82893933n
const CS64_ADJUSTMENT0 = 0xf2f90b1an
const CS64_ADJUSTMENT1 = 0x0b1a0000n

function rol16(value: bigint): bigint {
  const v = u32(value)
  return u32((v << 16n) | (v >> 16n))
}

function sigma0(value: bigint): bigint {
  return u32((value >> 7n) ^ (value << 25n) ^ (value >> 18n) ^ (value << 14n) ^ (value >> 3n))
}

function sigma1(value: bigint): bigint {
  return u32((value >> 17n) ^ (value << 15n) ^ (value >> 19n) ^ (value << 13n) ^ (value >> 10n))
}

function sha256Rounds(state: bigint[], words: bigint[], firstRound = 0): bigint[] {
  let [a, b, c, d, e, f, g, h] = state
  const constants = firstRound === 14 ? BLOCK_CONSTANTS : SHA256_ROUND
  const aligned = Math.min(64, Math.floor((firstRound + 7) / 8) * 8)
  for (let index = firstRound; index < aligned; index += 1) {
    const rotE = e * 0x100000001n
    const rotA = a * 0x100000001n
    const t1 = h + ((rotE >> 6n) ^ (rotE >> 11n) ^ (rotE >> 25n)) + (g ^ (e & (f ^ g))) + constants[index] + words[index]
    const t2 = ((rotA >> 2n) ^ (rotA >> 13n) ^ (rotA >> 22n)) + ((a & b) | (c & (a | b)))
    ;[a, b, c, d, e, f, g, h] = [u32(t1 + t2), a, b, c, u32(d + t1), e, f, g]
  }
  for (let index = aligned; index < 64; index += 8) {
    const step = (regs: bigint[], round: number, src: [number, number, number, number, number, number, number, number]) => {
      const [ia, ib, ic, id, ie, iff, ig, ih] = src
      const rotE = regs[ie] * 0x100000001n
      const rotA = regs[ia] * 0x100000001n
      const t1 =
        regs[ih] +
        ((rotE >> 6n) ^ (rotE >> 11n) ^ (rotE >> 25n)) +
        (regs[ig] ^ (regs[ie] & (regs[iff] ^ regs[ig]))) +
        constants[round] +
        words[round]
      regs[id] = u32(regs[id] + t1)
      regs[ih] = u32(t1 + ((rotA >> 2n) ^ (rotA >> 13n) ^ (rotA >> 22n)) + ((regs[ia] & regs[ib]) | (regs[ic] & (regs[ia] | regs[ib]))))
    }
    const regs = [a, b, c, d, e, f, g, h]
    step(regs, index, [0, 1, 2, 3, 4, 5, 6, 7])
    step(regs, index + 1, [7, 0, 1, 2, 3, 4, 5, 6])
    step(regs, index + 2, [6, 7, 0, 1, 2, 3, 4, 5])
    step(regs, index + 3, [5, 6, 7, 0, 1, 2, 3, 4])
    step(regs, index + 4, [4, 5, 6, 7, 0, 1, 2, 3])
    step(regs, index + 5, [3, 4, 5, 6, 7, 0, 1, 2])
    step(regs, index + 6, [2, 3, 4, 5, 6, 7, 0, 1])
    step(regs, index + 7, [1, 2, 3, 4, 5, 6, 7, 0])
    ;[a, b, c, d, e, f, g, h] = regs
  }
  return [a, b, c, d, e, f, g, h]
}

function expandSchedule(words: bigint[], firstWord = 16): void {
  for (let index = firstWord; index < 64; index += 1) {
    const x = words[index - 2]
    const y = words[index - 15]
    const s1 = (x >> 17n) ^ (x << 15n) ^ (x >> 19n) ^ (x << 13n) ^ (x >> 10n)
    const s0 = (y >> 7n) ^ (y << 25n) ^ (y >> 18n) ^ (y << 14n) ^ (y >> 3n)
    words.push(u32(s1 + words[index - 7] + s0 + words[index - 16]))
  }
}

function beInt(data: Uint8Array, from: number, to: number): bigint {
  let n = 0n
  for (let i = from; i < to; i += 1) n = (n << 8n) | BigInt(data[i] || 0)
  return n
}

function sha256Init(data: Uint8Array): bigint[] {
  const words: bigint[] = Array.from({ length: 14 }, () => 0n)
  words.push(beInt(data, 0, 3))
  words.push(beInt(data, 3, 7))
  for (let index = 16; index < 30; index += 1) {
    let value = SHA256_SCHEDULE[index - 16]
    if (index - 2 >= 14) value += index === 16 ? sigma1(words[index - 2]) ^ SIGMA1_ADJUSTMENT : sigma1(words[index - 2])
    if (index - 7 >= 14) value += words[index - 7]
    if (index - 15 >= 14) value += index === 29 ? sigma0(words[index - 15]) ^ SIGMA0_ADJUSTMENT : sigma0(words[index - 15])
    words.push(u32(value))
  }
  words.push(u32(sigma1(words[28]) + words[23] + sigma0(words[15]) + words[14] + SHA256_ADJUSTMENT - SHA256_ROUND[14]))
  expandSchedule(words, 31)
  const working = sha256Rounds(SHA256_STATE, words, 14)
  return SHA256_INITIAL.map((x, i) => u32(x + working[i]))
}

function sha256Digest(data: Uint8Array): Uint8Array {
  const length = 57 + data.length
  const pad = ((55 - length) % 64 + 64) % 64
  const rest = data.subarray(7)
  const padded = new Uint8Array(rest.length + 1 + pad + 8)
  padded.set(rest, 0)
  padded[rest.length] = 0x80
  const bits = BigInt(length) * 8n
  for (let i = 0; i < 8; i += 1) padded[padded.length - 1 - i] = Number((bits >> BigInt(i * 8)) & 0xffn)
  let state = sha256Init(data.subarray(0, 7))
  for (let offset = 0; offset < padded.length; offset += 64) {
    const words: bigint[] = []
    for (let i = 0; i < 16; i += 1) words.push(beInt(padded, offset + i * 4, offset + i * 4 + 4))
    expandSchedule(words)
    const working = sha256Rounds(state, words)
    state = state.map((x, i) => u32(x + working[i]))
  }
  const out = new Uint8Array(32)
  state.forEach((word, i) => {
    out[i * 4] = Number((word >> 24n) & 0xffn)
    out[i * 4 + 1] = Number((word >> 16n) & 0xffn)
    out[i * 4 + 2] = Number((word >> 8n) & 0xffn)
    out[i * 4 + 3] = Number(word & 0xffn)
  })
  return out
}

function wordsLe4Even(data: Uint8Array): bigint[] {
  const paddedLen = data.length + ((4 - (data.length % 4)) % 4)
  const padded = new Uint8Array(paddedLen)
  padded.set(data)
  const words: bigint[] = []
  for (let i = 0; i < padded.length; i += 4) {
    words.push(
      BigInt(padded[i]) |
        (BigInt(padded[i + 1]) << 8n) |
        (BigInt(padded[i + 2]) << 16n) |
        (BigInt(padded[i + 3]) << 24n),
    )
  }
  if (words.length % 2) words.push(0n)
  return words
}

function cs64Digest(data: Uint8Array, digest: Uint8Array): [bigint, bigint] {
  let keyA =
    BigInt(digest[0]) | (BigInt(digest[1]) << 8n) | (BigInt(digest[2]) << 16n) | (BigInt(digest[3]) << 24n)
  let keyB =
    BigInt(digest[4]) | (BigInt(digest[5]) << 8n) | (BigInt(digest[6]) << 16n) | (BigInt(digest[7]) << 24n)
  keyA = u32(keyA | 1n)
  keyB = u32(keyB | 1n)
  const factors = [u32(keyA * CS64_FACTOR), u32(keyB * CS64_FACTOR)]
  const terms = CS64_COEFFICIENTS.map(([coefficient], index) => u32(coefficient * factors[index % 2]))
  const offsets = CS64_COEFFICIENTS.map(([, offset]) => offset)
  const prefixed = new Uint8Array(data.length + 1)
  prefixed.set(data, 1)
  wordsLe4Even(prefixed).forEach((word, index) => {
    let term = word * (index % 2 === 0 ? keyA : keyB)
    let offset = rol16(word) * (index % 2 === 0 ? 0xef0569fbn : 0xc31713dbn)
    if (index === 0) {
      term += CS64_ADJUSTMENT0 * factors[0]
      offset += CS64_ADJUSTMENT1
    }
    terms.push(u32(term))
    offsets.push(u32(offset))
  })
  let swapAcc = 0n
  let swapLast = 0n
  let state = 0n
  let acc = 0n
  for (let index = 0; index < terms.length; index += 2) {
    const x = terms[index]
    const y = terms[index + 1]
    let t = rol16(u32(offsets[index] + x))
    let q = u32(t * 0x76f50f34n)
    swapAcc = u32(swapAcc + u32(rol16(q) * 0xc3efea97n + q))
    t = rol16(u32(offsets[index + 1] + y))
    q = u32(t * 0x1881ce3cn)
    swapLast = u32(rol16(q) * 0x35bd1ec9n + q)
    swapAcc = u32(swapAcc + swapLast)
    state = u32(state * keyA + x)
    state = u32(rol16(state) * 0xcf98b111n)
    state = u32(rol16(state) * 0x87085b9fn)
    state = u32(rol16(state) * 0x12ceb96dn)
    state = u32(rol16(state) * 0x257e1d83n)
    acc += state
    t = u32(state * keyB + y)
    t = u32(rol16(t) * 0xa27416f5n)
    t = u32(rol16(t) * 0xd38396ffn)
    state = u32(rol16(u32(rol16(t) * 0x7c932b89n)) * 0xbfa49f69n)
    acc = u32(acc + state)
  }
  return [u32(swapLast ^ state), u32(swapAcc ^ acc)]
}

function hexBytes(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

/** `<16 hex>-<64 hex>` für die Edge-Verbindung. */
export function secMsGecV2(unixSec = Date.now() / 1000): string {
  const sec = BigInt(Math.floor(unixSec))
  let ticks = sec + 11644473600n
  ticks -= ticks % 300n
  ticks *= 10000000n
  const data = new TextEncoder().encode(`${ticks.toString()}${TOKEN}`)
  const digest = sha256Digest(data)
  const [lo, hi] = cs64Digest(data, digest)
  const cs = new Uint8Array(8)
  const pair = [lo, hi]
  pair.forEach((word, i) => {
    cs[i * 4] = Number(word & 0xffn)
    cs[i * 4 + 1] = Number((word >> 8n) & 0xffn)
    cs[i * 4 + 2] = Number((word >> 16n) & 0xffn)
    cs[i * 4 + 3] = Number((word >> 24n) & 0xffn)
  })
  return `${hexBytes(cs)}-${hexBytes(digest)}`
}
