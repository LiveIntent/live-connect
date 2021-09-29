import { trim } from './types'
import { hashEmail } from '../utils/hash'

const emailRegex = () => /\S+(@|%40)\S+\.\S+/

/**
 * @param {string} s
 * @returns {boolean}
 */
export function isEmail (s) {
  return emailRegex().test(s)
}

const emailLikeRegex = /"([^"]+(@|%40)[^"]+[.][a-z]*(\s+)?)(\\"|")/
export const emailLikeNoDoubleQuotesRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/

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
export function listEmailsInString (s, regex) {
  const result = []
  const multipleEmailLikeRegex = new RegExp(regex.source, 'g')
  let current = multipleEmailLikeRegex.exec(s)
  while (current) {
    result.push(trim(current[1]))
    current = multipleEmailLikeRegex.exec(s)
  }
  return result
}

/**
 * @param {string} originalString
 * @returns {{hashesFromOriginalString: HashedEmail[], stringWithoutRawEmails: string}}
 */
export function findAndReplaceRawEmails (originalString) {
  if (containsEmailField(originalString)) {
    return replaceEmailsWithHashes(originalString, emailLikeRegex)
  } else if (isEmail(originalString)) {
    const hashes = hashEmail(originalString)
    return {
      stringWithoutRawEmails: hashes.md5,
      hashesFromOriginalString: [hashes]
    }
  } else {
    return {
      stringWithoutRawEmails: originalString,
      hashesFromOriginalString: []
    }
  }
}

/**
 *
 * @param originalString
 * @returns {{hashesFromOriginalString: HashedEmail[], stringWithoutRawEmails: string}}
 */
export function replaceEmailsWithHashes (originalString, regex) {
  const emailsInString = listEmailsInString(originalString, regex)
  const hashes = []
  for (let i = 0; i < emailsInString.length; i++) {
    const email = emailsInString[i]
    const emailHashes = hashEmail(email)
    originalString = originalString.replace(email, emailHashes.md5)
    hashes.push(emailHashes)
  }
  return {
    stringWithoutRawEmails: originalString,
    hashesFromOriginalString: hashes
  }
}
