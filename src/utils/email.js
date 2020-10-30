import { trim } from './types'

const emailRegex = () => /\S+(@|%40)\S+\.\S+/
const emailLikeRegex = /"([^"]+(@|%40)[^"]+[.][a-z]*(\s+)?)(\\"|")/
const multipleEmailLikeRegex = new RegExp(emailLikeRegex.source, 'g')

/**
 * @param {string} s
 * @returns {boolean}
 */
export function isEmail (s) {
  return emailRegex().test(s)
}

/**
 * @param {string} s
 * @returns {boolean}
 */
export function containsEmailField (s) {
  return emailLikeRegex.test(s)
}

export function extractEmail (s) {
  const result = s.match(emailRegex())
  return result && result.map(trim)[0]
}

/**
 * @param {string} s
 * @returns {string[]}
 */
export function listEmailsInString (s) {
  const result = []
  let current = multipleEmailLikeRegex.exec(s)
  while (current) {
    result.push(trim(current[1]))
    current = multipleEmailLikeRegex.exec(s)
  }
  return result
}
