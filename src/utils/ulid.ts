// Borrowed from https://github.com/Kiosked/ulid
const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const ENCODING_LEN = ENCODING.length
const TIME_MAX = Math.pow(2, 48) - 1
const TIME_LEN = 10
const RANDOM_LEN = 16
const prng = detectPrng()

function createError(message: string): Error & { source: string } {
  const err = new Error(message) as Error & { source: string }
  err.source = 'Ulid'
  return err
}

function detectPrng(): () => number {
  const root = typeof window !== 'undefined' ? window : null
  const browserCrypto = root && (root.crypto || root.msCrypto)
  if (browserCrypto) {
    return () => {
      const buffer = new Uint8Array(1)
      browserCrypto.getRandomValues(buffer)
      return buffer[0] / 0xff
    }
  }
  return () => Math.random()
}

function encodeTime(now: number, len: number): string {
  if (now > TIME_MAX) {
    throw createError('cannot encode time greater than ' + TIME_MAX)
  }
  let mod
  let str = ''
  for (; len > 0; len--) {
    mod = now % ENCODING_LEN
    str = ENCODING.charAt(mod) + str
    now = (now - mod) / ENCODING_LEN
  }
  return str
}

function encodeRandom(len: number): string {
  let str = ''
  for (; len > 0; len--) {
    str = randomChar() + str
  }
  return str
}

function randomChar(): string {
  let rand = Math.floor(prng() * ENCODING_LEN)
  if (rand === ENCODING_LEN) {
    rand = ENCODING_LEN - 1
  }
  return ENCODING.charAt(rand)
}

// the factory to generate unique identifier based on time and current pseudorandom number
export function ulid(): string {
  return encodeTime(Date.now(), TIME_LEN) + encodeRandom(RANDOM_LEN)
}
