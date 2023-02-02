// btoa() as defined by the HTML and Infra specs, which mostly just references RFC 4648.
export function btoa(s: string): string | null {
  // String conversion as required by Web IDL.
  s = `${s}`
  // "The btoa() method must throw an "InvalidCharacterError" DOMException if
  // data contains any character whose code point is greater than U+00FF."
  for (let i = 0; i < s.length; i++) {
    if (s.charCodeAt(i) > 255) {
      return null
    }
  }
  let out = ''
  for (let i = 0; i < s.length; i += 3) {
    const groupsOfSix: (number | undefined)[] = [undefined, undefined, undefined, undefined]
    groupsOfSix[0] = s.charCodeAt(i) >> 2
    groupsOfSix[1] = (s.charCodeAt(i) & 0x03) << 4
    if (s.length > i + 2) {
      groupsOfSix[1] |= s.charCodeAt(i + 1) >> 4
      groupsOfSix[2] = (s.charCodeAt(i + 1) & 0x0f) << 2
      groupsOfSix[2] |= s.charCodeAt(i + 2) >> 6
      groupsOfSix[3] = s.charCodeAt(i + 2) & 0x3f
    } else if (s.length > i + 1) {
      groupsOfSix[1] |= s.charCodeAt(i + 1) >> 4
      groupsOfSix[2] = (s.charCodeAt(i + 1) & 0x0f) << 2
    }
    for (let j = 0; j < groupsOfSix.length; j++) {
      const element = groupsOfSix[j]
      if (typeof element === 'undefined') {
        out += '='
      } else {
        out += btoaLookup(element)
      }
    }
  }
  return out
}

// Lookup table for btoa(), which converts a six-bit number into the corresponding ASCII character.
const keystr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function btoaLookup(index: number): string | undefined {
  return (index >= 0 && index < 64) ? keystr[index] : undefined
}
